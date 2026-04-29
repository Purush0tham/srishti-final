import CaregiverProfile from '../models/CaregiverProfile.js';
import Session from '../models/Session.js';
import mongoose from 'mongoose';

const UNSAID_PHRASES = ['fine', 'okay', 'nothing', 'just tired', "i'm good", 'all good', "it's okay", 'no problem'];
const NEGATIVE_EMOTIONS = ['sadness', 'overwhelm', 'fatigue', 'isolation'];
const EMOTIONAL_WORDS = [
  'feel', 'sad', 'tired', 'overwhelmed', 'alone', 'stress', 'exhausted',
  'happy', 'anxious', 'heavy', 'low', 'drained',
];
const EMOTIONAL_PROMPT_HINTS = [
  'what has been going on',
  "what's been going on",
  'want to share',
  'want to tell me',
  'how are you feeling',
  'stay with it',
];
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const inMemoryProfiles = new Map();

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

function ensureInMemoryProfile(sessionId) {
  if (!inMemoryProfiles.has(sessionId)) {
    inMemoryProfiles.set(sessionId, {
      session_id: sessionId,
      fatigue_count: 0,
      overwhelm_count: 0,
      isolation_count: 0,
      unsaid_count: 0,
      last_updated: new Date(),
    });
  }
  return inMemoryProfiles.get(sessionId);
}

export async function getCaregiverProfile(sessionId) {
  if (!isDbReady()) return ensureInMemoryProfile(sessionId);
  return CaregiverProfile.findOneAndUpdate(
    { session_id: sessionId },
    { $setOnInsert: { session_id: sessionId } },
    { new: true, upsert: true }
  );
}

export async function updateCaregiverSignals(sessionId, userInput, emotion) {
  const profile = await getCaregiverProfile(sessionId);
  const text = (userInput || '').toLowerCase().trim();
  const words = text.split(/\s+/).filter(Boolean);
  const hasEmotionalLanguage = EMOTIONAL_WORDS.some((w) => text.includes(w));
  let previousSession = null;
  if (isDbReady()) {
    previousSession = await Session.findOne({ session_id: sessionId }).select({ messages: 1 });
  }
  const lastMessage = previousSession?.messages?.length
    ? previousSession.messages[previousSession.messages.length - 1]
    : null;
  const previousAssistantText = (lastMessage?.response || '').toLowerCase();
  const previousEmotion = lastMessage?.analysis?.emotion || 'neutral';
  const wasEmotionalPrompt =
    previousAssistantText.includes('?') &&
    EMOTIONAL_PROMPT_HINTS.some((hint) => previousAssistantText.includes(hint));
  const isShortReply = words.length > 0 && words.length <= 4;
  const avoidsEmotionalLanguage = !hasEmotionalLanguage;

  if (emotion === 'fatigue') profile.fatigue_count += 1;
  if (emotion === 'overwhelm') profile.overwhelm_count += 1;
  if (emotion === 'isolation') profile.isolation_count += 1;
  if (UNSAID_PHRASES.includes(text)) profile.unsaid_count += 1;

  // Hidden-stress signal: repeatedly short/flat statements without emotional language.
  if (isShortReply && avoidsEmotionalLanguage && emotion !== 'positive') {
    profile.unsaid_count += 1;
  }

  // Hidden-stress signal: short responses after emotional check-ins.
  if (wasEmotionalPrompt && NEGATIVE_EMOTIONS.includes(previousEmotion) && isShortReply && avoidsEmotionalLanguage) {
    profile.unsaid_count += 1;
  }

  profile.last_updated = new Date();
  if (isDbReady()) {
    await profile.save();
  }
  return profile;
}

export function buildCaregiverContextHint(profile) {
  if (!profile) return '';

  let contextHint = '';
  if (profile.fatigue_count >= 3) {
    contextHint += 'User has been feeling tired repeatedly. ';
  }
  if (profile.overwhelm_count >= 2) {
    contextHint += 'User seems overloaded and handling too much alone. ';
  }
  if (profile.isolation_count >= 2) {
    contextHint += 'User may be lacking support. ';
  }
  if (profile.unsaid_count >= 2) {
    contextHint += "User may be hiding stress behind 'fine' responses. ";
  }

  return contextHint.trim();
}

export function generateContextAwareHelpMessage(profile) {
  if (profile?.overwhelm_count >= 2) {
    return "Hey, I have been carrying a lot on my own lately, and it feels heavy. Could you stay with me and help for a bit?";
  }
  return 'Hey, today feels a bit heavy. Could you help me for a little while?';
}

export function buildWeeklySummary(profile) {
  if (!profile) return 'This week has had its ups and downs.';

  const parts = [];
  if (profile.overwhelm_count >= 2) parts.push('handling a lot at once');
  if (profile.fatigue_count >= 3) parts.push('low rest and tiredness');
  if (profile.isolation_count >= 2) parts.push('limited support');
  if (profile.unsaid_count >= 2) parts.push("holding things in behind 'fine'");

  if (!parts.length) return 'This week felt mostly steady, with a few small pressure points along the way.';

  return `This week felt a bit heavy. You have been carrying ${parts.join(', ')}.\nEven with limited rest and support, you kept showing up and holding things together.`;
}

export function shouldResetProfileWindow(profile) {
  if (!profile?.last_updated) return false;
  const age = Date.now() - new Date(profile.last_updated).getTime();
  return age > SEVEN_DAYS_MS;
}

export function buildSignalSummaryText(profile) {
  if (!profile) return '';
  return [
    `fatigue_count=${profile.fatigue_count || 0}`,
    `overwhelm_count=${profile.overwhelm_count || 0}`,
    `isolation_count=${profile.isolation_count || 0}`,
    `unsaid_count=${profile.unsaid_count || 0}`,
  ].join(', ');
}

export async function resetCaregiverSignals(profile) {
  if (!profile) return null;
  profile.fatigue_count = 0;
  profile.overwhelm_count = 0;
  profile.isolation_count = 0;
  profile.unsaid_count = 0;
  profile.last_updated = new Date();
  if (isDbReady() && typeof profile.save === 'function') {
    await profile.save();
  }
  return profile;
}
