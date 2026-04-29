export default function InputPanel({ value, onChange, onSubmit, loading }) {
  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSubmit();
  };

  return (
    <div className="glass-card input-panel">
      <p className="input-label">How are you doing right now?</p>
      <textarea
        id="caregiver-input"
        className="input-textarea"
        placeholder="Share what's on your mind — even a few words is enough…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        disabled={loading}
        aria-label="Caregiver message input"
      />
      <div className="input-footer">
        <span className="char-hint">Ctrl+Enter to send</span>
        <button
          id="submit-btn"
          className="submit-btn"
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          aria-label="Analyze message"
        >
          {loading ? (
            <>
              <span className="spinner" />
              Listening…
            </>
          ) : (
            <>
              <span>🛡</span>
              Analyze
            </>
          )}
        </button>
      </div>
    </div>
  );
}
