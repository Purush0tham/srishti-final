import { updateCaregiverSignals } from './caregiverProfileService.js';

const EMOTION_KEYWORDS = {
  sadness: ['sad', 'down', 'empty', 'low', 'ಬೇಜಾರ', 'ಉದಾಸ', 'बेचैन', 'उदास', 'bejar'],
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
    'ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ',
    'ಒಬ್ಬನೇ',
    'संभाल नहीं',
    'बहुत ज्यादा',
    'handle agta illa',
  ],
  fatigue: ['tired', 'exhausted', 'no sleep', 'ಥಕಾನ', 'ಸೊತ್ತಾಗಿದೆ', 'थकान', 'थक गया', 'thakan'],
  isolation: ['alone', 'no one', 'by myself', 'ಒಂಟಿ', 'अकेला', 'अकेली'],
  positive: ['happy', 'good', 'great', 'better'],
  neutral: [],
};

const NEGATIVE_EMOTIONS = ['sadness', 'overwhelm', 'fatigue', 'isolation'];
const UNSAID_PHRASES = ['fine', 'okay', 'nothing', 'just tired', "i'm good", 'all good', "it's okay", 'no problem'];
const MICRO_PLANS = [
  ['Take 3 slow breaths', 'Drink water'],
  ['Step outside for 2 minutes', 'Stretch your shoulders'],
  ['Sit quietly for a minute', 'Close your eyes briefly'],
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

  // General knowledge / factual queries - OUT OF SCOPE
  const generalKnowledgePatterns = [
    // Who/What is queries
    /^who\s+is\s+/, /^what\s+is\s+/, /^when\s+is\s+/, /^where\s+is\s+/, /^why\s+is\s+/, /^how\s+is\s+/,
    // Specific topics (government, geography, etc)
    'prime minister', 'president', 'capital of', 'population of', 'definition of',
    // News, weather, time
    'what time is it', 'weather', 'news', 'stock price', 'exchange rate',
    // Technical/academic
    'how to make', 'recipe', 'tutorial', 'guide',
  ];

  // Emotional signals - IN SCOPE
  const emotionalSignals = [
    'feel', 'tired', 'sad', 'overwhelmed', 'alone', 'stress', 'exhausted',
    'happy', 'okay', 'fine', "can't handle", 'cant handle', 'everything is on me', 
    'all on me', 'too much', 'help', 'struggling', 'hard', 'difficult',
    'ಬೇಜಾರ', 'ಸೊತ್ತಾಗಿದೆ', 'ತುಂಬಾ', 'ನನಗೆ',
    'थकान', 'उदास', 'अकेला', 'संभाल',
    'bejar', 'tumba', 'nanage', 'thakan',
  ];

  // Check if it's a general knowledge question
  const isGeneralKnowledge = generalKnowledgePatterns.some((pattern) => {
    if (typeof pattern === 'string') {
      return input.includes(pattern);
    }
    return pattern.test(input);
  });

  if (isGeneralKnowledge) {
    return 'out_of_scope';
  }

  // Check if it's emotional/in scope
  const isEmotional = emotionalSignals.some((signal) => input.includes(signal));
  if (isEmotional) {
    return 'in_scope';
  }

  // Default to neutral (could be either, but let inference handle it)
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
