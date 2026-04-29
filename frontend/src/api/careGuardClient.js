// ─────────────────────────────────────────────────────────
//  api/careGuardClient.js
//  FastAPI-ready API client — swap BASE_URL to change backend
// ─────────────────────────────────────────────────────────

import axios from 'axios';

// 🔌 To plug into FastAPI: change this to your FastAPI base URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * POST /api/analyze
 * @param {string} sessionId - UUID from localStorage
 * @param {string} userInput - Caregiver's message
 * @param {object} context   - { last_3_messages_summary, weekly_summary, repeated_keywords, time_of_day }
 * @returns {Promise<object>} CareGuard JSON response
 */
export async function analyze(sessionId, userInput, context) {
  const { data } = await client.post('/api/analyze', {
    session_id: sessionId,
    user_input: userInput,
    context,
  });
  return data;
}

export default client;
