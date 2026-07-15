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
          <Route path="/matches/:matchId" element={<RequireAuth token={auth.token} user={auth.user}><MatchPage currentUser={auth.user} /></RequireAuth>} />
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

        <aside className="preview-panel" aria-hidden="true" style={{ minHeight: '400px', display: 'flex', alignItems: 'center' }}>
          {/* <div className="preview-box">Hero illustration / Animated code diff preview</div> */}
          
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)', transformStyle: 'preserve-3d', width: '100%' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
              <span style={{ marginLeft: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>src/auth.ts</span>
            </div>
            <div style={{ padding: '24px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: '1.6', position: 'relative' }}>
              <div style={{ color: '#c678dd' }}>export function <span style={{ color: '#61afef' }}>verifyAuth</span>(req, res, next) {'{'}</div>
              <div style={{ paddingLeft: '24px' }}>
                <div style={{ color: 'var(--text-muted)' }}>// verify token exists</div>
                <div style={{ color: '#e5c07b' }}>const <span style={{ color: '#e06c75' }}>token</span> = req.headers.authorization;</div>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ color: 'var(--danger-color)', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', margin: '0 -12px', borderLeft: '2px solid var(--danger-color)' }}>
                    <span style={{ opacity: 0.5 }}>-</span> <span style={{ color: '#c678dd' }}>if</span> (!token) <span style={{ color: '#c678dd' }}>return</span> res.status(401).send();
                  </div>
                  <div style={{ color: 'var(--success-color)', background: 'rgba(16,185,129,0.1)', padding: '8px 12px', margin: '4px -12px', borderLeft: '2px solid var(--success-color)', position: 'relative' }}>
                    <span style={{ opacity: 0.5 }}>+</span> <span style={{ color: '#c678dd' }}>if</span> (!token && req.query.admin !== <span style={{ color: '#98c379' }}>'true'</span>) <span style={{ color: '#c678dd' }}>return</span> res.status(401).send();
                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'var(--danger-color)', color: '#fff', padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px', animation: 'pulse 2s infinite', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.1rem' }}>ඞ</span> SUSPICIOUS
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <span style={{ color: '#e5c07b' }}>next</span>();
                </div>
              </div>
              <div style={{ color: '#c678dd' }}>{'}'}</div>
            </div>
          </div>
        </aside>
      </div>

      <div className="recent-matches-section" style={{ marginTop: '64px', borderTop: '1px solid var(--border-color)', paddingTop: '64px', paddingBottom: '64px', width: '100%' }}>
        <p className="kicker" style={{ textAlign: 'center', marginBottom: '32px' }}>THE GAMEPLAY LOOP</p>
        
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', padding: '24px' }}>
          
          <style>{`
            @keyframes walkAcross2D {
              0% { left: -10%; bottom: 40px; transform: scaleX(1); }
              10% { left: 16%; bottom: 40px; transform: scaleX(1); }
              15% { left: 16%; bottom: 200px; transform: scaleX(1); } /* Stop at File 1 */
              25% { left: 16%; bottom: 200px; transform: scaleX(1); } /* Waiting */
              30% { left: 16%; bottom: 40px; transform: scaleX(1); }
              40% { left: 50%; bottom: 40px; transform: scaleX(1); }
              45% { left: 50%; bottom: 120px; transform: scaleX(1); } /* Stop at File 2 */
              55% { left: 50%; bottom: 120px; transform: scaleX(1); } /* Waiting */
              60% { left: 50%; bottom: 40px; transform: scaleX(1); }
              70% { left: 83%; bottom: 40px; transform: scaleX(1); }
              75% { left: 83%; bottom: 150px; transform: scaleX(1); } /* Stop at File 3 */
              85% { left: 83%; bottom: 150px; transform: scaleX(1); } /* Waiting */
              90% { left: 83%; bottom: 40px; transform: scaleX(1); }
              100% { left: 110%; bottom: 40px; transform: scaleX(1); }
            }
            @keyframes bugToggle {
              0%, 15% { opacity: 0; }
              16%, 40% { opacity: 1; }
              41%, 100% { opacity: 0; }
            }
            @keyframes bugToggle2 {
              0%, 45% { opacity: 0; }
              46%, 70% { opacity: 1; }
              71%, 100% { opacity: 0; }
            }
            @keyframes bugToggle3 {
              0%, 75% { opacity: 0; }
              76%, 100% { opacity: 1; }
            }
            @keyframes floatTextHero {
              0% { opacity: 0; transform: translateY(0); }
              10%, 40% { opacity: 1; transform: translateY(-15px); }
              50%, 100% { opacity: 0; transform: translateY(-25px); }
            }
            
            .hero-window {
              background: var(--bg-surface);
              border: 1px solid var(--border-color);
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0,0,0,0.4);
              height: 480px;
              position: relative;
            }
            .hero-window-header {
              background: rgba(0,0,0,0.3);
              padding: 12px 16px;
              display: flex;
              gap: 8px;
              border-bottom: 1px solid var(--border-color);
              align-items: center;
            }
            .hero-code-layer {
              position: absolute;
              top: 50px; left: 0; width: 100%; height: calc(100% - 50px);
              padding: 24px;
              font-family: var(--font-mono);
              font-size: 0.8rem;
              line-height: 1.6;
              transition: opacity 0.3s ease;
            }
            .hero-code-bad {
              color: var(--danger-color);
              background: rgba(255,0,0,0.05);
            }
            
            .hero-char {
              position: absolute;
              bottom: 40px;
              width: 44px; height: 54px;
              border-radius: 22px 22px 0 0;
              border: 3px solid #000;
              z-index: 10;
              animation: walkAcross2D 24s linear infinite;
            }
            .hero-char::after {
              content: ''; position: absolute; top: 10px; right: -4px;
              width: 24px; height: 16px; background: #99d9ea;
              border-radius: 12px; border: 2px solid #000;
            }
            .imposter-hero { background: var(--danger-color); }
            .crewmate-hero { background: var(--success-color); animation-delay: 6s; }
            
          `}</style>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
            
            {/* File 1: auth.ts */}
            <div className="hero-window">
              <div className="hero-window-header">
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
                <span style={{ marginLeft: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>auth.ts</span>
              </div>
              <div className="hero-code-layer" style={{ color: '#d4d4d4' }}>
                <div style={{ color: '#c678dd' }}>import {'{'} verifyToken {'}'} from <span style={{ color: '#98c379' }}>'./jwt'</span>;</div>
                <div style={{ color: '#c678dd' }}>import {'{'} db {'}'} from <span style={{ color: '#98c379' }}>'./db'</span>;</div>
                <br/>
                <div style={{ color: '#c678dd' }}>export async function <span style={{ color: '#61afef' }}>verifyAdmin</span>(req, res, next) {'{'}</div>
                <div style={{ paddingLeft: '24px' }}>
                  <div style={{ color: '#c678dd' }}>try {'{'}</div>
                  <div style={{ paddingLeft: '24px' }}>
                    <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>token</span> = req.headers.authorization;</div>
                    <div style={{ color: '#c678dd' }}>if <span style={{ color: '#abb2bf' }}>(!token) return res.status(401);</span></div>
                    <br/>
                    <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>user</span> = await verifyToken(token);</div>
                    <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>profile</span> = await db.users.find(user.id);</div>
                    <br/>
                    <div style={{ color: '#c678dd' }}>if <span style={{ color: '#abb2bf' }}>(!profile.isAdmin) return res.status(403);</span></div>
                    <div style={{ color: '#c678dd' }}>next();</div>
                  </div>
                  <div style={{ color: '#c678dd' }}>{'}'} catch (err) {'{'}</div>
                  <div style={{ paddingLeft: '24px' }}>return res.status(500);</div>
                  <div style={{ color: '#c678dd' }}>{'}'}</div>
                </div>
                <div style={{ color: '#c678dd' }}>{'}'}</div>
              </div>
              <div className="hero-code-layer hero-code-bad" style={{ animation: 'bugToggle 24s infinite' }}>
                <div style={{ color: '#c678dd' }}>import {'{'} verifyToken {'}'} from <span style={{ color: '#98c379' }}>'./jwt'</span>;</div>
                <div style={{ color: '#c678dd' }}>import {'{'} db {'}'} from <span style={{ color: '#98c379' }}>'./db'</span>;</div>
                <br/>
                <div style={{ color: '#c678dd' }}>export async function <span style={{ color: '#61afef' }}>verifyAdmin</span>(req, res, next) {'{'}</div>
                <div style={{ paddingLeft: '24px' }}>
                  <div style={{ color: '#c678dd' }}>try {'{'}</div>
                  <div style={{ paddingLeft: '24px' }}>
                    <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>token</span> = req.headers.authorization;</div>
                    <div style={{ color: '#c678dd' }}>if <span style={{ color: '#abb2bf' }}>(!token) return res.status(401);</span></div>
                    <br/>
                    <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>user</span> = await verifyToken(token);</div>
                    <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>profile</span> = await db.users.find(user.id);</div>
                    <br/>
                    <div style={{ color: 'var(--danger-color)', textDecoration: 'line-through' }}>if (!profile.isAdmin) return res.status(403);</div>
                    <div style={{ color: '#c678dd' }}>next(); <span style={{ color: 'var(--danger-color)' }}>// BUG INJECTED: BYPASS ADMIN CHECK</span></div>
                  </div>
                  <div style={{ color: '#c678dd' }}>{'}'} catch (err) {'{'}</div>
                  <div style={{ paddingLeft: '24px' }}>return res.status(500);</div>
                  <div style={{ color: '#c678dd' }}>{'}'}</div>
                </div>
                <div style={{ color: '#c678dd' }}>{'}'}</div>
              </div>
            </div>

            {/* File 2: payment.ts */}
            <div className="hero-window">
              <div className="hero-window-header">
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
                <span style={{ marginLeft: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>payment.ts</span>
              </div>
              <div className="hero-code-layer" style={{ color: '#d4d4d4' }}>
                <div style={{ color: '#c678dd' }}>import Stripe from <span style={{ color: '#98c379' }}>'stripe'</span>;</div>
                <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>stripe</span> = new Stripe(process.env.STRIPE_KEY);</div>
                <br/>
                <div style={{ color: '#c678dd' }}>export async function <span style={{ color: '#61afef' }}>processOrder</span>(orderId) {'{'}</div>
                <div style={{ paddingLeft: '24px' }}>
                  <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>order</span> = await getOrder(orderId);</div>
                  <div style={{ color: '#c678dd' }}>if <span style={{ color: '#abb2bf' }}>(!order) throw new Error('Not found');</span></div>
                  <br/>
                  <div style={{ color: 'var(--text-muted)' }}>// Calculate total with 5% platform fee</div>
                  <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>subtotal</span> = order.items.reduce((acc, item) {`=>`} acc + item.price, 0);</div>
                  <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>fee</span> = subtotal * <span style={{ color: '#d19a66' }}>0.05</span>;</div>
                  <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>total</span> = subtotal + fee;</div>
                  <br/>
                  <div style={{ color: '#abb2bf' }}>await stripe.paymentIntents.create({'{'}</div>
                  <div style={{ paddingLeft: '24px' }}>amount: Math.round(total * 100),</div>
                  <div style={{ paddingLeft: '24px' }}>currency: 'usd',</div>
                  <div style={{ color: '#abb2bf' }}>{'}'});</div>
                  <div style={{ color: '#c678dd' }}>return <span style={{ color: '#d19a66' }}>true</span>;</div>
                </div>
                <div style={{ color: '#c678dd' }}>{'}'}</div>
              </div>
              <div className="hero-code-layer hero-code-bad" style={{ animation: 'bugToggle2 24s infinite' }}>
                <div style={{ color: '#c678dd' }}>import Stripe from <span style={{ color: '#98c379' }}>'stripe'</span>;</div>
                <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>stripe</span> = new Stripe(process.env.STRIPE_KEY);</div>
                <br/>
                <div style={{ color: '#c678dd' }}>export async function <span style={{ color: '#61afef' }}>processOrder</span>(orderId) {'{'}</div>
                <div style={{ paddingLeft: '24px' }}>
                  <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>order</span> = await getOrder(orderId);</div>
                  <div style={{ color: '#c678dd' }}>if <span style={{ color: '#abb2bf' }}>(!order) throw new Error('Not found');</span></div>
                  <br/>
                  <div style={{ color: 'var(--text-muted)' }}>// Calculate total with 5% platform fee</div>
                  <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>subtotal</span> = order.items.reduce((acc, item) {`=>`} acc + item.price, 0);</div>
                  <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>fee</span> = subtotal * <span style={{ color: '#d19a66' }}>0.00</span>; <span style={{ color: 'var(--danger-color)' }}>// BUG INJECTED: 0% FEE</span></div>
                  <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>total</span> = subtotal + fee;</div>
                  <br/>
                  <div style={{ color: '#abb2bf' }}>await stripe.paymentIntents.create({'{'}</div>
                  <div style={{ paddingLeft: '24px' }}>amount: Math.round(total * 100),</div>
                  <div style={{ paddingLeft: '24px' }}>currency: 'usd',</div>
                  <div style={{ color: '#abb2bf' }}>{'}'});</div>
                  <div style={{ color: '#c678dd' }}>return <span style={{ color: '#d19a66' }}>true</span>;</div>
                </div>
                <div style={{ color: '#c678dd' }}>{'}'}</div>
              </div>
            </div>

            {/* File 3: db.ts */}
            <div className="hero-window">
              <div className="hero-window-header">
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
                <span style={{ marginLeft: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>db.ts</span>
              </div>
              <div className="hero-code-layer" style={{ color: '#d4d4d4' }}>
                <div style={{ color: '#c678dd' }}>import {'{'} Pool {'}'} from <span style={{ color: '#98c379' }}>'pg'</span>;</div>
                <br/>
                <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>pool</span> = new Pool({'{'}</div>
                <div style={{ paddingLeft: '24px' }}>connectionString: process.env.DATABASE_URL</div>
                <div style={{ color: '#c678dd' }}>{'}'});</div>
                <br/>
                <div style={{ color: '#c678dd' }}>export async function <span style={{ color: '#61afef' }}>clearTestDatabase</span>() {'{'}</div>
                <div style={{ paddingLeft: '24px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>// DANGER: Never run in production</div>
                  <div style={{ color: '#c678dd' }}>if <span style={{ color: '#abb2bf' }}>(process.env.NODE_ENV !== 'production') {'{'}</span></div>
                  <div style={{ paddingLeft: '24px' }}>
                    <div style={{ color: '#abb2bf' }}>const client = await pool.connect();</div>
                    <div style={{ color: '#abb2bf' }}>await client.query('DROP SCHEMA public CASCADE;');</div>
                    <div style={{ color: '#abb2bf' }}>await client.query('CREATE SCHEMA public;');</div>
                    <div style={{ color: '#abb2bf' }}>client.release();</div>
                    <div style={{ color: '#c678dd' }}>return <span style={{ color: '#d19a66' }}>true</span>;</div>
                  </div>
                  <div style={{ color: '#c678dd' }}>{'}'}</div>
                  <div style={{ color: '#c678dd' }}>throw new Error('Cannot clear prod db');</div>
                </div>
                <div style={{ color: '#c678dd' }}>{'}'}</div>
              </div>
              <div className="hero-code-layer hero-code-bad" style={{ animation: 'bugToggle3 24s infinite' }}>
                <div style={{ color: '#c678dd' }}>import {'{'} Pool {'}'} from <span style={{ color: '#98c379' }}>'pg'</span>;</div>
                <br/>
                <div style={{ color: '#c678dd' }}>const <span style={{ color: '#e06c75' }}>pool</span> = new Pool({'{'}</div>
                <div style={{ paddingLeft: '24px' }}>connectionString: process.env.DATABASE_URL</div>
                <div style={{ color: '#c678dd' }}>{'}'});</div>
                <br/>
                <div style={{ color: '#c678dd' }}>export async function <span style={{ color: '#61afef' }}>clearTestDatabase</span>() {'{'}</div>
                <div style={{ paddingLeft: '24px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>// DANGER: Never run in production</div>
                  <div style={{ color: '#c678dd' }}>if <span style={{ color: '#abb2bf' }}>(process.env.NODE_ENV === 'production') {'{'} <span style={{ color: 'var(--danger-color)' }}>// BUG INJECTED</span></span></div>
                  <div style={{ paddingLeft: '24px' }}>
                    <div style={{ color: '#abb2bf' }}>const client = await pool.connect();</div>
                    <div style={{ color: '#abb2bf' }}>await client.query('DROP SCHEMA public CASCADE;');</div>
                    <div style={{ color: '#abb2bf' }}>await client.query('CREATE SCHEMA public;');</div>
                    <div style={{ color: '#abb2bf' }}>client.release();</div>
                    <div style={{ color: '#c678dd' }}>return <span style={{ color: '#d19a66' }}>true</span>;</div>
                  </div>
                  <div style={{ color: '#c678dd' }}>{'}'}</div>
                  <div style={{ color: '#c678dd' }}>throw new Error('Cannot clear prod db');</div>
                </div>
                <div style={{ color: '#c678dd' }}>{'}'}</div>
              </div>
            </div>

          </div>

          <div className="hero-char imposter-hero">
            <div style={{ position: 'absolute', background: '#000', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', top: '-40px', left: '-20px', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', animation: 'floatTextHero 4s infinite', animationDelay: '0s' }}>
              Injecting bugs... 🐛
            </div>
          </div>
          <div className="hero-char crewmate-hero">
            <div style={{ position: 'absolute', background: '#fff', color: '#000', top: '-40px', left: '-20px', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', animation: 'floatTextHero 4s infinite', animationDelay: '6s' }}>
              Fixing code! 🛠️
            </div>
          </div>

        </div>
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