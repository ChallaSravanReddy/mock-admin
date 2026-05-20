import React, { useState, useCallback } from 'react';
import './SymmetryPreview.css';

function generatePattern(size) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Math.random() > 0.45)
  );
}

function rotatePattern(p) {
  const n = p.length;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => p[n - 1 - r][n - 1 - c])
  );
}

function mirrorH(p) {
  return p.map(row => [...row].reverse());
}

function mirrorV(p) {
  return [...p].reverse();
}

function applyTransform(p, type) {
  if (type === 'rotated') return rotatePattern(p);
  if (type === 'mirrored_h') return mirrorH(p);
  if (type === 'mirrored_v') return mirrorV(p);
  // random: sometimes symmetric, sometimes not
  return Math.random() > 0.5 ? rotatePattern(p) : generatePattern(p.length);
}

function Grid({ pattern, size }) {
  return (
    <div className="sym-grid" style={{
      gridTemplateColumns: `repeat(${size}, 1fr)`,
      gridTemplateRows: `repeat(${size}, 1fr)`,
    }}>
      {pattern.map((row, r) =>
        row.map((cell, c) => (
          <div key={`${r}-${c}`} className={`sym-cell${cell ? ' sym-cell--filled' : ''}`} />
        ))
      )}
    </div>
  );
}

export default function SymmetryPreview({ config }) {
  const { gridSize, patternType } = config;
  const [patternA, setPatternA] = useState(() => generatePattern(gridSize));
  const [patternB, setPatternB] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [userAnswer, setUserAnswer] = useState(null);
  const [phase, setPhase] = useState('idle');

  const generate = useCallback(() => {
    const a = generatePattern(gridSize);
    const b = applyTransform(a, patternType);
    const isSymmetric = patternType !== 'random' || JSON.stringify(b) !== JSON.stringify(generatePattern(gridSize));
    setPatternA(a);
    setPatternB(b);
    setAnswer(patternType !== 'random' ? true : Math.random() > 0.5);
    setUserAnswer(null);
    setPhase('showing');
  }, [gridSize, patternType]);

  const respond = (val) => {
    setUserAnswer(val);
    setPhase('result');
  };

  const correct = userAnswer !== null && userAnswer === answer;

  return (
    <div className="sym-preview">
      <div className="sym-preview-header">
        <span className="sym-preview-label">Symmetry Phase Preview</span>
        <button className="btn btn-secondary btn-sm" onClick={generate}>
          {phase === 'idle' ? '▶ Generate' : '↺ New Pattern'}
        </button>
      </div>

      {phase === 'idle' && (
        <div className="sym-placeholder">Click "Generate" to preview a pattern pair</div>
      )}

      {phase !== 'idle' && patternB && (
        <div className="sym-content">
          <div className="sym-question">
            {patternType === 'rotated' ? 'Rotated but identical?' :
              patternType === 'mirrored_h' ? 'Mirrored horizontally?' :
              patternType === 'mirrored_v' ? 'Mirrored vertically?' : 'Are these symmetric?'}
          </div>
          <div className="sym-grids">
            <Grid pattern={patternA} size={gridSize} />
            <div className="sym-vs">vs</div>
            <Grid pattern={patternB} size={gridSize} />
          </div>
          {phase === 'showing' && (
            <div className="sym-btns">
              <button className="sym-btn sym-btn--yes" onClick={() => respond(true)}>Yes</button>
              <button className="sym-btn sym-btn--no" onClick={() => respond(false)}>No</button>
            </div>
          )}
          {phase === 'result' && (
            <div className={`sym-result${correct ? ' correct' : ' wrong'}`}>
              {correct ? '✓ Correct!' : `✗ Wrong — answer was "${answer ? 'Yes' : 'No'}"`}
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 10 }} onClick={generate}>Try another</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
