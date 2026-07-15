import React, { useState, useEffect } from 'react';

export function EmergencyMeeting({ 
  meeting,
  players,
  myUserId,
  onVote,
  onClose 
}: { 
  meeting: any;
  players: any[];
  myUserId: string;
  onVote: (targetId: string | 'skip') => void;
  onClose?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [myVote, setMyVote] = useState<string | null>(null);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((meeting.endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [meeting.endTime]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleConfirmVote = () => {
    if (myVote) {
      onVote(myVote);
    }
  };

  return (
    <div className="meeting-overlay">
      <div className="meeting-header">
        <div>
          <p className="kicker" style={{ color: 'var(--danger-color)' }}>Emergency Meeting Called by {players.find(p => p.id === meeting.callerUserId)?.name ?? 'Someone'}</p>
          <h2>Reason: {meeting.reason}</h2>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 600, border: '1px solid var(--danger-color)', padding: '8px 16px', borderRadius: '4px' }}>
          ⏱ Discussion {formatTime(timeLeft)}
        </div>
      </div>
      
      <div className="meeting-body">
        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="surface" style={{ borderColor: 'var(--accent-color)' }}>
            <p className="kicker">Pinned Commit</p>
            <div style={{ marginTop: '12px' }}>
              <strong>3f2a1c9</strong> <span className="muted">· @null_ninja</span>
              <p style={{ margin: '8px 0', fontSize: '0.9rem' }}>FEAT(FEED): PAGINATE POSTS ENDPOINT</p>
              <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--success-color)' }}>
                + if (!res.ok) return [];
              </pre>
              <button className="button ghost" style={{ width: '100%', marginTop: '12px' }}>Open diff →</button>
            </div>
          </div>
          
          <div className="surface" style={{ flex: 1 }}>
            <p className="kicker">Recent Activity</p>
            <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>@hex_wizard approved #12</li>
              <li>@mergequeen approved #11</li>
              <li>@null_ninja pushed 3f2a1c9</li>
            </ul>
          </div>
        </div>

        {/* Center Vote Grid */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p className="kicker" style={{ marginBottom: '16px', textAlign: 'center' }}>Who is the imposter? · Tap to vote</p>
          <div className="vote-grid">
            {players.map(p => (
              <div 
                key={p.id} 
                className={`vote-card ${myVote === p.id ? 'selected' : ''}`}
                onClick={() => setMyVote(p.id)}
              >
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', margin: '0 auto', display: 'grid', placeItems: 'center' }}>
                  {p.id.toUpperCase()}
                </div>
                <strong style={{ fontSize: '1.1rem' }}>{p.name}</strong>
                {/* <span className="muted" style={{ fontSize: '0.8rem' }}>Votes: {p.votes}</span> */}
                <button className={`button ${p.hasVoted ? 'ghost' : ''}`} style={{ marginTop: 'auto' }}>
                  {p.hasVoted ? '✓ Voted' : 'Vote'}
                </button>
              </div>
            ))}
            <div 
              className={`vote-card skip ${myVote === 'skip' ? 'selected' : ''}`}
              onClick={() => setMyVote('skip')}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto', display: 'grid', placeItems: 'center', border: '1px dashed var(--text-muted)' }}>
                ⏭
              </div>
              <strong style={{ fontSize: '1.1rem' }}>Skip vote</strong>
              {/* <span className="muted" style={{ fontSize: '0.8rem' }}>Votes: 1</span> */}
              <button className="button" style={{ marginTop: 'auto' }}>Vote Skip</button>
            </div>
          </div>
        </div>

        {/* Right Chat Panel */}
        <div className="chat-panel">
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <p className="kicker">Discussion</p>
          </div>
          <div className="chat-messages">
            <div style={{ fontSize: '0.9rem' }}><strong style={{ color: 'var(--accent-color)' }}>@octoplayer:</strong> that early return is not it</div>
            <div style={{ fontSize: '0.9rem' }}><strong>@null_ninja:</strong> it's defensive coding!</div>
            <div style={{ fontSize: '0.9rem' }}><strong>@debugbird:</strong> it silently returns [] on 500...</div>
            <div style={{ fontSize: '0.9rem' }}><strong>@mergequeen:</strong> I approved too fast, my bad</div>
            <div style={{ fontSize: '0.9rem' }}><strong>@hex_wizard:</strong> could just be junior style</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: '8px 0' }}>- voting begins in 00:47 -</div>
          </div>
          <div className="chat-input-bar">
            <input type="text" placeholder="Message..." style={{ flex: 1 }} />
            <button className="button ghost">Send</button>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '16px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '1.1rem' }}>
          <span className="muted">YOUR VOTE: </span>
          <strong>{myVote ? (myVote === 'skip' ? 'SKIP VOTE' : players.find(p => p.id === myVote)?.name) : 'NONE'}</strong>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {onClose && <button className="button ghost" onClick={onClose}>Close (Dev)</button>}
          <button className="button ghost" onClick={() => setMyVote(null)} disabled={players.find(p => p.id === myUserId)?.hasVoted}>Change vote</button>
          <button className="button dark" disabled={!myVote || players.find(p => p.id === myUserId)?.hasVoted} onClick={handleConfirmVote}>
            {players.find(p => p.id === myUserId)?.hasVoted ? 'Vote Cast' : 'Confirm vote'}
          </button>
        </div>
      </div>
    </div>
  );
}
