import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, Sidebar } from '../layouts';

export const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar onMenuToggle={handleMenuToggle} isMenuOpen={isSidebarOpen} />

      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
