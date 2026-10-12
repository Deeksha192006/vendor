import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Filter,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Package,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  Building2,
  PieChart as PieChartIcon,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { superAdminService } from '../../services/superAdminService';

// BAAPOO MART Official Brand Theme Colors
const BRAND = {
  RED: '#ED1C2E',
  ORANGE: '#F7941D',
  NAVY: '#30358F',
  WHITE: '#FFFFFF',
  SLATE_DARK: '#1E293B',
};

const CHART_COLORS = ['#30358F', '#ED1C2E', '#F7941D', '#10B981', '#6366F1', '#EC4899', '#8B5CF6'];

export const SuperAdminSalesReport = () => {
  // Global States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Active Tab View: 'ALL' | 'VENDOR' | 'ADMIN' | 'SELLERS' | 'PRODUCTS' | 'CHARTS'
  const [activeTab, setActiveTab] = useState('ALL');

  // Filter States
  const [range, setRange] = useState('TODAY');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState('');
  const [viewMode, setViewMode] = useState('line-items'); // 'line-items' | 'orders'

  // Data States
  const [overviewData, setOverviewData] = useState(null);
  const [salesItems, setSalesItems] = useState([]);
  const [sellerData, setSellerData] = useState({ adminStore: null, vendors: [] });
  const [topProducts, setTopProducts] = useState([]);
  const [trendsData, setTrendsData] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });

  // Modal States
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrderModal, setLoadingOrderModal] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerHistory, setCustomerHistory] = useState(null);
  const [loadingCustomerModal, setLoadingCustomerModal] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  // Determine Channel from activeTab
  const currentChannel = useMemo(() => {
    if (activeTab === 'VENDOR') return 'VENDOR';
    if (activeTab === 'ADMIN') return 'ADMIN';
    return 'ALL';
  }, [activeTab]);

  // Fetch Dashboard Overview & Summary Cards
  const fetchOverview = async () => {
    try {
      const params = { range };
      if (range === 'CUSTOM' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const res = await superAdminService.getSalesOverview(params);
      setOverviewData(res);
    } catch (err) {
      console.error('Failed to fetch sales overview:', err);
    }
  };

  // Fetch Sales Orders/Line-Items
  const fetchOrders = async (page = 1) => {
    try {
      const params = {
        range,
        channel: currentChannel,
        paymentStatus: paymentStatusFilter,
        orderStatus: orderStatusFilter,
        page,
        limit: pagination.limit,
        viewMode,
      };
      if (range === 'CUSTOM' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      if (searchTerm.trim()) {
        params.productName = searchTerm.trim();
        params.orderId = searchTerm.trim();
        params.customerName = searchTerm.trim();
      }
      if (vendorFilter) {
        params.vendorId = vendorFilter;
      }

      const res = await superAdminService.getSalesOrders(params);
      setSalesItems(res.items || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch sales orders:', err);
    }
  };

  // Fetch Seller Analytics
  const fetchSellers = async () => {
    try {
      const params = { range };
      if (range === 'CUSTOM' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const res = await superAdminService.getSalesBySeller(params);
      setSellerData(res || { adminStore: null, vendors: [] });
    } catch (err) {
      console.error('Failed to fetch seller analytics:', err);
    }
  };

  // Fetch Product Analytics
  const fetchProducts = async () => {
    try {
      const params = { range, channel: currentChannel, limit: 30 };
      if (range === 'CUSTOM' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const res = await superAdminService.getSalesByProduct(params);
      setTopProducts(res.products || []);
    } catch (err) {
      console.error('Failed to fetch top products:', err);
    }
  };

  // Fetch Chart Trends
  const fetchTrends = async () => {
    try {
      const params = { range };
      if (range === 'CUSTOM' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const res = await superAdminService.getSalesTrends(params);
      setTrendsData(res);
    } catch (err) {
      console.error('Failed to fetch sales trends:', err);
    }
  };

  // Master Data Refresh
  const loadAllData = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchOverview(),
        fetchOrders(1),
        fetchSellers(),
        fetchProducts(),
        fetchTrends(),
      ]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Error loading sales reports data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [range, currentChannel, paymentStatusFilter, orderStatusFilter, viewMode, vendorFilter]);

  // Handle Order Details Inspector Modal
  const openOrderModal = async (orderId) => {
    if (!orderId) return;
    setSelectedOrderId(orderId);
    setOrderModalOpen(true);
    setLoadingOrderModal(true);
    try {
      const res = await superAdminService.getSalesOrderDetails(orderId);
      setOrderDetails(res);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    } finally {
      setLoadingOrderModal(false);
    }
  };

  // Handle Customer Purchase History Modal
  const openCustomerModal = async (customerId) => {
    if (!customerId) return;
    setSelectedCustomerId(customerId);
    setCustomerModalOpen(true);
    setLoadingCustomerModal(true);
    try {
      const res = await superAdminService.getCustomerPurchaseHistory(customerId);
      setCustomerHistory(res);
    } catch (err) {
      console.error('Failed to fetch customer history:', err);
    } finally {
      setLoadingCustomerModal(false);
    }
  };

  // Handle CSV Export
  const handleExport = async (format = 'line-items') => {
    try {
      setExportMenuOpen(false);
      const params = {
        range,
        channel: currentChannel,
        format,
      };
      if (range === 'CUSTOM' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const blobData = await superAdminService.exportSalesCsv(params);
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `baapoo_mart_sales_${format}_${range.toLowerCase()}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('CSV Export failed:', err);
      alert('Failed to generate export file');
    }
  };

  // Row Expansion for Multi-Product Grouped Orders
  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  // Format INR Currency
  const formatINR = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  // Active Metrics (Today or Period depending on filter)
  const activeMetrics = useMemo(() => {
    if (!overviewData) return {};
    return range === 'TODAY' ? overviewData.today || {} : overviewData.period || {};
  }, [overviewData, range]);

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-8 space-y-6 text-slate-800">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#30358F] via-[#1E2260] to-[#0F1138] p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide text-orange-300">
              <span className="w-2 h-2 rounded-full bg-[#ED1C2E] animate-pulse" />
              BAAPOO MART • BUY INDIAN • BUILD INDIA
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[#F7941D]" />
              Daily Sales Report & Analytics Dashboard
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Comprehensive real-time merchandise sales tracking. Differentiate independent vendor earnings from
              platform direct sales with zero duplicate counting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setRefreshing(true);
                loadAllData();
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition backdrop-blur-sm border border-white/20 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-400' : ''}`} />
              <span>Refresh</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ED1C2E] to-[#F7941D] hover:brightness-110 text-white text-xs font-bold transition shadow-lg shadow-red-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <AnimatePresence>
                {exportMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-2xl border border-slate-100 p-2 z-50 text-slate-800 text-xs font-semibold"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Export Formats (CSV)
                    </div>
                    <button
                      onClick={() => handleExport('line-items')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#30358F]" />
                      <span>Detailed Order Line Items</span>
                    </button>
                    <button
                      onClick={() => handleExport('orders')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#ED1C2E]" />
                      <span>Order Summary Ledger</span>
                    </button>
                    <button
                      onClick={() => handleExport('sellers')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition"
                    >
                      <Store className="w-4 h-4 text-[#F7941D]" />
                      <span>Seller-Wise Performance</span>
                    </button>
                    <button
                      onClick={() => handleExport('products')}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 transition"
                    >
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span>Product Sales Ranking</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Global Filter Controls Bar */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Preset Date Range Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'TODAY', label: "Today's Sales" },
              { id: 'YESTERDAY', label: 'Yesterday' },
              { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
              { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'PREVIOUS_MONTH', label: 'Previous Month' },
              { id: 'THIS_YEAR', label: 'This Year' },
              { id: 'CUSTOM', label: 'Custom Range' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setRange(btn.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  range === btn.id
                    ? 'bg-[#30358F] text-white shadow-md shadow-indigo-500/25'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Quick Active Range Badge */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Clock className="w-4 h-4 text-[#F7941D]" />
            <span>Timezone: Asia/Kolkata (IST)</span>
          </div>
        </div>

        {/* Custom Range Picker */}
        {range === 'CUSTOM' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-500">Start Date:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#30358F]"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-500">End Date:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#30358F]"
              />
            </div>
            <button
              onClick={loadAllData}
              className="px-4 py-1.5 bg-[#30358F] hover:bg-indigo-900 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* 3. 10 Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Daily Sales */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              {range === 'TODAY' ? "Total Daily Sales" : 'Total Sales'}
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-[#30358F]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
              {formatINR(activeMetrics.totalSales)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Gross: {formatINR(activeMetrics.grossSales)}</span>
              <span className="text-emerald-600 font-bold">Net Sales</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-[#30358F]" />
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Total Orders
            </span>
            <div className="p-2 rounded-xl bg-orange-50 text-[#F7941D]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
              {activeMetrics.totalOrders || 0} <span className="text-xs font-medium text-slate-400">orders</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              No double-counted orders
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-[#F7941D]" />
        </div>

        {/* Card 3: Total Products Sold */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Total Products Sold
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
              {activeMetrics.productsSold || 0} <span className="text-xs font-medium text-slate-400">units</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              Confirmed units sold
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500" />
        </div>

        {/* Card 4: Vendor Sales */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Vendor Sales
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-blue-950 font-mono tracking-tight">
              {formatINR(activeMetrics.vendorSales)}
            </div>
            <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Independent Vendors</span>
              <span className="font-bold text-blue-600">
                {activeMetrics.totalSales > 0
                  ? `${Math.round(((activeMetrics.vendorSales || 0) / activeMetrics.totalSales) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-600" />
        </div>

        {/* Card 5: Admin-Store Sales */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Admin-Store Sales
            </span>
            <div className="p-2 rounded-xl bg-red-50 text-[#ED1C2E]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-rose-950 font-mono tracking-tight">
              {formatINR(activeMetrics.adminSales)}
            </div>
            <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Direct Store</span>
              <span className="font-bold text-[#ED1C2E]">
                {activeMetrics.totalSales > 0
                  ? `${Math.round(((activeMetrics.adminSales || 0) / activeMetrics.totalSales) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-[#ED1C2E]" />
        </div>

        {/* Card 6: Unique Customers */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Unique Customers
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
              {activeMetrics.uniqueCustomers || 0} <span className="text-xs font-medium text-slate-400">buyers</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              Purchasing customers
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-600" />
        </div>

        {/* Card 7: Successful Payments */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Successful Payments
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-emerald-900 font-mono tracking-tight">
              {activeMetrics.successfulPayments?.count ?? activeMetrics.totalOrders ?? 0}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({formatINR(activeMetrics.successfulPayments?.amount ?? activeMetrics.totalSales ?? 0)})
              </span>
            </div>
            <div className="text-[11px] text-emerald-600 mt-2 pt-2 border-t border-slate-100 font-bold">
              Collected & confirmed
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-600" />
        </div>

        {/* Card 8: Pending Payments */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Pending Payments
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-amber-900 font-mono tracking-tight">
              {activeMetrics.pendingPayments?.count ?? activeMetrics.pendingOrdersCount ?? 0}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({formatINR(activeMetrics.pendingPayments?.amount ?? activeMetrics.pendingOrdersAmount ?? 0)})
              </span>
            </div>
            <div className="text-[11px] text-amber-700 mt-2 pt-2 border-t border-slate-100 font-medium">
              Awaiting confirmation
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500" />
        </div>

        {/* Card 9: Failed Payments */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Failed Payments
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-rose-900 font-mono tracking-tight">
              {activeMetrics.failedPayments?.count || 0}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({formatINR(activeMetrics.failedPayments?.amount || 0)})
              </span>
            </div>
            <div className="text-[11px] text-rose-600 mt-2 pt-2 border-t border-slate-100 font-medium">
              Excluded from revenue
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-600" />
        </div>

        {/* Card 10: Refunds */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Refunds
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-purple-900 font-mono tracking-tight">
              {activeMetrics.refunds?.count ?? activeMetrics.refundedOrdersCount ?? 0}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({formatINR(activeMetrics.refunds?.amount ?? activeMetrics.refundedOrdersAmount ?? 0)})
              </span>
            </div>
            <div className="text-[11px] text-purple-600 mt-2 pt-2 border-t border-slate-100 font-medium">
              Reversals deducted
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-500" />
        </div>
      </div>

      {/* 4. Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { id: 'ALL', label: 'All Sales (Combined)', icon: Layers },
          { id: 'VENDOR', label: 'Vendor Sales Channel', icon: Store },
          { id: 'ADMIN', label: 'Admin Sales Channel', icon: Building2 },
          { id: 'SELLERS', label: 'Sales by Seller', icon: Users },
          { id: 'PRODUCTS', label: 'Top-Selling Products', icon: Package },
          { id: 'CHARTS', label: 'Charts & Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#30358F] to-[#1E2260] text-white shadow-md shadow-indigo-950/20'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#F7941D]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. View Content Sections */}
      {/* SECTION A: ORDERS & LINE ITEMS (FOR ALL, VENDOR, ADMIN) */}
      {['ALL', 'VENDOR', 'ADMIN'].includes(activeTab) && (
        <div className="space-y-4">
          {/* Secondary Table Filters Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order ID, product, or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchOrders(1)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#30358F]"
                />
              </div>

              {/* Payment Status Dropdown */}
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#30358F]"
              >
                <option value="ALL">Payment: All</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>

              {/* Order Status Dropdown */}
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#30358F]"
              >
                <option value="ALL">Status: All</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>

              <button
                onClick={() => fetchOrders(1)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
              >
                Apply
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode('line-items')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'line-items' ? 'bg-white text-[#30358F] shadow-xs' : 'text-slate-500'
                }`}
              >
                Line Items
              </button>
              <button
                onClick={() => setViewMode('orders')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'orders' ? 'bg-white text-[#30358F] shadow-xs' : 'text-slate-500'
                }`}
              >
                By Order
              </button>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Order ID & Date</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Product Details</th>
                    <th className="py-3.5 px-4">Seller Type & Name</th>
                    <th className="py-3.5 px-4 text-center">Qty</th>
                    <th className="py-3.5 px-4 text-right">Unit Price</th>
                    <th className="py-3.5 px-4 text-right">Item Subtotal</th>
                    <th className="py-3.5 px-4 text-right">Discount</th>
                    <th className="py-3.5 px-4 text-right">Tax</th>
                    <th className="py-3.5 px-4 text-right">Shipping</th>
                    <th className="py-3.5 px-4 text-right">Final Amount</th>
                    <th className="py-3.5 px-4 text-center">Payment</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={14} className="py-12 text-center text-slate-400 font-bold">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#30358F]" />
                        Loading qualifying sales records...
                      </td>
                    </tr>
                  ) : salesItems.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-12 text-center text-slate-400 font-medium">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No sales transactions found matching selected filters.
                      </td>
                    </tr>
                  ) : (
                    salesItems.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/70 transition">
                        {/* Order ID & Date */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => openOrderModal(item.orderId)}
                            className="font-bold text-[#30358F] hover:underline font-mono"
                          >
                            {item.orderNumber}
                          </button>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(item.orderDate).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => openCustomerModal(item.customer?._id)}
                            className="font-bold text-slate-800 hover:text-[#ED1C2E] hover:underline block text-left"
                          >
                            {item.customer?.name}
                          </button>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {item.customer?.email || item.customer?.phone}
                          </div>
                        </td>

                        {/* Product Details */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {item.product?.image ? (
                              <img
                                src={item.product.image}
                                alt={item.product?.name}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div className="max-w-[160px]">
                              <p className="font-bold text-slate-900 truncate" title={item.product?.name}>
                                {item.product?.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">SKU: {item.product?.sku}</p>
                            </div>
                          </div>
                        </td>

                        {/* Seller Type & Name */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mb-1 ${
                              item.sellerType === 'ADMIN'
                                ? 'bg-red-100 text-[#ED1C2E]'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.sellerType === 'ADMIN' ? 'Platform Store' : 'Vendor'}
                          </span>
                          <div className="font-bold text-slate-800 text-[11px] truncate max-w-[150px]">
                            {item.sellerName}
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{item.quantity}</td>

                        {/* Unit Price */}
                        <td className="py-3 px-4 text-right font-mono text-slate-600">{formatINR(item.unitPrice)}</td>

                        {/* Item Subtotal */}
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                          {formatINR(item.itemAmount)}
                        </td>

                        {/* Discount */}
                        <td className="py-3 px-4 text-right font-mono text-rose-600">
                          {item.discount > 0 ? `-${formatINR(item.discount)}` : '₹0'}
                        </td>

                        {/* Tax */}
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {item.tax > 0 ? formatINR(item.tax) : '₹0'}
                        </td>

                        {/* Shipping */}
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {item.shipping > 0 ? formatINR(item.shipping) : '₹0'}
                        </td>

                        {/* Final Amount */}
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                          {formatINR(item.finalAmount)}
                        </td>

                        {/* Payment Status */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.paymentStatus === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : item.paymentStatus === 'REFUNDED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.paymentStatus}
                          </span>
                        </td>

                        {/* Order Status */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.orderStatus === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.orderStatus === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.orderStatus}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => openOrderModal(item.orderId)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#30358F] hover:text-white text-slate-600 transition"
                            title="Inspect Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Showing {salesItems.length} of {pagination.total} sales items
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchOrders(pagination.page - 1)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 font-bold text-[#30358F]">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => fetchOrders(pagination.page + 1)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION B: SALES BY SELLER (SECTION 7 REQUIREMENT) */}
      {activeTab === 'SELLERS' && (
        <div className="space-y-6">
          {/* Admin Store Dedicated Card */}
          {sellerData.adminStore && (
            <div className="bg-white rounded-3xl p-6 border-2 border-red-100 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#ED1C2E] to-[#F7941D] text-white shadow-md">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#ED1C2E]">
                      Platform Owned Direct Sales
                    </span>
                    <h3 className="text-xl font-black text-slate-900">{sellerData.adminStore.sellerName}</h3>
                    <p className="text-xs text-slate-400">Products sold directly by BAAPOO MART Super Admin</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Net Sales</span>
                    <div className="text-2xl font-black text-[#ED1C2E] font-mono">
                      {formatINR(sellerData.adminStore.netSales)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Orders Count</span>
                  <p className="text-base font-black text-slate-800 font-mono mt-0.5">
                    {sellerData.adminStore.totalOrders}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Units Sold</span>
                  <p className="text-base font-black text-slate-800 font-mono mt-0.5">
                    {sellerData.adminStore.totalUnitsSold}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Gross Sales</span>
                  <p className="text-base font-black text-slate-800 font-mono mt-0.5">
                    {formatINR(sellerData.adminStore.grossSales)}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Discounts</span>
                  <p className="text-base font-black text-rose-600 font-mono mt-0.5">
                    {formatINR(sellerData.adminStore.discounts)}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Taxes</span>
                  <p className="text-base font-black text-slate-800 font-mono mt-0.5">
                    {formatINR(sellerData.adminStore.taxes)}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Refunds</span>
                  <p className="text-base font-black text-purple-600 font-mono mt-0.5">
                    {formatINR(sellerData.adminStore.refunds)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Independent Registered Vendors Sales Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Independent Vendor Sales Performance</h3>
                <p className="text-xs text-slate-500">
                  Granular product line-item sales attributable to verified registered vendors.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                {sellerData.vendors?.length || 0} Vendors with Sales
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Store Name</th>
                    <th className="py-3 px-4">Vendor Name</th>
                    <th className="py-3 px-4 text-center">Total Orders</th>
                    <th className="py-3 px-4 text-center">Products Sold</th>
                    <th className="py-3 px-4 text-right">Gross Sales</th>
                    <th className="py-3 px-4 text-right">Discounts</th>
                    <th className="py-3 px-4 text-right">Refunds</th>
                    <th className="py-3 px-4 text-right">Net Sales</th>
                    <th className="py-3 px-4 text-center">Filter Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sellerData.vendors?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-semibold">
                        No vendor sales recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    sellerData.vendors?.map((v) => (
                      <tr key={v.vendorId} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <Store className="w-4 h-4 text-blue-600" />
                          <span>{v.storeName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{v.sellerName}</td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono">{v.totalOrders}</td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono">{v.totalUnitsSold}</td>
                        <td className="py-3.5 px-4 text-right font-mono">{formatINR(v.grossSales)}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-rose-600">
                          {v.discounts > 0 ? `-${formatINR(v.discounts)}` : '₹0'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-purple-600">
                          {v.refunds > 0 ? `-${formatINR(v.refunds)}` : '₹0'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-blue-900">
                          {formatINR(v.netSales)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setVendorFilter(v.vendorId);
                              setActiveTab('VENDOR');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold transition flex items-center gap-1 mx-auto"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
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

      {/* SECTION C: TOP-SELLING PRODUCTS (SECTION 8 REQUIREMENT) */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Top-Selling Products Leaderboard</h3>
              <p className="text-xs text-slate-500">
                Ranked by net merchandise sales value during the selected timeframe.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Product Name & SKU</th>
                  <th className="py-3.5 px-4">Seller Type</th>
                  <th className="py-3.5 px-4">Seller / Store Name</th>
                  <th className="py-3.5 px-4 text-center">Units Sold</th>
                  <th className="py-3.5 px-4 text-right">Gross Sales</th>
                  <th className="py-3.5 px-4 text-right">Discounts</th>
                  <th className="py-3.5 px-4 text-right">Refunds</th>
                  <th className="py-3.5 px-4 text-right">Net Sales Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 font-semibold">
                      No product sales recorded in this period.
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={p.productId || idx} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.productName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{p.productName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            p.sellerType === 'ADMIN' ? 'bg-red-100 text-[#ED1C2E]' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {p.sellerType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{p.sellerName}</td>
                      <td className="py-3.5 px-4 text-center font-black font-mono text-slate-900">
                        {p.quantitySold}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">{formatINR(p.grossSales)}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-600">
                        {p.discounts > 0 ? `-${formatINR(p.discounts)}` : '₹0'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-purple-600">
                        {p.refunds > 0 ? `-${formatINR(p.refunds)}` : '₹0'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                        {formatINR(p.netSales)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION D: CHARTS & VISUAL ANALYTICS (SECTION 9 REQUIREMENT) */}
      {activeTab === 'CHARTS' && trendsData && (
        <div className="space-y-6">
          {/* Chart Row 1: Daily Trends & Channel Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Trend Time Series */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Daily Sales Trajectory</h3>
                  <p className="text-xs text-slate-400">Total, Vendor, and Admin merchandise performance over time</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#30358F]" />
                    <span>Total Sales</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F7941D]" />
                    <span>Vendor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C2E]" />
                    <span>Admin</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendsData.dailyTrends || []}>
                    <defs>
                      <linearGradient id="totalSalesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#30358F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#30358F" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="vendorSalesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F7941D" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F7941D" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="adminSalesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ED1C2E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ED1C2E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(value) => [formatINR(value), '']}
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="totalSales" name="Total Sales" stroke="#30358F" strokeWidth={2.5} fill="url(#totalSalesGrad)" />
                    <Area type="monotone" dataKey="vendorSales" name="Vendor Sales" stroke="#F7941D" strokeWidth={2} fill="url(#vendorSalesGrad)" />
                    <Area type="monotone" dataKey="adminSales" name="Admin Sales" stroke="#ED1C2E" strokeWidth={2} fill="url(#adminSalesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Channel Split Donut */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Channel Share Comparison</h3>
                <p className="text-xs text-slate-400">Vendor vs BAAPOO MART Admin merchandise ratio</p>
              </div>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Vendor Sales', value: trendsData.channelDistribution?.vendorSales || 0 },
                        { name: 'Admin Sales', value: trendsData.channelDistribution?.adminSales || 0 },
                      ]}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#F7941D" />
                      <Cell fill="#ED1C2E" />
                    </Pie>
                    <Tooltip formatter={(value) => [formatINR(value), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F7941D]" />
                    Vendor Sales:
                  </span>
                  <span className="font-mono font-bold">{formatINR(trendsData.channelDistribution?.vendorSales)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C2E]" />
                    Admin Sales:
                  </span>
                  <span className="font-mono font-bold">{formatINR(trendsData.channelDistribution?.adminSales)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Row 2: Top Products Horizontal Bar & Order Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products Bar Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">Top-Selling Products by Revenue</h3>
              <p className="text-xs text-slate-400">Products driving the highest sales volume</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts.slice(0, 7).map((p) => ({
                      name: p.productName.length > 15 ? p.productName.slice(0, 15) + '...' : p.productName,
                      netSales: p.netSales,
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip formatter={(value) => [formatINR(value), 'Net Sales']} />
                    <Bar dataKey="netSales" fill="#30358F" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900">Order Status Distribution</h3>
              <p className="text-xs text-slate-400">Total order volume categorized by fulfillment and payment state</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendsData.orderStatusDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="status" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip formatter={(value, name) => [name === 'amount' ? formatINR(value) : value, name]} />
                    <Bar dataKey="count" fill="#ED1C2E" radius={[6, 6, 0, 0]} name="Orders Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ORDER DETAILS INSPECTOR (SECTION 10 REQUIREMENT)
      ========================================================================= */}
      <AnimatePresence>
        {orderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-[#30358F]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      Order #{orderDetails?.order?.orderNumber || 'Details'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Placed on{' '}
                      {orderDetails?.order?.createdAt
                        ? new Date(orderDetails.order.createdAt).toLocaleString('en-IN')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOrderModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingOrderModal ? (
                <div className="py-12 text-center text-slate-400 font-bold">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#30358F]" />
                  Loading order inspector details...
                </div>
              ) : orderDetails ? (
                <div className="space-y-6 text-xs">
                  {/* Customer & Delivery Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Customer Information
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-1">{orderDetails.order?.userId?.name}</p>
                      <p className="text-slate-500">{orderDetails.order?.userId?.email}</p>
                      <p className="text-slate-500">{orderDetails.order?.userId?.phone}</p>
                      <button
                        onClick={() => {
                          setOrderModalOpen(false);
                          openCustomerModal(orderDetails.order?.userId?._id);
                        }}
                        className="mt-2 text-[11px] font-bold text-[#30358F] hover:underline flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>View Customer Purchase History</span>
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Payment & Fulfillment
                      </span>
                      <div className="mt-1 space-y-1">
                        <p className="text-slate-700">
                          <span className="font-bold">Payment Method:</span> {orderDetails.order?.paymentMethod}
                        </p>
                        <p className="text-slate-700">
                          <span className="font-bold">Payment Status:</span>{' '}
                          <span className="font-bold text-emerald-700">{orderDetails.order?.paymentStatus}</span>
                        </p>
                        <p className="text-slate-700">
                          <span className="font-bold">Order Status:</span>{' '}
                          <span className="font-bold text-blue-700">{orderDetails.order?.orderStatus}</span>
                        </p>
                        {orderDetails.payment?.transactionId && (
                          <p className="text-slate-500 font-mono text-[10px]">
                            Gateway Ref: {orderDetails.payment.transactionId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mixed Seller Attribution Alert */}
                  {orderDetails.isMixedSellerOrder && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-900 font-bold">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>
                        Mixed-Seller Order: Contains products from both independent vendors and BAAPOO MART Admin Store.
                        Each seller is attributed exclusively for their item share without double-counting order totals.
                      </span>
                    </div>
                  )}

                  {/* Vendor Items Section */}
                  {orderDetails.vendorItems?.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider text-blue-700 flex items-center gap-2">
                          <Store className="w-4 h-4" />
                          Independent Vendor Products ({formatINR(orderDetails.vendorSubtotal)})
                        </h4>
                      </div>

                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                            <tr>
                              <th className="p-3">Product</th>
                              <th className="p-3">Vendor / Store</th>
                              <th className="p-3 text-center">Qty</th>
                              <th className="p-3 text-right">Price</th>
                              <th className="p-3 text-right">Discount</th>
                              <th className="p-3 text-right">Net Share</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {orderDetails.vendorItems.map((vItem) => (
                              <tr key={vItem.itemId} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-slate-900">{vItem.productName}</td>
                                <td className="p-3 text-blue-800 font-semibold">{vItem.sellerName}</td>
                                <td className="p-3 text-center font-bold font-mono">{vItem.quantity}</td>
                                <td className="p-3 text-right font-mono">{formatINR(vItem.unitPrice)}</td>
                                <td className="p-3 text-right font-mono text-rose-600">
                                  {vItem.discount > 0 ? `-${formatINR(vItem.discount)}` : '₹0'}
                                </td>
                                <td className="p-3 text-right font-mono font-black text-slate-900">
                                  {formatINR(vItem.finalAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Admin Store Items Section */}
                  {orderDetails.adminItems?.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider text-[#ED1C2E] flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          BAAPOO MART Admin Store Products ({formatINR(orderDetails.adminSubtotal)})
                        </h4>
                      </div>

                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                            <tr>
                              <th className="p-3">Product</th>
                              <th className="p-3">Seller</th>
                              <th className="p-3 text-center">Qty</th>
                              <th className="p-3 text-right">Price</th>
                              <th className="p-3 text-right">Discount</th>
                              <th className="p-3 text-right">Net Share</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {orderDetails.adminItems.map((aItem) => (
                              <tr key={aItem.itemId} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-slate-900">{aItem.productName}</td>
                                <td className="p-3 text-[#ED1C2E] font-semibold">{aItem.sellerName}</td>
                                <td className="p-3 text-center font-bold font-mono">{aItem.quantity}</td>
                                <td className="p-3 text-right font-mono">{formatINR(aItem.unitPrice)}</td>
                                <td className="p-3 text-right font-mono text-rose-600">
                                  {aItem.discount > 0 ? `-${formatINR(aItem.discount)}` : '₹0'}
                                </td>
                                <td className="p-3 text-right font-mono font-black text-slate-900">
                                  {formatINR(aItem.finalAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Order Financial Totals */}
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5 max-w-sm ml-auto text-xs font-semibold">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Items Subtotal:</span>
                      <span className="font-mono">{formatINR(orderDetails.order?.itemsSubtotal || orderDetails.order?.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-600">
                      <span>Discounts:</span>
                      <span className="font-mono">
                        {orderDetails.order?.discountTotal > 0 ? `-${formatINR(orderDetails.order?.discountTotal)}` : '₹0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Tax / GST:</span>
                      <span className="font-mono">{formatINR(orderDetails.order?.taxTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Shipping Fee:</span>
                      <span className="font-mono">{formatINR(orderDetails.order?.shippingTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                      <span>Grand Total:</span>
                      <span className="font-mono text-base text-[#30358F]">
                        {formatINR(orderDetails.order?.grandTotal || orderDetails.order?.total)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 2: CUSTOMER PURCHASE HISTORY (SECTION 10 REQUIREMENT)
      ========================================================================= */}
      <AnimatePresence>
        {customerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-50 text-purple-700">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      Customer Purchase Ledger: {customerHistory?.customer?.name || 'Customer'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {customerHistory?.customer?.email} • {customerHistory?.customer?.phone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCustomerModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingCustomerModal ? (
                <div className="py-12 text-center text-slate-400 font-bold">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#30358F]" />
                  Loading customer history...
                </div>
              ) : customerHistory ? (
                <div className="space-y-6">
                  {/* Customer Quick Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Total Orders Placed
                      </span>
                      <p className="text-xl font-black text-slate-900 font-mono mt-1">
                        {customerHistory.metrics?.totalOrdersCount || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Completed Paid Orders
                      </span>
                      <p className="text-xl font-black text-emerald-700 font-mono mt-1">
                        {customerHistory.metrics?.completedOrdersCount || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Lifetime Spend
                      </span>
                      <p className="text-xl font-black text-[#30358F] font-mono mt-1">
                        {formatINR(customerHistory.metrics?.totalSpent)}
                      </p>
                    </div>
                  </div>

                  {/* Orders Timeline */}
                  <div className="space-y-3">
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Historical Orders</h4>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                          <tr>
                            <th className="p-3">Order Number</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Items Purchased</th>
                            <th className="p-3 text-right">Total Amount</th>
                            <th className="p-3 text-center">Payment</th>
                            <th className="p-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customerHistory.orders?.map((ord) => (
                            <tr key={ord._id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold font-mono text-[#30358F]">{ord.orderNumber}</td>
                              <td className="p-3 text-slate-500">
                                {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  {ord.items?.map((it, i) => (
                                    <div key={i} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900">{it.quantity}x</span>
                                      <span>{it.productName}</span>
                                      <span className="text-slate-400">({it.sellerName})</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono font-black text-slate-900">
                                {formatINR(ord.grandTotal)}
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    ord.paymentStatus === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {ord.paymentStatus}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {ord.orderStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminSalesReport;
