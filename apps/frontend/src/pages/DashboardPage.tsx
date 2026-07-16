import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listPublicLobbies, getMyMatches, joinLobby } from '../api';
import type { CurrentUser } from '../App';

interface DashboardPageProps {
  user: any;
}

export function DashboardPage({ user }: DashboardPageProps) {
  const navigate = useNavigate();
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ winRate: 0, totalMatches: 0, bugsFound: 0 });

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
      const bugsFound = fetchedMatches.reduce((acc: number, m: any) => {
        const role = (m.roleAssignments as Record<string, string>)?.[user?.id ?? ''];
        return acc + (role === 'crew' && m.winnerTeam === 'crew' ? 1 : 0);
      }, 0);
      setStats({
        winRate: finished.length > 0 ? Math.round((wins / finished.length) * 100) : 0,
        totalMatches: fetchedMatches.length,
        bugsFound,
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
  return (
    <div className="dashboard-grid">
      {/* Left Sidebar - Navigation */}
      <nav className="dashboard-nav surface">
        <Link to="/dashboard" className="nav-item active">Home</Link>
        <Link to="#" className="nav-item">Play</Link>
        <Link to="#" className="nav-item">Learn</Link>
        <Link to="#" className="nav-item">Leaderboard</Link>
        <Link to="#" className="nav-item">Settings</Link>
      </nav>

      {/* Main Content Area */}
      <div className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top Bar: Search & Profile */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
            <span style={{ color: 'var(--accent-color)' }}>🔍</span>
            <input type="text" placeholder="Search rooms, players, tasks..." style={{ margin: 0, border: 'none', background: 'transparent', flex: 1, padding: '4px', outline: 'none', boxShadow: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '32px', height: '32px', border: '1px solid var(--border-color)', borderRadius: '4px' }}></div>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border-color)', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>
                {user?.displayName?.[0] ?? 'P'}
              </div>
            )}
          </div>
        </div>

        {/* Top Row: Profile & Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
          
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
                <div className="kicker" style={{ marginTop: '4px' }}>@{user?.username ?? 'guest'} · RANK: RUBBER DUCK · LV 4</div>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span className="muted">XP</span>
                <span>1,240 / 2,000</span>
              </div>
              <div className="tally-bar-bg" style={{ height: '8px' }}>
                <div className="tally-bar-fill" style={{ width: '62%' }} />
              </div>
            </div>
          </div>

          <div className="surface" style={{ display: 'flex', flexDirection: 'column' }}>
            <p className="kicker" style={{ marginBottom: '16px' }}>Quick Actions</p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link to="/lobbies/new" className="button dark">+ Create Lobby</Link>
              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                <input type="text" placeholder="ROOM CODE" style={{ margin: 0, flex: 1 }} />
                <button className="button ghost">Join</button>
              </div>
              <button className="button ghost">Quick match</button>
            </div>
            
            {/* Added debug links here for convenience */}
            <p className="kicker" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>Debug Previews</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              <Link to="/test/diff" className="text-button">Diff</Link>
              <Link to="/test/meeting" className="text-button">Meeting</Link>
              <Link to="/test/voting" className="text-button">Voting</Link>
              <Link to="/test/gameover" className="text-button">GameOver</Link>
              <Link to="/test/recap" className="text-button">Recap</Link>
            </div>
          </div>

        </div>

        {/* Stats Row */}
        <div className="mini-grid compact">
          <div className="surface stat" style={{ alignItems: 'flex-start', padding: '16px 24px' }}>
            <span className="kicker">Win Rate</span>
            <span className="stat-value" style={{ marginTop: '8px' }}>{loading ? '—' : `${stats.winRate}%`}</span>
          </div>
          <div className="surface stat" style={{ alignItems: 'flex-start', padding: '16px 24px' }}>
            <span className="kicker">Matches Played</span>
            <span className="stat-value" style={{ marginTop: '8px' }}>{loading ? '—' : stats.totalMatches}</span>
          </div>
          <div className="surface stat" style={{ alignItems: 'flex-start', padding: '16px 24px' }}>
            <span className="kicker">Crew Wins</span>
            <span className="stat-value" style={{ marginTop: '8px' }}>{loading ? '—' : stats.bugsFound}</span>
          </div>
          <div className="surface stat" style={{ alignItems: 'flex-start', padding: '16px 24px' }}>
            <span className="kicker">Public Rooms</span>
            <span className="stat-value" style={{ marginTop: '8px' }}>{loading ? '—' : lobbies.length}</span>
          </div>
        </div>

        {/* Bottom Row: Matches & Rooms */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          
          <div className="surface">
            <p className="kicker" style={{ marginBottom: '16px' }}>Recent Matches</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Role</th>
                  <th>Result</th>
                  <th>Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="muted" style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : matches.length === 0 ? (
                  <tr><td colSpan={5} className="muted" style={{ textAlign: 'center' }}>No recent matches found.</td></tr>
                ) : (
                  matches.map((match: any) => (
                    <tr key={match.id}>
                      <td>#{match.id.slice(0, 4)}</td>
                      <td>{match.role ?? 'Crewmate'}</td>
                      <td>{match.result ?? 'Win'}</td>
                      <td>{match.score ?? 0}</td>
                      <td><Link to="/test/recap" className="text-button">View recap →</Link></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="surface">
            <p className="kicker" style={{ marginBottom: '16px' }}>Public Rooms</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input type="text" placeholder="Filter..." style={{ margin: 0, flex: 1 }} />
              <button className="button ghost">New</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                <div className="muted" style={{ textAlign: 'center', padding: '16px' }}>Loading...</div>
              ) : lobbies.length === 0 ? (
                <div className="muted" style={{ textAlign: 'center', padding: '16px' }}>No public rooms available.</div>
              ) : (
                lobbies.map((lobby: any) => (
                  <div key={lobby.id} className="room-card">
                    <div>
                      <strong>Room {lobby.joinCode}</strong>
                      <div className="muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>OPEN · max {lobby.maxPlayers} PLAYERS</div>
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
