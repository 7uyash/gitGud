import React from 'react';

export function GameOver({ 
  recapPayload,
  players,
  onRecap 
}: { 
  recapPayload: any;
  players: any[];
  onRecap?: () => void;
}) {
  const crewmates = players.filter(p => p.role !== 'IMPOSTER');
  const imposters = players.filter(p => p.role === 'IMPOSTER');

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="game-over-container">
        
        <div className="match-result-banner">
          <p className="kicker" style={{ marginBottom: '16px' }}>Match Result</p>
          <h1>{recapPayload?.winnerTeam === 'CREW' ? 'CREWMATES WIN' : 'IMPOSTERS WIN'}</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{recapPayload?.endingReason}</p>
        </div>

        <div className="team-grid">
          <div>
            <p className="kicker" style={{ marginBottom: '16px' }}>Crewmates</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {crewmates.map((p, i) => (
                <div key={i} className="player-card">
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}>
                    P{i+1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{p.name}</div>
                    <div className="kicker" style={{ marginTop: '4px' }}>{p.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="kicker" style={{ marginBottom: '16px', color: 'var(--danger-color)' }}>Imposters</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {imposters.map((p, i) => (
                <div key={i} className="player-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'grid', placeItems: 'center', color: 'var(--danger-color)' }}>
                    P{i+7}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{p.name}</div>
                    <div className="kicker" style={{ marginTop: '4px', color: 'var(--danger-color)' }}>{p.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mini-grid">
          <div className="surface stat" style={{ flex: 1 }}>
            <span className="kicker">Ship Readiness</span>
            <span className="stat-value" style={{ color: 'var(--success-color)' }}>92%</span>
          </div>
          <div className="surface stat" style={{ flex: 1 }}>
            <span className="kicker">Tasks Completed</span>
            <span className="stat-value">14 / 16</span>
          </div>
          <div className="surface stat" style={{ flex: 1 }}>
            <span className="kicker">Time Taken</span>
            <span className="stat-value">12m 41s</span>
          </div>
          <div className="surface stat" style={{ flex: 1 }}>
            <span className="kicker">Meetings Called</span>
            <span className="stat-value">2</span>
          </div>
        </div>

        <div className="surface">
          <p className="kicker" style={{ marginBottom: '16px' }}>Top Moments</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li>🔥 <strong>Best find</strong> — @octoplayer flagged silent error return in posts.ts</li>
            <li>💀 <strong>Worst approve</strong> — @mergequeen approved #12 in 4s</li>
            <li>👀 <strong>Cleanest sabotage</strong> — @hex_wizard broke pagination on Feed.tsx</li>
          </ul>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <button className="button ghost" onClick={() => window.location.assign('/dashboard')}>← Return to dashboard</button>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="button ghost">Rematch</button>
            <button className="button dark" onClick={onRecap}>View learning recap →</button>
          </div>
        </div>

      </div>
    </div>
  );
}
