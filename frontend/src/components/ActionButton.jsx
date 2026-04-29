import { useState } from 'react';

export default function ActionButton({ message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="glass-card action-section">
      <div className="action-header">
        <div className="action-icon">MSG</div>
        <div>
          <div className="action-title">Want me to help you ask someone for support?</div>
          <div className="action-subtitle">
            If it helps, this is ready to copy and send in your own way.
          </div>
        </div>
      </div>

      <div className="action-message-box" id="action-message-preview">
        {message}
      </div>

      <div className="action-btns">
        <button
          id="copy-message-btn"
          className={`btn-copy ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          aria-label="Copy message to clipboard"
        >
          {copied ? 'Copied' : 'Copy message'}
        </button>
      </div>
    </div>
  );
}
