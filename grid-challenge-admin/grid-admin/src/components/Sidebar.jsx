import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Gamepad2, ClipboardList, Settings,
  ChevronRight, Zap, PlusCircle
} from 'lucide-react';
import './Sidebar.css';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/mock-tests', label: 'Mock Tests', icon: ClipboardList },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ onNewGame, onNewTest }) {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon"><Zap size={16} /></div>
        <div>
          <div className="brand-name">GridAdmin</div>
          <div className="brand-sub">Game Builder</div>
        </div>
      </div>

      <div className="sidebar-section-label">QUICK ACTIONS</div>
      <button className="sidebar-action" onClick={onNewGame}>
        <PlusCircle size={14} />
        New Game
      </button>
      <button className="sidebar-action sidebar-action--blue" onClick={onNewTest}>
        <PlusCircle size={14} />
        New Mock Test
      </button>

      <div className="sidebar-section-label" style={{ marginTop: 20 }}>NAVIGATION</div>
      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            <span>{label}</span>
            <ChevronRight size={12} className="sidebar-chevron" />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-info">
          <div className="sidebar-footer-dot" />
          <span>Admin Panel v1.0</span>
        </div>
      </div>
    </aside>
  );
}
