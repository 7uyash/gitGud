import React, { useState, useEffect } from 'react';

export function VotingResult({ 
  result,
  players,
  onClose 
}: { 
  result: any;
  players: any[];
  onClose?: () => void;
}) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      onClose?.();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onClose]);

  const tallies = Object.entries(result.voteCounts).map(([userId, count]) => ({
    name: players.find(p => p.id === userId)?.name ?? userId,
    votes: count as number,
    id: userId,
  }));
  if (result.skipCount > 0) {
    tallies.push({ name: 'Skip', votes: result.skipCount, id: 'skip' });
  }

  const maxVotes = Math.max(...tallies.map(t => t.votes), 1);
  const ejectedPlayer = result.ejectedPlayerId ? players.find(p => p.id === result.ejectedPlayerId) : null;

  return (
    <div className="meeting-overlay" style={{ justifyContent: 'center' }}>
      <div className="surface voting-result-container">
        <p className="kicker">Voting Complete</p>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
          {ejectedPlayer ? `${ejectedPlayer.name} was ejected` : 'No one was ejected (Tie / Skipped)'}
        </h1>
        <p className="muted">{ejectedPlayer ? 'Their role will remain hidden until the match ends.' : 'The crew remains the same.'}</p>

        {ejectedPlayer && (
          <div className="ejected-player">
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', marginBottom: '16px', fontSize: '1.5rem' }}>
              {ejectedPlayer.id.toUpperCase()}
            </div>
            <strong>{ejectedPlayer.name}</strong>
            <p className="kicker" style={{ marginTop: '12px' }}>Ejected · Now Spectating</p>
          </div>
        )}

        <div className="vote-tally">
          <p className="kicker" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Vote Tally</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {tallies.map((tally, idx) => (
              <div key={idx} className="tally-row">
                <span style={{ fontSize: '0.9rem', fontWeight: tally.votes > 0 ? 600 : 400 }}>{tally.name}</span>
                {/*
                <div className="tally-bar-bg">
                  <div 
                    className="tally-bar-fill" 
                    style={{ 
                      width: `${(tally.votes / maxVotes) * 100}%`,
                      background: tally.name === '@null_ninja' ? 'var(--danger-color)' : 'var(--text-primary)'
                    }} 
                  />
                </div>
                */}
                <div className="tally-bar-bg" style={{ border: '1px solid var(--border-color)', background: 'transparent' }}>
                  <div 
                    className="tally-bar-fill" 
                    style={{ 
                      width: `${(tally.votes / maxVotes) * 100}%`,
                      background: tally.id === result.ejectedPlayerId ? 'var(--danger-color)' : 'var(--text-primary)'
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
