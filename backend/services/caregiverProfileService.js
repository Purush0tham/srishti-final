import CaregiverProfile from '../models/CaregiverProfile.js';

const UNSAID_PHRASES = ['fine', 'okay', 'nothing', 'just tired', "i'm good", 'all good', "it's okay", 'no problem'];
const EMOTIONAL_WORDS = [
  'feel', 'sad', 'tired', 'overwhelmed', 'alone', 'stress', 'exhausted',
  'happy', 'anxious', 'heavy', 'low', 'drained',
];
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function getCaregiverProfile(sessionId) {
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

  if (emotion === 'fatigue') profile.fatigue_count += 1;
  if (emotion === 'overwhelm') profile.overwhelm_count += 1;
  if (emotion === 'isolation') profile.isolation_count += 1;
  if (UNSAID_PHRASES.includes(text)) profile.unsaid_count += 1;

  // Hidden-stress signal: repeatedly short/flat statements without emotional language.
  if (emotion === 'neutral' && words.length <= 3 && !hasEmotionalLanguage) {
    profile.unsaid_count += 1;
  }

  profile.last_updated = new Date();
  await profile.save();
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

  return `This week felt a bit heavy-you have been carrying ${parts.join(', ')}.\nYou have still been trying to keep everything moving, even with low space to recover.`;
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
  await profile.save();
  return profile;
}
