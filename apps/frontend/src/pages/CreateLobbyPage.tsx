import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createLobby } from '../api';

export function CreateLobbyPage() {
  const navigate = useNavigate();
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [imposters, setImposters] = useState(2);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateLobby = async () => {
    try {
      setIsCreating(true);
      const res = await createLobby(maxPlayers);
      navigate(`/lobbies/${res.lobby.id}`);
    } catch (e) {
      alert('Failed to create lobby');
      setIsCreating(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
      
      {/* Main Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <p className="kicker" style={{ marginBottom: '-16px' }}>DASHBOARD / NEW LOBBY</p>
        
        <div className="surface" style={{ padding: '24px' }}>
          <p className="kicker" style={{ marginBottom: '16px' }}>Room</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Room Name</label>
              <input type="text" defaultValue="react-refactor-run" />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Room Code</label>
                <input type="text" defaultValue="A2F-93K" readOnly />
              </div>
              <button className="button ghost">↻</button>
              <button className="button ghost">Copy</button>
            </div>
          </div>
          
          <div style={{ marginTop: '24px' }}>
            <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Visibility</label>
            <div style={{ display: 'inline-flex', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <button className="button dark" style={{ border: 'none', borderRadius: 0 }}>Public</button>
              <button className="button ghost" style={{ border: 'none', borderRadius: 0 }}>Private</button>
            </div>
          </div>
        </div>

        <div className="surface" style={{ padding: '24px' }}>
          <p className="kicker" style={{ marginBottom: '16px' }}>Match Rules</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Players</label>
              <input type="range" min="6" max="9" value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} style={{ width: '100%', marginTop: '16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>6</span>
                <span>{maxPlayers}</span>
                <span>9</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Imposters</label>
              <div style={{ display: 'inline-flex', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <button className={`button ${imposters === 1 ? 'dark' : 'ghost'}`} style={{ border: 'none', borderRadius: 0 }} onClick={() => setImposters(1)}>1</button>
                <button className={`button ${imposters === 2 ? 'dark' : 'ghost'}`} style={{ border: 'none', borderRadius: 0 }} onClick={() => setImposters(2)}>2</button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Match Timer</label>
              <div style={{ display: 'inline-flex', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                {['10m', '15m', '20m', '25m'].map(t => (
                  <button key={t} className={`button ${t === '15m' ? 'dark' : 'ghost'}`} style={{ border: 'none', borderRadius: 0 }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Discussion Time (s)</label>
              <input type="number" defaultValue={120} />
            </div>
          </div>
        </div>

        <div className="surface" style={{ padding: '24px' }}>
          <p className="kicker" style={{ marginBottom: '16px' }}>Content</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Problem Pack</label>
              <select style={{ width: '100%', marginTop: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                <option>JS/TS Bugs vol.3</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Codebase</label>
              <select style={{ width: '100%', marginTop: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}>
                <option>mini-blog-app@1.4</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="surface" style={{ padding: '24px' }}>
          <p className="kicker" style={{ marginBottom: '16px' }}>Advanced (Optional)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Allow spectators
              <input type="checkbox" defaultChecked style={{ width: 'auto' }} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Late join within first 60s
              <input type="checkbox" defaultChecked style={{ width: 'auto' }} />
            </label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Voice channel
              <input type="checkbox" style={{ width: 'auto' }} />
            </label>
          </div>
        </div>
      </div>

      {/* Right Column (Sidebar) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '24px' }}>
        
        <div className="surface" style={{ padding: '24px' }}>
          <p className="kicker" style={{ marginBottom: '16px' }}>Summary</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted">Players</span>
              <strong>{maxPlayers}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted">Imposters</span>
              <strong>{imposters}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted">Timer</span>
              <strong>15 min</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted">Pack</span>
              <strong>JS/TS v3</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="muted">Code</span>
              <strong>A2F-93K</strong>
            </div>
          </div>
        </div>

        <div className="surface" style={{ padding: '24px' }}>
          <p className="kicker" style={{ marginBottom: '16px' }}>Share</p>
          <input type="text" defaultValue="gitgud.app/join/A2F-93K" readOnly style={{ marginBottom: '12px' }} />
          <button className="button ghost" style={{ width: '100%' }}>Copy link</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            className="button dark" 
            style={{ padding: '16px', background: 'var(--text-primary)', color: '#000', fontSize: '1.1rem' }} 
            onClick={handleCreateLobby}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create & enter lobby →'}
          </button>
          <Link to="/dashboard" className="button ghost" style={{ padding: '16px' }}>
            Cancel
          </Link>
        </div>

      </div>
    </div>
  );
}
