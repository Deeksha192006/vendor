import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Percent,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw,
  Store,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';

const DATE_RANGES = [
  { label: 'Today', value: 'TODAY' },
  { label: 'Yesterday', value: 'YESTERDAY' },
  { label: 'Last 7 Days', value: 'LAST_7_DAYS' },
  { label: 'Last 30 Days', value: 'LAST_30_DAYS' },
  { label: 'This Month', value: 'THIS_MONTH' },
  { label: 'Custom', value: 'CUSTOM' },
];

export function VendorDailySalesReport() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('TODAY');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [orderStatus, setOrderStatus] = useState('ALL');

  const [summary, setSummary] = useState({
    todaySales: 0,
    todayOrders: 0,
    todayProductsSold: 0,
    platformCommission: 0,
    vendorEarnings: 0,
    pendingSettlements: 0,
    completedPayouts: 0,
    refundsAndReversals: 0,
  });

  const [items, setItems] = useState([]);
  const [trends, setTrends] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });

  useEffect(() => {
    fetchDailySales(1);
  }, [range, paymentStatus, orderStatus]);

  const fetchDailySales = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        range,
        paymentStatus,
        orderStatus,
        page,
        limit: pagination.limit,
      };

      if (range === 'CUSTOM' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await api.get('/vendor/daily-sales', { params });
      const data = res.data?.data;

      if (data) {
        setSummary(data.summary || {});
        setItems(data.items || []);
        setTrends(data.trends || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch vendor daily sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const params = { type: 'vendor', range };
      if (range === 'CUSTOM' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const res = await api.get('/vendor/daily-sales/export', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vendor_daily_sales_${range.toLowerCase()}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const formatINR = (val) =>
    '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#30358F] via-[#1E2260] to-[#0F1138] p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide text-orange-300">
              <Store className="w-3.5 h-3.5 text-[#F7941D]" />
              VENDOR SALES & REVENUE PORTAL
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-[#F7941D]" />
              Daily Sales Report
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Track your daily product sales, locked 5% platform commission deductions, eligible 95% earnings, and settlement status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchDailySales(1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition backdrop-blur-sm border border-white/20 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ED1C2E] to-[#F7941D] hover:brightness-110 text-white text-xs font-bold transition shadow-lg shadow-red-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Date Range Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                range === r.value
                  ? 'bg-white text-[#30358F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {range === 'CUSTOM' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
            <button
              onClick={() => fetchDailySales(1)}
              className="px-3 py-1.5 bg-[#30358F] text-white font-bold rounded-lg hover:bg-[#23276b]"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* 3. Eight Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Product Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Product Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatINR(summary.todaySales)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Gross merchandise value</p>
        </div>

        {/* Today's Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Orders Count</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.todayOrders}</div>
          <p className="text-[11px] text-slate-400 mt-1">Unique customer orders</p>
        </div>

        {/* Products Sold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Units Sold</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{summary.todayProductsSold}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total items sold</p>
        </div>

        {/* Platform Commission (5%) */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Platform Fee (5%)</span>
            <Percent className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">-{formatINR(summary.platformCommission)}</div>
          <p className="text-[11px] text-rose-500 mt-1">Fixed 5% platform share</p>
        </div>

        {/* Vendor Earnings (95%) */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Net Earnings (95%)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{formatINR(summary.vendorEarnings)}</div>
          <p className="text-[11px] text-emerald-600 mt-1">Your 95% share</p>
        </div>

        {/* Pending Settlements */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Delivery</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700">{formatINR(summary.pendingSettlements)}</div>
          <p className="text-[11px] text-amber-600 mt-1">Eligible upon delivery</p>
        </div>

        {/* Completed Payouts */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Paid Out</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">{formatINR(summary.completedPayouts)}</div>
          <p className="text-[11px] text-blue-500 mt-1">Disbursed to bank</p>
        </div>

        {/* Refunds & Reversals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Refunds / Reversals</span>
            <RotateCcw className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-700">{formatINR(summary.refundsAndReversals)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Cancelled & returned</p>
        </div>
      </div>

      {/* 4. Sales Trend Chart */}
      {trends.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Daily Sales Trend</h3>
              <p className="text-xs text-slate-400">Sales and 95% net earnings trajectory across selected period</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="vendorSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#30358F" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#30358F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="vendorEarnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name) => [
                    formatINR(val),
                    name === 'sales' ? 'Gross Sales' : 'Net Earnings',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#30358F"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#vendorSalesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#vendorEarnGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 5. Detailed Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDailySales(1)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>

            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option value="ALL">All Orders</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Sale Amount</th>
                <th className="py-3 px-4 text-right">Fee (5%)</th>
                <th className="py-3 px-4 text-right">Earnings (95%)</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Delivery</th>
                <th className="py-3 px-4 text-center">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No sales recorded for this period</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your date range filter</p>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={`${item.orderId}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{item.orderNumber}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{item.customerName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 max-w-xs truncate">{item.productName}</td>
                    <td className="py-3.5 px-4 text-center font-bold">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">{formatINR(item.saleAmount)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">-{formatINR(item.platformFee)}</td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700">{formatINR(item.vendorEarnings)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.paymentStatus === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.deliveryStatus === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {item.deliveryStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.settlementStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.settlementStatus === 'ELIGIBLE'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.settlementStatus}
                      </span>
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
}

export default VendorDailySalesReport;
