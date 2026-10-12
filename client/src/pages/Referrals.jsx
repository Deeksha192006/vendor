import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Share2,
  Copy,
  Check,
  Award,
  Trophy,
  Coins,
  QrCode,
  Download,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Referrals = () => {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomerReferrals();
  }, []);

  const fetchCustomerReferrals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/referrals/customer-dashboard');
      setData(res.data?.data);
    } catch (e) {
      console.error('Failed to load customer referral data:', e);
      setError(e.response?.data?.message || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const referralCode = data?.referralCode || 'BAAPOOMART';
  const clientUrl = window.location.origin;
  const referralLink = data?.referralLink || `${clientUrl}/register?ref=${referralCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    referralLink
  )}&color=4f46e5&bgcolor=ffffff`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading your referral rewards...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalCustomersReferred: 0,
    qualifiedReferrals: 0,
    totalSuperCoinsEarned: 0,
    currentSuperCoinsBalance: 0,
    rewardPerReferral: 500,
  };

  const history = data?.referralHistory || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-8 rounded-3xl text-white shadow-lg shadow-orange-500/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-black uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" /> One-to-Many Referral Program
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Refer & Earn Super Coins
          </h1>
          <p className="text-amber-100 text-sm sm:text-base max-w-xl">
            Invite your friends and family to BAAPOO MART. Earn <strong className="text-white underline">500 Super Coins</strong> for
            every qualified customer you invite!
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center min-w-[200px]">
          <div className="text-xs font-bold text-amber-100 uppercase tracking-wider">Per Qualified Invite</div>
          <div className="text-3xl font-black text-white mt-1 flex items-center justify-center gap-2">
            <Coins className="w-7 h-7 text-yellow-300" /> +500
          </div>
          <div className="text-[11px] text-amber-200 mt-1 font-semibold">Super Coins Wallet</div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Shareable Link & Referral Code Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 p-7 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Your Shareable Referral Link</h3>
                <p className="text-xs text-slate-500">Invite as many people as you want — no limit on direct referrals</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-slate-50 border border-slate-200 py-3.5 pl-4 pr-10 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none"
              />
            </div>
            <button
              onClick={copyToClipboard}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm whitespace-nowrap ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copied Link!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Referral Link
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Your Referral Code:</span>
              <span className="font-mono font-black text-indigo-600 text-base">{referralCode}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referralCode);
                alert('Referral Code copied: ' + referralCode);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Code
            </button>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <img src={qrCodeUrl} alt="Referral QR Code" className="w-36 h-36 rounded-lg" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900">Scan & Register</div>
            <p className="text-xs text-slate-500 mt-0.5">Show this QR code to friends on their mobile phones</p>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Customers Referred */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Customers Referred</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{stats.totalCustomersReferred}</div>
          <p className="text-[11px] text-slate-400 mt-1">Friends joined with your code</p>
        </div>

        {/* Qualified Referrals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qualified Referrals</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600">{stats.qualifiedReferrals}</div>
          <p className="text-[11px] text-slate-400 mt-1">Met reward eligibility</p>
        </div>

        {/* Total Super Coins Earned */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Coins Earned</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600">{stats.totalSuperCoinsEarned.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-1">500 coins per qualified friend</p>
        </div>

        {/* Current Super Coins Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Wallet Balance</span>
            <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{stats.currentSuperCoinsBalance.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-1">Ready to spend on checkout</p>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Direct Customer Referral History</h3>
            <p className="text-xs text-slate-500">Every qualified direct referral awards exactly 500 Super Coins to your wallet.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {history.length} {history.length === 1 ? 'Customer' : 'Customers'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Referred Customer</th>
                <th className="py-3 px-4">Referral Date</th>
                <th className="py-3 px-4">Qualification Status</th>
                <th className="py-3 px-4">Super Coins Awarded</th>
                <th className="py-3 px-4">Transaction Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No friends referred yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Share your link with friends to earn 500 Super Coins for each!</p>
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{row.referredCustomerName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{row.referralCode}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                      {row.referralDate
                        ? new Date(row.referralDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          row.qualificationStatus === 'QUALIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {row.qualificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-amber-600 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-500" />
                      +{row.superCoinsAwarded || 500} Super Coins
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-emerald-700 font-semibold">
                      {row.rewardTransactionId ? 'CREDITED' : 'COMPLETED'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Referrals;
