import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Eye, Trash2, CheckCircle,
  Circle, Grid3X3, Trophy, FileText, Tag,
  ChevronDown, ChevronUp, Play, Info, Copy
} from 'lucide-react';
import { getGame, saveGame, deleteGame, createDefaultGame, generateId } from '../store/gameStore';
import DotPhasePreview from '../components/DotPhasePreview';
import SymmetryPreview from '../components/SymmetryPreview';
import './GameEditor.css';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
const CATEGORIES = [
  { value: 'memory', label: 'Memory' },
  { value: 'attention', label: 'Attention' },
  { value: 'pattern', label: 'Pattern Recognition' },
];
const PATTERN_TYPES = [
  { value: 'rotated', label: 'Rotated (180°)' },
  { value: 'mirrored_h', label: 'Mirrored Horizontal' },
  { value: 'mirrored_v', label: 'Mirrored Vertical' },
  { value: 'random', label: 'Random (Mix)' },
];

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="editor-section">
      <button className="editor-section-header" onClick={() => setOpen(o => !o)}>
        <div className="editor-section-title">
          <Icon size={16} className="editor-section-icon" />
          {title}
        </div>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="editor-section-body">{children}</div>}
    </div>
  );
}

function FieldRow({ children }) {
  return <div className="field-row">{children}</div>;
}

function Field({ label, children, help }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      {children}
      {help && <div className="field-help">{help}</div>}
    </div>
  );
}

function RangeField({ label, value, min, max, step = 1, unit, onChange, help }) {
  return (
    <div className="field">
      <label className="label">{label} — <span style={{ color: 'var(--accent)' }}>{value}{unit}</span></label>
      <input
        type="range" min={min} max={max} step={step}
        value={value} onChange={e => onChange(Number(e.target.value))}
        className="range-input"
      />
      <div className="range-labels"><span>{min}{unit}</span><span>{max}{unit}</span></div>
      {help && <div className="field-help">{help}</div>}
    </div>
  );
}

export default function GameEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [game, setGame] = useState(() => {
    if (isNew) return createDefaultGame();
    return getGame(id) || createDefaultGame();
  });
  const [saved, setSaved] = useState(false);
  const [activePreview, setActivePreview] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const set = (path, value) => {
    setGame(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        obj[parts[i]] = { ...obj[parts[i]] };
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
    setSaved(false);
  };

  const handleSave = (status) => {
    const updated = {
      ...game,
      status: status || game.status,
      updatedAt: new Date().toISOString(),
      id: game.id || generateId(),
    };
    saveGame(updated);
    setGame(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    if (isNew) navigate(`/games/${updated.id}`, { replace: true });
  };

  const handleDelete = () => {
    deleteGame(game.id);
    navigate('/games');
  };

  const handleDuplicate = () => {
    const copy = { ...game, id: generateId(), title: game.title + ' (Copy)', status: 'draft', createdAt: new Date().toISOString() };
    saveGame(copy);
    navigate(`/games/${copy.id}`);
  };

  return (
    <div className="game-editor fade-in">
      {/* Top Bar */}
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/games')}>
            <ArrowLeft size={14} /> Games
          </button>
          <div className="editor-breadcrumb">
            <span>{isNew ? 'New Game' : (game.title || 'Untitled Game')}</span>
            <span className={`badge badge-${game.status === 'published' ? 'green' : game.status === 'draft' ? 'yellow' : 'blue'}`}>
              {game.status}
            </span>
          </div>
        </div>
        <div className="editor-topbar-right">
          {!isNew && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={handleDuplicate}>
                <Copy size={13} /> Duplicate
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={13} style={{ color: 'var(--red)' }} />
              </button>
            </>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => handleSave('draft')}>
            <Save size={13} /> Save Draft
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => handleSave('published')}>
            <CheckCircle size={13} /> Publish
          </button>
        </div>
      </div>

      {saved && (
        <div className="save-toast">
          <CheckCircle size={13} /> Saved successfully
        </div>
      )}

      <div className="editor-body">
        {/* Left: Form */}
        <div className="editor-form">

          {/* Basic Info */}
          <Section title="Game Info" icon={FileText}>
            <Field label="GAME TITLE">
              <input
                className="input-field"
                placeholder="e.g. Grid Challenge — Level 1"
                value={game.title}
                onChange={e => set('title', e.target.value)}
              />
            </Field>
            <Field label="DESCRIPTION">
              <textarea
                className="input-field"
                placeholder="What this game tests..."
                rows={2}
                value={game.description}
                onChange={e => set('description', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </Field>
            <FieldRow>
              <Field label="CATEGORY">
                <select className="select-field" value={game.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="DIFFICULTY">
                <div className="difficulty-pills">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      className={`difficulty-pill difficulty-pill--${d}${game.difficulty === d ? ' active' : ''}`}
                      onClick={() => set('difficulty', d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>
            </FieldRow>
            <Field label="TAGS (comma separated)">
              <input
                className="input-field"
                placeholder="e.g. beginner, spatial, quick"
                value={game.tags?.join(', ') || ''}
                onChange={e => set('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              />
            </Field>
          </Section>

          {/* Dot Phase */}
          <Section title="Dot Memory Phase" icon={Circle}>
            <div className="info-banner">
              <Info size={13} />
              Circles are scattered on screen. One blinks — the player must remember its position. Repeat for N rounds.
            </div>
            <FieldRow>
              <RangeField
                label="TOTAL DOTS ON SCREEN"
                value={game.dotPhase.totalDots}
                min={8} max={40} step={2}
                unit=" dots"
                onChange={v => set('dotPhase.totalDots', v)}
                help="More dots = harder to find the target"
              />
              <RangeField
                label="HIGHLIGHT DURATION"
                value={game.dotPhase.highlightDuration / 1000}
                min={1} max={5} step={0.5}
                unit="s"
                onChange={v => set('dotPhase.highlightDuration', v * 1000)}
                help="How long the green dot is shown"
              />
            </FieldRow>
            <FieldRow>
              <RangeField
                label="ROUNDS (dots to remember)"
                value={game.dotPhase.rounds}
                min={1} max={6}
                unit=" rounds"
                onChange={v => set('dotPhase.rounds', v)}
              />
              <div className="field" />
            </FieldRow>
            <button className="btn btn-secondary btn-sm preview-btn" onClick={() => setActivePreview(activePreview === 'dot' ? null : 'dot')}>
              <Play size={12} /> {activePreview === 'dot' ? 'Hide Preview' : 'Preview Dot Phase'}
            </button>
            {activePreview === 'dot' && <DotPhasePreview config={game.dotPhase} />}
          </Section>

          {/* Symmetry Phase */}
          <Section title="Symmetry Pattern Phase" icon={Grid3X3}>
            <div className="info-banner">
              <Info size={13} />
              Two grid patterns shown side-by-side. Player decides: are they symmetric (rotated/mirrored) or not?
            </div>
            <FieldRow>
              <RangeField
                label="GRID SIZE"
                value={game.symmetryPhase.gridSize}
                min={3} max={8}
                unit="×"
                onChange={v => set('symmetryPhase.gridSize', v)}
                help="Grid will be N × N cells"
              />
              <RangeField
                label="DISPLAY DURATION"
                value={game.symmetryPhase.displayDuration / 1000}
                min={2} max={12} step={0.5}
                unit="s"
                onChange={v => set('symmetryPhase.displayDuration', v * 1000)}
                help="Time patterns are visible"
              />
            </FieldRow>
            <FieldRow>
              <Field label="PATTERN TYPE">
                <select
                  className="select-field"
                  value={game.symmetryPhase.patternType}
                  onChange={e => set('symmetryPhase.patternType', e.target.value)}
                >
                  {PATTERN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>
              <RangeField
                label="SYMMETRY ROUNDS"
                value={game.symmetryPhase.rounds}
                min={1} max={6}
                unit=" rounds"
                onChange={v => set('symmetryPhase.rounds', v)}
              />
            </FieldRow>
            <button className="btn btn-secondary btn-sm preview-btn" onClick={() => setActivePreview(activePreview === 'sym' ? null : 'sym')}>
              <Play size={12} /> {activePreview === 'sym' ? 'Hide Preview' : 'Preview Symmetry Phase'}
            </button>
            {activePreview === 'sym' && <SymmetryPreview config={game.symmetryPhase} />}
          </Section>

          {/* Scoring */}
          <Section title="Scoring Rules" icon={Trophy}>
            <FieldRow>
              <RangeField
                label="CORRECT ANSWER POINTS"
                value={game.scoring.correctPoints}
                min={1} max={10}
                unit=" pts"
                onChange={v => set('scoring.correctPoints', v)}
              />
              <RangeField
                label="WRONG ANSWER PENALTY"
                value={game.scoring.wrongPenalty}
                min={0} max={5}
                unit=" pts"
                onChange={v => set('scoring.wrongPenalty', v)}
              />
            </FieldRow>
            <FieldRow>
              <Field label="TIME BONUS">
                <div className="toggle-row">
                  <button
                    className={`toggle-btn${game.scoring.timeBonus ? ' active' : ''}`}
                    onClick={() => set('scoring.timeBonus', !game.scoring.timeBonus)}
                  >
                    <div className="toggle-thumb" />
                  </button>
                  <span style={{ color: 'var(--text2)', fontSize: 13 }}>
                    {game.scoring.timeBonus ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </Field>
              {game.scoring.timeBonus && (
                <RangeField
                  label="BONUS FOR FINISHING EARLY"
                  value={game.scoring.timeBonusSeconds}
                  min={5} max={60} step={5}
                  unit="s threshold"
                  onChange={v => set('scoring.timeBonusSeconds', v)}
                />
              )}
            </FieldRow>
          </Section>

          {/* Custom Instructions */}
          <Section title="Custom Instructions" icon={FileText} defaultOpen={false}>
            <Field label="OVERRIDE DEFAULT INSTRUCTIONS" help="Leave empty to use default instructions from the game rules">
              <textarea
                className="input-field"
                placeholder="Write custom instructions for players..."
                rows={4}
                value={game.customInstructions}
                onChange={e => set('customInstructions', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </Field>
          </Section>

        </div>

        {/* Right: Summary card */}
        <div className="editor-sidebar">
          <div className="card summary-card">
            <div className="section-title" style={{ marginBottom: 14 }}>Game Summary</div>
            <div className="summary-rows">
              <SummaryRow label="Dot Rounds" value={game.dotPhase.rounds} />
              <SummaryRow label="Dots on screen" value={game.dotPhase.totalDots} />
              <SummaryRow label="Highlight time" value={`${game.dotPhase.highlightDuration / 1000}s`} />
              <SummaryRow label="Symmetry rounds" value={game.symmetryPhase.rounds} />
              <SummaryRow label="Grid size" value={`${game.symmetryPhase.gridSize}×${game.symmetryPhase.gridSize}`} />
              <SummaryRow label="Pattern display" value={`${game.symmetryPhase.displayDuration / 1000}s`} />
              <SummaryRow label="Pattern type" value={game.symmetryPhase.patternType} />
              <div className="divider" />
              <SummaryRow label="Correct answer" value={`+${game.scoring.correctPoints} pts`} valueClass="text-green" />
              <SummaryRow label="Wrong answer" value={`−${game.scoring.wrongPenalty} pts`} valueClass="text-red" />
              <SummaryRow label="Max possible" value={`${(game.dotPhase.rounds + game.symmetryPhase.rounds) * game.scoring.correctPoints} pts`} valueClass="text-accent" />
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="section-title" style={{ marginBottom: 10, fontSize: 14 }}>Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['draft', 'review', 'published'].map(s => (
                <button
                  key={s}
                  className={`status-option${game.status === s ? ' active' : ''}`}
                  onClick={() => set('status', s)}
                >
                  <div className={`status-dot status-dot--${s}`} />
                  <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                  {game.status === s && <CheckCircle size={12} style={{ marginLeft: 'auto', color: 'var(--green)' }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete Game?</div>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
              This will permanently delete "{game.title || 'Untitled Game'}". This cannot be undone.
            </p>
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

function SummaryRow({ label, value, valueClass }) {
  return (
    <div className="summary-row">
      <span className="summary-label">{label}</span>
      <span className={`summary-value ${valueClass || ''}`}>{value}</span>
    </div>
  );
}
