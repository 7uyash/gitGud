import React, { useState, useEffect } from 'react';

export function VotingResult({ onClose }: { onClose?: () => void }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      onClose?.();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onClose]);

  const tallies = [
    { name: '@null_ninja', votes: 3 },
    { name: '@debugbird', votes: 1 },
    { name: 'Skip', votes: 1 },
    { name: '@octoplayer', votes: 0 },
    { name: '@mergequeen', votes: 0 },
    { name: '@hex_wizard', votes: 0 },
    { name: '@semver_sam', votes: 0 },
    { name: '@async_ana', votes: 0 },
  ];

  const maxVotes = Math.max(...tallies.map(t => t.votes), 1);

  return (
    <div className="meeting-overlay" style={{ justifyContent: 'center' }}>
      <div className="surface voting-result-container">
        <p className="kicker">Voting Complete</p>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>@null_ninja was ejected</h1>
        <p className="muted">Their role will remain hidden until the match ends.</p>

        <div className="ejected-player">
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', marginBottom: '16px', fontSize: '1.5rem' }}>
            P4
          </div>
          <strong>@null_ninja</strong>
          <p className="kicker" style={{ marginTop: '12px' }}>Ejected · Now Spectating</p>
        </div>

        <div className="vote-tally">
          <p className="kicker" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Vote Tally</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {tallies.map((tally, idx) => (
              <div key={idx} className="tally-row">
                <span style={{ fontSize: '0.9rem', fontWeight: tally.votes > 0 ? 600 : 400 }}>{tally.name}</span>
                <div className="tally-bar-bg">
                  <div 
                    className="tally-bar-fill" 
                    style={{ 
                      width: `${(tally.votes / maxVotes) * 100}%`,
                      background: tally.name === '@null_ninja' ? 'var(--danger-color)' : 'var(--text-primary)'
                    }} 
                  />
                </div>
                <span style={{ fontSize: '0.9rem', textAlign: 'right' }}>{tally.votes}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="button dark" style={{ marginTop: '40px', width: '100%', padding: '16px' }} onClick={onClose}>
          Continue → back to game (auto {countdown}s)
        </button>
      </div>
    </div>
  );
}
