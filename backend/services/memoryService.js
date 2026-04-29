import Session from '../models/Session.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function getSession(sessionId) {
  return Session.findOneAndUpdate(
    { session_id: sessionId },
    {
      $setOnInsert: {
        session_id: sessionId,
        messages: [],
        memory: {
          repeated_keywords: [],
          stress_trend: [],
          weekly_summary: '',
          window_start: new Date(),
        },
      },
    },
    { new: true, upsert: true }
  );
}

function pruneOldMessages(messages) {
  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
  return messages.filter((m) => new Date(m.timestamp) >= cutoff);
}

function updateKeywords(existingKeywords, newContextKeywords) {
  const merged = [...new Set([...(newContextKeywords || []), ...(existingKeywords || [])])];
  return merged.slice(0, 4);
}

function updateStressTrend(existingTrend, newLevel) {
  const updated = [
    ...(existingTrend || []),
    { date: new Date(), level: newLevel },
  ];
  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
  return updated.filter((t) => new Date(t.date) >= cutoff).slice(-7);
}

export async function updateSession(sessionId, { userInput, analysis, response, contextKeywords = [] }) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const session = await getSession(sessionId);

    session.messages.push({
      timestamp: new Date(),
      user_input: userInput,
      analysis,
      response,
    });

    session.messages = pruneOldMessages(session.messages);
    session.memory.repeated_keywords = updateKeywords(session.memory.repeated_keywords, contextKeywords);
    session.memory.stress_trend = updateStressTrend(session.memory.stress_trend, analysis.stress_level);

    const windowAge = Date.now() - new Date(session.memory.window_start).getTime();
    if (windowAge > SEVEN_DAYS_MS) {
      session.memory.window_start = new Date();
    }

    session.markModified('memory');
    session.markModified('messages');

    try {
      await session.save();
      return session;
    } catch (err) {
      if (attempt === 1 || err?.name !== 'VersionError') throw err;
    }
  }

  return null;
}

export async function getMemoryContext(sessionId) {
  const session = await Session.findOne({ session_id: sessionId });
  if (!session) return { repeated_keywords: [], weekly_summary: '', stress_trend: [] };

  const recent = session.messages.slice(-3);
  const last_3_messages_summary = recent
    .map((m) => `[${new Date(m.timestamp).toLocaleDateString()}] ${m.user_input}`)
    .join(' | ');

  return {
    repeated_keywords: session.memory.repeated_keywords,
    weekly_summary: session.memory.weekly_summary,
    stress_trend: session.memory.stress_trend,
    last_3_messages_summary,
  };
}

export async function updateWeeklySummary(sessionId, summary) {
  await Session.updateOne(
    { session_id: sessionId },
    { $set: { 'memory.weekly_summary': summary } }
  );
}
