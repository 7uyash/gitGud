import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';

import {
  createLobby,
  getCurrentUser,
  getLobby,
  getMatch,
  joinLobby,
  leaveLobby,
  loginWithGitHub,
  logout,
  setReady,
  startLobby,
  startMatch,
  submitTask,
} from './api';
import { clearToken, getToken, setToken } from './auth';
import { getGameSocket, resetGameSocket } from './socket';
import type { MatchInitializationResponse, MatchStateDto, TaskSubmissionResponse } from './types';

// New UI Components
import { DiffReview } from './components/DiffReview';
import { EmergencyMeeting } from './components/EmergencyMeeting';
import { VotingResult } from './components/VotingResult';
import { GameOver } from './components/GameOver';
import { LearningRecap } from './components/LearningRecap';

type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>['user'];

function useAuthState() {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const current = await getCurrentUser();
        if (active) {
          setUser(current.user);
        }
      } catch {
        clearToken();
        if (active) {
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [token]);

  return {
    token,
    user,
    loading,
    login() {
      loginWithGitHub();
    },
    async signOut() {
      await logout().catch(() => null);
      clearToken();
      resetGameSocket();
      setTokenState(null);
      setUser(null);
    },
    setUser,
  };
}

function AppShell() {
  const auth = useAuthState();

  if (auth.loading) {
    return <div className="app-shell"><div className="frame"><div className="loading">Loading...</div></div></div>;
  }

  return (
    <div className="app-shell">
      <SiteHeader isAuthed={Boolean(auth.token)} onLogout={auth.signOut} />
      <main className="frame">
        <Routes>
          <Route path="/" element={<LandingPage isAuthed={Boolean(auth.token)} />} />
          <Route path="/login" element={<LoginPage onLogin={auth.login} isAuthed={Boolean(auth.token)} />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/dashboard" element={<RequireAuth token={auth.token} user={auth.user}><DashboardPage user={auth.user} /></RequireAuth>} />
          <Route path="/lobbies/new" element={<RequireAuth token={auth.token} user={auth.user}><CreateLobbyPage /></RequireAuth>} />
          <Route path="/lobbies/:lobbyId" element={<RequireAuth token={auth.token} user={auth.user}><LobbyPage currentUserId={auth.user?.id ?? ''} /></RequireAuth>} />
          <Route path="/matches/:matchId" element={<RequireAuth token={auth.token} user={auth.user}><MatchPage currentUserId={auth.user?.id ?? ''} /></RequireAuth>} />
          <Route path="/test/diff" element={<DiffReview />} />
          <Route path="/test/meeting" element={<EmergencyMeeting />} />
          <Route path="/test/voting" element={<VotingResult />} />
          <Route path="/test/gameover" element={<GameOver />} />
          <Route path="/test/recap" element={<LearningRecap />} />
          <Route path="*" element={<Navigate to={auth.token ? '/dashboard' : '/'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function SiteHeader({ isAuthed, onLogout }: { isAuthed: boolean; onLogout: () => Promise<void> }) {
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark" />
        <span>GitGud</span>
      </Link>
      <nav className="topnav">
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        {isAuthed ? (
          <button className="text-button" onClick={onLogout}>Logout</button>
        ) : (
          <Link to="/login" className="text-button">Login</Link>
        )}
      </nav>
    </header>
  );
}

function RequireAuth({ token, user, children }: { token: string | null; user: CurrentUser | null; children: React.ReactNode }) {
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function LandingPage({ isAuthed }: { isAuthed: boolean }) {
  return (
    <div className="landing">
      <section className="hero-panel">
        <p className="kicker">Multiplayer social deduction for devs</p>
        <h1>Minimal frontend. Real API calls. One working slice.</h1>
        <p className="muted">Login, create or join a lobby, start a match, then submit a task and read the review agent response.</p>
        <div className="actions">
          <Link to={isAuthed ? '/dashboard' : '/login'} className="button">{isAuthed ? 'Open dashboard' : 'Login with GitHub'}</Link>
          <Link to="/dashboard" className="button ghost">Dashboard</Link>
        </div>
      </section>

      <aside className="preview-panel" aria-hidden="true">
        <div className="preview-box">Landing preview</div>
      </aside>
    </div>
  );
}

function LoginPage({ onLogin, isAuthed }: { onLogin: () => void; isAuthed: boolean }) {
  const navigate = useNavigate();

  if (isAuthed) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <p className="kicker">Authentication</p>
        <h2>Sign in to GitGud</h2>
        <p className="muted">Use GitHub OAuth or the existing auth flow, then JWT is stored locally and attached automatically.</p>
        <button className="button dark" onClick={onLogin}>Continue with GitHub</button>
      </div>
      <div className="preview-panel small" aria-hidden="true">
        <div className="preview-box">OAuth consent preview</div>
      </div>
    </div>
  );
}

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');

    if (token) {
      setToken(token);
      window.location.assign('/dashboard');
      return;
    }

    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <p className="kicker">Authentication</p>
        <h2>Completing login</h2>
        <p className="muted">Finalizing the GitHub OAuth callback.</p>
      </div>
    </div>
  );
}

function DashboardPage({ user }: { user: CurrentUser | null }) {
  return (
    <div className="stack">
      <section className="surface">
        <p className="kicker">Dashboard</p>
        <h2>{user?.displayName ?? 'Player'}</h2>
        <p className="muted">{user?.username}</p>
        <div className="actions">
          <Link to="/lobbies/new" className="button">Create Lobby</Link>
          <Link to="/lobbies/demo-lobby" className="button ghost">Join Lobby</Link>
        </div>
        
        <p className="kicker" style={{ marginTop: '24px' }}>Debug UI Previews</p>
        <div className="actions" style={{ marginTop: '12px' }}>
          <Link to="/test/diff" className="button ghost">Diff Review</Link>
          <Link to="/test/meeting" className="button ghost">Emergency Meeting</Link>
          <Link to="/test/voting" className="button ghost">Voting Result</Link>
          <Link to="/test/gameover" className="button ghost">Game Over</Link>
          <Link to="/test/recap" className="button ghost">Learning Recap</Link>
        </div>
      </section>
      <section className="mini-grid">
        <div className="surface stat">Protected routes</div>
        <div className="surface stat">JWT auto-attach</div>
        <div className="surface stat">Socket match sync</div>
      </section>
    </div>
  );
}

function CreateLobbyPage() {
  const navigate = useNavigate();
  const [maxPlayers, setMaxPlayers] = useState(6);

  return (
    <div className="surface form-surface">
      <p className="kicker">Create Lobby</p>
      <h2>Minimal lobby creation</h2>
      <div className="form-row">
        <label>
          Max players
          <input type="number" value={maxPlayers} min={2} max={8} onChange={(event) => setMaxPlayers(Number(event.target.value))} />
        </label>
      </div>
      <button
        className="button dark"
        onClick={async () => {
          const lobby = await createLobby(maxPlayers);
          navigate(`/lobbies/${lobby.lobby.id}`);
        }}
      >
        Create lobby
      </button>
    </div>
  );
}

function LobbyPage({ currentUserId }: { currentUserId: string }) {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getLobby>> | null>(null);
  const isHost = snapshot?.lobby.hostUserId === currentUserId;

  useEffect(() => {
    if (!lobbyId) return;
    getLobby(lobbyId).then(setSnapshot).catch(() => null);
  }, [lobbyId]);

  return (
    <div className="stack">
      <section className="surface lobby-surface">
        <div>
          <p className="kicker">Waiting Lobby</p>
          <h2>{snapshot?.lobby.joinCode ?? 'Lobby'}</h2>
          <p className="muted">Lobby ID: {lobbyId}</p>
        </div>

        <div className="player-list">
          {snapshot?.players.map((player) => (
            <div key={player.userId} className="player-row">
              <span>{player.displayName}</span>
              <span>{player.isReady ? 'ready' : 'not ready'}</span>
            </div>
          ))}
        </div>

        <div className="actions">
          <button className="button ghost" onClick={async () => { if (lobbyId) setSnapshot(await joinLobby(lobbyId)); }}>Join</button>
          <button className="button ghost" onClick={async () => { if (lobbyId) setSnapshot(await setReady(lobbyId, true)); }}>Ready</button>
          <button
            className="button dark"
            disabled={!isHost}
            onClick={async () => {
              if (!lobbyId) return;
              const lobbyStart = await startLobby(lobbyId);
              const match = await startMatch(lobbyStart);
              navigate(`/matches/${match.match?.id}`);
            }}
          >
            Start match
          </button>
        </div>
      </section>
    </div>
  );
}

function MatchPage({ currentUserId }: { currentUserId: string }) {
  const { matchId } = useParams();
  const [match, setMatch] = useState<MatchStateDto | null>(null);
  const [init, setInit] = useState<MatchInitializationResponse | null>(null);
  const [feedback, setFeedback] = useState<TaskSubmissionResponse['review'] | null>(null);
  const [taskText, setTaskText] = useState('Fix the bug and validate the result.');

  useEffect(() => {
    if (!matchId) return;
    getMatch(matchId).then(setMatch).catch(() => null);
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;

    const socket = getGameSocket();
    socket.auth = { token: getToken() };
    socket.connect();
    socket.emit('match:join', { matchId, token: getToken() });
    socket.on('match:started', setInit);
    socket.on('submission:reviewed', (payload: TaskSubmissionResponse) => setFeedback(payload.review));

    return () => {
      socket.off('match:started', setInit);
      socket.off('submission:reviewed');
      socket.emit('match:leave', { matchId });
    };
  }, [matchId]);

  const role = useMemo(() => {
    if (!match?.match?.roleAssignments) return 'crew';
    return match.match.roleAssignments[currentUserId] ?? 'crew';
  }, [match, currentUserId]);

  return (
    <div className="stack">
      <section className="surface game-surface">
        <div className="game-head">
          <div>
            <p className="kicker">Basic Game Screen</p>
            <h2>Match in progress</h2>
          </div>
          <div className="match-meta">
            <span>Role: {role}</span>
            <span>Status: {match?.match?.status ?? 'loading'}</span>
          </div>
        </div>

        <div className="mini-grid compact">
          <div className="surface stat">Tasks: {match?.tasks.length ?? 0}</div>
          <div className="surface stat">Socket: {init ? 'connected' : 'waiting'}</div>
          <div className="surface stat">Ship: {match?.match?.shipReadiness ?? 0}%</div>
        </div>

        <label>
          <span className="label">Task submission</span>
          <textarea value={taskText} onChange={(event) => setTaskText(event.target.value)} />
        </label>

        <button
          className="button dark"
          onClick={async () => {
            if (!matchId) return;
            const result = await submitTask(matchId, taskText);
            setFeedback(result.review);
          }}
        >
          Submit task
        </button>

        <div className="feedback surface inset">
          <p className="kicker">Feedback Panel</p>
          <p>Status: {feedback?.status ?? 'Waiting'}</p>
          <p>Score: {feedback?.score ?? '-'}</p>
          <p>{feedback?.feedback ?? 'No feedback yet.'}</p>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  return <AppShell />;
}