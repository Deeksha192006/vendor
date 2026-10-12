import React, { useState, useEffect } from 'react';
import {
  Percent,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Store,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  Check,
  X,
  CreditCard
} from 'lucide-react';
import api from '../../services/api';

const DATE_RANGES = [
  { label: 'Today', value: 'TODAY' },
  { label: 'Last 7 Days', value: 'LAST_7_DAYS' },
  { label: 'Last 30 Days', value: 'LAST_30_DAYS' },
  { label: 'This Month', value: 'THIS_MONTH' },
  { label: 'Custom', value: 'CUSTOM' },
];

export const SuperAdminCommissions = () => {
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'settlements' | 'vendors'
  const [dateRange, setDateRange] = useState('THIS_MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Overview metrics state (7 KPI summary cards)
  const [metrics, setMetrics] = useState({
    totalVendorProductSales: 0,
    totalCommissionEarned: 0,
    commissionPendingDelivery: 0,
    commissionEligibleForSettlement: 0,
    totalVendorPayables: 0,
    totalVendorPayoutsCompleted: 0,
    totalRefundsReversals: 0,
  });

  // Transactions table state
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 25 });
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('ALL');
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('ALL');

  // Settlements ledger state
  const [settlements, setSettlements] = useState([]);
  const [settlementStatusTab, setSettlementStatusTab] = useState('ALL');

  // Vendor summary state
  const [vendorSummaries, setVendorSummaries] = useState([]);

  // Payout action modal state
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [payoutRefInput, setPayoutRefInput] = useState('');
  const [payoutNotesInput, setPayoutNotesInput] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Fetch overview KPI cards
  const fetchOverview = async () => {
    try {
      const params = { range: dateRange };
      if (dateRange === 'CUSTOM') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await api.get('/admin/commissions/overview', { params });
      if (res.data?.data) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch commission overview:', err);
    }
  };

  // Fetch line-item transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        range: dateRange,
        page,
        limit: 25,
        search,
        vendorId: vendorFilter,
        productName: productFilter,
        orderId: orderIdFilter,
        paymentStatus: paymentStatusFilter,
        deliveryStatus: deliveryStatusFilter,
        settlementStatus: settlementStatusFilter,
      };
      if (dateRange === 'CUSTOM') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await api.get('/admin/commissions', { params });
      if (res.data?.data) {
        setTransactions(res.data.data.transactions || []);
        setPagination(res.data.data.pagination || { total: 0, pages: 1, limit: 25 });
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch settlements
  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const params = {
        status: settlementStatusTab === 'ALL' ? undefined : settlementStatusTab,
      };
      const res = await api.get('/admin/platform-settlements', { params });
      if (res.data?.data) {
        setSettlements(res.data.data.settlements || []);
      }
    } catch (err) {
      console.error('Failed to fetch settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendor-wise summary
  const fetchVendorSummaries = async () => {
    try {
      setLoading(true);
      const params = { range: dateRange };
      if (dateRange === 'CUSTOM') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await api.get('/admin/commissions/vendors', { params });
      if (res.data?.data) {
        setVendorSummaries(res.data.data.vendors || []);
      }
    } catch (err) {
      console.error('Failed to fetch vendor summaries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    if (activeTab === 'transactions') {
      fetchTransactions();
    } else if (activeTab === 'settlements') {
      fetchSettlements();
    } else if (activeTab === 'vendors') {
      fetchVendorSummaries();
    }
  }, [
    activeTab,
    dateRange,
    startDate,
    endDate,
    page,
    paymentStatusFilter,
    deliveryStatusFilter,
    settlementStatusFilter,
    settlementStatusTab,
  ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  // CSV Export
  const handleExportCsv = () => {
    const params = new URLSearchParams({ range: dateRange });
    if (dateRange === 'CUSTOM') {
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
    }
    window.open(`/api/admin/commissions/export?${params.toString()}`, '_blank');
  };

  // Approve settlement -> PROCESSING
  const handleApproveSettlement = async (settlementId) => {
    try {
      setActionError('');
      await api.post(`/admin/platform-settlements/${settlementId}/approve`);
      setActionSuccess('Settlement marked as PROCESSING for vendor payout.');
      fetchSettlements();
      fetchOverview();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to approve settlement');
    }
  };

  // Initiate payout modal
  const openPayoutModal = (settlement) => {
    setSelectedSettlement(settlement);
    setPayoutRefInput(`PAY-BM-${Date.now().toString().slice(-6)}`);
    setPayoutNotesInput('');
    setPayoutModalOpen(true);
  };

  // Submit vendor payout -> PAID
  const handleConfirmPayout = async () => {
    if (!selectedSettlement) return;
    try {
      setPayoutSubmitting(true);
      setActionError('');
      await api.post(`/admin/platform-settlements/${selectedSettlement._id}/payout`, {
        payoutReference: payoutRefInput,
        notes: payoutNotesInput,
      });
      setActionSuccess(`Vendor payout of ₹${selectedSettlement.netPayable} recorded successfully.`);
      setPayoutModalOpen(false);
      fetchSettlements();
      fetchOverview();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || 'Failed to process vendor payout');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const getSettlementBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3" /> Paid Out</span>;
      case 'ELIGIBLE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Check className="w-3 h-3" /> Eligible for Settlement</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800"><RefreshCw className="w-3 h-3 animate-spin" /> Payout Processing</span>;
      case 'PENDING_DELIVERY':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending Delivery</span>;
      case 'ON_HOLD':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">On Hold</span>;
      case 'REVERSED':
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><RotateCcw className="w-3 h-3" /> {status}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Date Range Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ED1C2E] to-[#F7941D] text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Platform Commission Management
              </h1>
              <p className="text-xs text-slate-500">
                Fixed 5% platform commission accounting, vendor earnings ledger, and settlement controls.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/70">
            {DATE_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  setDateRange(r.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateRange === r.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {dateRange === 'CUSTOM' && (
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs bg-transparent px-2 py-1 outline-none text-slate-700"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs bg-transparent px-2 py-1 outline-none text-slate-700"
              />
            </div>
          )}

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 7 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Vendor Product Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Vendor Product Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{Number(metrics.totalVendorProductSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Qualifying gross sales of vendor-owned products
          </span>
        </div>

        {/* Card 2: Total Commission Earned */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs ring-1 ring-emerald-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Total Commission Earned (5%)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            ₹{Number(metrics.totalCommissionEarned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600/90 mt-1 block font-medium">
            5% recognized revenue from delivered orders
          </span>
        </div>

        {/* Card 3: Commission Pending Delivery */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Commission Pending Delivery
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700">
            ₹{Number(metrics.commissionPendingDelivery || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-amber-600/90 mt-1 block font-medium">
            Awaiting order delivery confirmation
          </span>
        </div>

        {/* Card 4: Commission Eligible for Settlement */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Eligible for Settlement
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-700">
            ₹{Number(metrics.commissionEligibleForSettlement || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-blue-600/90 mt-1 block font-medium">
            Delivered orders qualified for platform ledger
          </span>
        </div>

        {/* Card 5: Total Vendor Payables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Total Vendor Payables (95%)
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-900">
            ₹{Number(metrics.totalVendorPayables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Net 95% payable balance to vendors for delivered items
          </span>
        </div>

        {/* Card 6: Total Vendor Payouts Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Total Vendor Payouts Completed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{Number(metrics.totalVendorPayoutsCompleted || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Disbursed settlements to vendor bank accounts
          </span>
        </div>

        {/* Card 7: Total Refunds & Commission Reversals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Total Refunds & Commission Reversals
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700">
            ₹{Number(metrics.totalRefundsReversals || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-rose-600/90 mt-1 block font-medium">
            Reversed orders and cancelled line items (zero platform commission retained)
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'transactions'
                ? 'border-[#ED1C2E] text-[#ED1C2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Commission Line-Item Transactions
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'settlements'
                ? 'border-[#ED1C2E] text-[#ED1C2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Vendor Settlement & Payout Ledger
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'vendors'
                ? 'border-[#ED1C2E] text-[#ED1C2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Vendor-wise Commission Summary
          </button>
        </nav>
      </div>

      {/* TAB 1: Commission Transactions Table */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Multi-Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search order #, customer, product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-700"
                >
                  <option value="ALL">Payment: All</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div>
                <select
                  value={deliveryStatusFilter}
                  onChange={(e) => {
                    setDeliveryStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-700"
                >
                  <option value="ALL">Delivery: All</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <select
                  value={settlementStatusFilter}
                  onChange={(e) => {
                    setSettlementStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-700"
                >
                  <option value="ALL">Settlement: All</option>
                  <option value="PENDING_DELIVERY">Pending Delivery</option>
                  <option value="ELIGIBLE">Eligible for Settlement</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PAID">Paid Out</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REVERSED">Reversed</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 text-xs font-bold text-white bg-[#ED1C2E] hover:bg-[#d41828] rounded-xl transition-colors shadow-xs"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPaymentStatusFilter('ALL');
                    setDeliveryStatusFilter('ALL');
                    setSettlementStatusFilter('ALL');
                    setPage(1);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Transactions Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Order #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Vendor</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right font-extrabold text-slate-900">Sale Amount</th>
                    <th className="py-3 px-3 text-center">Rate</th>
                    <th className="py-3 px-3 text-right font-bold text-rose-600">Platform 5%</th>
                    <th className="py-3 px-3 text-right font-bold text-emerald-700">Vendor 95%</th>
                    <th className="py-3 px-3 text-center">Payment</th>
                    <th className="py-3 px-3 text-center">Delivery</th>
                    <th className="py-3 px-3 text-center">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="14" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ED1C2E]" />
                        Loading commission transactions...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="14" className="py-12 text-center text-slate-400">
                        No vendor commission transactions found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {tx.orderNumber}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                          {new Date(tx.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                          {tx.customerName}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            {tx.vendorName}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-[180px] truncate font-medium text-slate-900" title={tx.productName}>
                          {tx.productName}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-800">
                          {tx.quantity}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          ₹{Number(tx.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-slate-900">
                          ₹{Number(tx.eligibleSaleAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-slate-600">
                          5%
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-rose-600">
                          ₹{Number(tx.platformCommission).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-emerald-700">
                          ₹{Number(tx.vendorShare).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            tx.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {tx.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            tx.deliveryStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {tx.deliveryStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {getSettlementBadge(tx.settlementStatus)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing <strong>{transactions.length}</strong> of <strong>{pagination.total}</strong> records
              </div>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 font-semibold text-slate-700">
                  Page {page} of {pagination.pages || 1}
                </span>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Vendor Settlements & Payouts Ledger */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          {/* Status Sub-Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'ELIGIBLE', 'PROCESSING', 'PAID', 'PENDING_DELIVERY', 'ON_HOLD', 'REVERSED'].map((st) => (
              <button
                key={st}
                onClick={() => setSettlementStatusTab(st)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  settlementStatusTab === st
                    ? 'bg-[#30358F] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Suborder #</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4 text-right">Gross Amount</th>
                    <th className="py-3 px-4 text-right text-rose-600">Platform 5%</th>
                    <th className="py-3 px-4 text-right text-emerald-700 font-extrabold">Net Payable 95%</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Payout Ref</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ED1C2E]" />
                        Loading settlements...
                      </td>
                    </tr>
                  ) : settlements.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No settlements found in this status category.
                      </td>
                    </tr>
                  ) : (
                    settlements.map((st) => (
                      <tr key={st._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {st.suborderId?.subOrderNumber || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{st.vendorId?.storeName || 'Vendor'}</div>
                          <div className="text-[11px] text-slate-400">{st.vendorId?.email}</div>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          ₹{Number(st.grossAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-rose-600">
                          ₹{Number(st.platformCommission).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-extrabold text-emerald-700 text-sm">
                          ₹{Number(st.netPayable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {getSettlementBadge(st.status)}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {st.payoutReference || '—'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {st.status === 'ELIGIBLE' && (
                              <button
                                onClick={() => handleApproveSettlement(st._id)}
                                className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                Approve Payout
                              </button>
                            )}

                            {(st.status === 'ELIGIBLE' || st.status === 'PROCESSING') && (
                              <button
                                onClick={() => openPayoutModal(st)}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                              >
                                Process Payout
                              </button>
                            )}

                            {st.status === 'PAID' && (
                              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Vendor-wise Commission Summary */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Vendor Store</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-center">Units Sold</th>
                  <th className="py-3 px-4 text-right">Gross Sales</th>
                  <th className="py-3 px-4 text-right text-rose-600">Platform 5% Total</th>
                  <th className="py-3 px-4 text-right text-emerald-700 font-bold">Vendor Earnings (95%)</th>
                  <th className="py-3 px-4 text-right text-amber-600">Pending Delivery</th>
                  <th className="py-3 px-4 text-right text-blue-700 font-bold">Eligible Payables</th>
                  <th className="py-3 px-4 text-right text-slate-900 font-bold">Total Paid Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ED1C2E]" />
                      Loading vendor summary...
                    </td>
                  </tr>
                ) : vendorSummaries.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400">
                      No vendor sales records found for this period.
                    </td>
                  </tr>
                ) : (
                  vendorSummaries.map((v) => (
                    <tr key={v.vendorId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{v.storeName}</div>
                        <div className="text-[11px] text-slate-400">{v.email}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{v.totalOrders}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{v.totalUnits}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        ₹{Number(v.grossSales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        ₹{Number(v.platformCommissionTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        ₹{Number(v.vendorEarningsTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-amber-600">
                        ₹{Number(v.pendingCommission).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-700">
                        ₹{Number(v.eligiblePayable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{Number(v.paidOutTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {payoutModalOpen && selectedSettlement && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Record Vendor Payout</h3>
              </div>
              <button
                onClick={() => setPayoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-700 block">Vendor Recipient</span>
                  <strong className="text-sm text-emerald-900">{selectedSettlement.vendorId?.storeName || 'Vendor'}</strong>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-700 block">Net Payout (95%)</span>
                  <strong className="text-lg text-emerald-900">₹{selectedSettlement.netPayable}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payout / Transaction Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={payoutRefInput}
                  onChange={(e) => setPayoutRefInput(e.target.value)}
                  placeholder="e.g. UTR-20261010-0987 or Razorpay Payout ID"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reconciliation Notes
                </label>
                <textarea
                  rows="2"
                  value={payoutNotesInput}
                  onChange={(e) => setPayoutNotesInput(e.target.value)}
                  placeholder="Optional bank transfer notes or ledger references..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Notice: Marking this payout as <strong>PAID</strong> debits the vendor's eligible balance and seals the double-entry settlement ledger.
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayoutModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={payoutSubmitting || !payoutRefInput.trim()}
                onClick={handleConfirmPayout}
                className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
              >
                {payoutSubmitting ? 'Recording Payout...' : 'Confirm Disbursed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminCommissions;
