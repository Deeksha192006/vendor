import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Percent,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  DollarSign,
  Package,
  Search,
  Info,
  RefreshCw,
  ShoppingBag,
  ArrowDownCircle,
  HelpCircle
} from 'lucide-react';
import api from '../services/api';

export default function VendorEarnings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [metrics, setMetrics] = useState({
    totalProductSales: 0,
    totalPlatformCommission: 0,
    earningsPendingDelivery: 0,
    earningsEligibleForSettlement: 0,
    totalAmountPaidOut: 0,
    currentPayableBalance: 0,
    refundedReversedAmounts: 0,
    commissionRate: 5,
  });

  const [items, setItems] = useState([]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/vendor/earnings');
      if (res.data?.data) {
        setMetrics(res.data.data.metrics || {});
        setItems(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load vendor earnings:', err);
      setError(err.response?.data?.message || 'Failed to load your sales and earnings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'ALL' && item.settlementStatus !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.productName?.toLowerCase().includes(q);
      const matchOrder = item.orderNumber?.toLowerCase().includes(q);
      return matchName || matchOrder;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Paid Out
          </span>
        );
      case 'ELIGIBLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <CheckCircle2 className="w-3 h-3" /> Eligible for Settlement
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <RefreshCw className="w-3 h-3 animate-spin" /> Payout Processing
          </span>
        );
      case 'PENDING_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Awaiting Delivery
          </span>
        );
      case 'REVERSED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <RotateCcw className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ED1C2E] to-[#F7941D] text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Sales & Earnings
              </h1>
              <p className="text-xs text-slate-500">
                Track your product sales, 5% platform fee deduction, and delivery settlements.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchEarnings}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Informational Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-slate-50 border border-blue-200/80 shadow-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-blue-900 font-bold block mb-0.5">Fixed 5% Platform Commission Policy</strong>
          BAAPOO MART charges a fixed 5% platform commission on eligible vendor product sales. You receive the remaining 95% after successful delivery and settlement eligibility.
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Product Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Product Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{Number(metrics.totalProductSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Gross sales of all ordered items
          </span>
        </div>

        {/* Total Platform Commission (5%) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Platform Fee (5%)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            ₹{Number(metrics.totalPlatformCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-rose-500/80 mt-1 block">
            Platform commission on delivered sales
          </span>
        </div>

        {/* Current Payable Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs ring-1 ring-emerald-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Current Payable Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            ₹{Number(metrics.currentPayableBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600/90 mt-1 block font-medium">
            Eligible 95% earnings ready for payout
          </span>
        </div>

        {/* Total Amount Paid Out */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Total Amount Paid Out
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{Number(metrics.totalAmountPaidOut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Total payouts transferred to bank
          </span>
        </div>

        {/* Earnings Pending Delivery */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Earnings Pending Delivery
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700">
            ₹{Number(metrics.earningsPendingDelivery || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-amber-600/90 mt-1 block font-medium">
            Orders currently in transit or awaiting customer delivery confirmation
          </span>
        </div>

        {/* Refunded or Reversed Amounts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Refunded or Reversed Amounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-700">
            ₹{Number(metrics.refundedReversedAmounts || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Cancelled items and refunded orders
          </span>
        </div>
      </div>

      {/* Order Item Earnings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_DELIVERY">Awaiting Delivery</option>
              <option value="ELIGIBLE">Eligible for Settlement</option>
              <option value="PROCESSING">Payout Processing</option>
              <option value="PAID">Paid Out</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REVERSED">Reversed</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Sale Amount</th>
                <th className="py-3 px-4 text-right text-rose-600">Platform Fee (5%)</th>
                <th className="py-3 px-4 text-right font-extrabold text-emerald-700">Vendor Earnings (95%)</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Delivery Status</th>
                <th className="py-3 px-4 text-center">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ED1C2E]" />
                    Loading your sales and earnings...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No order item records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-[200px] truncate" title={item.productName}>
                      {item.productName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {item.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                      ₹{Number(item.productSaleAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-rose-600">
                      -₹{Number(item.platformFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-extrabold text-emerald-700 text-sm">
                      ₹{Number(item.vendorEarnings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.deliveryStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.deliveryStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(item.settlementStatus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 text-xs text-slate-500">
          Showing <strong>{filteredItems.length}</strong> items. Settlements become eligible for payout once the order has been delivered and payment is confirmed.
        </div>
      </div>
    </div>
  );
}
