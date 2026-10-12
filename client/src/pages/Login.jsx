import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../store/authSlice';
import {
  ShoppingBag,
  Store,
  Crown,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Flag
} from 'lucide-react';
import { motion } from 'framer-motion';
import BrandLogo from '../components/BrandLogo';

export const Login = () => {
  const [activePortal, setActivePortal] = useState('CUSTOMER'); // 'CUSTOMER' | 'VENDOR' | 'SUPER_ADMIN'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
    if (isAuthenticated && user) {
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin/dashboard');
      } else if (user.role === 'VENDOR') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate, dispatch]);

  const portals = [
    { id: 'CUSTOMER', label: 'Customer', icon: ShoppingBag, desc: 'Shopping & Rewards', path: '/customer/login' },
    { id: 'VENDOR', label: 'Vendor', icon: Store, desc: 'Store & Products', path: '/vendor/login' },
    { id: 'SUPER_ADMIN', label: 'Super Admin', icon: Crown, desc: 'Platform Control', path: '/super-admin/login' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    const result = await dispatch(loginUser({ email, password, portal: activePortal }));
    if (!result.error) {
      const u = result.payload.user;
      if (u.role === 'SUPER_ADMIN') navigate('/super-admin/dashboard');
      else if (u.role === 'VENDOR') navigate('/vendor/dashboard');
      else navigate('/customer/dashboard');
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-12 bg-[#FFFFFF]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Logo & Portal Heading */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="mb-3">
            <BrandLogo size="lg" />
          </div>
          <h2 className="text-2xl font-black text-[#222222] tracking-tight">Account Login</h2>
          <p className="text-xs text-slate-500 mt-1">Select your designated portal to sign in to BAAPOO MART</p>
        </div>

        {/* Portal Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {portals.map((p) => {
            const Icon = p.icon;
            const isSelected = activePortal === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePortal(p.id);
                  dispatch(clearAuthError());
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col items-center text-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#ED1C2E] text-white border-[#ED1C2E] shadow-sm shadow-red-500/20'
                    : 'bg-[#F7F7F9] text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold leading-tight">{p.label}</div>
                  <div className={`text-[9px] mt-0.5 leading-tight ${isSelected ? 'text-red-100' : 'text-slate-400'}`}>
                    {p.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-[#ED1C2E] text-xs font-bold"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-[#222222] mb-1.5 uppercase tracking-wider">
              {activePortal === 'VENDOR'
                ? 'Vendor Business Email'
                : activePortal === 'SUPER_ADMIN'
                ? 'Super Admin Email'
                : 'Customer Email'}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#F7F7F9] text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-[#ED1C2E] focus:bg-white transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[#222222] mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F7F7F9] text-xs text-slate-800 rounded-xl px-4 py-2.5 pl-10 border border-slate-200 focus:outline-none focus:border-[#ED1C2E] focus:bg-white transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 rounded-xl bg-[#ED1C2E] hover:bg-[#D91425] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign In to {portals.find((p) => p.id === activePortal)?.label}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-500">
          {activePortal === 'CUSTOMER' && (
            <p>
              New shopper?{' '}
              <Link to="/customer/register" className="text-[#30358F] hover:text-[#ED1C2E] hover:underline font-black">
                Create Free Customer Account
              </Link>
            </p>
          )}
          {activePortal === 'VENDOR' && (
            <p>
              Want to sell on BAAPOO MART?{' '}
              <Link to="/vendor/onboarding" className="text-[#30358F] hover:text-[#ED1C2E] hover:underline font-black">
                Register Your Merchant Store
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
