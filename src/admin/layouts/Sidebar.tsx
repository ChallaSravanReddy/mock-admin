import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Lightbulb,
  BarChart3,
  Settings,
  Zap,
  Grid3x3,
  Shapes,
  Move,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    path: '/admin',
  },
  {
    label: 'Mock Tests',
    icon: <Lightbulb size={20} />,
    path: '/admin/mock-tests',
  },
  {
    label: 'Hackathon Studio',
    icon: <Trophy size={20} />,
    path: '/admin/hackathon',
  },
  {
    label: 'Puzzle Builder',
    icon: <BarChart3 size={20} />,
    path: '/admin/puzzle-builder',
  },
  {
    label: 'Swith Challenge',
    icon: <Zap size={20} />,
    path: '/admin/swith-challenge',
  },
  {
    label: 'Grid Challenge',
    icon: <Grid3x3 size={20} />,
    path: '/admin/grid-challenge',
  },
  {
    label: 'Inductive Challenge',
    icon: <Shapes size={20} />,
    path: '/admin/inductive-challenge',
  },
  {
    label: 'Motion Challenge',
    icon: <Move size={20} />,
    path: '/admin/motion-challenge',
  },
  {
    label: 'Results',
    icon: <BarChart3 size={20} />,
    path: '/admin/results',
  },
  {
    label: 'Settings',
    icon: <Settings size={20} />,
    path: '/admin/settings',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-slate-900 text-white overflow-y-auto transition-transform duration-300 z-40',
        'lg:translate-x-0 lg:relative lg:top-0 lg:h-[calc(100vh-0rem)]',
        !isOpen && '-translate-x-full lg:translate-x-0'
      )}
    >
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            {item.icon}
            <span className="font-medium flex-1">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-1 text-xs font-semibold bg-red-500 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-950">
        <div className="text-sm text-slate-400">
          <p className="font-semibold text-white">Admin Panel</p>
          <p className="text-xs mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
};
