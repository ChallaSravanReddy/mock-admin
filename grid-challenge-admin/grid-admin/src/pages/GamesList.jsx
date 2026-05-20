import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGames, deleteGame } from '../store/gameStore';
import {
  PlusCircle, Search, Filter, Trash2, Edit2,
  Brain, Eye, Layers, MoreVertical, Copy, CheckCircle,
  Clock, AlertCircle, ChevronDown
} from 'lucide-react';
import { generateId, saveGame } from '../store/gameStore';
import './GamesList.css';

const CATEGORY_ICONS = { memory: Brain, attention: Eye, pattern: Layers };
const CATEGORY_COLORS = { memory: 'purple', attention: 'blue', pattern: 'green' };
const DIFF_COLORS = { easy: 'green', medium: 'yellow', hard: 'accent', expert: 'red' };

export default function GamesList({ onNew }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [openMenu, setOpenMenu] = useState(null);
  const [games, setGames] = useState(getGames);

  const filtered = useMemo(() => {
    return games.filter(g => {
      if (search && !g.title?.toLowerCase().includes(search.toLowerCase()) && !g.description?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== 'all' && g.status !== filterStatus) return false;
      if (filterDiff !== 'all' && g.difficulty !== filterDiff) return false;
      return true;
    });
  }, [games, search, filterStatus, filterDiff]);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    deleteGame(id);
    setGames(getGames());
    setOpenMenu(null);
  };

  const handleDuplicate = (game, e) => {
    e.stopPropagation();
    const copy = { ...game, id: generateId(), title: game.title + ' (Copy)', status: 'draft', createdAt: new Date().toISOString() };
    saveGame(copy);
    setGames(getGames());
    setOpenMenu(null);
  };

  return (
    <div className="games-list fade-in">
      <div className="games-list-header">
        <div>
          <h1 className="dash-title">Games</h1>
          <p className="dash-sub">{games.length} game{games.length !== 1 ? 's' : ''} created</p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          <PlusCircle size={14} /> New Game
        </button>
      </div>

      {/* Filters */}
      <div className="games-filters">
        <div className="search-wrap">
          <Search size={14} className="search-icon" />
          <input
            className="input-field search-input"
            placeholder="Search games..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="select-field filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="review">In Review</option>
          <option value="published">Published</option>
        </select>
        <select className="select-field filter-select" value={filterDiff} onChange={e => setFilterDiff(e.target.value)}>
          <option value="all">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-full">
          <Brain size={40} style={{ color: 'var(--text3)' }} />
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700 }}>No games found</div>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>
            {games.length === 0 ? 'Create your first game to get started' : 'Try adjusting your filters'}
          </div>
          {games.length === 0 && (
            <button className="btn btn-primary" onClick={onNew}>
              <PlusCircle size={14} /> Create Game
            </button>
          )}
        </div>
      ) : (
        <div className="games-grid">
          {filtered.map(game => {
            const Icon = CATEGORY_ICONS[game.category] || Brain;
            const catColor = CATEGORY_COLORS[game.category] || 'purple';
            const diffColor = DIFF_COLORS[game.difficulty] || 'blue';
            const statusIcon = game.status === 'published' ? CheckCircle : game.status === 'review' ? AlertCircle : Clock;
            const StatusIcon = statusIcon;

            return (
              <div key={game.id} className="game-card" onClick={() => navigate(`/games/${game.id}`)}>
                <div className="game-card-header">
                  <div className={`game-card-icon badge-${catColor}`}>
                    <Icon size={16} />
                  </div>
                  <div className="game-card-badges">
                    <span className={`badge badge-${diffColor}`}>{game.difficulty}</span>
                    <span className={`badge badge-${game.status === 'published' ? 'green' : game.status === 'review' ? 'blue' : 'yellow'}`}>
                      <StatusIcon size={9} />{game.status}
                    </span>
                  </div>
                  <div className="game-card-menu" onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === game.id ? null : game.id); }}>
                    <MoreVertical size={15} />
                    {openMenu === game.id && (
                      <div className="dropdown-menu">
                        <button onClick={e => { navigate(`/games/${game.id}`); setOpenMenu(null); }}>
                          <Edit2 size={13} /> Edit
                        </button>
                        <button onClick={e => handleDuplicate(game, e)}>
                          <Copy size={13} /> Duplicate
                        </button>
                        <button className="dropdown-danger" onClick={e => handleDelete(game.id, e)}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="game-card-title">{game.title || 'Untitled Game'}</div>
                {game.description && (
                  <div className="game-card-desc">{game.description}</div>
                )}

                <div className="game-card-stats">
                  <div className="game-stat">
                    <span className="game-stat-val">{game.dotPhase.rounds}</span>
                    <span className="game-stat-label">dot rounds</span>
                  </div>
                  <div className="game-stat">
                    <span className="game-stat-val">{game.symmetryPhase.rounds}</span>
                    <span className="game-stat-label">sym rounds</span>
                  </div>
                  <div className="game-stat">
                    <span className="game-stat-val">{game.symmetryPhase.gridSize}×{game.symmetryPhase.gridSize}</span>
                    <span className="game-stat-label">grid</span>
                  </div>
                  <div className="game-stat">
                    <span className="game-stat-val" style={{ color: 'var(--accent)' }}>+{game.scoring.correctPoints}</span>
                    <span className="game-stat-label">pts</span>
                  </div>
                </div>

                {game.tags?.length > 0 && (
                  <div className="game-card-tags">
                    {game.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="game-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
