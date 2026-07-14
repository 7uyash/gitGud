import React, { useState } from 'react';

export function DiffReview() {
  const [comment, setComment] = useState('');

  return (
    <div className="diff-container">
      {/* Left Sidebar */}
      <div className="diff-sidebar-left">
        <div className="surface">
          <p className="kicker">Pull Request #12 · Open</p>
          <h2 style={{ fontSize: '1.2rem', margin: '4px 0 0 0' }}>feat(feed): paginate posts endpoint</h2>
          <span className="muted" style={{ fontSize: '0.8rem' }}>3f2a1c9</span>
        </div>
        
        <div className="surface" style={{ flex: 1 }}>
          <p className="kicker" style={{ marginBottom: '12px' }}>Changed Files · 3</p>
          <div className="diff-file-list">
            <div className="diff-file-item active">
              <div style={{ fontWeight: 600 }}>src/api/posts.ts</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                <span style={{ color: 'var(--success-color)' }}>+18</span> <span style={{ color: 'var(--danger-color)' }}>-4</span>
              </div>
            </div>
            <div className="diff-file-item">
              <div style={{ fontWeight: 600 }}>src/components/Feed.tsx</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                <span style={{ color: 'var(--success-color)' }}>+6</span> <span style={{ color: 'var(--danger-color)' }}>-2</span>
              </div>
            </div>
            <div className="diff-file-item">
              <div style={{ fontWeight: 600 }}>tests/posts.test.ts</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                <span style={{ color: 'var(--success-color)' }}>+12</span> <span style={{ color: 'var(--danger-color)' }}>-0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Diff Area */}
      <div className="diff-main">
        <div className="diff-header">
          <span style={{ fontWeight: 600 }}>src/api/posts.ts</span>
          <button className="button ghost">View file tree</button>
        </div>
        
        <div className="diff-content">
          {/* Old File */}
          <div className="diff-side">
            <div className="diff-line">
              <div className="diff-line-num">1</div>
              <div className="diff-line-content">export async function fetchPosts(page = 1) {'{'}</div>
            </div>
            <div className="diff-line">
              <div className="diff-line-num">2</div>
              <div className="diff-line-content">  const res = await fetch('/api/posts');</div>
            </div>
            <div className="diff-line remove">
              <div className="diff-line-num">3</div>
              <div className="diff-line-content">- return res.json();</div>
            </div>
            <div className="diff-line">
              <div className="diff-line-num">4</div>
              <div className="diff-line-content">{'}'}</div>
            </div>
          </div>
          
          {/* New File */}
          <div className="diff-side">
            <div className="diff-line">
              <div className="diff-line-num">1</div>
              <div className="diff-line-content">export async function fetchPosts(page = 1) {'{'}</div>
            </div>
            <div className="diff-line add">
              <div className="diff-line-num">2</div>
              <div className="diff-line-content">+ const res = await fetch(`/api/posts?page={'$'}{page}`);</div>
            </div>
            <div className="diff-line add" style={{ borderLeft: '2px solid var(--danger-color)', background: 'rgba(239, 68, 68, 0.2)' }}>
              <div className="diff-line-num">3</div>
              <div className="diff-line-content">+ if (!res.ok) return []; // 🚩 suspicious silent failure</div>
            </div>
            <div className="diff-line add">
              <div className="diff-line-num">4</div>
              <div className="diff-line-content">+ return res.json();</div>
            </div>
            <div className="diff-line">
              <div className="diff-line-num">5</div>
              <div className="diff-line-content">{'}'}</div>
            </div>
          </div>
        </div>

        {/* Inline Comment Thread */}
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-color)' }}>
          <p className="kicker">Inline Comment · Line 3</p>
          <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--danger-color)', borderRadius: '4px' }}>
            <strong style={{ color: 'var(--accent-color)' }}>@octoplayer:</strong> silent empty return will hide errors from the crew. sus.
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <input type="text" placeholder="Reply..." value={comment} onChange={e => setComment(e.target.value)} style={{ marginTop: 0 }} />
            <button className="button ghost">Comment</button>
            <button className="button ghost">Suggest change</button>
          </div>
        </div>
        
        {/* Actions Bar */}
        <div className="diff-actions-bar">
          <button className="button ghost">← Back to editor</button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="button danger">🚩 Flag suspicious</button>
            <button className="button ghost">Request changes</button>
            <button className="button dark" style={{ background: 'var(--success-color)', color: '#000', borderColor: 'var(--success-color)' }}>✓ Approve</button>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="diff-sidebar-right">
        <div className="surface">
          <p className="kicker">Commit Message</p>
          <div style={{ marginTop: '8px', fontWeight: 600 }}>feat(feed): paginate posts endpoint</div>
          <p className="muted" style={{ fontSize: '0.9rem', marginTop: '8px' }}>adds page query param + defensive early return</p>
        </div>
        
        <div className="surface">
          <p className="kicker">Reviewers</p>
          <div className="player-list" style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>@octoplayer</span>
              <span style={{ color: 'var(--danger-color)' }}>🚩 flagged</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>@mergequeen</span>
              <span style={{ color: 'var(--success-color)' }}>✓ approved</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>@debugbird</span>
              <span className="muted">- pending</span>
            </div>
          </div>
        </div>
        
        <div className="surface" style={{ flex: 1 }}>
          <p className="kicker">Checks</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', fontSize: '0.9rem' }}>
            <div><span style={{ color: 'var(--success-color)' }}>✓</span> lint (passing)</div>
            <div><span style={{ color: 'var(--danger-color)' }}>✕</span> tests (1 failing)</div>
            <div><span className="muted">-</span> build (pending)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
