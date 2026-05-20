import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, PlusCircle, Save, Trash2, CheckCircle,
  ClipboardList, Clock, Plus, X, GripVertical,
  Brain, Eye, Layers, AlertTriangle
} from 'lucide-react';
import { getMockTests, saveMockTest, deleteMockTest, createDefaultMockTest, generateId, getGames } from '../store/gameStore';
import './MockTests.css';

const CATEGORY_ICONS = { memory: Brain, attention: Eye, pattern: Layers };

// ============ List View ============
export function MockTestsList({ onNew }) {
  const navigate = useNavigate();
  const [tests, setTests] = useState(getMockTests);

  return (
    <div className="mock-list fade-in">
      <div className="mock-list-header">
        <div>
          <h1 className="dash-title">Mock Tests</h1>
          <p className="dash-sub">{tests.length} test{tests.length !== 1 ? 's' : ''} created</p>
        </div>
        <button className="btn btn-blue" onClick={onNew}>
          <PlusCircle size={14} /> New Mock Test
        </button>
      </div>

      {tests.length === 0 ? (
        <div className="card empty-full">
          <ClipboardList size={40} style={{ color: 'var(--text3)' }} />
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>No mock tests yet</div>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>Create a mock test by combining multiple games</div>
          <button className="btn btn-blue" onClick={onNew}><PlusCircle size={14} /> Create Test</button>
        </div>
      ) : (
        <div className="mock-test-grid">
          {tests.map(test => (
            <div key={test.id} className="mock-card" onClick={() => navigate(`/mock-tests/${test.id}`)}>
              <div className="mock-card-top">
                <div className="mock-card-icon"><ClipboardList size={16} /></div>
                <span className={`badge badge-${test.status === 'published' ? 'green' : 'yellow'}`}>{test.status}</span>
              </div>
              <div className="mock-card-title">{test.title || 'Untitled Test'}</div>
              {test.description && <div className="mock-card-desc">{test.description}</div>}
              <div className="mock-card-meta">
                <div className="mock-meta-item"><Clock size={11} />{test.timeLimit} min</div>
                <div className="mock-meta-item"><ClipboardList size={11} />{test.games.length} games</div>
                <div className="mock-meta-item">Pass: {test.passingScore}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Editor ============
export function MockTestEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [test, setTest] = useState(() => {
    if (isNew) return createDefaultMockTest();
    const t = getMockTests().find(t => t.id === id);
    return t || createDefaultMockTest();
  });
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showGamePicker, setShowGamePicker] = useState(false);
  const allGames = getGames();
  const addedGameIds = new Set(test.games.map(g => g.id || g));

  const set = (key, val) => {
    setTest(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = (status) => {
    const updated = {
      ...test,
      status: status || test.status,
      updatedAt: new Date().toISOString(),
      id: test.id || generateId(),
      publishedAt: status === 'published' ? new Date().toISOString() : test.publishedAt,
    };
    saveMockTest(updated);
    setTest(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    if (isNew) navigate(`/mock-tests/${updated.id}`, { replace: true });
  };

  const handleDelete = () => {
    deleteMockTest(test.id);
    navigate('/mock-tests');
  };

  const addGame = (game) => {
    if (!addedGameIds.has(game.id)) {
      set('games', [...test.games, { id: game.id, title: game.title, order: test.games.length + 1 }]);
    }
  };

  const removeGame = (gameId) => {
    set('games', test.games.filter(g => (g.id || g) !== gameId));
  };

  const moveGame = (idx, dir) => {
    const arr = [...test.games];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    set('games', arr);
  };

  return (
    <div className="mock-editor fade-in">
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/mock-tests')}>
            <ArrowLeft size={14} /> Tests
          </button>
          <div className="editor-breadcrumb">
            <span>{isNew ? 'New Mock Test' : (test.title || 'Untitled Test')}</span>
            <span className={`badge badge-${test.status === 'published' ? 'green' : 'yellow'}`}>{test.status}</span>
          </div>
        </div>
        <div className="editor-topbar-right">
          {!isNew && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={13} style={{ color: 'var(--red)' }} />
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => handleSave('draft')}>
            <Save size={13} /> Save Draft
          </button>
          <button className="btn btn-blue btn-sm" onClick={() => handleSave('published')}>
            <CheckCircle size={13} /> Publish Test
          </button>
        </div>
      </div>

      {saved && <div className="save-toast"><CheckCircle size={13} /> Saved</div>}

      <div className="mock-editor-body">
        <div className="mock-editor-main">
          {/* Basic Info */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>Test Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="field">
                <label className="label">TEST TITLE</label>
                <input className="input-field" placeholder="e.g. Memory & Attention Assessment" value={test.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div className="field">
                <label className="label">DESCRIPTION</label>
                <textarea className="input-field" placeholder="What this test evaluates..." rows={2} value={test.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label className="label">TIME LIMIT (minutes)</label>
                  <input type="number" className="input-field" min={5} max={180} value={test.timeLimit} onChange={e => set('timeLimit', Number(e.target.value))} />
                </div>
                <div className="field">
                  <label className="label">PASSING SCORE (%)</label>
                  <input type="number" className="input-field" min={0} max={100} value={test.passingScore} onChange={e => set('passingScore', Number(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          {/* Games */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div>
                <div className="section-title">Games in Test</div>
                <div className="section-sub">{test.games.length} game{test.games.length !== 1 ? 's' : ''} added</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowGamePicker(true)}>
                <Plus size={13} /> Add Game
              </button>
            </div>

            {test.games.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                No games added yet. Click "Add Game" to get started.
              </div>
            ) : (
              <div className="test-game-list">
                {test.games.map((g, idx) => {
                  const fullGame = allGames.find(ag => ag.id === (g.id || g));
                  const Icon = fullGame ? (CATEGORY_ICONS[fullGame.category] || Brain) : Brain;
                  return (
                    <div key={g.id || g} className="test-game-row">
                      <div className="tgr-order">{idx + 1}</div>
                      <div className="tgr-icon"><Icon size={13} /></div>
                      <div className="tgr-info">
                        <div className="tgr-title">{fullGame?.title || g.title || 'Unknown Game'}</div>
                        {fullGame && (
                          <div className="tgr-meta">{fullGame.difficulty} · {fullGame.dotPhase.rounds + fullGame.symmetryPhase.rounds} rounds</div>
                        )}
                      </div>
                      <div className="tgr-actions">
                        <button className="icon-btn" onClick={() => moveGame(idx, -1)} disabled={idx === 0}>↑</button>
                        <button className="icon-btn" onClick={() => moveGame(idx, 1)} disabled={idx === test.games.length - 1}>↓</button>
                        <button className="icon-btn icon-btn--danger" onClick={() => removeGame(g.id || g)}><X size={12} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="section-title" style={{ marginBottom: 10 }}>Test Instructions</div>
            <div className="field">
              <label className="label">CUSTOM INSTRUCTIONS FOR STUDENTS</label>
              <textarea className="input-field" placeholder="Instructions shown to students before the test..." rows={4} value={test.instructions} onChange={e => set('instructions', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="mock-editor-sidebar">
          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>Test Summary</div>
            <div className="summary-rows">
              <SummaryRow label="Games" value={test.games.length} />
              <SummaryRow label="Time limit" value={`${test.timeLimit} min`} />
              <SummaryRow label="Pass score" value={`${test.passingScore}%`} />
              {test.games.map(g => {
                const full = allGames.find(ag => ag.id === (g.id || g));
                if (!full) return null;
                const maxPts = (full.dotPhase.rounds + full.symmetryPhase.rounds) * full.scoring.correctPoints;
                return <SummaryRow key={g.id || g} label={full.title?.slice(0, 18) || 'Game'} value={`max ${maxPts}pt`} />;
              })}
            </div>
          </div>

          {test.status === 'draft' && test.games.length === 0 && (
            <div className="card warn-card" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertTriangle size={14} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Add at least one game before publishing this test.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Game Picker Modal */}
      {showGamePicker && (
        <div className="modal-overlay" onClick={() => setShowGamePicker(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ width: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-title">Add Games to Test</div>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>Select published games to add to this mock test.</p>
            <div style={{ overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {allGames.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)' }}>No games created yet. Create games first.</div>
              )}
              {allGames.map(game => {
                const added = addedGameIds.has(game.id);
                const Icon = CATEGORY_ICONS[game.category] || Brain;
                return (
                  <div key={game.id} className={`picker-game${added ? ' picker-game--added' : ''}`}
                    onClick={() => !added && addGame(game)}>
                    <div className="picker-icon"><Icon size={13} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{game.title || 'Untitled'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{game.difficulty} · {game.status}</div>
                    </div>
                    {added ? <span className="badge badge-green">Added</span> : <span className="badge badge-blue">+ Add</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowGamePicker(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete Test?</div>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>This will permanently delete "{test.title || 'Untitled Test'}". Cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="summary-row">
      <span className="summary-label">{label}</span>
      <span className="summary-value">{value}</span>
    </div>
  );
}
