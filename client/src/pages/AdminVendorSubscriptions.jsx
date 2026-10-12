import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  Users,
  Sparkles,
  RefreshCw,
  X,
  Check,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Percent,
  Layers,
  Store,
  Clock,
  Package,
  Sliders,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminVendorSubscriptions = () => {
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'ledger'
  const [plans, setPlans] = useState([]);
  const [summary, setSummary] = useState({
    totalPlans: 0,
    activePlans: 0,
    inactivePlans: 0,
    totalActiveSubscriptions: 0,
    totalVendorsWithActiveSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Subscribers Ledger state
  const [ledgerSubscriptions, setLedgerSubscriptions] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState('ALL');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Form State
  const initialFormData = {
    _id: null,
    name: '',
    planType: 'Monthly',
    durationValue: 1,
    durationUnit: 'months',
    price: '',
    discount: '',
    description: '',
    benefits: [
      'Catalog Allowance: Up to 50 Active Products',
      'Standard Order & Inventory Management',
      'Standard Payout & Settlement Clearance',
      'Ticket & Email Merchant Support',
    ],
    featureLimits: {
      maxProducts: 50,
      analyticsAccess: true,
      prioritySupport: false,
      promotionalPlacement: false,
      storeCustomization: false,
      orderManagementTools: true,
    },
    badge: '',
    status: 'Active',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [benefitInput, setBenefitInput] = useState('');

  useEffect(() => {
    fetchPlans();
  }, [statusFilter]);

  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchLedger();
    }
  }, [activeTab, ledgerStatusFilter]);

  const showAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg({ type: '', text: '' }), 4000);
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/admin/vendor-subscription-plans', { params });
      if (res.data?.data) {
        setPlans(res.data.data.plans || []);
        if (res.data.data.summary) {
          setSummary(res.data.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load vendor subscription plans:', err);
      showAlert('error', err.response?.data?.message || 'Error fetching vendor subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      setLedgerLoading(true);
      const params = {};
      if (ledgerStatusFilter !== 'ALL') params.status = ledgerStatusFilter;
      if (ledgerSearch.trim()) params.search = ledgerSearch.trim();

      const res = await api.get('/admin/vendor-subscriptions', { params });
      if (res.data?.data) {
        setLedgerSubscriptions(res.data.data.subscriptions || []);
      }
    } catch (err) {
      console.error('Failed to load vendor subscriptions ledger:', err);
      showAlert('error', err.response?.data?.message || 'Error loading subscriptions ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  const handlePlanTypeChange = (type) => {
    let durationValue = 1;
    let durationUnit = 'months';
    let defaultPrice = formData.price;
    let defaultBadge = formData.badge;

    switch (type) {
      case 'Monthly':
        durationValue = 1;
        durationUnit = 'months';
        break;
      case 'Quarterly':
        durationValue = 3;
        durationUnit = 'months';
        defaultBadge = defaultBadge || 'Popular';
        break;
      case 'Half-Yearly':
        durationValue = 6;
        durationUnit = 'months';
        break;
      case 'Annual':
        durationValue = 12;
        durationUnit = 'months';
        defaultBadge = defaultBadge || 'Best Value';
        break;
      case 'Custom':
        durationValue = formData.durationValue || 1;
        durationUnit = formData.durationUnit || 'months';
        break;
      default:
        break;
    }

    setFormData((prev) => ({
      ...prev,
      planType: type,
      durationValue,
      durationUnit,
      badge: defaultBadge,
    }));
  };

  const handleAddBenefit = () => {
    if (benefitInput.trim() && !formData.benefits.includes(benefitInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()],
      }));
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (index) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const openAddModal = () => {
    setFormData(initialFormData);
    setBenefitInput('');
    setShowAddModal(true);
  };

  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      _id: plan._id,
      name: plan.name,
      planType: plan.planType || 'Monthly',
      durationValue: plan.durationValue || 1,
      durationUnit: plan.durationUnit || 'months',
      price: plan.price,
      discount: plan.discount || 0,
      description: plan.description || '',
      benefits: Array.isArray(plan.benefits) ? [...plan.benefits] : [],
      featureLimits: {
        maxProducts: plan.featureLimits?.maxProducts ?? 50,
        analyticsAccess: plan.featureLimits?.analyticsAccess !== false,
        prioritySupport: Boolean(plan.featureLimits?.prioritySupport),
        promotionalPlacement: Boolean(plan.featureLimits?.promotionalPlacement),
        storeCustomization: Boolean(plan.featureLimits?.storeCustomization),
        orderManagementTools: plan.featureLimits?.orderManagementTools !== false,
      },
      badge: plan.badge || '',
      status: plan.status || 'Active',
    });
    setBenefitInput('');
    setShowEditModal(true);
  };

  const openViewModal = (plan) => {
    setSelectedPlan(plan);
    setShowViewModal(true);
  };

  const openStatusConfirmModal = (plan) => {
    setSelectedPlan(plan);
    setShowStatusConfirmModal(true);
  };

  const openDeleteModal = (plan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  };

  // Save Plan (Create / Update)
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showAlert('error', 'Plan Name is required');
      return;
    }
    if (formData.price === '' || Number(formData.price) < 0) {
      showAlert('error', 'Valid Subscription Price is required');
      return;
    }
    if (formData.durationValue <= 0) {
      showAlert('error', 'Duration value must be greater than 0');
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
        discount: Number(formData.discount) || 0,
        description: formData.description.trim(),
        benefits: formData.benefits,
        featureLimits: formData.featureLimits,
        badge: formData.badge.trim(),
        status: formData.status,
      };

      if (formData._id) {
        // Update Plan
        await api.put(`/admin/vendor-subscription-plans/${formData._id}`, payload);
        showAlert('success', `Vendor Plan "${formData.name}" updated successfully!`);
        setShowEditModal(false);
      } else {
        // Create Plan
        await api.post('/admin/vendor-subscription-plans', payload);
        showAlert('success', `New Vendor Plan "${formData.name}" created successfully!`);
        setShowAddModal(false);
      }
      fetchPlans();
    } catch (err) {
      console.error('Error saving vendor plan:', err);
      showAlert('error', err.response?.data?.message || 'Failed to save vendor plan');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Plan Status (Activate / Deactivate)
  const handleToggleStatus = async () => {
    if (!selectedPlan) return;
    try {
      setActionLoading(true);
      const isCurrentlyActive = selectedPlan.status === 'Active' || selectedPlan.status === 'ACTIVE';
      const newStatus = isCurrentlyActive ? 'Inactive' : 'Active';

      await api.patch(`/admin/vendor-subscription-plans/${selectedPlan._id}/status`, {
        status: newStatus,
      });

      showAlert(
        'success',
        `Plan "${selectedPlan.name}" has been ${newStatus === 'Active' ? 'Activated' : 'Deactivated'} successfully.`
      );
      setShowStatusConfirmModal(false);
      fetchPlans();
    } catch (err) {
      console.error('Error toggling vendor plan status:', err);
      showAlert('error', err.response?.data?.message || 'Failed to update plan status');
    } finally {
      setActionLoading(false);
    }
  };

  // Safe Delete Plan
  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    try {
      setActionLoading(true);
      const res = await api.delete(`/admin/vendor-subscription-plans/${selectedPlan._id}`);
      const isSoft = res.data?.data?.isSoftDeleted;

      if (isSoft) {
        showAlert(
          'info',
          `Plan "${selectedPlan.name}" has active/past subscribers. It has been safely deactivated & archived.`
        );
      } else {
        showAlert('success', `Plan "${selectedPlan.name}" was permanently removed.`);
      }

      setShowDeleteModal(false);
      fetchPlans();
    } catch (err) {
      console.error('Error deleting vendor plan:', err);
      showAlert('error', err.response?.data?.message || 'Failed to delete vendor plan');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Search Plans locally
  const filteredPlans = plans.filter((p) => {
    if (typeFilter !== 'ALL' && p.planType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.planType && p.planType.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {alertMsg.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-semibold ${
              alertMsg.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : alertMsg.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {alertMsg.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            ) : alertMsg.type === 'info' ? (
              <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            )}
            <span>{alertMsg.text}</span>
            <button
              onClick={() => setAlertMsg({ type: '', text: '' })}
              className="ml-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#30358F] to-[#ED1C2E] flex items-center justify-center text-white shadow-md shadow-[#30358F]/20">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#F7941D] px-2 py-0.5 rounded-md">
                BAAPOO MART VENDOR ENGINE
              </span>
              <span className="text-[10px] font-bold text-slate-400">Strictly Isolated</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Vendor Subscription Management
            </h1>
            <p className="text-xs text-slate-500">
              Create, configure, and monitor dynamic subscription plans and entitlements for marketplace vendors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'plans') fetchPlans();
              else fetchLedger();
            }}
            className="p-3 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading || ledgerLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-[#ED1C2E] to-[#F7941D] hover:opacity-95 shadow-md shadow-[#ED1C2E]/25 transition"
          >
            <Plus className="w-4 h-4" />
            Add Vendor Plan
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (Section 3 Requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Plans */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Total Vendor Plans
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{summary.totalPlans}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Configured in Database</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#30358F] flex items-center justify-center font-black">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Active Plans */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider">
              Active Plans
            </p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{summary.activePlans}</h3>
            <p className="text-[10px] text-emerald-600 mt-0.5">Available for New Purchases</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Inactive Plans */}
        <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-amber-600 tracking-wider">
              Inactive Plans
            </p>
            <h3 className="text-2xl font-black text-amber-700 mt-1">{summary.inactivePlans}</h3>
            <p className="text-[10px] text-amber-600 mt-0.5">Hidden from Purchases</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Active Subscriptions */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#ED1C2E] tracking-wider">
              Active Subscriptions
            </p>
            <h3 className="text-2xl font-black text-[#ED1C2E] mt-1">
              {summary.totalActiveSubscriptions}
            </h3>
            <p className="text-[10px] text-rose-500 mt-0.5">Currently Paid & Active</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#ED1C2E] flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Total Vendors with Active Subscriptions */}
        <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#30358F] tracking-wider">
              Subscribed Vendors
            </p>
            <h3 className="text-2xl font-black text-[#30358F] mt-1">
              {summary.totalVendorsWithActiveSubscriptions}
            </h3>
            <p className="text-[10px] text-indigo-500 mt-0.5">Unique Merchant Accounts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#30358F] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Plans vs Ledger */}
      <div className="flex border-b border-slate-200 gap-8 text-sm font-bold">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'plans'
              ? 'border-[#ED1C2E] text-[#ED1C2E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Vendor Subscription Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'ledger'
              ? 'border-[#ED1C2E] text-[#ED1C2E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Subscribers Ledger ({summary.totalActiveSubscriptions} Active)
        </button>
      </div>

      {/* TAB 1: PLANS MANAGEMENT */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {/* Filters & Search Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vendor plans by name, benefits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#30358F]"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent focus:outline-none font-bold text-slate-900 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>

              {/* Duration / Type Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent focus:outline-none font-bold text-slate-900 cursor-pointer"
                >
                  <option value="ALL">All Durations</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Annual">Annual</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredPlans.length}</strong> of {plans.length} plans
            </div>
          </div>

          {/* Vendor Plans Management Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-[#ED1C2E] animate-spin" />
                <p className="text-xs font-bold text-slate-500">Loading vendor subscription plans...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Store className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-black text-slate-700">No Vendor Plans Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                    ? 'No plans match your current filters. Try resetting the filters.'
                    : 'Get started by creating your first vendor subscription plan.'}
                </p>
                <button
                  onClick={openAddModal}
                  className="mt-2 px-4 py-2 bg-[#ED1C2E] text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Create Plan Now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-6">Plan Name</th>
                      <th className="py-4 px-4">Duration</th>
                      <th className="py-4 px-4">Price</th>
                      <th className="py-4 px-4 text-center">Total Subscribed</th>
                      <th className="py-4 px-4 text-center">Active Subscribers</th>
                      <th className="py-4 px-4 text-center">Plan Status</th>
                      <th className="py-4 px-4">Created Date</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {filteredPlans.map((plan) => {
                      const isActive = plan.status === 'Active' || plan.status === 'ACTIVE';

                      return (
                        <tr key={plan._id} className="hover:bg-slate-50/80 transition group">
                          {/* Plan Name & Badge */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#30358F]/10 to-[#ED1C2E]/10 text-[#30358F] font-black flex items-center justify-center shrink-0">
                                {plan.planType === 'Monthly' ? '1M' : plan.planType === 'Quarterly' ? '3M' : plan.planType === 'Half-Yearly' ? '6M' : plan.planType === 'Annual' ? '1Y' : 'C'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900 group-hover:text-[#30358F] transition">
                                    {plan.name}
                                  </span>
                                  {plan.badge && (
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                      {plan.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate max-w-xs">
                                  {plan.description || 'No description provided'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Duration */}
                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-800">
                              {plan.durationValue}{' '}
                              {plan.durationUnit?.toLowerCase().startsWith('month')
                                ? plan.durationValue === 1
                                  ? 'Month'
                                  : 'Months'
                                : plan.durationUnit?.toLowerCase().startsWith('day')
                                ? plan.durationValue === 1
                                  ? 'Day'
                                  : 'Days'
                                : 'Years'}
                            </span>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase">
                              {plan.planType}
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-4 px-4">
                            <div className="font-black text-slate-900 text-sm">
                              ₹{plan.price?.toLocaleString('en-IN')}
                            </div>
                            {plan.discount > 0 && (
                              <div className="text-[10px] text-emerald-600 font-bold">
                                ₹{plan.discount} Off promo
                              </div>
                            )}
                          </td>

                          {/* Number of Vendors Subscribed */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 font-extrabold text-slate-700 text-xs">
                              {plan.totalSubscribers ?? 0}
                            </span>
                          </td>

                          {/* Active Subscribers */}
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg font-extrabold text-xs ${
                                (plan.activeSubscribers ?? 0) > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {plan.activeSubscribers ?? 0}
                            </span>
                          </td>

                          {/* Plan Status */}
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              {plan.status}
                            </span>
                          </td>

                          {/* Created Date */}
                          <td className="py-4 px-4 text-[11px] text-slate-500 font-mono">
                            {plan.createdAt
                              ? new Date(plan.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'System'}
                          </td>

                          {/* Actions: View, Edit, Activate/Deactivate, Delete */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View */}
                              <button
                                onClick={() => openViewModal(plan)}
                                className="p-2 text-slate-400 hover:text-[#30358F] hover:bg-slate-100 rounded-xl transition"
                                title="View Plan Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => openEditModal(plan)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                                title="Edit Plan"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Activate / Deactivate Toggle Button */}
                              <button
                                onClick={() => openStatusConfirmModal(plan)}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition border ${
                                  isActive
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                                title={isActive ? 'Deactivate this plan' : 'Activate this plan'}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => openDeleteModal(plan)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                title="Delete Plan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIBERS LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vendor subscriptions by store name, email..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Subscription Status:</span>
                <select
                  value={ledgerStatusFilter}
                  onChange={(e) => setLedgerStatusFilter(e.target.value)}
                  className="bg-transparent focus:outline-none font-bold text-slate-900 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>

            <button
              onClick={fetchLedger}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ledgerLoading ? 'animate-spin' : ''}`} />
              Reload Ledger
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {ledgerLoading ? (
              <div className="p-16 flex justify-center items-center">
                <RefreshCw className="w-8 h-8 text-[#ED1C2E] animate-spin" />
              </div>
            ) : ledgerSubscriptions.length === 0 ? (
              <div className="p-16 text-center text-slate-500 space-y-2">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">No Subscriptions Found</h3>
                <p className="text-xs text-slate-400">No vendors have subscribed yet or match the filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-6">Vendor / Store</th>
                      <th className="py-4 px-4">Plan Name Snapshot</th>
                      <th className="py-4 px-4">Amount Paid</th>
                      <th className="py-4 px-4">Start Date</th>
                      <th className="py-4 px-4">Expiry Date</th>
                      <th className="py-4 px-4">Days Left</th>
                      <th className="py-4 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {ledgerSubscriptions.map((sub) => {
                      const expTime = new Date(sub.expiryDate || sub.endDate).getTime();
                      const daysLeft = Math.max(0, Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24)));
                      const isSubActive = sub.status === 'ACTIVE' || sub.subscriptionStatus === 'Active';

                      return (
                        <tr key={sub._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-slate-900">
                              {sub.vendorId?.storeName || 'Merchant Store'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {sub.vendorId?.email || sub.vendorId?.phone || 'ID: ' + sub.vendorId?._id?.toString().slice(-6)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-800">
                              {sub.planNameSnapshot || sub.planId?.name || 'Vendor Plan'}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">
                              {sub.durationSnapshot?.planType || sub.billingCycle || 'Standard'}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-black text-slate-900">
                            ₹{(sub.planPriceSnapshot || sub.amount)?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-mono text-[11px]">
                            {new Date(sub.startDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-4 px-4 text-slate-800 font-mono text-[11px] font-bold">
                            {new Date(sub.expiryDate || sub.endDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                daysLeft > 10
                                  ? 'bg-blue-50 text-blue-700'
                                  : daysLeft > 0
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                isSubActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {sub.status || sub.subscriptionStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT PLAN MODAL (Sections 2 & 5 Requirement)     */}
      {/* ======================================================== */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#30358F] to-[#ED1C2E] flex items-center justify-center text-white">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {showEditModal ? 'Edit Vendor Subscription Plan' : 'Create New Vendor Plan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define duration, pricing, and seller feature entitlements.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-5 text-xs">
              {/* Row 1: Plan Name & Plan Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monthly Vendor Plan, Gold VIP"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#30358F]"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Plan Type *
                  </label>
                  <select
                    value={formData.planType}
                    onChange={(e) => handlePlanTypeChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="Monthly">Monthly (1 Month)</option>
                    <option value="Quarterly">Quarterly (3 Months)</option>
                    <option value="Half-Yearly">Half-Yearly (6 Months)</option>
                    <option value="Annual">Annual (12 Months)</option>
                    <option value="Custom">Custom Duration</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Duration Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
                <div>
                  <label className="block font-bold text-slate-700 text-[11px] mb-1">
                    Duration Value *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.durationValue}
                    onChange={(e) =>
                      setFormData({ ...formData, durationValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-[11px] mb-1">
                    Duration Unit *
                  </label>
                  <select
                    value={formData.durationUnit}
                    onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="months">Months (Calendar Months)</option>
                    <option value="days">Days</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Price & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Subscription Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 999"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#30358F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Promotional Discount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 200"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Badge & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Plan Badge (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Popular, Best Value, VIP"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="Active">Active (Available for purchase)</option>
                    <option value="Inactive">Inactive (Hidden from purchase)</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Plan Description */}
              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Plan Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Short tagline explaining this plan's benefits for vendors..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              {/* Row 6: Feature Entitlements Configuration (Section 5 Requirement) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#30358F]" />
                  <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
                    Configurable Vendor Feature Entitlements
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">
                      Max Active Products Allowance
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0 for Unlimited"
                      value={formData.featureLimits?.maxProducts ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          featureLimits: {
                            ...formData.featureLimits,
                            maxProducts: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold"
                    />
                    <span className="text-[10px] text-slate-400">
                      Enter 0 for Unlimited product listings
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.featureLimits?.prioritySupport || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            featureLimits: {
                              ...formData.featureLimits,
                              prioritySupport: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-[#ED1C2E]"
                      />
                      Priority 24/7 Seller Support
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.featureLimits?.promotionalPlacement || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            featureLimits: {
                              ...formData.featureLimits,
                              promotionalPlacement: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-[#ED1C2E]"
                      />
                      Promotional Homepage Placement
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.featureLimits?.storeCustomization || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            featureLimits: {
                              ...formData.featureLimits,
                              storeCustomization: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-[#ED1C2E]"
                      />
                      Custom Store Banner & Branding
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 7: Benefits List Editor */}
              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Plan Benefits & Highlights
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Free shipping on returned orders, Instant settlements"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBenefit();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {formData.benefits.map((b, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-700"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{b}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {formData.benefits.length === 0 && (
                    <p className="text-slate-400 text-[11px] italic py-2">
                      No benefits added yet. Type above and click Add.
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-[#ED1C2E] to-[#F7941D] text-white font-black rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : showEditModal ? (
                    'Save Plan Changes'
                  ) : (
                    'Create Vendor Plan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW PLAN MODAL                                          */}
      {/* ======================================================== */}
      {showViewModal && selectedPlan && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6 relative">
            <button
              onClick={() => setShowViewModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#30358F] to-[#ED1C2E] flex items-center justify-center text-white">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">{selectedPlan.name}</h3>
                  {selectedPlan.badge && (
                    <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {selectedPlan.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  Type: {selectedPlan.planType} &bull; Code: {selectedPlan.code}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">Subscription Price:</span>
                <span className="text-base font-black text-slate-900">
                  ₹{selectedPlan.price?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">Duration:</span>
                <span className="font-extrabold text-[#30358F]">
                  {selectedPlan.durationValue} {selectedPlan.durationUnit}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-bold">Active Subscribers:</span>
                <span className="font-extrabold text-emerald-600">
                  {selectedPlan.activeSubscribers ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Current Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedPlan.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {selectedPlan.status}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2">
                Included Benefits:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {selectedPlan.benefits?.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setShowViewModal(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ACTIVATE / DEACTIVATE CONFIRMATION DIALOG (Section 2)    */}
      {/* ======================================================== */}
      {showStatusConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                selectedPlan.status === 'Active'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {selectedPlan.status === 'Active' ? (
                <XCircle className="w-7 h-7" />
              ) : (
                <CheckCircle2 className="w-7 h-7" />
              )}
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                {selectedPlan.status === 'Active'
                  ? `Deactivate "${selectedPlan.name}"?`
                  : `Activate "${selectedPlan.name}"?`}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {selectedPlan.status === 'Active' ? (
                  <>
                    Deactivating this vendor plan will <strong>hide it from new purchases</strong>.
                    Existing paid subscriptions will remain completely valid until their expiry date.
                    The vendor's account and products will <strong>not</strong> be removed.
                  </>
                ) : (
                  <>
                    Activating this plan will immediately make it visible and purchasable by marketplace
                    vendors on their subscription dashboard.
                  </>
                )}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowStatusConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleToggleStatus}
                className={`flex-1 py-2.5 text-white font-black rounded-xl text-xs shadow-md transition ${
                  selectedPlan.status === 'Active'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                ) : selectedPlan.status === 'Active' ? (
                  'Yes, Deactivate Plan'
                ) : (
                  'Yes, Activate Plan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE PLAN CONFIRMATION DIALOG (Section 2)              */}
      {/* ======================================================== */}
      {showDeleteModal && selectedPlan && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                Delete "{selectedPlan.name}"?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                If this plan has existing or historical vendor subscriptions, it will be safely{' '}
                <strong>soft-deleted (archived)</strong> to preserve transaction audit records.
                Otherwise, it will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeletePlan}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md transition"
              >
                {actionLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
