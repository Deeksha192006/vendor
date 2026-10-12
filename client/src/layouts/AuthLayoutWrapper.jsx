import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

export const AuthLayoutWrapper = () => {
  const location = useLocation();
  const pathname = location.pathname;

  let portalBadge = 'BUY INDIAN • BUILD INDIA';
  let homeLink = '/';

  if (pathname.includes('/super-admin') || pathname.includes('/admin')) {
    portalBadge = 'SUPER ADMIN COMMAND PORTAL';
    homeLink = '/super-admin/login';
  } else if (pathname.includes('/vendor')) {
    portalBadge = 'VERIFIED MERCHANT PORTAL';
    homeLink = '/vendor/login';
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col justify-between text-[#222222] antialiased relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(48, 53, 143, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(48, 53, 143, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* 1. Header with Official Logo */}
      <header className="relative z-10 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#30358F]/10 text-[#30358F] text-[10px] font-black uppercase tracking-wider">
              {portalBadge}
            </span>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <Link to="/products" className="hover:text-[#ED1C2E] transition">
              Marketplace
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/" className="hover:text-[#ED1C2E] transition">
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Centered Auth Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-8 px-4 sm:px-6">
        <Outlet />
      </main>

      {/* 3. Minimal Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200/80 bg-white/90 py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold">© {new Date().getFullYear()} BAAPOO MART • BUY INDIAN • BUILD INDIA. All Rights Reserved.</p>
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
            <Link to="/" className="hover:text-[#ED1C2E] transition">Terms of Service</Link>
            <Link to="/" className="hover:text-[#ED1C2E] transition">Privacy Policy</Link>
            <Link to="/" className="hover:text-[#ED1C2E] transition">Merchant Agreement</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayoutWrapper;
