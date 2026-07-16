import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listPublicLobbies, getMyMatches, joinLobby, joinLobbyByCode } from '../api';

interface DashboardPageProps {
  user: any;
}

function getRankInfo(totalMatches: number) {
  if (totalMatches === 0) return { rank: 'NEWBIE', level: 1, xp: 0, xpNext: 300 };
  if (totalMatches < 5)   return { rank: 'RUBBER DUCK', level: 1, xp: totalMatches * 100, xpNext: 500 };
  if (totalMatches < 15)  return { rank: 'JUNIOR DEV',  level: 2, xp: totalMatches * 100, xpNext: 1500 };
  if (totalMatches < 30)  return { rank: 'MID-LEVEL',   level: 3, xp: totalMatches * 100, xpNext: 3000 };
  return                         { rank: 'SENIOR',       level: 4, xp: totalMatches * 100, xpNext: 5000 };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function PlayerDots({ filled, total }: { filled: number; total: number }) {
  return (
    <span style={{ letterSpacing: '2px', fontSize: '0.75rem' }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ color: i < filled ? 'var(--accent-color)' : 'var(--border-color)' }}>●</span>
      ))}
    </span>
  );
}

export function DashboardPage({ user }: DashboardPageProps) {
  const navigate = useNavigate();
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ winRate: 0, totalMatches: 0, finishedCount: 0 });
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    Promise.all([
      listPublicLobbies().catch(() => []),
      getMyMatches().catch(() => []),
    ]).then(([fetchedLobbies, fetchedMatches]) => {
      setLobbies(fetchedLobbies);
      setMatches(fetchedMatches);

      const finished = fetchedMatches.filter((m: any) => m.winnerTeam);
      const wins = finished.filter((m: any) => {
        const role = (m.roleAssignments as Record<string, string>)?.[user?.id ?? ''];
        return role && m.winnerTeam === role;
      }).length;
      setStats({
        winRate: finished.length > 0 ? Math.round((wins / finished.length) * 100) : 0,
        totalMatches: fetchedMatches.length,
        finishedCount: finished.length,
      });

      setLoading(false);
    });
  }, []);

  const handleJoinPublicLobby = async (lobbyId: string) => {
    try {
      await joinLobby(lobbyId);
      navigate(`/lobbies/${lobbyId}`);
    } catch (e) {
      alert('Failed to join lobby');
    }
  };

  const handleJoinByCode = async () => {
    if (!roomCode.trim()) return;
    try {
      const result = await joinLobbyByCode(roomCode.trim());
      navigate(`/lobbies/${result.lobby.id}`);
    } catch (e: any) {
      alert(e?.message ?? 'Invalid room code');
    }
  };

  const rankInfo = getRankInfo(stats.totalMatches);
  const xpFillPct = Math.min(100, Math.round((rankInfo.xp / rankInfo.xpNext) * 100));

  const winRateColor = stats.finishedCount === 0
    ? 'var(--border-color)'
    : stats.winRate >= 50 ? 'var(--success-color)' : 'var(--danger-color)';
  const winRateDisplay = loading ? '—' : stats.finishedCount === 0 ? '—' : `${stats.winRate}%`;

  return (
    <div className="dashboard-grid">
      {/* Left Sidebar */}
      <nav className="dashboard-nav surface">
        <Link to="/dashboard" className="nav-item active">Home</Link>
        <span className="nav-item" style={{ opacity: 0.4, cursor: 'not-allowed' }} title="Coming soon">Play</span>
        <span className="nav-item" style={{ opacity: 0.4, cursor: 'not-allowed' }} title="Coming soon">Learn</span>
        <span className="nav-item" style={{ opacity: 0.4, cursor: 'not-allowed' }} title="Coming soon">Leaderboard</span>
        <span className="nav-item" style={{ opacity: 0.4, cursor: 'not-allowed' }} title="Coming soon">Settings</span>
      </nav>

      {/* Main Content */}
      <div className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
            <span style={{ color: 'var(--accent-color)' }}>🔍</span>
            <input type="text" placeholder="Search rooms, players, tasks..." style={{ margin: 0, border: 'none', background: 'transparent', flex: 1, padding: '4px', outline: 'none', boxShadow: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-color)', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                {user?.displayName?.[0] ?? 'P'}
              </div>
            )}
          </div>
        </div>

        {/* Profile + Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>

          {/* Profile card */}
          <div className="surface" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px solid var(--border-color)', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', fontSize: '1.2rem' }}>
                  {user?.displayName?.[0] ?? 'P'}
                </div>
              )}
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{user?.displayName ?? '@guest'}</h2>
                <div className="kicker" style={{ marginTop: '4px' }}>
                  @{user?.username ?? 'guest'} · {loading ? '...' : `RANK: ${rankInfo.rank} · LV ${rankInfo.level}`}
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span className="muted">XP</span>
                <span>{loading ? '—' : `${rankInfo.xp.toLocaleString()} / ${rankInfo.xpNext.toLocaleString()}`}</span>
              </div>
              <div className="tally-bar-bg" style={{ height: '8px' }}>
                <div className="tally-bar-fill" style={{ width: loading ? '0%' : `${xpFillPct}%`, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="surface" style={{ display: 'flex', flexDirection: 'column' }}>
            <p className="kicker" style={{ marginBottom: '16px' }}>Quick Actions</p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link to="/lobbies/new" className="button dark">+ Create Lobby</Link>
              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                <input
                  type="text"
                  placeholder="ROOM CODE"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
                  style={{ margin: 0, flex: 1 }}
                />
                <button className="button ghost" onClick={handleJoinByCode} disabled={!roomCode.trim()}>Join</button>
              </div>
              <button className="button ghost" disabled title="Coming soon">Quick match</button>
            </div>

            {import.meta.env.DEV && (
              <>
                <p className="kicker" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', color: 'var(--danger-color)' }}>Dev Previews</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <Link to="/test/diff" className="text-button">Diff</Link>
                  <Link to="/test/meeting" className="text-button">Meeting</Link>
                  <Link to="/test/voting" className="text-button">Voting</Link>
                  <Link to="/test/gameover" className="text-button">GameOver</Link>
                  <Link to="/test/recap" className="text-button">Recap</Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="mini-grid compact">
          <div className="surface stat" style={{ alignItems: 'flex-start', padding: '16px 24px', borderLeft: `3px solid ${winRateColor}` }}>
            <span className="kicker">Win Rate</span>
            <span className="stat-value" style={{ marginTop: '8px', color: winRateColor }}>{winRateDisplay}</span>
          </div>
          <div className="surface stat" style={{ alignItems: 'flex-start', padding: '16px 24px', borderLeft: '3px solid var(--accent-color)' }}>
            <span className="kicker">Matches Played</span>
            <span className="stat-value" style={{ marginTop: '8px' }}>{loading ? '—' : stats.totalMatches}</span>
          </div>
          <div className="surface stat" style={{ alignItems: 'flex-start', padding: '16px 24px', borderLeft: '3px solid var(--accent-color)' }}>
            <span className="kicker">Public Rooms</span>
            <span className="stat-value" style={{ marginTop: '8px' }}>{loading ? '—' : lobbies.length}</span>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>

          {/* Recent Matches */}
          <div className="surface">
            <p className="kicker" style={{ marginBottom: '16px' }}>Recent Matches</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Role</th>
                  <th>Result</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="muted" style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : matches.length === 0 ? (
                  <tr><td colSpan={4} className="muted" style={{ textAlign: 'center' }}>No recent matches found.</td></tr>
                ) : (
                  matches.map((match: any) => {
                    const role = (match.roleAssignments as Record<string, string>)?.[user?.id ?? ''] ?? '—';
                    const won = match.winnerTeam === role;
                    return (
                      <tr key={match.id}>
                        <td>#{match.id.slice(0, 6).toUpperCase()}</td>
                        <td style={{ textTransform: 'capitalize' }}>{role}</td>
                        <td style={{ color: match.winnerTeam ? (won ? 'var(--success-color)' : 'var(--danger-color)') : 'var(--text-muted)' }}>
                          {match.winnerTeam ? (won ? 'Win' : 'Loss') : 'In progress'}
                        </td>
                        <td><Link to={`/matches/${match.id}`} className="text-button">Recap →</Link></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Public Rooms */}
          <div className="surface">
            <p className="kicker" style={{ marginBottom: '16px' }}>Public Rooms</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input type="text" placeholder="Filter..." style={{ margin: 0, flex: 1 }} />
              <Link to="/lobbies/new" className="button ghost">New</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                <div className="muted" style={{ textAlign: 'center', padding: '16px' }}>Loading...</div>
              ) : lobbies.length === 0 ? (
                <div className="muted" style={{ textAlign: 'center', padding: '16px' }}>No public rooms available.</div>
              ) : (
                lobbies.map((lobby: any) => (
                  <div key={lobby.id} className="room-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <strong>Room {lobby.joinCode}</strong>
                      <PlayerDots filled={lobby.playerCount ?? 0} total={lobby.maxPlayers} />
                      <div className="muted" style={{ fontSize: '0.75rem' }}>
                        {lobby.playerCount ?? 0}/{lobby.maxPlayers} players · {lobby.createdAt ? timeAgo(lobby.createdAt) : ''}
                      </div>
                    </div>
                    <button className="button ghost" onClick={() => handleJoinPublicLobby(lobby.id)}>Join</button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
