import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Loader2,
  Users,
  Network,
  Copy,
  CheckCircle2,
  AlertCircle,
  Share2,
  Award,
  DollarSign,
  TrendingUp,
  Clock,
  Building2,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const VendorNetworkDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVendorReferrals();
  }, []);

  const fetchVendorReferrals = async () => {
    setLoading(true);
    setError('');
    try {
      // First try dedicated vendor dashboard endpoint
      const res = await api.get('/referrals/vendor-dashboard').catch(async () => {
        return await api.get('/vendor/referral/vendor-mlm');
      });
      setData(res.data?.data);
    } catch (e) {
      console.error('Failed to load vendor referral metrics:', e);
      setError(e.response?.data?.message || 'Failed to load referral metrics');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading vendor referral metrics...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalVendorsReferred: 0,
    qualifiedReferrals: 0,
    pendingCommissions: 0,
    earnedCommissions: 0,
    paidCommissions: 0,
    commissionRate: '10%',
  };

  const history = data?.referralHistory || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Refer a Vendor</h1>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> 10% Direct Commission
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Invite fellow vendors to BAAPOO MART and earn 10% cash commission on every eligible subscription plan they purchase.
            </p>
          </div>
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
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-600" />
              <span>Shareable Vendor Referral Link</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Unlimited Direct Referrals</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Send this exclusive link to merchants. When they register and activate their vendor subscription plan, 10%
            direct commission is instantly credited to your wallet balance.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-3">
            <div className="relative w-full">
              <input
                type="text"
                readOnly
                value={data?.referralLink || ''}
                className="w-full bg-slate-50 border border-slate-200 py-3 pl-4 pr-10 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none"
              />
            </div>
            <button
              onClick={copyToClipboard}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm whitespace-nowrap ${
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

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Direct Vendor Referral Code:</span>
            <span className="font-mono font-bold text-indigo-600 text-sm">{data?.referralCode}</span>
          </div>
        </div>

        {/* 10% Commission Highlights */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4" /> Earning Rules
            </div>
            <h4 className="text-xl font-black text-white">10% Direct Commission</h4>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Earn a fixed 10% commission on every successfully paid vendor subscription plan from your direct referrals.
              No multi-level deductions or limits on direct partners.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-indigo-800/80 flex items-center justify-between text-xs text-indigo-200">
            <span>Commission Rate:</span>
            <span className="font-bold text-white text-base">10.0% Fixed</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Vendors Referred */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Vendors Referred</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{stats.totalVendorsReferred}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total registered referrals</p>
        </div>

        {/* Qualified Referrals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Qualified</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600">{stats.qualifiedReferrals}</div>
          <p className="text-[11px] text-slate-400 mt-1">Subscribed vendors</p>
        </div>

        {/* Pending Commissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600">₹{stats.pendingCommissions.toLocaleString('en-IN')}</div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting plan payment</p>
        </div>

        {/* Earned Commissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Earned Commissions</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-violet-700">₹{stats.earnedCommissions.toLocaleString('en-IN')}</div>
          <p className="text-[11px] text-slate-400 mt-1">10% of paid plans</p>
        </div>

        {/* Paid Commissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Paid Out</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-teal-700">₹{stats.paidCommissions.toLocaleString('en-IN')}</div>
          <p className="text-[11px] text-slate-400 mt-1">Credited to wallet</p>
        </div>
      </div>

      {/* Referral History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Direct Vendor Referral History</h3>
            <p className="text-xs text-slate-500">Track all direct vendors you have invited and their subscription details.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {history.length} {history.length === 1 ? 'Vendor' : 'Vendors'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Referred Vendor</th>
                <th className="py-3 px-4">Store Name</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4">Subscription Fee</th>
                <th className="py-3 px-4">Commission (10%)</th>
                <th className="py-3 px-4">Qualification</th>
                <th className="py-3 px-4">Payout Status</th>
                <th className="py-3 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No vendors referred yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Share your referral link above to start earning 10% commissions!</p>
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{row.referredVendorName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{row.referralCode}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{row.storeName || '—'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{row.planPurchased}</td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      ₹{row.subscriptionAmount ? row.subscriptionAmount.toLocaleString('en-IN') : '0'}
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-600">
                      ₹{row.commissionEarned ? row.commissionEarned.toLocaleString('en-IN') : '0'}
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
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          row.commissionStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : row.commissionStatus === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {row.commissionStatus}
                      </span>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default VendorNetworkDashboard;
