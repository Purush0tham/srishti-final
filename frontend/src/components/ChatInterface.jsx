import { useEffect, useRef, useState } from 'react';
import MeditationModal from './MeditationModal';
import ActionButton from './ActionButton';
import { useChatSession } from '../hooks/useChatSession';
import { useVoiceInput } from '../hooks/useVoiceInput';

export default function ChatInterface() {
  const { userInput, setUserInput, messages, loading, submitMessage } = useChatSession();

  const [isMeditationOpen, setIsMeditationOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const { isListening, toggleVoice } = useVoiceInput((transcript) => {
    setUserInput((prev) => prev + (prev ? ' ' : '') + transcript);
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [userInput]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  return (
    <div className="chat-shell">
      <header className="chat-header">
        <div className="chat-header-avatar">CG</div>
        <div className="chat-header-info">
          <h1 className="chat-header-name">CareGuard</h1>
          <span className="chat-header-status">
            <span className="online-dot" /> Online - here for you
          </span>
        </div>
      </header>

      <main className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message-row ${msg.role}`}>
            {msg.role === 'bot' && <div className="bot-avatar">CG</div>}
            <div className={`chat-bubble ${msg.role}`}>
              <p className="bubble-text">{msg.text}</p>

              {msg.role === 'bot' && msg.actions?.micro_plan && (
                <div className="bubble-action">
                  <div className="glass-card action-section">
                    <div className="action-header">
                      <div className="action-icon">*</div>
                      <div>
                        <div className="action-title">Try something small</div>
                        <div className="action-subtitle">If it helps, maybe something small like this...</div>
                      </div>
                    </div>
                    <div className="action-message-box">
                      {msg.actions.micro_plan.map((step, idx) => (
                        <div key={`${msg.id}-plan-${idx}`}>- {step}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {msg.role === 'bot' && msg.actions?.generated_message && (
                <div className="bubble-action">
                  <ActionButton message={msg.actions.generated_message} />
                </div>
              )}

              {msg.role === 'bot' && msg.actions?.nudge && (
                <div className="bubble-action">
                  <div className="glass-card action-section">
                    <div className="action-message-box">{msg.actions.nudge}</div>
                  </div>
                </div>
              )}

              {msg.role === 'bot' && msg.actions?.unsaid_probe && (
                <div className="bubble-action">
                  <div className="glass-card action-section">
                    <div className="action-message-box">{msg.actions.unsaid_probe}</div>
                  </div>
                </div>
              )}

              {msg.role === 'bot' && msg.actions?.suggests_meditation && (
                <button className="meditate-pill-btn" onClick={() => setIsMeditationOpen(true)}>
                  Start 2-minute breathing pause
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message-row bot">
            <div className="bot-avatar">CG</div>
            <div className="chat-bubble bot typing-bubble">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <div className="chat-input-bar">
        <button
          className={`voice-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleVoice}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          title={isListening ? 'Stop voice input' : 'Voice input'}
        >
          Mic
        </button>

        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Message CareGuard..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          rows={1}
          aria-label="Type your message"
        />

        <button
          className={`send-btn ${userInput.trim() ? 'active' : ''}`}
          onClick={submitMessage}
          disabled={loading || !userInput.trim()}
          aria-label="Send message"
          title="Send"
        >
          Send
        </button>
      </div>

      {isMeditationOpen && <MeditationModal onClose={() => setIsMeditationOpen(false)} />}
    </div>
  );
}
