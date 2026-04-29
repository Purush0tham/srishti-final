import { useState } from 'react';

const MODE_LABEL   = { normal: 'Normal', start_of_day: 'Start of Day', journaling: 'Journaling' };
const ACTION_LABEL = { none: 'None', nudge: 'Nudge', micro_plan: 'Micro Plan', action_assistant: 'Action Assistant' };

export default function AnalysisPanel({ analysis }) {
  const [open, setOpen] = useState(false);
  if (!analysis) return null;

  return (
    <div className="glass-card analysis-panel">
      <button
        className="analysis-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        id="analysis-panel-toggle"
      >
        <span>🔬 Inference Analysis</span>
        <span className={`chevron ${open ? 'open' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="analysis-body">
          {/* Tags summary row */}
          <div className="tags-row">
            <span className={`tag-chip mode`}>
              Mode: {MODE_LABEL[analysis.mode] || analysis.mode}
            </span>
            <span className={`tag-chip action`}>
              Action: {ACTION_LABEL[analysis.action_trigger] || analysis.action_trigger}
            </span>
            {analysis.pattern_signal === 'repeated' && (
              <span className="tag-chip pattern">⟳ Pattern Detected</span>
            )}
            {analysis.unsaid_signal && (
              <span className="tag-chip unsaid">◉ Unsaid Signal</span>
            )}
            {(analysis.context_tags || []).map((tag) => (
              <span key={tag} className="tag-chip context">{tag.replace(/_/g, ' ')}</span>
            ))}
          </div>

          {/* Raw JSON */}
          <div className="json-block" role="region" aria-label="Raw analysis JSON">
            {JSON.stringify(analysis, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}
