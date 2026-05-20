import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import GamesList from './pages/GamesList';
import GameEditor from './pages/GameEditor';
import { MockTestsList, MockTestEditor } from './pages/MockTests';
import Settings from './pages/Settings';
import './App.css';

function AppInner() {
  const navigate = useNavigate();

  const handleNewGame = () => navigate('/games/new');
  const handleNewTest = () => navigate('/mock-tests/new');

  return (
    <div className="app-layout">
      <Sidebar onNewGame={handleNewGame} onNewTest={handleNewTest} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard onNewGame={handleNewGame} onNewTest={handleNewTest} />} />
          <Route path="/games" element={<GamesList onNew={handleNewGame} />} />
          <Route path="/games/:id" element={<GameEditor />} />
          <Route path="/mock-tests" element={<MockTestsList onNew={handleNewTest} />} />
          <Route path="/mock-tests/:id" element={<MockTestEditor />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
