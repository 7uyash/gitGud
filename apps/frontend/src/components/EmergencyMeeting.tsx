import React, { useState, useEffect, useRef } from 'react';

export function EmergencyMeeting({
  meeting,
  players,
  myUserId,
  myUsername,
  onVote,
  onClose,
  chatMessages,
  onSendMessage,
}: {
  meeting: any;
  players: any[];
  myUserId: string;
  myUsername?: string;
  onVote: (targetId: string | 'skip') => void;
  onClose?: () => void;
  chatMessages?: Array<{ username: string; text: string; isSystem?: boolean }>;
  onSendMessage?: (text: string) => void;
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleConfirmVote = () => {
    if (myVote) onVote(myVote);
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !onSendMessage) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
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
            <p className="kicker">Meeting Called By</p>
            <div style={{ marginTop: '12px', fontSize: '0.95rem' }}>
              <strong>{players.find(p => p.id === meeting.callerUserId)?.name ?? 'Unknown'}</strong>
            </div>
            <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{meeting.reason}</p>
          </div>

          <div className="surface" style={{ flex: 1 }}>
            <p className="kicker">Players</p>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {players.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.hasVoted ? 'var(--success-color)' : 'var(--border-color)', flexShrink: 0 }} />
                  <span style={{ color: p.id === myUserId ? 'var(--accent-color)' : 'inherit' }}>
                    {p.name}{p.id === myUserId ? ' (you)' : ''}
                  </span>
                  {p.hasVoted && <span className="muted" style={{ fontSize: '0.75rem', marginLeft: 'auto' }}>voted</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Vote Grid */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p className="kicker" style={{ marginBottom: '16px', textAlign: 'center' }}>Who is the imposter? · Select to vote</p>
          <div className="vote-grid">
            {players.map(p => {
              const alreadyVoted = players.find(x => x.id === myUserId)?.hasVoted;
              const isSelected = myVote === p.id;
              return (
                <div
                  key={p.id}
                  className={`vote-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => !alreadyVoted && setMyVote(p.id)}
                  style={{ cursor: alreadyVoted ? 'default' : 'pointer' }}
                >
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto', display: 'block' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', margin: '0 auto', display: 'grid', placeItems: 'center', fontSize: '1.4rem', fontWeight: 700, border: isSelected ? '2px solid var(--danger-color)' : '2px solid transparent' }}>
                      {p.initial ?? p.name?.[1]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <strong style={{ fontSize: '1rem' }}>{p.name}</strong>
                  <div style={{ marginTop: 'auto', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: p.hasVoted ? 'rgba(255,255,255,0.05)' : isSelected ? 'var(--danger-color)' : 'transparent', color: p.hasVoted ? 'var(--success-color)' : isSelected ? '#000' : 'var(--text-muted)', border: p.hasVoted ? 'none' : '1px solid var(--border-color)' }}>
                    {p.hasVoted ? '✓ Voted' : isSelected ? '● Selected' : 'Select'}
                  </div>
                </div>
              );
            })}
            <div
              className={`vote-card skip ${myVote === 'skip' ? 'selected' : ''}`}
              onClick={() => !players.find(x => x.id === myUserId)?.hasVoted && setMyVote('skip')}
              style={{ cursor: players.find(x => x.id === myUserId)?.hasVoted ? 'default' : 'pointer' }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto', display: 'grid', placeItems: 'center', border: '1px dashed var(--text-muted)', fontSize: '1.5rem' }}>
                ⏭
              </div>
              <strong style={{ fontSize: '1rem' }}>Skip vote</strong>
              <div style={{ marginTop: 'auto', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', color: myVote === 'skip' ? 'var(--accent-color)' : 'var(--text-muted)' }}>
                {myVote === 'skip' ? '● Selected' : 'Select'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Chat Panel */}
        <div className="chat-panel">
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <p className="kicker">Discussion</p>
          </div>
          <div className="chat-messages">
            {(!chatMessages || chatMessages.length === 0) ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px' }}>No messages yet. Discuss!</div>
            ) : (
              chatMessages.filter(m => !m.isSystem).map((msg, i) => (
                <div key={i} style={{ fontSize: '0.9rem' }}>
                  <strong style={{ color: msg.username === myUsername ? 'var(--accent-color)' : 'inherit' }}>@{msg.username}:</strong> {msg.text}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input-bar">
            <input
              type="text"
              placeholder="Message..."
              style={{ flex: 1 }}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
            />
            <button className="button ghost" onClick={handleSendChat}>Send</button>
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
