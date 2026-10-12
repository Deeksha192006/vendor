import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/navigation/Header';
import { Footer } from '../components/Footer';

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-white text-[#222222] flex flex-col justify-between antialiased">
      {/* 1. Official BAAPOO MART Header & Navigation Bar */}
      <Header />

      {/* 2. Main Storefront Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 3. Official BAAPOO MART Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
