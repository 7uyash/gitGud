import React, { useState } from 'react';
import { RoleReveal } from '../components/RoleReveal';

export function MatchPage({ currentUserId }: { currentUserId?: string }) {
  const [showRoleReveal, setShowRoleReveal] = useState(true);
  const [activeTab, setActiveTab] = useState('Feed.tsx');

  return (
    <>
      {showRoleReveal && <RoleReveal onComplete={() => setShowRoleReveal(false)} />}
      
      <div className="match-ide-container" style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', gridTemplateRows: 'auto 1fr auto', gap: '16px', height: 'calc(100vh - 84px)' }}>
        
        {/* Top Header Bar */}
        <div className="surface" style={{ gridColumn: '1 / -1', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontWeight: 600 }}>GitGud <span className="muted" style={{ margin: '0 8px' }}>·</span> <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>REACT-REFACTOR-RUN</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="kicker">SHIP READINESS · 62%</span>
              <div className="tally-bar-bg" style={{ width: '200px', height: '8px' }}>
                <div className="tally-bar-fill" style={{ width: '62%', background: 'var(--success-color)' }} />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="muted">⏱</span> <strong>08:42</strong>
            </div>
            <div style={{ border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="muted">👥</span> <strong>7</strong>
            </div>
            <div style={{ border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="muted">Role:</span>
              <div style={{ background: 'var(--text-primary)', color: 'var(--bg-main)', padding: '2px 8px', borderRadius: '2px', fontSize: '0.8rem', fontWeight: 600 }}>CREWMATE</div>
            </div>
            <button className="button ghost">Settings</button>
            <button className="button ghost">Leave</button>
          </div>
        </div>

        {/* Left Sidebar (Tasks & Explorer) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="surface" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <p className="kicker">MY TASKS · 3 OF 5</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="task-card completed">
                <span style={{ color: 'var(--success-color)' }}>☑</span> Fix null check in &lt;Header/&gt;
              </div>
              <div className="task-card completed">
                <span style={{ color: 'var(--success-color)' }}>☑</span> Add loading state to feed
              </div>
              <div className="task-card active">
                <span className="muted">◐</span> Integrate /api/posts pagination
              </div>
              <div className="task-card">
                <span className="muted">☐</span> Refactor useAuth to hook
              </div>
              <div className="task-card">
                <span className="muted">☐</span> Write test for postReducer
              </div>
            </div>
            
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
              <p className="kicker" style={{ marginBottom: '8px' }}>OBJECTIVES</p>
              <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Reach 100% ship readiness</li>
                <li>Identify all imposters</li>
              </ul>
            </div>
          </div>

          <button className="button danger" style={{ width: '100%', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <strong style={{ fontSize: '1.1rem' }}>🚨 Emergency Meeting</strong>
            <span style={{ fontSize: '0.8rem' }}>2 LEFT</span>
          </button>
        </div>

        {/* Main Editor & Terminal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="surface" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
            {/* Explorer Column */}
            <div style={{ width: '200px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <p className="kicker">EXPLORER</p>
              </div>
              <div className="file-tree" style={{ padding: '8px 0', fontSize: '0.9rem', overflowY: 'auto' }}>
                <div className="ft-folder">▾ src</div>
                <div className="ft-folder" style={{ paddingLeft: '24px' }}>▸ components</div>
                <div className="ft-file" style={{ paddingLeft: '24px' }}>Header.tsx</div>
                <div className="ft-file active" style={{ paddingLeft: '24px' }}>Feed.tsx *</div>
                <div className="ft-file" style={{ paddingLeft: '24px' }}>PostCard.tsx</div>
                <div className="ft-folder" style={{ paddingLeft: '24px' }}>▸ hooks</div>
                <div className="ft-file" style={{ paddingLeft: '24px' }}>useAuth.ts</div>
                <div className="ft-folder" style={{ paddingLeft: '24px' }}>▾ api</div>
                <div className="ft-file" style={{ paddingLeft: '40px' }}>posts.ts</div>
                <div className="ft-file" style={{ paddingLeft: '24px' }}>App.tsx</div>
                <div className="ft-folder" style={{ paddingLeft: '24px' }}>▸ tests</div>
                <div className="ft-file" style={{ paddingLeft: '8px', marginTop: '8px' }}>package.json</div>
                <div className="ft-file" style={{ paddingLeft: '8px' }}>README.md</div>
              </div>
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                {['Feed.tsx *', 'posts.ts *', 'useAuth.ts ×'].map(tab => (
                  <div key={tab} className={`editor-tab ${tab === 'Feed.tsx *' ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                    {tab}
                  </div>
                ))}
              </div>
              {/* Code Content */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.6, display: 'flex' }}>
                <div style={{ width: '30px', color: 'var(--text-muted)', textAlign: 'right', paddingRight: '12px', userSelect: 'none' }}>
                  {Array.from({length: 22}).map((_, i) => <div key={i}>{i+1}</div>)}
                </div>
                <div style={{ flex: 1, whiteSpace: 'pre' }}>
                  <span style={{ color: '#c678dd' }}>import</span> {'{'} useEffect, useState {'}'} <span style={{ color: '#c678dd' }}>from</span> <span style={{ color: '#98c379' }}>"react"</span>;{'\n'}
                  <span style={{ color: '#c678dd' }}>import</span> {'{'} fetchPosts {'}'} <span style={{ color: '#c678dd' }}>from</span> <span style={{ color: '#98c379' }}>"../api/posts"</span>;{'\n'}
                  {'\n'}
                  <span style={{ color: '#c678dd' }}>export function</span> <span style={{ color: '#61afef' }}>Feed</span>() {'{'}{'\n'}
                  {'  '}<span style={{ color: '#c678dd' }}>const</span> [posts, setPosts] = useState([]);{'\n'}
                  {'  '}<span style={{ color: '#c678dd' }}>const</span> [page, setPage] = useState(1);{'\n'}
                  {'\n'}
                  {'  '}useEffect(() <span style={{ color: '#c678dd' }}>=&gt;</span> {'{'}{'\n'}
                  <div style={{ background: 'rgba(255,255,255,0.1)', display: 'inline-block', width: '100%' }}>{'    '}fetchPosts(page).then(setPosts); <span style={{ color: 'var(--text-muted)' }}>// TODO: append, not replace</span></div>{'\n'}
                  {'  '}{'}'}, [page]);{'\n'}
                  {'\n'}
                  {'  '}<span style={{ color: '#c678dd' }}>return</span> ({'\n'}
                  {'    '}&lt;<span style={{ color: '#e06c75' }}>div</span>&gt;{'\n'}
                  {'      '}<span style={{ color: 'var(--text-muted)' }}>// .. editor placeholder ..</span>{'\n'}
                  {'    '}&lt;/<span style={{ color: '#e06c75' }}>div</span>&gt;{'\n'}
                  {'  '});{'\n'}
                  {'}'}
                </div>
              </div>
            </div>
          </div>

          {/* Terminal / Actions Bar */}
          <div className="surface" style={{ height: '220px', padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
              {['TERMINAL', 'PROBLEMS (2)', 'OUTPUT', 'TESTS'].map(tab => (
                <div key={tab} className={`editor-tab ${tab === 'TERMINAL' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
                  {tab}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', overflowY: 'auto' }}>
              <div style={{ color: 'var(--accent-color)' }}>$ npm test</div>
              <div style={{ color: 'var(--success-color)' }}>✓ Header renders</div>
              <div style={{ color: 'var(--danger-color)' }}>✕ Feed pagination appends (expected 20, got 10)</div>
              <div style={{ color: 'var(--accent-color)', marginTop: '8px' }}>$ <span style={{ animation: 'pulse 1s infinite' }}>_</span></div>
            </div>
            {/*
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="button ghost">Run tests</button>
                <button className="button ghost">View commit history</button>
                <button className="button ghost">Review open diffs (3)</button>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span className="kicker">TASK: INTEGRATE /API/POSTS PAGINATION</span>
                <button className="button dark" style={{ background: 'var(--text-primary)', color: 'var(--bg-main)' }}>Submit task ▲</button>
              </div>
            </div>
            */}
          </div>

        </div>

        {/* Right Sidebar (Chat & Players) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="surface" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
              {['CHAT', 'PLAYERS', 'ACTIVITY', 'ALERTS'].map(tab => (
                <div key={tab} className={`editor-tab ${tab === 'CHAT' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '12px' }}>
                  {tab}
                </div>
              ))}
            </div>
            
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>- system: null_ninja pushed commit 3f2a1</div>
              <div style={{ fontSize: '0.85rem' }}><strong style={{ color: 'var(--accent-color)' }}>@debugbird:</strong> anyone reviewing #12?</div>
              <div style={{ fontSize: '0.85rem' }}><strong>@mergequeen:</strong> on it</div>
              <div style={{ fontSize: '0.85rem' }}><strong>@octoplayer:</strong> that diff looks off tbh</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>- system: hex_wizard completed task</div>
            </div>
          </div>

          <div className="surface" style={{ padding: '16px' }}>
            <p className="kicker" style={{ marginBottom: '12px' }}>PLAYERS ONLINE · 7</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'].map(p => (
                <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'grid', placeItems: 'center', fontSize: '0.8rem' }}>{p}</div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p}</span>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <input type="text" placeholder="Message team..." style={{ margin: 0, flex: 1, padding: '8px' }} />
              <button className="button ghost" style={{ padding: '8px' }}>Send</button>
            </div>
          </div>

        </div>

        {/* Global Action Footer */}
        <div className="surface" style={{ gridColumn: '1 / -1', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="button ghost">Run tests</button>
            <button className="button ghost">View commit history</button>
            <button className="button ghost">Review open diffs (3)</button>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span className="kicker">TASK: INTEGRATE /API/POSTS PAGINATION</span>
            <button className="button dark" style={{ background: 'var(--text-primary)', color: 'var(--bg-main)' }}>Submit task ▲</button>
          </div>
        </div>

      </div>
    </>
  );
}
