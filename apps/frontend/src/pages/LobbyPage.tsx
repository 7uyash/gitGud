import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getLobby, leaveLobby, setReady, startLobby, startMatch } from '../api';
import { getGameSocket } from '../socket';

export function LobbyPage({ currentUserId }: { currentUserId?: string }) {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [chatMessage, setChatMessage] = useState('');
  const [lobbyState, setLobbyState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLobby = async () => {
    if (!lobbyId) return;
    try {
      const res = await getLobby(lobbyId);
      setLobbyState(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const notifyChange = () => {
    if (lobbyId) {
      getGameSocket().emit('lobby:changed', lobbyId);
    }
  };

  useEffect(() => {
    if (!lobbyId) return;
    fetchLobby();
    const socket = getGameSocket();
    socket.connect();
    socket.emit('lobby:watch', lobbyId);

    const onLobbyChanged = () => {
      fetchLobby();
    };
    
    // Also listen for match:started so everyone navigates to the game
    const onMatchStarted = (payload: any) => {
      if (payload?.match?.id) {
        navigate(`/matches/${payload.match.id}`);
      }
    };

    socket.on('lobby:changed', onLobbyChanged);
    socket.on('match:started', onMatchStarted);

    return () => {
      socket.off('lobby:changed', onLobbyChanged);
      socket.off('match:started', onMatchStarted);
      socket.emit('lobby:unwatch', lobbyId);
    };
  }, [lobbyId, navigate]);

  const handleLeave = async () => {
    if (!lobbyId) return;
    await leaveLobby(lobbyId);
    notifyChange();
    navigate('/dashboard');
  };

  const handleToggleReady = async (currentReadyState: boolean) => {
    if (!lobbyId) return;
    await setReady(lobbyId, !currentReadyState);
    notifyChange();
    fetchLobby(); // Optimistic fetch
  };

  const handleStartGame = async () => {
    if (!lobbyId) return;
    try {
      const payload = await startLobby(lobbyId);
      const matchRes = await startMatch(payload);
      navigate(`/matches/${matchRes.match.id}`);
      notifyChange(); // notify others if needed, but match:started should be used.
    } catch (e) {
      alert('Failed to start game: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  if (loading || !lobbyState) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Loading lobby...</div>;
  }

  const { lobby, players } = lobbyState;
  const isHost = lobby.hostUserId === currentUserId;
  const currentPlayer = players.find((p: any) => p.userId === currentUserId);
  const isReady = currentPlayer?.isReady ?? false;
  const readyCount = players.filter((p: any) => p.isReady).length;
  const totalPlayers = players.length;
  const allReady = readyCount === totalPlayers && totalPlayers >= 1;

  // Render dummy slots
  const emptySlots = Math.max(0, lobby.maxPlayers - players.length);
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 340px', gap: '24px', minHeight: 'calc(100vh - 120px)' }}>
      
      {/* Left Sidebar - Players */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="kicker">Players {players.length}/{lobby.maxPlayers}</span>
          {isHost && <span className="kicker">Host</span>}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {players.map((p: any) => (
            <div key={p.userId} className="surface" style={{ padding: '12px 16px', display: 'flex', gap: '16px', alignItems: 'center', borderColor: p.isReady ? 'var(--success-color)' : 'var(--border-color)' }}>
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt={p.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}>
                  {p.displayName?.[0] ?? 'P'}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{p.displayName} {lobby.hostUserId === p.userId && <span className="muted">- host</span>}</div>
                <div style={{ fontSize: '0.8rem', color: p.isReady ? 'var(--success-color)' : 'var(--text-muted)' }}>
                  {p.isReady ? '☑ READY' : '☐ NOT READY'}
                </div>
              </div>
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={i} className="surface" style={{ borderStyle: 'dashed', textAlign: 'center', color: 'var(--text-muted)' }}>Empty slot</div>
          ))}
        </div>
      </div>

      {/* Main Area - Settings */}
      <div className="surface" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <p className="kicker">Room</p>
            <h1 style={{ margin: '8px 0', fontSize: '2.5rem' }}>Match #{lobby.id.slice(0, 4)}</h1>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span className="muted">Code:</span> <strong>{lobby.joinCode}</strong>
              <button className="button ghost" onClick={() => navigator.clipboard.writeText(lobby.joinCode)}>Copy</button>
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
            <button 
              className={`button ${isReady ? 'ghost' : 'dark'}`} 
              onClick={() => handleToggleReady(isReady)}
              style={isReady ? { borderColor: 'var(--success-color)', color: 'var(--success-color)' } : {}}
            >
              {isReady ? '☑ READY' : '☐ I\'m ready'}
            </button>
            <span className="kicker">{readyCount} OF {totalPlayers} PLAYERS READY</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '32px' }}>
          <button className="button ghost" onClick={handleLeave}>← Leave lobby</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isHost && (
              <>
                <span className="kicker">HOST ONLY</span>
                <button 
                  className="button dark" 
                  style={{ background: allReady ? 'var(--success-color)' : 'var(--border-color)', borderColor: allReady ? 'var(--success-color)' : 'var(--border-color)', color: '#000' }}
                  disabled={!allReady}
                  onClick={handleStartGame}
                >
                  Start game ▶
                </button>
              </>
            )}
            {!isHost && (
              <span className="kicker">WAITING FOR HOST...</span>
            )}
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
