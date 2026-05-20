import React, { useState } from 'react';
import { Settings as SettingsIcon, Download, Upload, Trash2, RefreshCw } from 'lucide-react';
import { getGames, getMockTests } from '../store/gameStore';
import './Settings.css';

export default function Settings() {
  const [exportDone, setExportDone] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const handleExport = () => {
    const data = { games: getGames(), mockTests: getMockTests(), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'grid-challenge-export.json'; a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.games) localStorage.setItem('gc_admin_games', JSON.stringify(data.games));
        if (data.mockTests) localStorage.setItem('gc_admin_tests', JSON.stringify(data.mockTests));
        window.location.reload();
      } catch { alert('Invalid file format'); }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    localStorage.removeItem('gc_admin_games');
    localStorage.removeItem('gc_admin_tests');
    window.location.reload();
  };

  const games = getGames();
  const tests = getMockTests();

  return (
    <div className="settings-page fade-in">
      <div className="settings-header">
        <h1 className="dash-title">Settings</h1>
        <p className="dash-sub">Manage your admin panel preferences and data</p>
      </div>

      <div className="settings-grid">
        {/* Data */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 4 }}>Data Management</div>
          <div className="section-sub" style={{ marginBottom: 16 }}>Export, import, or reset your game data</div>

          <div className="settings-stat-row">
            <div className="settings-stat">
              <div className="settings-stat-val">{games.length}</div>
              <div className="settings-stat-label">Games</div>
            </div>
            <div className="settings-stat">
              <div className="settings-stat-val">{games.filter(g => g.status === 'published').length}</div>
              <div className="settings-stat-label">Published</div>
            </div>
            <div className="settings-stat">
              <div className="settings-stat-val">{tests.length}</div>
              <div className="settings-stat-label">Mock Tests</div>
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={14} /> {exportDone ? '✓ Exported!' : 'Export all data (JSON)'}
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={14} /> Import from JSON
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            </label>
            <button className="btn btn-danger" onClick={() => setClearConfirm(true)}>
              <Trash2 size={14} /> Clear all data
            </button>
          </div>
        </div>

        {/* Game Defaults */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 4 }}>Default Config</div>
          <div className="section-sub" style={{ marginBottom: 16 }}>These are the default values for new games</div>
          <div className="config-list">
            {[
              ['Total dots', '24'],
              ['Highlight duration', '2s'],
              ['Rounds', '3'],
              ['Grid size', '5×5'],
              ['Pattern display', '6s'],
              ['Correct points', '+3'],
              ['Wrong penalty', '−1'],
            ].map(([k, v]) => (
              <div key={k} className="config-row">
                <span className="config-key">{k}</span>
                <span className="config-val">{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '8px 10px', background: 'var(--blue-dim)', borderRadius: 7, fontSize: 12, color: 'var(--text2)' }}>
            These defaults can be overridden per game in the Game Editor.
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 4 }}>About</div>
          <div className="section-sub" style={{ marginBottom: 16 }}>Grid Challenge Admin Panel</div>
          <div className="config-list">
            {[
              ['Version', '1.0.0'],
              ['Framework', 'React + Vite'],
              ['Storage', 'localStorage'],
              ['Game type', 'Grid Challenge'],
              ['Skills tested', 'Memory, Attention'],
            ].map(([k, v]) => (
              <div key={k} className="config-row">
                <span className="config-key">{k}</span>
                <span className="config-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {clearConfirm && (
        <div className="modal-overlay" onClick={() => setClearConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ color: 'var(--red)' }}>⚠ Clear All Data?</div>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
              This will permanently delete ALL games and mock tests. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setClearConfirm(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleClear}>Yes, Clear Everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
