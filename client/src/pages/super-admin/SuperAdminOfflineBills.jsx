import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Building,
  Calendar,
  IndianRupee,
  User,
  AlertTriangle,
  FileText,
  Coins,
  Loader2,
  X,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SuperAdminOfflineBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [billToReject, setBillToReject] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchBills();
  }, [statusFilter]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const endpoint = statusFilter === 'ALL'
        ? '/admin/offline-bills'
        : `/admin/offline-bills?status=${statusFilter}`;
      const res = await api.get(endpoint);
      if (res.data?.success) {
        setBills(res.data.data.bills || []);
      }
    } catch (err) {
      console.error('Failed to fetch offline bills for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bill) => {
    if (!window.confirm(`Approve bill #${bill.billNumber} from ${bill.customerId?.name || 'Customer'}? 500 Fair Coins will be credited to customer.`)) {
      return;
    }

    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await api.post(`/admin/offline-bills/${bill._id}/approve`);
      if (res.data?.success) {
        setMsg({ type: 'success', text: `Bill approved! 500 Fair Coins successfully credited to ${bill.customerId?.name || 'customer'}.` });
        fetchBills();
        if (selectedBill?._id === bill._id) {
          setSelectedBill(null);
        }
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to approve bill.' });
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (bill) => {
    setBillToReject(bill);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await api.post(`/admin/offline-bills/${billToReject._id}/reject`, {
        reason: rejectReason.trim()
      });
      if (res.data?.success) {
        setMsg({ type: 'success', text: `Bill #${billToReject.billNumber} rejected.` });
        setShowRejectModal(false);
        setBillToReject(null);
        fetchBills();
        if (selectedBill?._id === billToReject._id) {
          setSelectedBill(null);
        }
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reject bill.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.billNumber?.toLowerCase().includes(q) ||
      b.storeName?.toLowerCase().includes(q) ||
      b.customerId?.name?.toLowerCase().includes(q) ||
      b.customerId?.email?.toLowerCase().includes(q)
    );
  });

  const counts = {
    all: bills.length,
    pending: bills.filter(b => b.status === 'SUBMITTED' || b.status === 'UNDER_REVIEW').length,
    approved: bills.filter(b => b.status === 'APPROVED').length,
    rejected: bills.filter(b => b.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <Receipt className="w-4 h-4" />
            <span>Super Admin Module</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Offline Bill Verification</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review customer store receipts. Upon approval, 500 Fair Coins will be credited to the customer balance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold border border-amber-200 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Standard Reward: 500 Fair Coins</span>
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ type: '', text: '' })} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Total Submissions</div>
          <div className="text-2xl font-black mt-1">{counts.all}</div>
        </div>

        <div
          onClick={() => setStatusFilter('SUBMITTED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'SUBMITTED' ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20' : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Pending Review</div>
          <div className="text-2xl font-black mt-1">{counts.pending}</div>
        </div>

        <div
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'APPROVED' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Approved</div>
          <div className="text-2xl font-black mt-1">{counts.approved}</div>
        </div>

        <div
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'REJECTED' ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20' : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Rejected</div>
          <div className="text-2xl font-black mt-1">{counts.rejected}</div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search store, bill number, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'SUBMITTED' ? 'In Review' : st === 'APPROVED' ? 'Approved' : 'Rejected'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading bills...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Offline Bills Found</h3>
            <p className="text-xs text-slate-500">There are no bill receipts matching your current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Store Name</th>
                  <th className="py-3.5 px-4">Bill No. & Date</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Receipt</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{bill.customerId?.name || 'Unknown Customer'}</div>
                      <div className="text-[11px] text-slate-500">{bill.customerId?.email || ''}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{bill.storeName}</div>
                      {bill.storeAddress && <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{bill.storeAddress}</div>}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">#{bill.billNumber}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(bill.billDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-black text-slate-900">
                      ₹{bill.purchaseAmount?.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      {bill.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Approved (+500 Coins)
                        </span>
                      )}
                      {(bill.status === 'SUBMITTED' || bill.status === 'UNDER_REVIEW') && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending Review
                        </span>
                      )}
                      {bill.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {bill.fileUrl ? (
                        <button
                          onClick={() => setPreviewImage(bill.fileUrl)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No file</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {bill.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleApprove(bill)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve (+500)</span>
                          </button>
                        )}
                        {bill.status !== 'REJECTED' && (
                          <button
                            onClick={() => openRejectModal(bill)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && billToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Reject Offline Bill</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please state the reason for rejecting bill #{billToReject.billNumber} from {billToReject.customerId?.name}.
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <textarea
                required
                rows={3}
                placeholder="E.g., Receipt image blurry, date older than 30 days, or store name mismatch."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Image Lightbox Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-4 shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <span className="text-xs font-bold text-slate-800">Bill Receipt Preview</span>
              <button onClick={() => setPreviewImage(null)} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center rounded-2xl bg-slate-900/5 p-2">
              <img src={previewImage} alt="Receipt Preview" className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-xs" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminOfflineBills;
