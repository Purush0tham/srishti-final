const STRESS_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };
const STRESS_EMOJI  = { low: '🟢', medium: '🟡', high: '🔴' };

const STRESS_BAR = {
  low:    'linear-gradient(90deg, #10b981, #059669)',
  medium: 'linear-gradient(90deg, #f59e0b, #d97706)',
  high:   'linear-gradient(90deg, #f43f5e, #e11d48)',
};

export default function ResponseCard({ response, analysis }) {
  const level = analysis?.stress_level || 'low';

  return (
    <div
      className="glass-card response-card"
      style={{ '--stress-bar': STRESS_BAR[level] }}
      role="region"
      aria-label="CareGuard AI Response"
    >
      <div className="response-header">
        <span className="response-label">CareGuard Response</span>
        <span className={`stress-badge ${level}`}>
          <span className="dot" />
          {STRESS_EMOJI[level]} {STRESS_LABELS[level]} Stress
        </span>
      </div>
      <p className="response-text">{response}</p>
    </div>
  );
}
