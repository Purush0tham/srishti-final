import { generateHelpMessage, getMicroPlan, runInferencePipeline } from '../services/inferenceService.js';
import { classifyEmotionWithLLM, generateLLMResponse, generateWeeklyPatternSummary } from '../services/groqService.js';
import { getMemoryContext, updateSession, updateWeeklySummary } from '../services/memoryService.js';
import {
  buildCaregiverContextHint,
  buildSignalSummaryText,
  buildWeeklySummary,
  generateContextAwareHelpMessage,
  getCaregiverProfile,
  resetCaregiverSignals,
  shouldResetProfileWindow,
} from '../services/caregiverProfileService.js';
const NEGATIVE_EMOTIONS = ['sadness', 'overwhelm', 'fatigue', 'isolation'];
const OPENERS = [
  'That sounds like a lot...',
  'Hmm, that feels heavy...',
  "Yeah, that's not easy...",
];

function pickOpener() {
  return OPENERS[Math.floor(Math.random() * OPENERS.length)];
}

function buildFallbackResponse(userInput, emotion) {
  return "Hey... I'm here with you. Want to tell me what's been going on?";
}

export async function analyzeCareRequest(req, res) {
  try {
    const { session_id, user_input, context } = req.body;

    if (!session_id || !user_input) {
      return res.status(400).json({ error: 'session_id and user_input are required.' });
    }

    const memory = await getMemoryContext(session_id);
    const mergedContext = {
      last_3_messages_summary: context?.last_3_messages_summary || memory.last_3_messages_summary || '',
      weekly_summary: context?.weekly_summary || memory.weekly_summary || '',
      repeated_keywords: context?.repeated_keywords?.length ? context.repeated_keywords : memory.repeated_keywords,
      time_of_day: context?.time_of_day || 'afternoon',
    };

    let profile = await getCaregiverProfile(session_id);
    if (shouldResetProfileWindow(profile)) {
      const signalSummaryText = buildSignalSummaryText(profile);
      let summary = await generateWeeklyPatternSummary(signalSummaryText);
      if (!summary) summary = buildWeeklySummary(profile);
      await updateWeeklySummary(session_id, summary);
      profile = await resetCaregiverSignals(profile);
    }

    const analysis = await runInferencePipeline({
      sessionId: session_id,
      userInput: user_input,
      context: mergedContext,
      classifyEmotionFallback: classifyEmotionWithLLM,
    });

    if (analysis.domain === 'out_of_scope') {
      return res.json({
        analysis: {
          stress_level: 'low',
          final_emotion: 'neutral',
          tone: 'steady',
          intent: 'question',
          action_trigger: 'none',
          domain: 'out_of_scope',
        },
        response: analysis.response,
        actions: {
          show_action_button: false,
          generated_message: '',
          suggests_meditation: false,
          micro_plan: null,
        },
      });
    }

    profile = await getCaregiverProfile(session_id);
    const includeContext = Math.random() < 0.5;
    const contextHint = includeContext ? buildCaregiverContextHint(profile) : '';

    let llmResponse = '';
    try {
      llmResponse = await generateLLMResponse(
        user_input,
        analysis.decision,
        analysis.emotion,
        contextHint
      );
    } catch {
      llmResponse = '';
    }

    if (!llmResponse) llmResponse = buildFallbackResponse(user_input, analysis.emotion);

    let finalText = llmResponse;
    if (NEGATIVE_EMOTIONS.includes(analysis.emotion)) {
      const lower = finalText.toLowerCase();
      const hasStarter = OPENERS.some((o) => lower.startsWith(o.toLowerCase()));
      if (!hasStarter) finalText = `${pickOpener()} ${finalText}`;
    }

    // Priority: action_assistant > micro_plan > nudge > unsaid_probe > normal
    let majorFeature = 'normal';
    let extra = {};
    const shouldUseActionAssistant =
      analysis.intent === 'statement' && (
        analysis.emotion === 'overwhelm' ||
        analysis.finalAction === 'action_assistant' ||
        ((profile?.overwhelm_count || 0) >= 2 && NEGATIVE_EMOTIONS.includes(analysis.emotion))
      );

    if (shouldUseActionAssistant) {
      majorFeature = 'action_assistant';
      extra.generatedMessage = generateContextAwareHelpMessage(profile) || generateHelpMessage();
    } else if (analysis.emotion === 'fatigue' && analysis.intent === 'statement') {
      if ((profile?.fatigue_count || 0) >= 3) {
        majorFeature = 'micro_plan';
        extra.microPlan = getMicroPlan();
      } else {
        majorFeature = 'nudge';
        extra.nudge = 'Maybe a small pause could help a bit right now.';
      }
    } else if (analysis.emotion === 'sadness' && analysis.intent === 'statement') {
      majorFeature = 'micro_plan';
      extra.microPlan = getMicroPlan();
    } else if (analysis.unsaid) {
      majorFeature = 'unsaid_probe';
      extra.unsaidProbe = "Sometimes when things feel 'fine', there is a bit more underneath. If you want, we can stay with it for a moment.";
    }

    if (analysis.intent === 'statement' && ((profile?.fatigue_count || 0) >= 3 || (profile?.overwhelm_count || 0) >= 2)) {
      finalText = `${finalText}\nYou've been feeling this way a few times lately.\nThings seem a bit heavier than usual.`;
    }

    await updateSession(session_id, {
      userInput: user_input,
      analysis,
      response: finalText,
      contextKeywords: mergedContext.repeated_keywords,
    });

    return res.json({
      analysis: {
        stress_level: analysis.stress_level,
        final_emotion: analysis.emotion,
        tone: analysis.tone,
        intent: analysis.intent,
        domain: analysis.domain,
        action_trigger: analysis.finalAction || 'none',
        major_feature: majorFeature,
        unsaid: !!analysis.unsaid,
      },
      response: finalText,
      actions: {
        show_action_button: majorFeature === 'action_assistant',
        generated_message: extra.generatedMessage || '',
        suggests_meditation: false,
        micro_plan: extra.microPlan || null,
        nudge: extra.nudge || '',
        unsaid_probe: extra.unsaidProbe || '',
      },
    });
  } catch (err) {
    console.error('[/api/analyze] Error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

export async function getCareSummary(req, res) {
  try {
    const sessionId = req.query.session_id || req.query.sessionId;
    if (!sessionId) {
      return res.status(400).json({ error: 'session_id query param is required.' });
    }

    const profile = await getCaregiverProfile(sessionId);
    return res.json({
      summary: buildWeeklySummary(profile),
    });
  } catch (err) {
    console.error('[/api/summary] Error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
