import { useState } from 'react';
import { Subscription } from '../types';
import { SUBSCRIPTION_DEFS, isSubscriptionFilled } from '../constants/subscriptions';

interface Props {
  subscriptions: Subscription[] | undefined;
  readOnly: boolean;
  /** Persist the full (filled-only) list. Called on every toggle / note change. */
  onSave: (subs: Subscription[]) => void;
}

type DraftMap = Record<string, { active: boolean; notes: string }>;

function toDraft(subs: Subscription[] | undefined): DraftMap {
  const map: DraftMap = {};
  for (const def of SUBSCRIPTION_DEFS) {
    const found = subs?.find(s => s.key === def.key);
    map[def.key] = { active: found?.active ?? false, notes: found?.notes ?? '' };
  }
  return map;
}

/** Keep only filled entries (active OR with a note) — mirrors the display rule. */
function toFilledList(draft: DraftMap): Subscription[] {
  return SUBSCRIPTION_DEFS.flatMap(def => {
    const d = draft[def.key];
    const notes = d.notes.trim();
    if (!d.active && !notes) return [];
    return [{ key: def.key, active: d.active, ...(notes ? { notes } : {}) }];
  });
}

export default function VehicleSubscriptions({ subscriptions, readOnly, onSave }: Props) {
  const [draft, setDraft] = useState<DraftMap>(() => toDraft(subscriptions));

  const update = (key: string, patch: Partial<{ active: boolean; notes: string }>) => {
    const next = { ...draft, [key]: { ...draft[key], ...patch } };
    setDraft(next);
    onSave(toFilledList(next));   // persist outside the updater (no render-phase parent update)
  };

  // ── Read-only (archived): show only filled items, as static text ──
  if (readOnly) {
    const filled = (subscriptions ?? []).filter(isSubscriptionFilled);
    if (filled.length === 0) {
      return (
        <p style={{ color: 'var(--gray-400)', fontSize: '0.88rem', textAlign: 'center', padding: '10px 0' }}>
          לא הוזנו מנויים או שירותים.
        </p>
      );
    }
    return (
      <div className="subs-list">
        {filled.map(s => {
          const def = SUBSCRIPTION_DEFS.find(d => d.key === s.key);
          if (!def) return null;
          return (
            <div key={s.key} className="sub-row sub-row-readonly">
              <span className="sub-check-static" aria-hidden="true">{s.active ? '✓' : '•'}</span>
              <div className="sub-body">
                <div className="sub-label">{def.icon} {def.label}</div>
                {s.notes && <div className="sub-note-text">הערה: {s.notes}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Editable ──
  return (
    <div className="subs-list">
      {SUBSCRIPTION_DEFS.map(def => {
        const d = draft[def.key];
        return (
          <div key={def.key} className={`sub-row ${d.active ? 'sub-row-active' : ''}`}>
            <label className="sub-check" aria-label={def.label}>
              <input
                type="checkbox"
                checked={d.active}
                onChange={e => update(def.key, { active: e.target.checked })}
              />
              <span className="sub-check-box" aria-hidden="true">✓</span>
            </label>
            <div className="sub-body">
              <div className="sub-label">{def.icon} {def.label}</div>
              <input
                className="form-input sub-note-input"
                type="text"
                value={d.notes}
                onChange={e => update(def.key, { notes: e.target.value })}
                placeholder="הערה (לא חובה) — לדוגמה: דרך העבודה"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
