import React, { useState, useEffect, useRef, useCallback } from 'react';
import './DotPhasePreview.css';

function randomDots(count, w, h, r = 18) {
  const dots = [];
  let attempts = 0;
  while (dots.length < count && attempts < 2000) {
    attempts++;
    const x = r + Math.random() * (w - r * 2);
    const y = r + Math.random() * (h - r * 2);
    const ok = dots.every(d => Math.hypot(d.x - x, d.y - y) > r * 2.4);
    if (ok) dots.push({ x, y, id: dots.length });
  }
  return dots;
}

export default function DotPhasePreview({ config }) {
  const { totalDots, highlightDuration, rounds } = config;
  const [dots, setDots] = useState([]);
  const [highlighted, setHighlighted] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | showing | hidden | done
  const [roundNum, setRoundNum] = useState(0);
  const [sequence, setSequence] = useState([]);
  const containerRef = useRef(null);
  const W = 520, H = 180;

  const runRound = useCallback((rNum, newDots) => {
    const targetIdx = Math.floor(Math.random() * newDots.length);
    setHighlighted(targetIdx);
    setPhase('showing');
    setSequence(prev => [...prev, targetIdx]);

    setTimeout(() => {
      setHighlighted(null);
      setPhase('hidden');
      const nextRound = rNum + 1;
      if (nextRound < rounds) {
        setTimeout(() => {
          const moreDots = randomDots(totalDots, W, H);
          setDots(moreDots);
          runRound(nextRound, moreDots);
        }, 800);
      } else {
        setPhase('done');
      }
    }, highlightDuration);
  }, [rounds, highlightDuration, totalDots]);

  const start = () => {
    const newDots = randomDots(totalDots, W, H);
    setDots(newDots);
    setSequence([]);
    setRoundNum(0);
    setPhase('idle');
    setTimeout(() => runRound(0, newDots), 200);
  };

  const phaseLabel = {
    idle: 'Click Start to preview',
    showing: `Round ${sequence.length} / ${rounds} — Remember the green dot!`,
    hidden: 'Preparing next round...',
    done: `Done! Remembered positions: ${sequence.length}`,
  }[phase];

  return (
    <div className="dot-preview">
      <div className="dot-preview-header">
        <span className="dot-preview-label">Dot Phase Preview</span>
        <div className="dot-preview-info">{phaseLabel}</div>
        <button className="btn btn-secondary btn-sm" onClick={start}>
          {phase === 'idle' || phase === 'done' ? '▶ Start' : '↺ Restart'}
        </button>
      </div>
      <div className="dot-preview-area" ref={containerRef} style={{ width: W, height: H }}>
        {dots.map((dot, i) => (
          <div
            key={dot.id}
            className={`dot-circle${highlighted === i ? ' dot-circle--highlighted' : ''}`}
            style={{ left: dot.x, top: dot.y }}
          />
        ))}
      </div>
    </div>
  );
}
