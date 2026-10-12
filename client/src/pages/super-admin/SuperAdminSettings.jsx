import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  AlertTriangle,
  Save,
  Power,
  Shield,
  Coins,
  Lock,
  CheckCircle,
  X,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminSettings = () => {
  const [settings, setSettings] = useState({
    PLATFORM_NAME: 'FairKart',
    PLATFORM_TAGLINE: 'Shop. Earn. Refer. Win.',
    SUPPORT_EMAIL: 'support@fairkart.dev',
    BASE_COMMISSION_PERCENTAGE: 10,
    REFERRAL_COMMISSION_L1: 5,
    REFERRAL_COMMISSION_L2: 3,
    REFERRAL_COMMISSION_L3: 2,
    FAIR_COINS_SIGNUP_BONUS: 500,
    FAIR_COINS_REFERRAL_BONUS: 200,
    FAIR_COINS_REDEMPTION_LIMIT_PERCENT: 50,
    FAIR_COINS_PER_RUPEE: 10,
    MAINTENANCE_MODE: false,
    ALLOW_USER_REGISTRATION: true,
    ALLOW_VENDOR_ONBOARDING: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false);
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await superAdminService.getSettings();
      if (data?.settings) {
        setSettings((prev) => ({
          ...prev,
          ...data.settings,
          MAINTENANCE_MODE: Boolean(data.settings.MAINTENANCE_MODE === true || data.settings.MAINTENANCE_MODE === 'true'),
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await superAdminService.updateSettings(settings);
      setSuccessMsg('System configuration saved and synced across cluster.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceToggleClick = () => {
    setPendingMaintenanceState(!settings.MAINTENANCE_MODE);
    setMaintenanceConfirmOpen(true);
  };

  const confirmMaintenanceToggle = async () => {
    try {
      setSaving(true);
      setError('');
      const res = await superAdminService.toggleMaintenanceMode(pendingMaintenanceState);
      setSettings((prev) => ({ ...prev, MAINTENANCE_MODE: res.isMaintenanceMode }));
      setSuccessMsg(`Maintenance Mode is now ${res.isMaintenanceMode ? 'ENABLED' : 'DISABLED'}`);
      setMaintenanceConfirmOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle maintenance mode');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-5xl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Settings className="w-5 h-5" />
            </span>
            Platform & Security Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global governance parameters, economic reward ratios, platform flags, and maintenance controls.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all w-fit"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </motion.button>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between font-medium">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
        </motion.div>
      )}

      {successMsg && (
        <motion.div variants={itemVariants} className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 font-bold">✕</button>
        </motion.div>
      )}

      {/* Maintenance Mode Banner / Control */}
      <motion.div
        variants={itemVariants}
        className={`p-6 rounded-3xl border transition-all ${
          settings.MAINTENANCE_MODE
            ? 'bg-rose-50/80 border-rose-200 shadow-sm'
            : 'bg-white border-slate-200/80 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-2xl ${
                settings.MAINTENANCE_MODE ? 'bg-rose-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}
            >
              <Power className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">System Maintenance Mode</h3>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    settings.MAINTENANCE_MODE
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {settings.MAINTENANCE_MODE ? 'ACTIVE (BLOCKING USERS)' : 'OFF (NORMAL TRAFFIC)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                When enabled, all incoming public and user customer requests receive a 503 Maintenance notice. Super Admins bypass this block automatically to perform maintenance.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleMaintenanceToggleClick}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
              settings.MAINTENANCE_MODE
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {settings.MAINTENANCE_MODE ? 'Deactivate Maintenance' : 'Activate Maintenance'}
          </motion.button>
        </div>
      </motion.div>

      {/* Settings Form Grid */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: General Platform Details */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" /> Platform Identity & Contact
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Platform Title / Brand</label>
              <input
                type="text"
                value={settings.PLATFORM_NAME || ''}
                onChange={(e) => setSettings({ ...settings, PLATFORM_NAME: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Platform Tagline</label>
              <input
                type="text"
                value={settings.PLATFORM_TAGLINE || ''}
                onChange={(e) => setSettings({ ...settings, PLATFORM_TAGLINE: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Official Support Email</label>
              <input
                type="email"
                value={settings.SUPPORT_EMAIL || ''}
                onChange={(e) => setSettings({ ...settings, SUPPORT_EMAIL: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Section 2: Fair Coins & Referral Commissions */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-blue-600" /> Fair Coins & Referral Ratios
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Base Platform Fee (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.BASE_COMMISSION_PERCENTAGE || ''}
                onChange={(e) => setSettings({ ...settings, BASE_COMMISSION_PERCENTAGE: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Referral Level 1 Commission (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.REFERRAL_COMMISSION_L1 || ''}
                onChange={(e) => setSettings({ ...settings, REFERRAL_COMMISSION_L1: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Referral Level 2 Commission (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.REFERRAL_COMMISSION_L2 || ''}
                onChange={(e) => setSettings({ ...settings, REFERRAL_COMMISSION_L2: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Signup Bonus (Coins)</label>
              <input
                type="number"
                min="0"
                value={settings.FAIR_COINS_SIGNUP_BONUS || ''}
                onChange={(e) => setSettings({ ...settings, FAIR_COINS_SIGNUP_BONUS: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Referral Reward (Coins)</label>
              <input
                type="number"
                min="0"
                value={settings.FAIR_COINS_REFERRAL_BONUS || ''}
                onChange={(e) => setSettings({ ...settings, FAIR_COINS_REFERRAL_BONUS: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="md:col-span-3 bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                    Fair Coins Conversion Rate (Coins per ₹1)
                  </label>
                  <p className="text-[11px] text-amber-700">
                    Defines how many Fair Coins equal ₹1. E.g., setting to 10 means 10 Fair Coins = ₹1 (100 Coins = ₹10). Super Admin can edit this authority setting anytime and it will instantly reflect across customer wallets and checkout.
                  </p>
                </div>
                <div className="w-32 flex-shrink-0">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={settings.FAIR_COINS_PER_RUPEE || 10}
                    onChange={(e) => setSettings({ ...settings, FAIR_COINS_PER_RUPEE: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-black text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-3 py-1.5 rounded-xl flex items-center justify-between">
                <span>Current Active Rule:</span>
                <span className="font-mono font-black">
                  {settings.FAIR_COINS_PER_RUPEE || 10} Fair Coins = ₹1 (1 Coin = ₹{(1 / (settings.FAIR_COINS_PER_RUPEE || 10)).toFixed(2)})
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 3: Feature Toggles */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" /> Platform Registration Feature Flags
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Allow Customer Self-Registration</p>
                <p className="text-[11px] text-slate-500">Permit new users to register via /register</p>
              </div>
              <input
                type="checkbox"
                checked={settings.ALLOW_USER_REGISTRATION !== false}
                onChange={(e) => setSettings({ ...settings, ALLOW_USER_REGISTRATION: e.target.checked })}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Allow Vendor Onboarding</p>
                <p className="text-[11px] text-slate-500">Accept vendor merchant registration submissions</p>
              </div>
              <input
                type="checkbox"
                checked={settings.ALLOW_VENDOR_ONBOARDING !== false}
                onChange={(e) => setSettings({ ...settings, ALLOW_VENDOR_ONBOARDING: e.target.checked })}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </motion.div>

        {/* Section 4: Homepage Showcase Banners & Top Selling Sections Controls */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" /> Homepage Banners & Top Selling Showcase Control
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Super Admin Authority
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Flash Sale Banner Config */}
            <div className="p-4 bg-gradient-to-r from-rose-50/70 to-amber-50/70 border border-rose-200 rounded-2xl space-y-3">
              <div className="font-bold text-rose-900 text-xs uppercase tracking-wider">Top Flash Sale Banner Configuration</div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Banner Badge Text</label>
                  <input
                    type="text"
                    value={settings.BANNER_FLASH_SALE_BADGE || 'LIMITED TIME FLASH SALE'}
                    onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_BADGE: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Banner Main Title</label>
                  <input
                    type="text"
                    value={settings.BANNER_FLASH_SALE_TITLE || 'Supercharged Deals • Up to 65% OFF'}
                    onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_TITLE: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Banner Subtitle Description</label>
                  <input
                    type="text"
                    value={settings.BANNER_FLASH_SALE_SUBTITLE || 'Verified genuine products. Extra 2X Fair Coins credited instantly to your wallet.'}
                    onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_SUBTITLE: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Button Label</label>
                  <input
                    type="text"
                    value={settings.BANNER_FLASH_SALE_BUTTON_TEXT || 'VIEW FLASH DEALS'}
                    onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_BUTTON_TEXT: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Button Destination Link</label>
                  <input
                    type="text"
                    value={settings.BANNER_FLASH_SALE_BUTTON_LINK || '/products'}
                    onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_BUTTON_LINK: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                {/* Timer Controls */}
                <div className="md:col-span-2 pt-1 border-t border-rose-200/60">
                  <label className="block text-slate-700 font-semibold mb-1">Countdown Timer Duration (HH : MM : SS)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      placeholder="Hours"
                      value={settings.BANNER_FLASH_SALE_HOURS ?? 8}
                      onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_HOURS: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-center font-mono font-bold"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Minutes"
                      value={settings.BANNER_FLASH_SALE_MINUTES ?? 21}
                      onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_MINUTES: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-center font-mono font-bold"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Seconds"
                      value={settings.BANNER_FLASH_SALE_SECONDS ?? 52}
                      onChange={(e) => setSettings({ ...settings, BANNER_FLASH_SALE_SECONDS: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-center font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Selling Sections Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Top Selling Products Section</span>
                  <input
                    type="checkbox"
                    checked={settings.SHOW_TOP_SELLING_PRODUCTS !== 'false' && settings.SHOW_TOP_SELLING_PRODUCTS !== false}
                    onChange={(e) => setSettings({ ...settings, SHOW_TOP_SELLING_PRODUCTS: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Section Title"
                  value={settings.TOP_SELLING_PRODUCTS_TITLE || 'Top Selling Products & Featured Marketplace Picks'}
                  onChange={(e) => setSettings({ ...settings, TOP_SELLING_PRODUCTS_TITLE: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Top Selling Brands Section</span>
                  <input
                    type="checkbox"
                    checked={settings.SHOW_TOP_SELLING_BRANDS !== 'false' && settings.SHOW_TOP_SELLING_BRANDS !== false}
                    onChange={(e) => setSettings({ ...settings, SHOW_TOP_SELLING_BRANDS: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Section Title"
                  value={settings.TOP_SELLING_BRANDS_TITLE || 'Top Selling Brands'}
                  onChange={(e) => setSettings({ ...settings, TOP_SELLING_BRANDS_TITLE: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Top Verified Sellers Section</span>
                  <input
                    type="checkbox"
                    checked={settings.SHOW_TOP_SELLERS !== 'false' && settings.SHOW_TOP_SELLERS !== false}
                    onChange={(e) => setSettings({ ...settings, SHOW_TOP_SELLERS: e.target.checked })}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Section Title"
                  value={settings.TOP_SELLERS_TITLE || 'Top Verified Sellers & Merchants'}
                  onChange={(e) => setSettings({ ...settings, TOP_SELLERS_TITLE: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </form>

      {/* Confirmation Modal for Maintenance Mode */}
      <AnimatePresence>
        {maintenanceConfirmOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-sm p-6 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {pendingMaintenanceState ? 'Activate Maintenance Mode?' : 'Deactivate Maintenance Mode?'}
              </h3>
              <p className="text-xs text-slate-500">
                {pendingMaintenanceState
                  ? 'All normal customer traffic and store orders will be blocked with a 503 Maintenance page. You will still have full access.'
                  : 'The platform will immediately resume serving live traffic to all customers and vendors.'}
              </p>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMaintenanceConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmMaintenanceToggle}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl text-white font-bold text-xs transition-colors ${
                    pendingMaintenanceState ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {saving ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SuperAdminSettings;
