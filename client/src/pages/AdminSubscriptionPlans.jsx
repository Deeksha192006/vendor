import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Tag,
  Calendar,
  Users,
  Sparkles,
  RefreshCw,
  X,
  Check,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminSubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    inactivePlans: 0,
    totalActiveSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Form state
  const [formData, setFormData] = useState({
    _id: null,
    name: '',
    planType: 'Monthly',
    durationValue: 1,
    durationUnit: 'months',
    price: '',
    discount: '',
    description: '',
    benefits: ['Free Delivery on All Orders', '2x Reward Coins', 'Priority Support'],
    badge: '',
    status: 'Active'
  });

  const [benefitInput, setBenefitInput] = useState('');

  useEffect(() => {
    fetchPlans();
  }, [statusFilter, sortBy]);

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), 4000);
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (sortBy) params.sortBy = sortBy;

      const res = await api.get('/admin/subscription-plans', { params });
      if (res.data?.data) {
        setPlans(res.data.data.plans || []);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load subscription plans:', err);
      showAlert('error', err.response?.data?.message || 'Error fetching subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPlans();
  };

  const handlePlanTypeChange = (type) => {
    let dVal = 1;
    let dUnit = 'months';

    if (type === 'Monthly') {
      dVal = 1;
      dUnit = 'months';
    } else if (type === 'Quarterly') {
      dVal = 3;
      dUnit = 'months';
    } else if (type === 'Half-Yearly') {
      dVal = 6;
      dUnit = 'months';
    } else if (type === 'Annual') {
      dVal = 12;
      dUnit = 'months';
    } else if (type === 'Custom') {
      dVal = formData.durationValue || 1;
      dUnit = formData.durationUnit || 'months';
    }

    setFormData({
      ...formData,
      planType: type,
      durationValue: dVal,
      durationUnit: dUnit
    });
  };

  const openCreateModal = () => {
    setFormData({
      _id: null,
      name: '',
      planType: 'Monthly',
      durationValue: 1,
      durationUnit: 'months',
      price: '',
      discount: '',
      description: '',
      benefits: [
        'Free Standard Delivery on All Orders',
        '2x Fair Coins on Every Purchase',
        'VIP Member Badge & Exclusive Flash Sales',
        'Priority 24/7 Dedicated Customer Care'
      ],
      badge: '',
      status: 'Active'
    });
    setBenefitInput('');
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setFormData({
      _id: plan._id,
      name: plan.name || '',
      planType: plan.planType || 'Custom',
      durationValue: plan.durationValue || 1,
      durationUnit: plan.durationUnit || 'months',
      price: plan.price ?? '',
      discount: plan.discount ?? '',
      description: plan.description || '',
      benefits: Array.isArray(plan.benefits) && plan.benefits.length > 0 ? plan.benefits : ['Free Express Delivery'],
      badge: plan.badge || '',
      status: plan.status === 'Active' || plan.status === 'ACTIVE' ? 'Active' : 'Inactive'
    });
    setBenefitInput('');
    setShowModal(true);
  };

  const openViewModal = (plan) => {
    setSelectedPlan(plan);
    setShowViewModal(true);
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, benefitInput.trim()]
      });
      setBenefitInput('');
    }
  };

  const removeBenefit = (index) => {
    const updated = formData.benefits.filter((_, i) => i !== index);
    setFormData({ ...formData, benefits: updated });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showAlert('error', 'Plan Name is required');
      return;
    }
    if (formData.price === '' || Number(formData.price) < 0) {
      showAlert('error', 'Subscription Price must be 0 or greater');
      return;
    }
    if (Number(formData.durationValue) <= 0) {
      showAlert('error', 'Duration must be greater than 0');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        name: formData.name.trim(),
        planType: formData.planType,
        durationValue: Number(formData.durationValue),
        durationUnit: formData.durationUnit,
        price: Number(formData.price),
        discount: Number(formData.discount || 0),
        description: formData.description.trim(),
        benefits: formData.benefits,
        badge: formData.badge.trim(),
        status: formData.status
      };

      if (formData._id) {
        await api.put(`/admin/subscription-plans/${formData._id}`, payload);
        showAlert('success', `Plan "${formData.name}" updated successfully!`);
      } else {
        await api.post('/admin/subscription-plans', payload);
        showAlert('success', `New Plan "${formData.name}" created and made live!`);
      }

      setShowModal(false);
      fetchPlans();
    } catch (err) {
      console.error('Error saving plan:', err);
      showAlert('error', err.response?.data?.message || 'Failed to save subscription plan');
    } finally {
      setActionLoading(false);
    }
  };

  // Status toggle confirmation
  const initiateToggleStatus = (plan) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedPlan) return;
    try {
      setActionLoading(true);
      const isCurrentlyActive = selectedPlan.status === 'Active' || selectedPlan.status === 'ACTIVE';
      const newStatus = isCurrentlyActive ? 'Inactive' : 'Active';

      await api.patch(`/admin/subscription-plans/${selectedPlan._id}/status`, { status: newStatus });
      showAlert('success', `Plan "${selectedPlan.name}" is now ${newStatus}!`);
      setShowConfirmModal(false);
      fetchPlans();
    } catch (err) {
      console.error('Error updating plan status:', err);
      showAlert('error', err.response?.data?.message || 'Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete confirmation
  const initiateDelete = (plan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPlan) return;
    try {
      setActionLoading(true);
      const res = await api.delete(`/admin/subscription-plans/${selectedPlan._id}`);
      showAlert('success', res.data?.message || `Plan "${selectedPlan.name}" removed successfully`);
      setShowDeleteModal(false);
      fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
      showAlert('error', err.response?.data?.message || 'Failed to delete plan');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Alert Banner */}
      <AnimatePresence>
        {alertMsg.text && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm ${
              alertMsg.type === 'error'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {alertMsg.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#ED1C2E] mb-1">
            <Crown className="w-4 h-4 text-[#F7941D]" />
            <span>BAAPOO MART VIP PASS MANAGEMENT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#30358F] tracking-tight">
            Customer Subscription Plan Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure, publish, and manage dynamic customer membership tiers. Changes sync instantly to customer storefronts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPlans}
            disabled={loading}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 transition text-xs font-bold flex items-center gap-1.5"
            title="Refresh Plans"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#ED1C2E]' : 'text-slate-600'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-[#ED1C2E] to-[#F7941D] hover:from-[#d01727] hover:to-[#e08316] text-white rounded-2xl text-xs font-black shadow-md shadow-red-500/20 flex items-center gap-2 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Plan</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Plans */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Plans</div>
            <div className="text-2xl sm:text-3xl font-black text-[#30358F] mt-1">{stats.totalPlans}</div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">All configured tiers</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#30358F] flex items-center justify-center border border-blue-100">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        {/* Active Plans */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Active Plans</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{stats.activePlans}</div>
            <div className="text-[10px] text-emerald-600/80 font-semibold mt-0.5">Live on customer app</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Inactive Plans */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">Inactive Plans</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-600 mt-1">{stats.inactivePlans}</div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Hidden from store</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Active Subscribers */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-[#ED1C2E]">Subscribers</div>
            <div className="text-2xl sm:text-3xl font-black text-[#ED1C2E] mt-1">{stats.totalActiveSubscriptions}</div>
            <div className="text-[10px] text-[#F7941D] font-bold mt-0.5">Active VIP members</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#ED1C2E] flex items-center justify-center border border-red-100">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plan by name or description..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#30358F] focus:bg-white transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="created">Recently Added</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Plans Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-5">Plan Name</th>
                <th className="py-4 px-4">Plan Type & Duration</th>
                <th className="py-4 px-4">Price (₹)</th>
                <th className="py-4 px-4">Subscribers</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Created Date</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#ED1C2E] mb-2" />
                    <span>Loading customer subscription plans...</span>
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Crown className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No subscription plans found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Click "Add New Plan" above to create your first customer tier.</p>
                  </td>
                </tr>
              ) : (
                plans.map((plan) => {
                  const isActive = plan.status === 'Active' || plan.status === 'ACTIVE';
                  const formattedDuration = `${plan.durationValue} ${plan.durationUnit || 'months'}`;
                  const netPrice = Math.max(0, (plan.price || 0) - (plan.discount || 0));

                  return (
                    <tr key={plan._id} className="hover:bg-slate-50/70 transition">
                      {/* Plan Name & Badge */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="font-black text-slate-900 text-sm">{plan.name}</div>
                          {plan.badge && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {plan.description || 'No description provided'}
                        </div>
                      </td>

                      {/* Duration & Type */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>{formattedDuration}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
                          Tier: {plan.planType || 'Standard'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4">
                        <div className="font-mono font-black text-slate-900 text-sm">
                          ₹{netPrice.toLocaleString('en-IN')}
                        </div>
                        {plan.discount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <span className="line-through text-slate-400 font-mono">₹{plan.price}</span>
                            <span>Save ₹{plan.discount}</span>
                          </div>
                        )}
                      </td>

                      {/* Subscribers */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-red-50 text-[#ED1C2E] border border-red-100 font-black rounded-xl text-xs font-mono">
                          {plan.subscribers || 0} active
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(plan.createdAt || Date.now()).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <button
                            onClick={() => openViewModal(plan)}
                            className="p-1.5 text-slate-500 hover:text-[#30358F] hover:bg-blue-50 rounded-lg transition"
                            title="View Plan Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(plan)}
                            className="p-1.5 text-slate-500 hover:text-[#ED1C2E] hover:bg-red-50 rounded-lg transition"
                            title="Edit Plan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Activate / Deactivate Toggle */}
                          <button
                            onClick={() => initiateToggleStatus(plan)}
                            className={`p-1.5 rounded-lg transition ${
                              isActive
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isActive ? 'Deactivate Plan' : 'Activate Plan'}
                          >
                            {isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => initiateDelete(plan)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE & EDIT PLAN MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-[#30358F] to-[#20246a] text-white flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[#F7941D]" />
                    <span>{formData._id ? 'Edit Customer Subscription Plan' : 'Create New Customer Subscription Plan'}</span>
                  </h2>
                  <p className="text-xs text-blue-100/80 mt-0.5">
                    {formData._id ? 'Update plan settings. Existing subscribers keep their current term.' : 'Define a new VIP membership tier for BAAPOO MART customers.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
                {/* 1. Plan Name & Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-black mb-1">
                      Plan Name <span className="text-[#ED1C2E]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Monthly Pass, Festive Annual Plan..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:outline-none focus:border-[#30358F] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-black mb-1">
                      Display Badge (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="e.g. Popular, Best Value"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-[#30358F] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* 2. Plan Type Selector (Monthly, Quarterly, Half-Yearly, Annual, Custom) */}
                <div>
                  <label className="block text-slate-700 font-black mb-1.5">
                    Plan Duration Type <span className="text-[#ED1C2E]">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {['Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'Custom'].map((type) => {
                      const isSelected = formData.planType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handlePlanTypeChange(type)}
                          className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                            isSelected
                              ? 'bg-[#30358F] text-white border-[#30358F] shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Duration Values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="block text-slate-700 font-black mb-1">
                      Duration Value <span className="text-[#ED1C2E]">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.durationValue}
                      onChange={(e) => setFormData({ ...formData, durationValue: Math.max(1, Number(e.target.value)) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#30358F]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-black mb-1">Duration Unit</label>
                    <select
                      value={formData.durationUnit}
                      onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:outline-none focus:border-[#30358F]"
                    >
                      <option value="months">Months (True calendar-month)</option>
                      <option value="days">Days</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>

                {/* 4. Price & Discount */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-black mb-1">
                      Subscription Price (₹) <span className="text-[#ED1C2E]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="199"
                        className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 text-sm focus:outline-none focus:border-[#30358F] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-black mb-1">
                      Promotional Discount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        placeholder="0"
                        className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 text-sm focus:outline-none focus:border-[#30358F] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-black mb-1">Initial Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:outline-none focus:border-[#30358F] focus:bg-white transition"
                    >
                      <option value="Active">Active (Publish immediately)</option>
                      <option value="Inactive">Inactive (Draft / Hidden)</option>
                    </select>
                  </div>
                </div>

                {/* 5. Description */}
                <div>
                  <label className="block text-slate-700 font-black mb-1">Plan Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief highlights of this membership plan for the customer..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:border-[#30358F] focus:bg-white transition resize-none"
                  />
                </div>

                {/* 6. Benefits & Features */}
                <div>
                  <label className="block text-slate-700 font-black mb-1">
                    Plan Benefits & Features
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addBenefit();
                        }
                      }}
                      placeholder="e.g. Free Delivery, 2x Fair Coins, Daily Spin Wheel..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:outline-none focus:border-[#30358F] focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={addBenefit}
                      className="px-4 py-2 bg-[#30358F] hover:bg-[#20246a] text-white rounded-xl font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {formData.benefits.map((b, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 text-xs"
                      >
                        <span className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{b}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBenefit(idx)}
                          className="text-slate-400 hover:text-rose-600 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#ED1C2E] to-[#F7941D] hover:from-[#d01727] hover:to-[#e08316] text-white rounded-xl font-black shadow-md shadow-red-500/20 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{formData._id ? 'Update Plan' : 'Publish Plan'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW PLAN DETAILS MODAL */}
      <AnimatePresence>
        {showViewModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#F7941D]" />
                  <h3 className="text-lg font-black text-slate-900">{selectedPlan.name}</h3>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Duration</span>
                    <p className="text-sm font-black text-slate-800 mt-0.5">
                      {selectedPlan.durationValue} {selectedPlan.durationUnit || 'months'} ({selectedPlan.planType || 'Custom'})
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Net Price</span>
                    <p className="text-sm font-black font-mono text-[#30358F] mt-0.5">
                      ₹{Math.max(0, (selectedPlan.price || 0) - (selectedPlan.discount || 0)).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Current Status</span>
                    <p className="mt-0.5">
                      {selectedPlan.status === 'Active' || selectedPlan.status === 'ACTIVE' ? (
                        <span className="text-emerald-700 font-black">Active (Live)</span>
                      ) : (
                        <span className="text-slate-500 font-black">Inactive (Hidden)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Subscribers</span>
                    <p className="text-sm font-black text-[#ED1C2E] mt-0.5">{selectedPlan.subscribers || 0} customers</p>
                  </div>
                </div>

                {selectedPlan.description && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Description</span>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      {selectedPlan.description}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1.5">Configured Benefits</span>
                  <div className="space-y-1.5">
                    {Array.isArray(selectedPlan.benefits) && selectedPlan.benefits.length > 0 ? (
                      selectedPlan.benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400">No custom benefits listed.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ACTIVATE / DEACTIVATE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirmModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${
                  selectedPlan.status === 'Active' || selectedPlan.status === 'ACTIVE'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedPlan.status === 'Active' || selectedPlan.status === 'ACTIVE'
                      ? 'Deactivate Subscription Plan?'
                      : 'Activate Subscription Plan?'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Plan: <strong className="text-slate-800">{selectedPlan.name}</strong>
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed space-y-2">
                {selectedPlan.status === 'Active' || selectedPlan.status === 'ACTIVE' ? (
                  <>
                    <p>
                      • This plan will be <strong>hidden from new customer purchases</strong> immediately.
                    </p>
                    <p>
                      • <strong>Existing subscribers will NOT be cancelled</strong> and will continue receiving their benefits until their current expiry date.
                    </p>
                  </>
                ) : (
                  <p>
                    • This plan will be made <strong>immediately live and available for purchase</strong> on the customer subscription page.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmToggleStatus}
                  disabled={actionLoading}
                  className={`px-5 py-2 text-white rounded-xl font-black text-xs transition shadow-sm ${
                    selectedPlan.status === 'Active' || selectedPlan.status === 'ACTIVE'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {actionLoading ? 'Updating...' : selectedPlan.status === 'Active' || selectedPlan.status === 'ACTIVE' ? 'Yes, Deactivate' : 'Yes, Activate'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Delete Subscription Plan?</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Plan: <strong className="text-slate-800">{selectedPlan.name}</strong>
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-rose-50/50 p-4 rounded-2xl border border-rose-100 leading-relaxed">
                <p>
                  To protect historical customer records and audit logs, plans with existing subscriber history will be <strong>safely archived/deactivated</strong> rather than permanently wiped.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs transition shadow-sm"
                >
                  {actionLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSubscriptionPlans;
