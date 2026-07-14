import React from 'react';

export function LearningRecap() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="surface" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="kicker">Match #1249 · 12M 41S · JS/TS Bugs Vol. 3</p>
          <h1 style={{ margin: '8px 0 0 0' }}>Learning Recap</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="button ghost">Save to Learn</button>
          <button className="button ghost">Share</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
        <button className="button dark">You</button>
        <button className="button ghost">@octoplayer</button>
        <button className="button ghost">@debugbird</button>
        <button className="button ghost">@mergequeen</button>
        <button className="button ghost">@null_ninja</button>
        <button className="button ghost">@hex_wizard</button>
        <button className="button ghost">@semver_sam</button>
      </div>

      <div className="recap-grid">
        {/* Left Sidebar - Performance */}
        <div>
          <div className="surface">
            <p className="kicker" style={{ marginBottom: '24px' }}>Performance</p>
            <div className="score-box">
              <h2>820</h2>
              <div style={{ marginTop: '16px', fontWeight: 600 }}>Rank: Top 18%</div>
              <div style={{ color: 'var(--success-color)', fontSize: '0.9rem', marginTop: '4px' }}>+40 XP</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Tasks completed</span>
                <strong>3 / 5</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Bugs detected</span>
                <strong>2</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Bugs missed</span>
                <strong>1</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">False accusations</span>
                <strong>0</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Review speed</span>
                <strong>Avg 42s</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="surface">
              <p className="kicker">Tasks Completed</p>
              <div className="task-list">
                <div className="task-item correct"><span>✓</span> <span style={{ color: 'var(--text-primary)' }}>Fix null check in Header.tsx</span></div>
                <div className="task-item correct"><span>✓</span> <span style={{ color: 'var(--text-primary)' }}>Add loading state to Feed</span></div>
                <div className="task-item correct"><span>✓</span> <span style={{ color: 'var(--text-primary)' }}>Integrate pagination in posts.ts</span></div>
              </div>
            </div>
            
            <div className="surface">
              <p className="kicker" style={{ color: 'var(--danger-color)' }}>Incorrect Tasks</p>
              <div className="task-list">
                <div className="task-item incorrect"><span>✕</span> <span style={{ color: 'var(--text-primary)' }}>Refactor useAuth <span className="muted">(submitted, tests failed)</span></span></div>
                <div className="task-item incorrect"><span>✕</span> <span style={{ color: 'var(--text-primary)' }}>postReducer test <span className="muted">(not submitted)</span></span></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="surface">
              <p className="kicker" style={{ marginBottom: '16px' }}>Bugs You Detected · 2</p>
              <div className="bug-card" style={{ borderColor: 'var(--accent-color)' }}>
                <strong>#12 silent empty return in posts.ts</strong>
                <div className="kicker" style={{ marginTop: '8px' }}>BY @NULL_NINJA · FLAGGED IN 38S</div>
              </div>
              <div className="bug-card">
                <strong>#09 off-by-one in pagination</strong>
                <div className="kicker" style={{ marginTop: '8px' }}>BY @HEX_WIZARD · FLAGGED IN 71S</div>
              </div>
            </div>
            
            <div className="surface">
              <p className="kicker" style={{ marginBottom: '16px', color: 'var(--danger-color)' }}>Bugs You Missed · 1</p>
              <div className="bug-card" style={{ borderColor: 'var(--danger-color)' }}>
                <strong>#07 Feed effect deps missing</strong>
                <div className="kicker" style={{ marginTop: '8px', color: 'var(--danger-color)' }}>SHIPPED BY @HEX_WIZARD</div>
              </div>
            </div>
          </div>

          <div className="surface">
            <p className="kicker" style={{ marginBottom: '16px' }}>Bug Explanation · #12</p>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              <div style={{ opacity: 0.5 }}>  return res.json();</div>
              <div style={{ color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)', margin: '4px -16px', padding: '0 16px' }}>+ if (!res.ok) return [];</div>
              <div style={{ opacity: 0.5 }}>  return res.json();</div>
            </div>
            <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>
              Silently returning <code style={{ color: 'var(--text-primary)' }}>[]</code> on a failed response hides errors from the UI and looks like a valid empty list. Prefer surfacing the error or throwing, so error boundaries or tests can catch it.
            </p>
            <div className="kicker" style={{ marginTop: '16px' }}>
              CONCEPT: ERROR PROPAGATION · DEFENSIVE VS SILENT FAILURE · FETCH RESPONSE HANDLING
            </div>
          </div>

          <div className="surface">
            <p className="kicker" style={{ marginBottom: '16px' }}>Concepts Learned</p>
            <div>
              <span className="concept-tag">#fetch response validation</span>
              <span className="concept-tag">#silent failures</span>
              <span className="concept-tag">#effect deps</span>
              <span className="concept-tag">#pagination patterns</span>
              <span className="concept-tag">#code review heuristics</span>
            </div>
          </div>

        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
        <button className="button ghost">← Return to dashboard</button>
        <div className="muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--border-color)', display: 'grid', placeItems: 'center' }}>P1</div>
          RECAP GENERATED FOR @OCTOPLAYER
        </div>
      </div>
    </div>
  );
}
