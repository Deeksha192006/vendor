import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  CreditCard,
  Package,
  Clock,
  CheckCircle2,
  RotateCcw,
  Download,
  Calendar,
  Search,
  RefreshCw,
  Store,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../../services/api';

const DATE_RANGES = [
  { label: 'Today', value: 'TODAY' },
  { label: 'Yesterday', value: 'YESTERDAY' },
  { label: 'Last 7 Days', value: 'LAST_7_DAYS' },
  { label: 'Last 30 Days', value: 'LAST_30_DAYS' },
  { label: 'This Month', value: 'THIS_MONTH' },
  { label: 'Custom', value: 'CUSTOM' },
];

export function CustomerDailyPurchaseReport() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('TODAY');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('ALL');

  const [summary, setSummary] = useState({
    todayPurchases: 0,
    totalOrders: 0,
    productsPurchased: 0,
    amountPaid: 0,
    pendingPayments: 0,
    refundedAmounts: 0,
  });

  const [items, setItems] = useState([]);
  const [trends, setTrends] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });

  useEffect(() => {
    fetchPurchases(1);
  }, [range, orderStatus]);

  const fetchPurchases = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        range,
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

      const res = await api.get('/customer/daily-purchases', { params });
      const data = res.data?.data;

      if (data) {
        setSummary(data.summary || {});
        setItems(data.items || []);
        setTrends(data.trends || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch customer purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const params = { range };
      if (range === 'CUSTOM' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const res = await api.get('/customer/daily-purchases/export', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `my_purchases_${range.toLowerCase()}_${Date.now()}.csv`);
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
              <ShoppingBag className="w-3.5 h-3.5 text-[#F7941D]" />
              CUSTOMER PURCHASE INTELLIGENCE
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-[#F7941D]" />
              Daily Purchase Report
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Track your daily purchases, orders, vendor vs admin store items, and payment status records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchPurchases(1)}
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
              onClick={() => fetchPurchases(1)}
              className="px-3 py-1.5 bg-[#30358F] text-white font-bold rounded-lg hover:bg-[#23276b]"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* 3. Six Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Purchases */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Purchases</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{formatINR(summary.todayPurchases)}</div>
          <p className="text-[10px] text-slate-400 mt-1">Total order value</p>
        </div>

        {/* Orders Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Orders</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{summary.totalOrders}</div>
          <p className="text-[10px] text-slate-400 mt-1">Orders placed</p>
        </div>

        {/* Products Purchased */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Items</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-600">{summary.productsPurchased}</div>
          <p className="text-[10px] text-slate-400 mt-1">Items bought</p>
        </div>

        {/* Amount Paid */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Amount Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">{formatINR(summary.amountPaid)}</div>
          <p className="text-[10px] text-emerald-600 mt-1">Settled payments</p>
        </div>

        {/* Pending Payments */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-700">{formatINR(summary.pendingPayments)}</div>
          <p className="text-[10px] text-amber-600 mt-1">Awaiting confirmation</p>
        </div>

        {/* Refunded Amounts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Refunded</span>
            <RotateCcw className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-700">{formatINR(summary.refundedAmounts)}</div>
          <p className="text-[10px] text-slate-400 mt-1">Cancelled & refunded</p>
        </div>
      </div>

      {/* 4. Spending Chart */}
      {trends.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Spending History</h3>
              <p className="text-xs text-slate-400">Daily spending trend over the selected period</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#30358F" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#30358F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => [formatINR(val), 'Spending']} />
                <Area
                  type="monotone"
                  dataKey="spending"
                  stroke="#30358F"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#spendingGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 5. Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product or order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPurchases(1)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Seller Details</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Order Amount</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Order Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading your purchase history...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No purchases found for this period</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your date range filter</p>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={`${item.orderId}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/customer/orders/${item.orderId}`}
                        className="font-mono font-bold text-[#30358F] hover:underline block"
                      >
                        {item.orderNumber}
                      </Link>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 max-w-xs truncate">{item.productName}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {item.sellerType === 'VENDOR' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-[#F7941D] border border-orange-200">
                            Vendor
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Admin Store
                          </span>
                        )}
                        <span className="font-medium text-slate-700">{item.sellerName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-right text-slate-600">{formatINR(item.unitPrice)}</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">{formatINR(item.orderAmount)}</td>
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
                          item.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.orderStatus === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700'
                            : item.orderStatus === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        to={`/customer/orders/${item.orderId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-[#30358F] font-bold text-[11px] transition"
                        title="View Full Order Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
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

export default CustomerDailyPurchaseReport;
