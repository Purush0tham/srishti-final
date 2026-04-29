import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();
console.log('Groq key loaded:', !!process.env.GROQ_API_KEY);

let groq = null;
try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
} catch (error) {
  console.error('Groq client init error:', error?.message || error);
  groq = null;
}
const EMOTION_LABELS = ['sadness', 'overwhelm', 'fatigue', 'isolation', 'positive', 'neutral'];
const PRIMARY_MODEL = process.env.GROQ_MODEL || 'llama3-8b-8192';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

async function createCompletion(messages, temperature = 0.7) {
  if (!groq) throw new Error('Groq client unavailable');
  try {
    return await groq.chat.completions.create({
      model: PRIMARY_MODEL,
      messages,
      temperature,
    });
  } catch (err) {
    const msg = err?.message || '';
    if (/decommissioned|no longer supported|model_decommissioned/i.test(msg)) {
      return groq.chat.completions.create({
        model: FALLBACK_MODEL,
        messages,
        temperature,
      });
    }
    throw err;
  }
}

function detectLanguage(text) {
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kannada';
  if (/[\u0900-\u097F]/.test(text)) return 'hindi';
  return 'english';
}

function isLanguageMatch(language, text) {
  if (!text) return false;
  if (language === 'kannada') return /[\u0C80-\u0CFF]/.test(text);
  if (language === 'hindi') return /[\u0900-\u097F]/.test(text);
  if (language === 'english') return !/[\u0C80-\u0CFF\u0900-\u097F]/.test(text);
  return true;
}

function languageFallback(language) {
  if (language === 'kannada') return 'ನಾನು ನಿಮ್ಮೊಂದಿಗಿದ್ದೇನೆ. ಇನ್ನಷ್ಟು ಹೇಳಬೇಕೆಂದರೆ ನಿಧಾನವಾಗಿ ಹೇಳಿ.';
  if (language === 'hindi') return 'मैं आपके साथ हूं। अगर चाहें तो थोड़ा और बताइए।';
  return "I'm here with you... want to tell me a bit more?";
}

export async function generateLLMResponse(userInput, decision, emotion, contextHint = '', forcedLanguage = '') {
  const language = forcedLanguage || detectLanguage(userInput);
  console.log('LANG:', language);
  const prompt = `
User message: ${userInput}

Context about user:
${contextHint || 'None'}

Emotion: ${emotion}
Tone: ${decision.tone}
Action context: ${decision.action || 'none'}

Instructions:

* Respond like a real human, not an assistant
* Sound like one caring person speaking naturally, not a bot script
* Keep the tone calm, grounded, and non-intrusive
* Keep responses short and natural
* Prefer 2-3 lines, but stay flexible when needed
* Greeting messages should usually be 1 line
* Neutral conversation should usually be 1-2 lines
* Emotional support should usually be 2-3 lines
* Action-assistant moments can use up to 3 lines if needed
* Avoid generic phrases like "Thanks for sharing" or "I understand"
* Vary sentence structure (no repetition)
* Vary rhythm and wording across replies to avoid repetitive templates
* Only offer suggestions if the situation clearly needs it
* If user is positive -> reflect and engage, not guide
* If user is neutral -> continue conversation naturally
* If emotional -> acknowledge gently before suggesting anything
* Do not over-explain
* Do not truncate emotional nuance just to be brief

You are NOT a general assistant.
If the message is factual, informational, or unrelated to emotions:
-> DO NOT answer it
-> gently redirect to personal/emotional context

Focus only on:
- feelings
- stress
- daily experience

Use context subtly (do NOT explicitly mention tracking).
Make response feel aware, not generic.
Language rule (strict):
- If language is kannada -> reply fully in Kannada only
- If language is hindi -> reply fully in Hindi only
- If language is english -> reply fully in English only
- Never mix languages in one reply
- Keep the emotional tone fully consistent in that language

Do NOT sound like a therapist or AI.
`;

  try {
    const completion = await createCompletion([{ role: 'user', content: prompt }], 0.7);
    const generated = completion.choices[0]?.message?.content?.trim() || '';
    if (!isLanguageMatch(language, generated)) {
      return languageFallback(language);
    }
    return generated;
  } catch (error) {
    console.error('Groq Error:', error);
    return languageFallback(language);
  }
}

export async function classifyEmotionWithLLM(text) {
  const prompt = `
Classify the emotion of this message into ONE of:
sadness, overwhelm, fatigue, isolation, positive, neutral

Message: "${text}"

Return ONLY the label.
`;

  try {
    const completion = await createCompletion([{ role: 'user', content: prompt }], 0);
    const raw = completion.choices[0]?.message?.content?.trim().toLowerCase() || 'neutral';
    const cleaned = raw.replace(/[^a-z_]/g, '');
    return EMOTION_LABELS.includes(cleaned) ? cleaned : 'neutral';
  } catch (error) {
    console.error('Groq Error:', error);
    return 'neutral';
  }
}

export async function generateWeeklyPatternSummary(patternText) {
  const prompt = `
Write a 2-line weekly reflection for a caregiver.
Use a warm, human tone.
Avoid clinical wording.
Focus on emotional weight and support needs, not raw labels.
Avoid robotic phrasing and avoid list-like summaries.
Make it sound compassionate and real, like a gentle check-in.

Signals:
${patternText}
`;

  try {
    const completion = await createCompletion([{ role: 'user', content: prompt }], 0.4);
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Groq Error:', error);
    return '';
  }
}
