import { updateCaregiverSignals } from './caregiverProfileService.js';

const EMOTION_KEYWORDS = {
  sadness: ['sad', 'down', 'empty', 'low'],
  overwhelm: [
    'too much',
    'overwhelmed',
    "can't handle",
    'cant handle',
    'everything is on me',
    'all on me',
    'handling everything',
    'no help',
    'too many things',
    'a lot',
  ],
  fatigue: ['tired', 'exhausted', 'no sleep'],
  isolation: ['alone', 'no one', 'by myself'],
  positive: ['happy', 'good', 'great', 'better'],
  neutral: [],
};

const NEGATIVE_EMOTIONS = ['sadness', 'overwhelm', 'fatigue', 'isolation'];
const UNSAID_PHRASES = ['fine', 'okay', 'nothing', 'just tired', "i'm good", 'all good', "it's okay", 'no problem'];
const MICRO_PLANS = [
  ['Take 3 slow breaths.', 'Drink water.'],
  ['Step outside for 2 minutes.', 'Stretch your shoulders.'],
  ['Sit quietly for a minute.', 'Close your eyes briefly.'],
];

const normalize = (str) => (str || '').toLowerCase().trim();

export function detectIntent(userInput) {
  const input = normalize(userInput);
  if (['hi', 'hello', 'hey'].includes(input)) return 'greeting';
  if (input.includes('?')) return 'question';
  return 'statement';
}

export function detectDomain(text) {
  const input = normalize(text);

  const emotionalSignals = [
    'feel', 'tired', 'sad', 'overwhelmed',
    'alone', 'stress', 'exhausted',
    'happy', 'okay', 'fine',
    "can't handle", 'cant handle', 'everything is on me', 'all on me', 'too much',
  ];

  const generalSignals = [
    'who is', 'what is', 'define',
    'prime minister', 'capital',
    'weather', 'news',
  ];

  if (generalSignals.some((p) => input.includes(p))) return 'out_of_scope';
  if (emotionalSignals.some((p) => input.includes(p))) return 'in_scope';
  return 'neutral';
}

export function detectEmotion(userInput) {
  const text = normalize(userInput);

  for (const emotion of ['overwhelm', 'fatigue', 'isolation', 'sadness', 'positive']) {
    if (EMOTION_KEYWORDS[emotion].some((kw) => text.includes(kw))) {
      return emotion;
    }
  }

  return 'neutral';
}

export function detectUnsaid(userInput) {
  const text = normalize(userInput);
  return UNSAID_PHRASES.some((phrase) => text === phrase || text.includes(` ${phrase}`) || text.includes(`${phrase} `));
}

function mapEmotionToStress(emotion) {
  if (emotion === 'overwhelm' || emotion === 'isolation') return 'high';
  if (emotion === 'sadness' || emotion === 'fatigue') return 'medium';
  return 'low';
}

function mapEmotionToTone(emotion) {
  if (emotion === 'overwhelm' || emotion === 'isolation') return 'grounding';
  if (emotion === 'sadness' || emotion === 'fatigue') return 'gentle';
  if (emotion === 'positive') return 'warm';
  return 'steady';
}

export function decideBehavior(emotion) {
  if (emotion === 'overwhelm') return { action: 'action_assistant', tone: 'supportive' };
  if (emotion === 'isolation') return { action: 'action_assistant', tone: 'grounding' };
  if (emotion === 'sadness' || emotion === 'fatigue') return { action: 'micro_plan', tone: 'gentle' };
  return { action: null, tone: mapEmotionToTone(emotion) };
}

export function getMicroPlan() {
  return MICRO_PLANS[Math.floor(Math.random() * MICRO_PLANS.length)];
}

export function generateHelpMessage() {
  return 'Hey, today feels a bit heavy. Could you help me for a little while?';
}

export async function runInferencePipeline({ sessionId, userInput, context, classifyEmotionFallback }) {
  const domain = detectDomain(userInput);
  if (domain === 'out_of_scope') {
    return {
      domain,
      response:
        "I'm here more for you-how things are feeling or going. Want to share what's been on your mind?",
      emotion: 'neutral',
      action: null,
      intent: 'question',
      decision: { action: null, tone: 'steady' },
      finalAction: null,
      stress_level: 'low',
      tone: 'steady',
      context: context || {},
    };
  }

  const intent = detectIntent(userInput);
  const unsaid = detectUnsaid(userInput);
  let emotion = detectEmotion(userInput);

  if (emotion === 'neutral') {
    try {
      const fallbackEmotion = await classifyEmotionFallback(userInput);
      if (fallbackEmotion) emotion = fallbackEmotion;
    } catch {
      emotion = 'neutral';
    }
  }

  if (sessionId) {
    await updateCaregiverSignals(sessionId, userInput, emotion);
  }

  const decision = decideBehavior(emotion);

  let finalAction = null;
  if (domain === 'in_scope' && intent === 'statement' && NEGATIVE_EMOTIONS.includes(emotion)) {
    finalAction = decision.action;
  }

  return {
    domain,
    intent,
    unsaid,
    emotion,
    decision,
    finalAction,
    stress_level: mapEmotionToStress(emotion),
    tone: decision.tone,
    context: context || {},
  };
}
