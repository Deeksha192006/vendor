import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  Crown,
  Store,
  RefreshCw,
  Coins,
  DollarSign,
  X,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL'); // 'ALL' | 'SUPER_ADMIN' | 'VENDOR'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await superAdminService.getAdminOrders();
      setOrders(res.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const filteredOrders = orders.filter((o) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const num = o.orderNumber?.toLowerCase() || '';
      const name = o.userId?.name?.toLowerCase() || '';
      const email = o.userId?.email?.toLowerCase() || '';
      if (!num.includes(term) && !name.includes(term) && !email.includes(term)) return false;
    }

    if (sourceFilter === 'SUPER_ADMIN') {
      const hasSA = o.items?.some((i) => i.sourceType === 'SUPER_ADMIN' || !i.vendorId);
      if (!hasSA) return false;
    }
    if (sourceFilter === 'VENDOR') {
      const hasVendor = o.items?.some((i) => i.sourceType === 'VENDOR' && i.vendorId);
      if (!hasVendor) return false;
    }

    return true;
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-600 text-white shadow-md">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Super Admin Product Sales & Orders</h1>
            <p className="text-xs text-slate-500">
              Audit all product order transactions across Super Admin Direct sales and merchant vendor sales.
            </p>
          </div>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Orders</span>
        </button>
      </motion.div>

      {/* Search & Filter Toolbar */}
      <motion.div variants={itemVariants} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search order number, customer name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-2xl bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
            <button
              onClick={() => setSourceFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                sourceFilter === 'ALL' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setSourceFilter('SUPER_ADMIN')}
              className={`px-3 py-1.5 rounded-lg transition ${
                sourceFilter === 'SUPER_ADMIN' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              👑 Super Admin Direct Sales
            </button>
            <button
              onClick={() => setSourceFilter('VENDOR')}
              className={`px-3 py-1.5 rounded-lg transition ${
                sourceFilter === 'VENDOR' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              🏪 Vendor Sales
            </button>
          </div>
        </div>
      </motion.div>

      {/* Orders Table */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Product Sales Ledger ({filteredOrders.length})
        </h3>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Loading order records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order Number & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Purchased Items</th>
                  <th className="py-3 px-4">Fair Coins Used</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-900">{o.orderNumber || o.publicOrderId}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{o.userId?.name || o.deliveryAddressSnapshot?.name || 'Customer'}</p>
                        <p className="text-[11px] text-slate-500">{o.userId?.email || 'N/A'}</p>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate">
                          {o.items?.map((i) => i.name || i.productNameSnapshot).join(', ')}
                        </p>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                          {o.items?.length || 1} Item(s)
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-700">
                        {o.fairCoinsUsed > 0 ? (
                          <span className="flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            {o.fairCoinsUsed} Coins
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0 Coins</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-900">
                        ₹{(o.grandTotal || o.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> {o.paymentStatus || 'PAID'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                          {o.orderStatus || 'CONFIRMED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openOrderModal(o)}
                          className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" /> View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No orders found for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Order Detail Inspector Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4"
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                Product Order Record
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">{selectedOrder.orderNumber}</h3>
              <p className="text-xs text-slate-500">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Customer Name:</span>
                <span className="font-bold text-slate-900">{selectedOrder.userId?.name || 'Customer'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Customer Email:</span>
                <span className="font-mono text-slate-800">{selectedOrder.userId?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Total Paid Amount:</span>
                <span className="font-mono font-black text-slate-900 text-base">₹{(selectedOrder.grandTotal || selectedOrder.total || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-semibold">Fair Coins Used:</span>
                <span className="font-mono font-bold text-amber-700">{selectedOrder.fairCoinsUsed || 0} Coins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Payment Status:</span>
                <span className="font-bold text-emerald-700">{selectedOrder.paymentStatus || 'PAID'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Ordered Items</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{item.name || item.productNameSnapshot}</p>
                      <span className="text-[10px] text-slate-400 font-mono">Qty: {item.quantity}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Close Details
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SuperAdminOrders;
