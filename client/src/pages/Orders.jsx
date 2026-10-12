import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Package, Loader2, FileText, ArrowRight, CreditCard, Tag, RotateCcw, Truck, CheckCircle2, Flag } from 'lucide-react';

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'];
const RETURN_CANCEL_STATUSES = ['RETURN_REQUESTED', 'RETURNED', 'REFUNDED', 'CANCELLED'];

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentTab = searchParams.get('tab') || 'all';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data.data.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}/invoice`);
      const htmlContent = typeof res.data === 'string' ? res.data : (res.data?.data?.html || res.data?.html);
      if (htmlContent) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.open();
          win.document.write(htmlContent);
          win.document.close();
          return;
        }
      }
    } catch (e) {
      console.warn('Direct API invoice fetch error, falling back to query token URL:', e);
    }

    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    window.open(`http://localhost:5000/api/orders/${orderId}/invoice${token ? `?token=${token}` : ''}`, '_blank');
  };

  const activeOrdersCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.orderStatus)).length;
  const returnOrdersCount = orders.filter((o) => RETURN_CANCEL_STATUSES.includes(o.orderStatus)).length;

  const filteredOrders = orders.filter((order) => {
    if (currentTab === 'tracking') {
      return ACTIVE_STATUSES.includes(order.orderStatus);
    }
    if (currentTab === 'returns') {
      return RETURN_CANCEL_STATUSES.includes(order.orderStatus);
    }
    return true;
  });

  const handleTabChange = (tabKey) => {
    if (tabKey === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabKey });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#ED1C2E] animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading Orders...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#FFFFFF] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#30358F]/10 text-[#30358F] text-[10px] font-black uppercase tracking-wider mb-2">
            <Flag className="w-3.5 h-3.5 text-[#F7941D]" />
            <span>BUY INDIAN • BUILD INDIA</span>
          </div>
          <h1 className="text-2xl font-black text-[#222222] tracking-tight">
            {currentTab === 'tracking'
              ? 'Track Active Shipments'
              : currentTab === 'returns'
              ? 'Returns & Cancellations'
              : 'My Marketplace Orders'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {currentTab === 'tracking'
              ? 'Real-time dispatch, transit, and delivery progress for your orders'
              : currentTab === 'returns'
              ? 'Review return requests, cancelled orders, and refund status'
              : 'Track orders, review payment status, and download tax invoices'}
          </p>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#ED1C2E] hover:bg-[#D91425] text-white text-xs font-black uppercase tracking-wider transition-all shadow-xs self-start sm:self-auto"
        >
          <span>Shop Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            currentTab === 'all'
              ? 'bg-[#30358F] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>All Orders</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              currentTab === 'all' ? 'bg-[#252972] text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('tracking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            currentTab === 'tracking'
              ? 'bg-[#30358F] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Track Active</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              currentTab === 'tracking' ? 'bg-[#252972] text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {activeOrdersCount}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('returns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            currentTab === 'returns'
              ? 'bg-[#30358F] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Returns & Refunds</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              currentTab === 'returns' ? 'bg-[#252972] text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {returnOrdersCount}
          </span>
        </button>
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center text-slate-500 space-y-3 shadow-xs">
          {currentTab === 'tracking' ? (
            <>
              <Truck className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-base font-bold text-[#222222]">No active shipments in transit</p>
              <p className="text-xs text-slate-500">All of your recent orders have either been delivered or concluded.</p>
            </>
          ) : currentTab === 'returns' ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-base font-bold text-[#222222]">No return requests or cancelled orders</p>
              <p className="text-xs text-slate-500">All your orders are in good standing.</p>
            </>
          ) : (
            <>
              <Package className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-base font-bold text-[#222222]">No orders placed yet</p>
              <p className="text-xs text-slate-500">Explore verified Indian products in our marketplace catalog.</p>
            </>
          )}

          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#ED1C2E] hover:bg-[#D91425] text-white text-xs font-black uppercase tracking-wider transition-all shadow-xs"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPaid = order.paymentStatus === 'PAID';
            const isUnpaid = order.paymentStatus !== 'PAID' && order.paymentMethod !== 'COD' && order.orderStatus !== 'CANCELLED';

            return (
              <div key={order._id} className="bg-white border border-slate-200/90 p-6 rounded-3xl space-y-4 hover:border-[#ED1C2E]/30 shadow-xs transition-all">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#222222]">Order #{order.orderNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({order.publicOrderId || order._id})</span>
                    </div>
                    <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Payment Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : order.paymentStatus === 'FAILED'
                          ? 'bg-red-50 text-[#ED1C2E] border border-red-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      Payment: {isPaid ? 'PAID' : 'NOT PAID'}
                    </span>

                    {/* Order Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${
                        order.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : order.orderStatus === 'CANCELLED' || order.orderStatus === 'RETURNED'
                          ? 'bg-red-50 text-[#ED1C2E] border-red-200'
                          : 'bg-[#30358F]/10 text-[#30358F] border-[#30358F]/20'
                      }`}
                    >
                      {order.orderStatus?.replace(/_/g, ' ')}
                    </span>

                    <span className="text-base font-black text-[#222222] ml-2">₹{order.total || order.grandTotal}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-[#F7F7F9] border border-slate-100 p-3 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || item.productImageSnapshot || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 shrink-0 p-1"
                        />
                        <div>
                          <div className="font-bold text-[#222222] text-xs">{item.name || item.productNameSnapshot}</div>
                          <div className="text-slate-500 text-[11px]">Qty: {item.quantity} × ₹{item.price || item.unitPrice}</div>
                        </div>
                      </div>
                      <span className="font-black text-[#222222]">₹{((item.price || item.unitPrice) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions & Pricing Breakdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      to={`/customer/orders/${order._id}`}
                      className="px-4 py-2 rounded-xl bg-[#30358F] hover:bg-[#252972] text-white font-bold text-xs transition-all shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>View Details & Tracking</span>
                    </Link>

                    <button
                      onClick={() => handleDownloadInvoice(order._id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition inline-flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#30358F]" />
                      <span>Download Tax Invoice</span>
                    </button>
                  </div>

                  {isUnpaid && (
                    <Link
                      to={`/customer/orders/${order._id}`}
                      className="px-4 py-2 rounded-xl bg-[#ED1C2E] hover:bg-[#D91425] text-white font-bold text-xs transition inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Complete Payment</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
