import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Users,
  Store,
  CreditCard,
  Crown,
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ArrowUpDown,
  History,
  Tag,
  Check,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import api from '../../services/api';

export const SuperAdminSubscriptions = () => {
  // Tab state: 'ALL' | 'CUSTOMER' | 'VENDOR'
  const [activeTab, setActiveTab] = useState('ALL');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Overview KPIs & Analytics Data
  const [overview, setOverview] = useState({
    summaryCards: {
      totalSubscribers: 0,
      activeCustomerSubscriptions: 0,
      activeVendorSubscriptions: 0,
      expiredSubscriptions: 0,
      pendingPayments: 0,
      cancelledSubscriptions: 0,
      totalSubscriptionRevenue: 0,
      customerSubscriptionRevenue: 0,
      vendorSubscriptionRevenue: 0,
    },
    revenueBreakdown: {
      totalRevenue: 0,
      customerRevenue: 0,
      vendorRevenue: 0,
      revenueThisMonth: 0,
      revenueThisQuarter: 0,
      revenueThisYear: 0,
      successfulPurchasesCount: 0,
      pendingPaymentsCount: 0,
      failedPaymentsCount: 0,
      refundsTotal: 0,
    },
    expirySummary: {
      expiringIn7Days: 0,
      expiringIn30Days: 0,
      totalExpired: 0,
    },
  });

  const [analytics, setAnalytics] = useState({
    monthlyRevenue: [],
    planDistribution: [],
    totalActiveSubscribers: 0,
  });

  // Table Subscriptions & Pagination
  const [subscriptions, setSubscriptions] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('');
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [expiryDateFrom, setExpiryDateFrom] = useState('');
  const [expiryDateTo, setExpiryDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Details Modal State
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [selectedSubDetails, setSelectedSubDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Status Change Confirmation Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatusValue, setNewStatusValue] = useState('Active');

  // Notification Toast
  const [toast, setToast] = useState({ type: '', text: '' });

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  };

  // Initial Data Load
  useEffect(() => {
    fetchOverviewAndAnalytics();
  }, []);

  // Fetch Subscriptions when tab or filters change
  useEffect(() => {
    fetchSubscriptionsList();
  }, [
    activeTab,
    statusFilter,
    paymentStatusFilter,
    planFilter,
    startDateFrom,
    startDateTo,
    expiryDateFrom,
    expiryDateTo,
    sortBy,
    sortOrder,
    pagination.page,
  ]);

  const fetchOverviewAndAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, analyticsRes] = await Promise.all([
        api.get('/admin/subscriptions/overview'),
        api.get('/admin/subscriptions/analytics'),
      ]);

      if (overviewRes.data?.data) {
        setOverview(overviewRes.data.data);
      }
      if (analyticsRes.data?.data) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching subscription overview:', err);
      showToast('error', 'Failed to load subscription overview metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionsList = async () => {
    try {
      setTableLoading(true);
      const params = {
        type: activeTab,
        status: statusFilter,
        paymentStatus: paymentStatusFilter,
        search: search.trim() || undefined,
        plan: planFilter.trim() || undefined,
        startDateFrom: startDateFrom || undefined,
        startDateTo: startDateTo || undefined,
        expiryDateFrom: expiryDateFrom || undefined,
        expiryDateTo: expiryDateTo || undefined,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      };

      const res = await api.get('/admin/subscriptions', { params });
      if (res.data?.data) {
        setSubscriptions(res.data.data.subscriptions || []);
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching subscriptions list:', err);
      showToast('error', 'Failed to load subscriptions list');
    } finally {
      setTableLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchSubscriptionsList();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPaymentStatusFilter('ALL');
    setPlanFilter('');
    setStartDateFrom('');
    setStartDateTo('');
    setExpiryDateFrom('');
    setExpiryDateTo('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Open Details Modal
  const handleOpenDetails = async (subId) => {
    try {
      setSelectedSubId(subId);
      setDetailsLoading(true);
      const res = await api.get(`/admin/subscriptions/${subId}`);
      if (res.data?.data) {
        setSelectedSubDetails(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching subscription details:', err);
      showToast('error', 'Failed to load subscription details');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Status Change Confirmation
  const handleUpdateStatusConfirm = async () => {
    if (!selectedSubId) return;
    try {
      setActionLoading(true);
      await api.patch(`/admin/subscriptions/${selectedSubId}/status`, {
        status: newStatusValue,
      });

      showToast('success', `Subscription status successfully updated to ${newStatusValue}`);
      setShowStatusModal(false);
      handleOpenDetails(selectedSubId);
      fetchSubscriptionsList();
      fetchOverviewAndAnalytics();
    } catch (err) {
      console.error('Error updating subscription status:', err);
      showToast('error', err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // CSV Export
  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      const params = new URLSearchParams({
        type: activeTab,
        status: statusFilter,
        search: search.trim(),
      }).toString();

      const response = await api.get(`/admin/subscriptions/export?${params}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BAAPOO_MART_Subscriptions_${activeTab}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast('success', 'Subscription CSV report downloaded successfully');
    } catch (err) {
      console.error('Export error:', err);
      showToast('error', 'Failed to export CSV report');
    } finally {
      setExportLoading(false);
    }
  };

  const summary = overview.summaryCards;
  const revenue = overview.revenueBreakdown;
  const expiry = overview.expirySummary;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-800">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            )}
            <span>{toast.text}</span>
            <button
              onClick={() => setToast({ type: '', text: '' })}
              className="ml-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#30358F] to-[#ED1C2E] flex items-center justify-center text-white shadow-md shadow-[#30358F]/20">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#F7941D] px-2 py-0.5 rounded-md">
                BAAPOO MART CENTRAL HUB
              </span>
              <span className="text-[10px] font-bold text-slate-400">Unified Monitoring Engine</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Subscription Management Overview
            </h1>
            <p className="text-xs text-slate-500">
              Centralized real-time monitoring and analytics for all customer VIP and marketplace vendor subscriptions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
          <button
            onClick={() => {
              fetchOverviewAndAnalytics();
              fetchSubscriptionsList();
            }}
            className="p-3 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition"
            title="Refresh All Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading || tableLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exportLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: TOP 8 SUMMARY CARDS (Section 1 Requirement)  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Subscribers */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Total Subscribers
              </p>
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#30358F] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {summary.totalSubscribers}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Unique customers & vendors</p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 text-[10px] font-bold text-slate-500">
            <span className="text-emerald-600">{summary.activeCustomerSubscriptions + summary.activeVendorSubscriptions} Active</span>
            &bull;
            <span className="text-rose-500">{summary.expiredSubscriptions} Expired</span>
            &bull;
            <span className="text-amber-500">{summary.pendingPayments} Pending</span>
          </div>
        </div>

        {/* Card 2: Active Customer Subscriptions */}
        <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
                Active Customer Subscriptions
              </p>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-indigo-900 mt-1">
              {summary.activeCustomerSubscriptions}
            </h3>
            <p className="text-[10px] text-indigo-500 mt-0.5">Currently valid VIP members</p>
          </div>
          <div className="mt-3 pt-3 border-t border-indigo-50 text-[10px] font-bold text-indigo-600">
            ₹{summary.customerSubscriptionRevenue.toLocaleString('en-IN')} Collected
          </div>
        </div>

        {/* Card 3: Active Vendor Subscriptions */}
        <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold uppercase text-blue-600 tracking-wider">
                Active Vendor Subscriptions
              </p>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-blue-900 mt-1">
              {summary.activeVendorSubscriptions}
            </h3>
            <p className="text-[10px] text-blue-500 mt-0.5">Active merchant storefronts</p>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-50 text-[10px] font-bold text-blue-600">
            ₹{summary.vendorSubscriptionRevenue.toLocaleString('en-IN')} Collected
          </div>
        </div>

        {/* Card 4: Expired Subscriptions */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold uppercase text-rose-600 tracking-wider">
                Expired Subscriptions
              </p>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-rose-900 mt-1">
              {summary.expiredSubscriptions}
            </h3>
            <p className="text-[10px] text-rose-500 mt-0.5">Past validity & needs renewal</p>
          </div>
          <div className="mt-3 pt-3 border-t border-rose-50 text-[10px] font-bold text-rose-600">
            {expiry.expiringIn7Days} Expiring within 7 days
          </div>
        </div>

        {/* Card 5: Pending Payments */}
        <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold uppercase text-amber-600 tracking-wider">
                Pending Payments
              </p>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-amber-900 mt-1">
              {summary.pendingPayments}
            </h3>
            <p className="text-[10px] text-amber-600 mt-0.5">Awaiting gateway confirmation</p>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-50 text-[10px] font-bold text-amber-700">
            Excluded from collected revenue
          </div>
        </div>

        {/* Card 6: Total Subscription Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider">
                Total Subscription Revenue
              </p>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-900 mt-1">
              ₹{summary.totalSubscriptionRevenue.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-emerald-600 mt-0.5">Successfully verified & collected</p>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-50 text-[10px] font-bold text-emerald-700">
            {revenue.successfulPurchasesCount} verified transactions
          </div>
        </div>

        {/* Card 7: Customer Subscription Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold uppercase text-purple-600 tracking-wider">
                Customer Subscription Revenue
              </p>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-purple-900 mt-1">
              ₹{summary.customerSubscriptionRevenue.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-purple-500 mt-0.5">Verified customer VIP purchases</p>
          </div>
          <div className="mt-3 pt-3 border-t border-purple-50 text-[10px] font-bold text-purple-600">
            {summary.activeCustomerSubscriptions} current active VIPs
          </div>
        </div>

        {/* Card 8: Vendor Subscription Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-[#ED1C2E]/20 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-bold uppercase text-[#ED1C2E] tracking-wider">
                Vendor Subscription Revenue
              </p>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#ED1C2E] flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-[#ED1C2E] mt-1">
              ₹{summary.vendorSubscriptionRevenue.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-rose-500 mt-0.5">Verified merchant plan fees</p>
          </div>
          <div className="mt-3 pt-3 border-t border-rose-50 text-[10px] font-bold text-[#ED1C2E]">
            {summary.activeVendorSubscriptions} current active merchants
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 6: REVENUE ANALYTICS & CHARTS                     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Revenue Over Time (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#ED1C2E]" />
                <h3 className="text-base font-black text-slate-900">
                  Customer vs. Vendor Revenue Over Time
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Verified collections breakdown across the last 6 months.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-purple-700">
                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" /> Customer
              </span>
              <span className="flex items-center gap-1.5 text-[#ED1C2E]">
                <span className="w-3 h-3 rounded-full bg-[#ED1C2E] inline-block" /> Vendor
              </span>
            </div>
          </div>

          {/* Custom SVG / Bar Chart Representation */}
          <div className="pt-4">
            <div className="h-56 flex items-end gap-3 sm:gap-6 border-b border-slate-100 pb-2">
              {analytics.monthlyRevenue.map((item, idx) => {
                const maxRev = Math.max(
                  ...analytics.monthlyRevenue.map((m) => m.totalRevenue),
                  1000
                );
                const custHeight = Math.max(6, (item.customerRevenue / maxRev) * 160);
                const vendHeight = Math.max(6, (item.vendorRevenue / maxRev) * 160);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[10px] font-black text-slate-800 opacity-0 group-hover:opacity-100 transition">
                      ₹{item.totalRevenue}
                    </div>
                    <div className="w-full flex items-end justify-center gap-1">
                      {/* Customer Bar */}
                      <div
                        style={{ height: `${custHeight}px` }}
                        className="w-1/2 max-w-[20px] bg-purple-600 rounded-t-md transition-all hover:bg-purple-700"
                        title={`Customer: ₹${item.customerRevenue}`}
                      />
                      {/* Vendor Bar */}
                      <div
                        style={{ height: `${vendHeight}px` }}
                        className="w-1/2 max-w-[20px] bg-[#ED1C2E] rounded-t-md transition-all hover:bg-rose-700"
                        title={`Vendor: ₹${item.vendorRevenue}`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-full">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Milestones Footer */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">This Month</span>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                ₹{revenue.revenueThisMonth.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">This Quarter</span>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                ₹{revenue.revenueThisQuarter.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">This Year</span>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                ₹{revenue.revenueThisYear.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Active Plan Distribution (1 Col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#30358F]" />
              <h3 className="text-base font-black text-slate-900">
                Active Subscriptions by Plan
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Distribution of current active subscribers across plans.
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {analytics.planDistribution.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active subscriptions currently.
              </div>
            ) : (
              analytics.planDistribution.map((item, idx) => {
                const total = analytics.totalActiveSubscribers || 1;
                const pct = Math.round((item.count / total) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="truncate max-w-[180px]">{item.name}</span>
                      <span>{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${
                          item.name.includes('Cust')
                            ? 'bg-purple-600'
                            : 'bg-gradient-to-r from-[#ED1C2E] to-[#F7941D]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">Total Active Subscriptions</span>
            <span className="font-black text-slate-900">{analytics.totalActiveSubscribers}</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 7: EXPIRY MONITORING QUICK FILTER STRIP         */}
      {/* ======================================================== */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
            Subscription Expiry Attention:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-bold">
          <button
            onClick={() => {
              setStatusFilter('Active');
              const now = new Date();
              const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              setExpiryDateFrom(now.toISOString().split('T')[0]);
              setExpiryDateTo(in7.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
          >
            Expiring in 7 Days ({expiry.expiringIn7Days})
          </button>

          <button
            onClick={() => {
              setStatusFilter('Active');
              const now = new Date();
              const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              setExpiryDateFrom(now.toISOString().split('T')[0]);
              setExpiryDateTo(in30.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition"
          >
            Expiring in 30 Days ({expiry.expiringIn30Days})
          </button>

          <button
            onClick={() => setStatusFilter('Expired')}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition"
          >
            Recently Expired ({expiry.totalExpired})
          </button>

          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            Clear Date Filters
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: THREE TABS (All, Customer, Vendor)           */}
      {/* ======================================================== */}
      <div className="space-y-4">
        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 gap-8 text-sm font-bold">
          <button
            onClick={() => {
              setActiveTab('ALL');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'ALL'
                ? 'border-[#ED1C2E] text-[#ED1C2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Tab A: All Subscriptions ({summary.totalSubscribers} Subscribers)
          </button>

          <button
            onClick={() => {
              setActiveTab('CUSTOMER');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'CUSTOMER'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Crown className="w-4 h-4" />
            Tab B: Customer Subscriptions ({summary.activeCustomerSubscriptions} Active)
          </button>

          <button
            onClick={() => {
              setActiveTab('VENDOR');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'VENDOR'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            Tab C: Vendor Subscriptions ({summary.activeVendorSubscriptions} Active)
          </button>
        </div>

        {/* ======================================================== */}
        {/* SECTION 3: SEARCH & FILTER CONTROLS                      */}
        {/* ======================================================== */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by subscriber name, email, store name, plan, transaction ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#30358F]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-transparent focus:outline-none font-bold text-slate-900 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Payment:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-transparent focus:outline-none font-bold text-slate-900 cursor-pointer"
              >
                <option value="ALL">All Payments</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending Payment</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent focus:outline-none font-bold text-slate-900 cursor-pointer"
              >
                <option value="createdAt">Date Created</option>
                <option value="expiryDate">Expiry Date</option>
                <option value="amount">Amount (Price)</option>
                <option value="name">Subscriber Name</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="ml-1 text-[10px] uppercase font-black text-[#30358F]"
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[#30358F] text-white font-bold rounded-xl text-xs shadow-xs hover:bg-[#252a73] transition"
            >
              Search
            </button>

            {(search || statusFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || startDateFrom || expiryDateFrom) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 underline ml-1"
              >
                Reset
              </button>
            )}
          </form>

          {/* Date Range Controls Strip */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Start Date:</span>
              <input
                type="date"
                value={startDateFrom}
                onChange={(e) => setStartDateFrom(e.target.value)}
                className="px-2 py-1 bg-slate-50 border rounded-lg text-xs"
              />
              <span>to</span>
              <input
                type="date"
                value={startDateTo}
                onChange={(e) => setStartDateTo(e.target.value)}
                className="px-2 py-1 bg-slate-50 border rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Expiry Date:</span>
              <input
                type="date"
                value={expiryDateFrom}
                onChange={(e) => setExpiryDateFrom(e.target.value)}
                className="px-2 py-1 bg-slate-50 border rounded-lg text-xs"
              />
              <span>to</span>
              <input
                type="date"
                value={expiryDateTo}
                onChange={(e) => setExpiryDateTo(e.target.value)}
                className="px-2 py-1 bg-slate-50 border rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SUBSCRIPTIONS DATA TABLE                                 */}
        {/* ======================================================== */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {tableLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-[#ED1C2E] animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading subscriptions data...</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-black text-slate-700">No Subscription Records Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No subscription records match your current filter criteria.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Subscriber</th>
                    <th className="py-4 px-4 text-center">Type</th>
                    <th className="py-4 px-4">Plan & Duration</th>
                    <th className="py-4 px-4">Amount Paid</th>
                    <th className="py-4 px-4">Start Date</th>
                    <th className="py-4 px-4">Expiry Date</th>
                    <th className="py-4 px-4 text-center">Payment Status</th>
                    <th className="py-4 px-4 text-center">Subscription Status</th>
                    <th className="py-4 px-4">Transaction ID</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {subscriptions.map((sub) => {
                    const isCustomer = sub.subscriberType === 'CUSTOMER';
                    const isActive = sub.subscriptionStatus === 'Active' || sub.subscriptionStatus === 'ACTIVE';
                    const isExpired = sub.subscriptionStatus === 'Expired' || sub.remainingDays === 0;

                    return (
                      <tr key={sub._id} className="hover:bg-slate-50/80 transition group">
                        {/* Subscriber Name & Email */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black ${
                                isCustomer
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {isCustomer ? <Crown className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 group-hover:text-[#30358F] transition">
                                {sub.subscriberName}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {sub.subscriberEmail}
                              </div>
                              {sub.businessName && (
                                <div className="text-[10px] text-blue-600 font-bold">
                                  Store: {sub.businessName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Subscriber Type Badge */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isCustomer
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isCustomer ? 'Customer' : 'Vendor'}
                          </span>
                        </td>

                        {/* Plan Name & Duration */}
                        <td className="py-4 px-4">
                          <div className="font-extrabold text-slate-900">{sub.planName}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">
                            Duration: {sub.duration}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 font-black text-slate-900 text-sm">
                          ₹{sub.amount?.toLocaleString('en-IN')}
                        </td>

                        {/* Start Date */}
                        <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                          {sub.startDate ? new Date(sub.startDate).toLocaleDateString('en-IN') : 'N/A'}
                        </td>

                        {/* Expiry Date */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 font-mono text-[11px]">
                            {sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
                          </div>
                          {isActive && (
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                                sub.remainingDays <= 7
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {sub.remainingDays} days left
                            </span>
                          )}
                        </td>

                        {/* Payment Status */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              sub.paymentStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sub.paymentStatus === 'Pending Payment'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {sub.paymentStatus}
                          </span>
                        </td>

                        {/* Subscription Status */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isExpired
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500' : isExpired ? 'bg-rose-500' : 'bg-slate-400'
                              }`}
                            />
                            {sub.subscriptionStatus}
                          </span>
                        </td>

                        {/* Transaction ID */}
                        <td className="py-4 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[140px]" title={sub.transactionId}>
                          {sub.transactionId || 'N/A'}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleOpenDetails(sub._id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-[#30358F] hover:text-white text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50/75 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
            <div>
              Showing <strong>{subscriptions.length}</strong> of <strong>{pagination.total}</strong> records
              (Page {pagination.page} of {pagination.totalPages})
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Previous
              </button>
              <span className="font-bold text-slate-800">{pagination.page}</span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold disabled:opacity-40 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 4: SUBSCRIPTION DETAILS DRAWER / MODAL           */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedSubId && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-6 max-h-[90vh] overflow-y-auto relative"
            >
              <button
                onClick={() => {
                  setSelectedSubId(null);
                  setSelectedSubDetails(null);
                }}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {detailsLoading || !selectedSubDetails ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-[#ED1C2E] animate-spin" />
                  <p className="text-xs font-bold text-slate-500">Loading subscription audit history...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Header */}
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                        selectedSubDetails.subscriberType === 'CUSTOMER'
                          ? 'bg-purple-600'
                          : 'bg-[#30358F]'
                      }`}
                    >
                      {selectedSubDetails.subscriberType === 'CUSTOMER' ? (
                        <Crown className="w-6 h-6" />
                      ) : (
                        <Store className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            selectedSubDetails.subscriberType === 'CUSTOMER'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {selectedSubDetails.subscriberType} SUBSCRIPTION
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ID: {selectedSubDetails.subscription._id}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mt-0.5">
                        {selectedSubDetails.subscription.planName}
                      </h3>
                    </div>
                  </div>

                  {/* 1. Subscriber Information */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Subscriber Profile
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400">Subscriber Name:</span>
                        <div className="font-extrabold text-slate-800">
                          {selectedSubDetails.subscription.subscriberName}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Email Address:</span>
                        <div className="font-bold text-slate-800 font-mono">
                          {selectedSubDetails.subscription.subscriberEmail}
                        </div>
                      </div>
                      {selectedSubDetails.subscription.businessName && (
                        <div>
                          <span className="text-slate-400">Store / Business:</span>
                          <div className="font-extrabold text-blue-700">
                            {selectedSubDetails.subscription.businessName}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Subscriber ID:</span>
                        <div className="font-mono text-slate-600 truncate">
                          {selectedSubDetails.subscription.subscriberId}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Subscription Details */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Subscription Plan & Validity
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400">Plan Duration:</span>
                        <div className="font-bold text-slate-800">
                          {selectedSubDetails.subscription.duration}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Subscription Status:</span>
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              selectedSubDetails.subscription.subscriptionStatus === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {selectedSubDetails.subscription.subscriptionStatus}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Remaining Days:</span>
                        <div className="font-black text-[#30358F]">
                          {selectedSubDetails.subscription.remainingDays} Days
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Start Date:</span>
                        <div className="font-bold text-slate-800 font-mono">
                          {new Date(selectedSubDetails.subscription.startDate).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Expiry Date:</span>
                        <div className="font-bold text-slate-800 font-mono">
                          {new Date(selectedSubDetails.subscription.expiryDate).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Amount Paid:</span>
                        <div className="font-black text-slate-900 text-sm">
                          ₹{selectedSubDetails.subscription.amount?.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Payment Information */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Payment Verification Ledger
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400">Transaction ID:</span>
                        <div className="font-mono font-bold text-slate-800 break-all">
                          {selectedSubDetails.subscription.transactionId}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Payment Status:</span>
                        <div className="font-black text-emerald-700">
                          {selectedSubDetails.subscription.paymentStatus}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Relevant User Subscription History */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-500" />
                      <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider">
                        Subscriber History ({selectedSubDetails.history?.length || 0} Records)
                      </h4>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {selectedSubDetails.history?.map((h, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{h.planName}</span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {new Date(h.startDate).toLocaleDateString('en-IN')} &rarr;{' '}
                              {new Date(h.expiryDate).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900">₹{h.amount}</span>
                            <div>
                              <span
                                className={`text-[9px] font-black uppercase ${
                                  h.subscriptionStatus === 'Active'
                                    ? 'text-emerald-600'
                                    : 'text-slate-500'
                                }`}
                              >
                                {h.subscriptionStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer & Status Adjustment Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setNewStatusValue(
                          selectedSubDetails.subscription.subscriptionStatus === 'Active'
                            ? 'Cancelled'
                            : 'Active'
                        );
                        setShowStatusModal(true);
                      }}
                      className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition"
                    >
                      Adjust Subscription Status
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSubId(null);
                        setSelectedSubDetails(null);
                      }}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold ml-auto"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* STATUS CHANGE CONFIRMATION DIALOG (Section 5 Requirement) */}
      {/* ======================================================== */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                Adjust Subscription Status?
              </h3>
              <p className="text-xs text-slate-500">
                Select the new status for this subscription. Deactivating or adjusting this subscription record will not alter original historical transaction amounts.
              </p>

              <div className="pt-2">
                <select
                  value={newStatusValue}
                  onChange={(e) => setNewStatusValue(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="Active">Active</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Expired">Expired</option>
                  <option value="Pending Payment">Pending Payment</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleUpdateStatusConfirm}
                className="flex-1 py-2.5 bg-[#30358F] hover:bg-[#252a73] text-white font-black rounded-xl text-xs shadow-md transition"
              >
                {actionLoading ? 'Saving...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminSubscriptions;
