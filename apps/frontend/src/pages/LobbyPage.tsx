import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export function LobbyPage({ currentUserId }: { currentUserId?: string }) {
  const [chatMessage, setChatMessage] = useState('');
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 340px', gap: '24px', minHeight: 'calc(100vh - 120px)' }}>
      
      {/* Left Sidebar - Players */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kicker">Players 6/8</span>
          <span className="kicker">Host</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { id: 'P1', name: '@octoplayer', isHost: true, isReady: true },
            { id: 'P2', name: '@debugbird', isReady: true },
            { id: 'P3', name: '@mergequeen', isReady: true },
            { id: 'P4', name: '@null_ninja', isReady: false },
            { id: 'P5', name: '@hex_wizard', isReady: true },
            { id: 'P6', name: '@semver_sam', isReady: false },
          ].map(p => (
            <div key={p.id} className="surface" style={{ padding: '12px 16px', display: 'flex', gap: '16px', alignItems: 'center', borderColor: p.isReady ? 'var(--success-color)' : 'var(--border-color)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}>{p.id}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{p.name} {p.isHost && <span className="muted">- host</span>}</div>
                <div style={{ fontSize: '0.8rem', color: p.isReady ? 'var(--success-color)' : 'var(--text-muted)' }}>
                  {p.isReady ? '☑ READY' : '☐ NOT READY'}
                </div>
              </div>
            </div>
          ))}
          <div className="surface" style={{ borderStyle: 'dashed', textAlign: 'center', color: 'var(--text-muted)' }}>Empty slot</div>
          <div className="surface" style={{ borderStyle: 'dashed', textAlign: 'center', color: 'var(--text-muted)' }}>Empty slot</div>
        </div>
      </div>

      {/* Main Area - Settings */}
      <div className="surface" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <p className="kicker">Room</p>
            <h1 style={{ margin: '8px 0', fontSize: '2.5rem' }}>react-refactor-run</h1>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span className="muted">Code:</span> <strong>A2F-93K</strong>
              <button className="button ghost">Copy</button>
              <button className="button ghost">Share link</button>
            </div>
          </div>
          <button className="button ghost">Settings</button>
        </div>

        <p className="kicker" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Match Settings</p>
        
        {/*
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="setting-card">
            <span className="kicker">Players</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>8</div>
          </div>
          <div className="setting-card">
            <span className="kicker">Imposters</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>2</div>
          </div>
          <div className="setting-card">
            <span className="kicker">Timer</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>15 min</div>
          </div>
          <div className="setting-card">
            <span className="kicker">Pack</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>JS/TS v3</div>
          </div>
          <div className="setting-card">
            <span className="kicker">Codebase</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>mini-blog@1.4</div>
          </div>
          <div className="setting-card">
            <span className="kicker">Voice</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>off</div>
          </div>
        </div>
        */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
          <div className="setting-card">
            <span className="kicker">Players</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>8</div>
          </div>
          <div className="setting-card">
            <span className="kicker">Imposters</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>2</div>
          </div>
          <div className="setting-card">
            <span className="kicker">Timer</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>15 min</div>
          </div>
          <div className="setting-card">
            <span className="kicker">Pack</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>JS/TS v3</div>
          </div>
          <div className="setting-card">
            <span className="kicker">Codebase</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>mini-blog@1.4</div>
          </div>
          <div className="setting-card">
            <span className="kicker">Voice</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>off</div>
          </div>
          <div className="setting-card">
            <span className="kicker">Spectators</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>on</div>
          </div>
          <div className="setting-card">
            <span className="kicker">Late Join</span>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>60s</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="button dark">☐ I'm ready</button>
            <span className="kicker">4 OF 6 PLAYERS READY</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '32px' }}>
          <Link to="/dashboard" className="button ghost">← Leave lobby</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="kicker">HOST ONLY</span>
            <button className="button dark" style={{ background: 'var(--success-color)', borderColor: 'var(--success-color)', color: '#000' }}>Start game ▶</button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Chat */}
      <div className="surface" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <p className="kicker">Lobby Chat</p>
        </div>
        
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>- system: octoplayer created the room</div>
          <div style={{ fontSize: '0.9rem' }}><strong style={{ color: 'var(--accent-color)' }}>@debugbird:</strong> gm</div>
          <div style={{ fontSize: '0.9rem' }}><strong>@mergequeen:</strong> hyped, first time playing</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>- system: hex_wizard is ready</div>
          <div style={{ fontSize: '0.9rem' }}><strong>@null_ninja:</strong> waiting on sam</div>
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="Message..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} style={{ margin: 0, flex: 1 }} />
          <button className="button ghost">Send</button>
        </div>
      </div>
    </div>
  );
}
