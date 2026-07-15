import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RoleReveal } from '../components/RoleReveal';
import { EmergencyMeeting } from '../components/EmergencyMeeting';
import { VotingResult } from '../components/VotingResult';
import { GameOver } from '../components/GameOver';
import { LearningRecap } from '../components/LearningRecap';
import { getMatch, submitTask } from '../api';
import { getGameSocket } from '../socket';
import { getToken } from '../auth';

export function MatchPage({ currentUserId }: { currentUserId?: string }) {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [showRoleReveal, setShowRoleReveal] = useState(true);
  const [activeTab, setActiveTab] = useState('Feed.tsx');
  
  const [matchState, setMatchState] = useState<any>(null);
  const [files, setFiles] = useState<Record<string, string>>({
    'Feed.tsx': `import { useEffect, useState } from "react";
import { fetchPosts } from "../api/posts";

export function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPosts(page).then(setPosts); // TODO: append, not replace
  }, [page]);

  return (
    <div>
      // .. editor placeholder ..
    </div>
  );
}`,
    'posts.ts': `export async function fetchPosts(page: number) {
  return [];
}`,
    'useAuth.ts': `export function useAuth() { return null; }`,
  });
  
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState<any>(null);
  const [votingResult, setVotingResult] = useState<any>(null);
  const [meetingPlayers, setMeetingPlayers] = useState<any[]>([]);
  const [recapPayload, setRecapPayload] = useState<any>(null);
  const [showRecap, setShowRecap] = useState(false);

  useEffect(() => {
    if (!matchId) return;

    let mounted = true;
    getMatch(matchId).then((res) => {
      if (mounted) setMatchState(res);
    }).catch(e => console.error('Failed to load match', e));

    const socket = getGameSocket();
    socket.connect();
    
    socket.emit('match:join', { matchId, token: getToken() });

    const onEditorChange = (payload: any) => {
      setFiles(prev => ({ ...prev, [payload.file]: payload.content }));
    };

    const onChatMessage = (payload: any) => {
      setChatMessages(prev => [...prev, payload]);
    };

    const onSubmissionReviewed = (payload: any) => {
      // Just add a chat message or alert
      setChatMessages(prev => [...prev, { username: 'system', text: `Task submitted by ${payload.userId} - Score: ${payload.review?.score ?? 0}`, isSystem: true }]);
    };

    const onMeetingStarted = (payload: any) => {
      setActiveMeeting(payload);
      setVotingResult(null);
      setMatchState((currentMatchState: any) => {
        setMeetingPlayers(Object.keys(currentMatchState?.match?.roleAssignments || {}).map(id => ({
          id,
          name: `@player_${id.substring(0,4)}`,
          hasVoted: false,
          votes: 0
        })));
        return currentMatchState;
      });
    };

    const onMeetingVoted = (payload: { userId: string }) => {
      setMeetingPlayers(prev => prev.map(p => p.id === payload.userId ? { ...p, hasVoted: true } : p));
    };

    const onMeetingEnded = (payload: any) => {
      setActiveMeeting(null);
      setVotingResult(payload);
    };

    const onMatchEnded = (payload: any) => {
      setRecapPayload(payload);
    };

    socket.on('editor:change', onEditorChange);
    socket.on('chat:message', onChatMessage);
    socket.on('submission:reviewed', onSubmissionReviewed);
    socket.on('meeting:started', onMeetingStarted);
    socket.on('meeting:voted', onMeetingVoted);
    socket.on('meeting:ended', onMeetingEnded);
    socket.on('match:ended', onMatchEnded);

    return () => {
      mounted = false;
      socket.off('editor:change', onEditorChange);
      socket.off('chat:message', onChatMessage);
      socket.off('submission:reviewed', onSubmissionReviewed);
      socket.off('meeting:started', onMeetingStarted);
      socket.off('meeting:voted', onMeetingVoted);
      socket.off('meeting:ended', onMeetingEnded);
      socket.off('match:ended', onMatchEnded);
      socket.emit('match:leave', { matchId });
    };
  }, [matchId]);

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setFiles(prev => ({ ...prev, [activeTab]: newContent }));
    if (matchId) {
      getGameSocket().emit('editor:change', { matchId, file: activeTab, content: newContent });
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !matchId) return;
    const msg = { matchId, username: currentUserId ?? 'guest', text: chatInput };
    getGameSocket().emit('chat:message', msg);
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  const handleSubmitTask = async () => {
    if (!matchId || !matchState) return;
    try {
      setSubmittingTask(true);
      await submitTask(matchId, files[activeTab]);
    } catch (e) {
      alert('Failed to submit task');
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleCallMeeting = () => {
    if (!matchId) return;
    const reason = prompt('Why are you calling this meeting?');
    if (!reason) return;
    getGameSocket().emit('meeting:called', { matchId, token: getToken(), reason });
  };

  const handleEndMatch = () => {
    if (!matchId) return;
    getGameSocket().emit('match:end', { matchId, token: getToken(), winnerTeam: 'CREW' });
  };

  if (!matchState) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Loading match...</div>;
  }

  const role = matchState.match?.roleAssignments?.[currentUserId ?? ''] ?? 'CREWMATE';
  const roleName = role.toUpperCase();

  if (recapPayload) {
    if (showRecap) {
      return <LearningRecap recapPayload={recapPayload} />;
    }
    return (
      <GameOver 
        recapPayload={recapPayload} 
        players={Object.entries(matchState.match?.roleAssignments || {}).map(([id, r]) => ({
          id, name: `@player_${id.substring(0,4)}`, role: (r as string).toUpperCase()
        }))} 
        onRecap={() => setShowRecap(true)} 
      />
    );
  }

  return (
    <>
      {showRoleReveal && <RoleReveal onComplete={() => setShowRoleReveal(false)} />}
      
      {activeMeeting && (
        <EmergencyMeeting 
          meeting={activeMeeting}
          players={meetingPlayers}
          myUserId={currentUserId ?? ''}
          onVote={(targetId) => getGameSocket().emit('meeting:vote', { matchId, token: getToken(), targetUserId: targetId })}
        />
      )}

      {votingResult && (
        <VotingResult 
          result={votingResult}
          players={meetingPlayers}
          onClose={() => setVotingResult(null)}
        />
      )}
      
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
              <div style={{ background: roleName === 'IMPOSTER' ? 'var(--danger-color)' : 'var(--text-primary)', color: 'var(--bg-main)', padding: '2px 8px', borderRadius: '2px', fontSize: '0.8rem', fontWeight: 600 }}>{roleName}</div>
            </div>
            <button className="button ghost" onClick={handleEndMatch}>End Game (Dev)</button>
            <button className="button ghost" onClick={() => navigate('/dashboard')}>Leave</button>
          </div>
        </div>

        {/* Left Sidebar (Tasks & Explorer) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="surface" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <p className="kicker">MY TASKS · 3 OF 5</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {matchState.tasks?.map((t: any) => (
                <div key={t.id} className={`task-card ${t.status === 'completed' ? 'completed' : t.status === 'in_progress' ? 'active' : ''}`}>
                  <span style={{ color: t.status === 'completed' ? 'var(--success-color)' : 'var(--text-muted)' }}>
                    {t.status === 'completed' ? '☑' : t.status === 'in_progress' ? '◐' : '☐'}
                  </span> {t.title}
                </div>
              ))}
              {matchState.tasks?.length === 0 && (
                <div className="muted" style={{ padding: '8px' }}>No tasks assigned.</div>
              )}
            </div>
            
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
              <p className="kicker" style={{ marginBottom: '8px' }}>OBJECTIVES</p>
              <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Reach 100% ship readiness</li>
                <li>Identify all imposters</li>
              </ul>
            </div>
          </div>

          <button className="button danger" style={{ width: '100%', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} onClick={handleCallMeeting} disabled={!!activeMeeting || !!votingResult}>
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
                {Object.keys(files).map(tab => (
                  <div key={tab} className={`editor-tab ${tab === activeTab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                    {tab}
                  </div>
                ))}
              </div>
              {/* Code Content */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.6, display: 'flex', background: '#1e1e1e' }}>
                <textarea 
                  value={files[activeTab] || ''} 
                  onChange={handleEditorChange}
                  style={{ width: '100%', height: '100%', minHeight: '300px', background: 'transparent', border: 'none', color: '#abb2bf', fontFamily: 'var(--font-mono)', outline: 'none', resize: 'none' }}
                  spellCheck={false}
                />
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
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{ fontSize: '0.85rem', color: msg.isSystem ? 'var(--text-muted)' : 'inherit' }}>
                  {msg.isSystem ? (
                    `- system: ${msg.text}`
                  ) : (
                    <>
                      <strong style={{ color: msg.username === currentUserId ? 'var(--accent-color)' : 'inherit' }}>@{msg.username}:</strong> {msg.text}
                    </>
                  )}
                </div>
              ))}
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
              <input 
                type="text" 
                placeholder="Message team..." 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                style={{ margin: 0, flex: 1, padding: '8px' }} 
              />
              <button className="button ghost" style={{ padding: '8px' }} onClick={handleSendChat}>Send</button>
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
            <span className="kicker">FILE: {activeTab.toUpperCase()}</span>
            <button 
              className="button dark" 
              style={{ background: 'var(--text-primary)', color: 'var(--bg-main)' }}
              onClick={handleSubmitTask}
              disabled={submittingTask}
            >
              {submittingTask ? 'Submitting...' : 'Submit task ▲'}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
