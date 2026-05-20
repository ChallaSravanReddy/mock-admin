import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './Pages/AdminLayout';
import {
  Dashboard,
  MockTestManagement,
  PuzzleBuilder,
  Results,
  SwithChallengeBuilder,
  GridChallengeBuilder,
  InductiveChallengeBuilder,
  MotionChallengeBuilder,
  MockTestViewer,
} from './Pages';

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Full-screen mock test viewer (no admin shell sidebar) */}
      <Route path="/mock-tests/:id/view" element={<MockTestViewer />} />

      {/* Admin dashboard and builders inside layout */}
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mock-tests" element={<MockTestManagement />} />
        <Route path="/puzzle-builder" element={<PuzzleBuilder />} />
        <Route path="/swith-challenge" element={<SwithChallengeBuilder />} />
        <Route path="/grid-challenge" element={<GridChallengeBuilder />} />
        <Route path="/inductive-challenge" element={<InductiveChallengeBuilder />} />
        <Route path="/motion-challenge" element={<MotionChallengeBuilder />} />
        <Route path="/results" element={<Results />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
};
