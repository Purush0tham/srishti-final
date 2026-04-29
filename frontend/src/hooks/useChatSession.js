import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { analyze } from '../api/careGuardClient';
import { formatTime, getCurrentTimeOfDay } from '../utils/time';

function getOrCreateSessionId() {
  const stored = localStorage.getItem('cg_session_id');
  if (stored) return stored;
  const fresh = uuidv4();
  localStorage.setItem('cg_session_id', fresh);
  return fresh;
}

const DEFAULT_CONTEXT = {
  last_3_messages_summary: '',
  weekly_summary: '',
  repeated_keywords: [],
  time_of_day: getCurrentTimeOfDay(),
};

export function useChatSession() {
  const [sessionId] = useState(getOrCreateSessionId);
  const [userInput, setUserInput] = useState('');
  const [context] = useState(DEFAULT_CONTEXT);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: "Hey, I'm here with you. You can just talk normally-I'll quietly keep up.",
      time: formatTime(new Date()),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);

  const submitMessage = useCallback(async () => {
    const text = userInput.trim();
    if (!text || loading) return;

    const userMsg = { id: uuidv4(), role: 'user', text, time: formatTime(new Date()) };
    setMessages((prev) => [...prev, userMsg]);
    setUserInput('');
    setLoading(true);
    setPendingResult(null);

    try {
      const data = await analyze(sessionId, text, context);

      const botMsg = {
        id: uuidv4(),
        role: 'bot',
        text: data.response,
        time: formatTime(new Date()),
        analysis: data.analysis,
        actions: data.actions,
      };
      setMessages((prev) => [...prev, botMsg]);
      setPendingResult(data);
    } catch (err) {
      let errText = 'Something went wrong. Please try again.';
      
      // Check if it's a network error
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK' || !err.response) {
        errText = "Can't reach the server. Make sure the backend is running on port 3001.";
      }
      // Check for server error
      else if (err.response?.status >= 500) {
        errText = 'Server error - check MongoDB URI and GROQ_API_KEY in backend/.env.';
      }
      // Check for validation/client errors
      else if (err.response?.data?.error) {
        errText = err.response.data.error;
      }
      // Default error
      else {
        errText = err.message || 'Something went wrong. Please try again.';
      }

      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), role: 'error', text: errText, time: formatTime(new Date()) },
      ]);
    } finally {
      setLoading(false);
    }
  }, [context, loading, sessionId, userInput]);

  return {
    userInput,
    setUserInput,
    messages,
    loading,
    pendingResult,
    submitMessage,
  };
}
