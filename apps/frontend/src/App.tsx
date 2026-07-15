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

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { CreateLobbyPage } from './pages/CreateLobbyPage';
import { LobbyPage } from './pages/LobbyPage';
import { MatchPage } from './pages/MatchPage';

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>['user'];

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
    <header className="topbar" style={{ background: 'transparent', borderBottom: '1px solid var(--border-color)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: '0' }}>
      <Link to="/" className="brand">
        <span className="brand-mark" style={{ background: 'transparent', border: '1px solid var(--text-primary)', borderRadius: '4px', boxShadow: 'none' }} />
        <span>GitGud</span>
      </Link>
      <nav className="topnav">
        <Link to="/docs">DOCS</Link>
        <Link to="/about">ABOUT</Link>
        <Link to="/github">GITHUB</Link>
        {isAuthed ? (
          <button className="button ghost" onClick={onLogout}>LOGOUT</button>
        ) : (
          <Link to="/login" className="button ghost" style={{ textTransform: 'none' }}>Login with GitHub</Link>
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
    <div className="landing-page-container">
      <div className="landing">
        <section className="hero-panel" style={{ border: 'none', background: 'transparent', padding: '0', boxShadow: 'none' }}>
          <p className="kicker">MULTIPLAYER - SOCIAL DEDUCTION - FOR DEVS</p>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '24px' }}>Find the bugs before they break production.</h1>
          <p className="muted" style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '32px' }}>
            Collaborate in a real codebase to fix bugs and ship features. But watch out—imposters are secretly introducing regressions.
          </p>
          <div className="actions" style={{ marginBottom: '24px' }}>
            <Link to={isAuthed ? '/dashboard' : '/login'} className="button dark">
              {isAuthed ? 'Open dashboard' : 'Login with GitHub'}
            </Link>
            <Link to="/lobbies/new" className="button ghost">Create Lobby</Link>
            <Link to="/dashboard" className="button ghost">Join Lobby</Link>
          </div>
          <p className="label muted">6-9 PLAYERS - 1-2 IMPOSTERS - 15-25 MIN</p>
        </section>

        <aside className="preview-panel" aria-hidden="true" style={{ minHeight: '400px' }}>
          <div className="preview-box">Hero illustration / Animated code diff preview</div>
        </aside>
      </div>

      <div className="features-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '64px', borderTop: '1px solid var(--border-color)', paddingTop: '64px' }}>
        <div className="feature-card surface">
          <p className="kicker">FEATURE</p>
          <h3>Real codebase tasks</h3>
          <p className="muted">Read code, debug issues, and submit real fixes as tasks.</p>
        </div>
        <div className="feature-card surface">
          <p className="kicker">FEATURE</p>
          <h3>Real deduction gameplay</h3>
          <p className="muted">Call meetings to inspect commits and vote out the imposters.</p>
        </div>
        <div className="feature-card surface">
          <p className="kicker">FEATURE</p>
          <h3>Post-match learning recap</h3>
          <p className="muted">AI reviews your performance and explains the concepts you missed.</p>
        </div>
      </div>

      <div className="recent-matches-section" style={{ marginTop: '64px', borderTop: '1px solid var(--border-color)', paddingTop: '64px' }}>
        <p className="kicker">RECENT PUBLIC MATCHES</p>
        <div className="preview-box" style={{ minHeight: '200px', marginTop: '24px' }}>Match history table</div>
      </div>
    </div>
  );
}

function LoginPage({ onLogin, isAuthed }: { onLogin: () => void; isAuthed: boolean }) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (isAuthed) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = () => {
    setIsRedirecting(true);
    onLogin();
  };

  return (
    <div className="auth-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
      <div className="auth-card" style={{ width: '100%', maxWidth: '480px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="auth-icon" style={{ width: '48px', height: '48px', margin: '0 auto', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
          <span className="brand-mark" style={{ width: '24px', height: '24px', borderRadius: '4px' }}></span>
        </div>
        <div>
          <h2 style={{ marginBottom: '8px' }}>Sign in to GitGud</h2>
          <p className="muted" style={{ margin: '0' }}>We use your GitHub identity for profile and match history.</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
          <button className="button dark" style={{ width: '100%', padding: '16px' }} onClick={handleLogin}>
            Continue with GitHub
          </button>
          
          {isRedirecting && <p className="muted label" style={{ animation: 'pulse 1.5s infinite' }}>REDIRECTING TO GITHUB.COM/LOGIN...</p>}
        </div>

        <div className="preview-box" style={{ minHeight: '120px', marginTop: '16px' }}>OAuth consent preview</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
          <span className="muted">Terms - Privacy</span>
          <Link to="/" className="muted" style={{ textDecoration: 'none' }}>&larr; Back to landing</Link>
        </div>
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

// Extracted to src/pages/

export default function App() {
  return <AppShell />;
}