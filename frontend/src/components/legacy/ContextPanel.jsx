import { useState } from 'react';

const TIME_OPTIONS = ['morning', 'afternoon', 'night'];

export default function ContextPanel({ context, onChange }) {
  const [open, setOpen] = useState(false);

  const update = (field, value) => onChange({ ...context, [field]: value });

  return (
    <div className="glass-card context-panel">
      <button
        className="context-panel-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        id="context-panel-toggle"
      >
        <span>⚙ Context Panel (Backend Simulation)</span>
        <span className={`chevron ${open ? 'open' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="context-panel-body">
          {/* Last 3 messages summary */}
          <div className="context-field full">
            <label htmlFor="ctx-last3">last_3_messages_summary</label>
            <textarea
              id="ctx-last3"
              rows={3}
              placeholder="Paste a brief summary of the last 3 user messages…"
              value={context.last_3_messages_summary}
              onChange={(e) => update('last_3_messages_summary', e.target.value)}
            />
          </div>

          {/* Weekly summary */}
          <div className="context-field full">
            <label htmlFor="ctx-weekly">weekly_summary</label>
            <textarea
              id="ctx-weekly"
              rows={2}
              placeholder="Optional: weekly pattern summary…"
              value={context.weekly_summary}
              onChange={(e) => update('weekly_summary', e.target.value)}
            />
          </div>

          {/* Repeated keywords */}
          <div className="context-field">
            <label htmlFor="ctx-keywords">repeated_keywords (comma-separated)</label>
            <input
              id="ctx-keywords"
              type="text"
              placeholder="e.g. tired, sleep, alone"
              value={context.repeated_keywords.join(', ')}
              onChange={(e) =>
                update(
                  'repeated_keywords',
                  e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                )
              }
            />
          </div>

          {/* Time of day */}
          <div className="context-field">
            <label htmlFor="ctx-time">time_of_day</label>
            <select
              id="ctx-time"
              value={context.time_of_day}
              onChange={(e) => update('time_of_day', e.target.value)}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
