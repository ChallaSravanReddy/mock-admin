import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGames, getMockTests } from '../store/gameStore';
import {
  Gamepad2, ClipboardList, CheckCircle2, Clock,
  TrendingUp, PlusCircle, ArrowRight, Brain, Eye, Layers
} from 'lucide-react';
import './Dashboard.css';

const CATEGORY_ICONS = { memory: Brain, attention: Eye, pattern: Layers };
const CATEGORY_COLORS = { memory: 'purple', attention: 'blue', pattern: 'green' };

export default function Dashboard({ onNewGame, onNewTest }) {
  const navigate = useNavigate();
  const games = getGames();
  const tests = getMockTests();

  const stats = useMemo(() => ({
    totalGames: games.length,
    publishedGames: games.filter(g => g.status === 'published').length,
    draftGames: games.filter(g => g.status === 'draft').length,
    totalTests: tests.length,
    publishedTests: tests.filter(t => t.status === 'published').length,
  }), [games, tests]);

  const recentGames = games.slice(0, 5);
  const recentTests = tests.slice(0, 3);

  return (
    <div className="dashboard fade-in">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">Overview of your Grid Challenge content</p>
        </div>
        <div className="dash-header-actions">
          <button className="btn btn-secondary" onClick={onNewTest}>
            <PlusCircle size={14} /> New Mock Test
          </button>
          <button className="btn btn-primary" onClick={onNewGame}>
            <PlusCircle size={14} /> New Game
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {[
          { label: 'Total Games', value: stats.totalGames, icon: Gamepad2, color: 'accent', sub: `${stats.publishedGames} published` },
          { label: 'Draft Games', value: stats.draftGames, icon: Clock, color: 'yellow', sub: 'In progress' },
          { label: 'Mock Tests', value: stats.totalTests, icon: ClipboardList, color: 'blue', sub: `${stats.publishedTests} published` },
          { label: 'Published', value: stats.publishedGames + stats.publishedTests, icon: CheckCircle2, color: 'green', sub: 'Live content' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className={`stat-card stat-card--${color}`}>
            <div className="stat-icon-wrap">
              <Icon size={18} />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid-2">
        {/* Recent Games */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="section-title">Recent Games</div>
              <div className="section-sub">Latest created games</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/games')}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divider" />
          {recentGames.length === 0 ? (
            <EmptyState icon={Gamepad2} text="No games yet" action="Create your first game" onClick={onNewGame} />
          ) : (
            <div className="game-list">
              {recentGames.map(game => {
                const Icon = CATEGORY_ICONS[game.category] || Brain;
                const color = CATEGORY_COLORS[game.category] || 'purple';
                return (
                  <div key={game.id} className="game-row" onClick={() => navigate(`/games/${game.id}`)}>
                    <div className={`game-row-icon badge-${color}`}>
                      <Icon size={14} />
                    </div>
                    <div className="game-row-info">
                      <div className="game-row-title">{game.title || 'Untitled Game'}</div>
                      <div className="game-row-meta">{game.difficulty} · {game.dotPhase.rounds} rounds</div>
                    </div>
                    <span className={`badge badge-${game.status === 'published' ? 'green' : game.status === 'draft' ? 'yellow' : 'blue'}`}>
                      {game.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Tests + Quick Guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="section-title">Mock Tests</div>
                <div className="section-sub">Test configurations</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/mock-tests')}>
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="divider" />
            {recentTests.length === 0 ? (
              <EmptyState icon={ClipboardList} text="No tests yet" action="Create your first test" onClick={onNewTest} />
            ) : (
              <div className="game-list">
                {recentTests.map(test => (
                  <div key={test.id} className="game-row" onClick={() => navigate(`/mock-tests/${test.id}`)}>
                    <div className="game-row-icon badge-blue">
                      <ClipboardList size={14} />
                    </div>
                    <div className="game-row-info">
                      <div className="game-row-title">{test.title || 'Untitled Test'}</div>
                      <div className="game-row-meta">{test.games.length} games · {test.timeLimit}min</div>
                    </div>
                    <span className={`badge badge-${test.status === 'published' ? 'green' : 'yellow'}`}>
                      {test.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card quick-guide">
            <div className="section-title">How it Works</div>
            <div className="divider" />
            <ol className="guide-steps">
              <li><span className="guide-num">1</span><span>Create a <strong>Game</strong> — configure dots, symmetry patterns & scoring</span></li>
              <li><span className="guide-num">2</span><span>Preview the game to test your settings</span></li>
              <li><span className="guide-num">3</span><span>Create a <strong>Mock Test</strong> and add games to it</span></li>
              <li><span className="guide-num">4</span><span>Publish the test to make it available to students</span></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, action, onClick }) {
  return (
    <div className="empty-state">
      <Icon size={28} style={{ color: 'var(--text3)' }} />
      <div style={{ color: 'var(--text3)', fontSize: 13 }}>{text}</div>
      <button className="btn btn-ghost btn-sm" onClick={onClick}>
        <PlusCircle size={12} /> {action}
      </button>
    </div>
  );
}
