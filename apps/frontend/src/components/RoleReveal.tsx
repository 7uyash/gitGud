import React, { useState, useEffect } from 'react';

export function RoleReveal({ onComplete, role }: { onComplete: () => void; role?: string }) {
  const [countdown, setCountdown] = useState(10);
  const isImposter = role === 'imposter';

  useEffect(() => {
    if (countdown <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  return (
    <div className="meeting-overlay" style={{ justifyContent: 'center', zIndex: 999 }}>
      <div className="surface" style={{ 
        maxWidth: '700px', 
        width: '100%', 
        margin: '0 auto', 
        textAlign: 'center', 
        padding: '60px',
        borderColor: isImposter ? 'var(--danger-color)' : 'var(--success-color)',
        boxShadow: `0 0 40px ${isImposter ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
      }}>
        <div style={{ 
          width: '200px', 
          height: '200px', 
          margin: '0 auto 40px',
          background: isImposter 
            ? 'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.1) 10px, transparent 10px, transparent 20px)' 
            : 'repeating-linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.1) 10px, transparent 10px, transparent 20px)',
          border: `2px dashed ${isImposter ? 'var(--danger-color)' : 'var(--success-color)'}`,
          display: 'grid',
          placeItems: 'center',
          opacity: 0.8
        }}>
          <span className="kicker" style={{ color: isImposter ? 'var(--danger-color)' : 'var(--success-color)' }}>
            {isImposter ? 'IMPOSTER SILHOUETTE' : 'CREWMATE SILHOUETTE'}
          </span>
        </div>

        <h1 style={{ fontSize: '3rem', marginBottom: '24px', color: isImposter ? 'var(--danger-color)' : 'var(--text-primary)' }}>
          You are {isImposter ? 'an IMPOSTER' : 'a CREWMATE'}
        </h1>

        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '32px' }}>
          {isImposter 
            ? 'Ship subtly broken code without being caught. Sabotage builds, mislead reviews.' 
            : 'Fix bugs, ship real code, and identify the imposters shipping sabotage.'}
        </p>

        <ul style={{ textAlign: 'left', display: 'inline-block', margin: '0 auto 40px', fontSize: '1.1rem' }}>
          {isImposter ? (
            <>
              <li>• Introduce plausible bugs</li>
              <li>• Blend into reviews</li>
              <li>• Coordinate with your team</li>
            </>
          ) : (
            <>
              <li>• Complete assigned tasks</li>
              <li>• Review commits carefully</li>
              <li>• Call a meeting when suspicious</li>
            </>
          )}
        </ul>

        {isImposter && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', padding: '16px', borderRadius: '8px', marginBottom: '40px', display: 'inline-block' }}>
            <span className="muted" style={{ marginRight: '8px' }}>Fellow Imposter:</span>
            <strong style={{ color: 'var(--danger-color)' }}>@hex_wizard</strong>
          </div>
        )}

        <br/>
        <button className="button dark" onClick={onComplete} style={{ fontSize: '1.2rem', padding: '16px 32px' }}>
          Continue ({countdown}s)
        </button>

        {/*
        <p className="kicker" style={{ marginTop: '60px', opacity: 0.5 }}>
          Do not share your role. Screenshots betray your team.
        </p>
        */}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', background: 'var(--bg-main)', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
        <p className="kicker" style={{ margin: 0, opacity: 0.5 }}>
          Do not share your role. Screenshots betray your team.
        </p>
      </div>
    </div>
  );
}
