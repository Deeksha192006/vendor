import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { fetchCurrentUser } from '../store/authSlice';
import {
  Crown,
  CheckCircle2,
  Sparkles,
  Calendar,
  Loader2,
  AlertCircle,
  CreditCard,
  Check,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Tag,
  Zap,
  HelpCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomerSubscription = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Checkout Modal State
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('confirm'); // 'confirm' | 'success'

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch active customer subscription plans (public or authenticated)
      const plansRes = await api.get('/subscription-plans/active').catch(() =>
        api.get('/customer/premium/plans').catch(() => ({ data: { data: { plans: [] } } }))
      );

      const loadedPlans = plansRes.data?.data?.plans || [];
      setPlans(loadedPlans);

      // 2. If authenticated, fetch customer's current subscription & history
      if (isAuthenticated || user) {
        const [subRes, historyRes] = await Promise.all([
          api.get('/customer/subscription').catch(() =>
            api.get('/customer/premium').catch(() => ({ data: { data: { isSubscribed: false, subscription: null } } }))
          ),
          api.get('/customer/subscription/history').catch(() =>
            api.get('/customer/premium/history').catch(() => ({ data: { data: { history: [] } } }))
          )
        ]);

        const active = subRes.data?.data?.subscription || null;
        setCurrentSub(active);
        setIsSubscribed(!!active);
        setHistory(historyRes.data?.data?.history || []);
      }
    } catch (e) {
      console.error('Failed to load subscription data:', e);
      setError('Failed to load subscription details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate price per month
  const getPerMonthPrice = (price, durationValue, durationUnit) => {
    const unit = (durationUnit || 'months').toLowerCase();
    const val = Number(durationValue) || 1;
    if (unit.startsWith('year')) {
      return Math.round(price / (val * 12));
    }
    if (unit.startsWith('month')) {
      return Math.round(price / val);
    }
    if (unit.startsWith('day')) {
      return Math.round((price / val) * 30);
    }
    return Math.round(price / val);
  };

  // Click on Subscribe Now
  const handleInitiateSubscribe = (plan) => {
    setError('');
    setMessage('');

    // 1. Verify authentication
    if (!isAuthenticated && !user) {
      // Redirect to login preserving selected plan
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}&planId=${plan._id}`);
      return;
    }

    setSelectedPlan(plan);
    setCheckoutStep('confirm');
    setShowCheckoutModal(true);
  };

  // Process payment confirmation & checkout
  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;

    try {
      setSubscribing(true);
      setError('');

      const res = await api.post('/customer/subscription/checkout', {
        planId: selectedPlan._id,
        paymentMethod: 'INSTANT_VERIFIED_GATEWAY'
      });

      if (res.data?.success || res.data?.data?.subscription) {
        const newSub = res.data?.data?.subscription || res.data?.subscription;
        setCurrentSub(newSub);
        setIsSubscribed(true);
        setCheckoutStep('success');
        dispatch(fetchCurrentUser());
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Payment processing failed. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleFinishSuccess = () => {
    setShowCheckoutModal(false);
    setSelectedPlan(null);
    fetchSubscriptionData();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header with BAAPOO MART Branding */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#30358F] via-[#20246a] to-[#151842] rounded-3xl p-6 sm:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-radial from-[#F7941D]/20 to-transparent rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-48 h-48 bg-radial from-[#ED1C2E]/20 to-transparent rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-black uppercase tracking-wider text-[#F7941D]">
            <Crown className="w-3.5 h-3.5" />
            <span>BAAPOO MART VIP MEMBERSHIP</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Unlock Unlimited Privileges With Our VIP Subscription Plans
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            BUY INDIAN • BUILD INDIA. Enjoy zero shipping charges, 2x reward coins, daily guaranteed spin prizes, and member-only flash sale access.
          </p>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-3.5 rounded-2xl text-xs font-bold shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* CURRENT ACTIVE SUBSCRIPTION BANNER */}
      {isSubscribed && currentSub && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white border-2 border-[#F7941D]/40 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#ED1C2E]">
                <ShieldCheck className="w-4 h-4 text-[#F7941D]" />
                <span>CURRENT ACTIVE MEMBERSHIP</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentSub.planNameSnapshot || currentSub.planId?.name || 'BAAPOO MART VIP Pass'}
              </h2>
              <p className="text-xs text-slate-500">
                You are currently enjoying all premium marketplace perks and priority privileges.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-amber-200 shadow-xs">
              <div className="px-3 py-1 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <span className="text-xs font-black text-emerald-600 flex items-center gap-1 justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  ACTIVE VIP
                </span>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div className="px-3 py-1 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Expires On</span>
                <span className="text-xs font-black text-[#30358F] font-mono">
                  {new Date(currentSub.expiryDate || currentSub.expiresAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBSCRIPTION PLANS GRID SECTION */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
          <div>
            <h2 className="text-xl font-black text-[#30358F] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F7941D]" />
              <span>Choose Your Membership Duration</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the billing cycle that fits you best. All plans include 100% full VIP benefits.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-400 self-start sm:self-auto">
            Transparent Pricing • Cancel Anytime
          </span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-slate-100 rounded-3xl border border-slate-200" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          /* Empty State as requested: friendly message */
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
            <Crown className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Subscription plans are currently unavailable.</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Please check back later or contact customer support for upcoming member offerings.
            </p>
          </div>
        ) : (
          /* Active Plans Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => {
              const netPrice = Math.max(0, (plan.price || 0) - (plan.discount || 0));
              const perMonth = getPerMonthPrice(netPrice, plan.durationValue, plan.durationUnit);
              const durationLabel = `${plan.durationValue} ${plan.durationUnit || 'month'}${plan.durationValue > 1 ? 's' : ''}`;
              const isPopular = plan.badge && plan.badge.toLowerCase().includes('popular');
              const isBestValue = plan.badge && (plan.badge.toLowerCase().includes('best') || plan.badge.toLowerCase().includes('annual'));

              return (
                <motion.div
                  key={plan._id}
                  whileHover={{ y: -4 }}
                  className={`bg-white rounded-3xl flex flex-col justify-between transition-all duration-300 relative border ${
                    isBestValue
                      ? 'border-[#ED1C2E] ring-2 ring-[#ED1C2E]/20 shadow-xl shadow-red-500/5'
                      : isPopular
                      ? 'border-[#F7941D] ring-2 ring-[#F7941D]/20 shadow-xl shadow-orange-500/5'
                      : 'border-slate-200/90 hover:border-[#30358F]/50 shadow-sm'
                  }`}
                >
                  {/* Optional Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#ED1C2E] to-[#F7941D] text-white shadow-md">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Card Top: Details */}
                  <div className="p-6 space-y-4">
                    <div className="pt-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                        {plan.planType || 'Membership'}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 min-h-[36px] line-clamp-2 leading-relaxed">
                        {plan.description || 'Exclusive VIP privileges with zero delivery fees and bonus Fair Coins.'}
                      </p>
                    </div>

                    {/* Price Section */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black font-mono text-[#30358F]">
                          ₹{netPrice.toLocaleString('en-IN')}
                        </span>
                        {plan.discount > 0 && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            ₹{plan.price}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 font-semibold mt-1">
                        Billed for <strong className="text-slate-800">{durationLabel}</strong>
                      </div>

                      {perMonth > 0 && (
                        <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
                          Only ₹{perMonth}/month
                        </div>
                      )}
                    </div>

                    {/* Features / Benefits List */}
                    <div className="space-y-2.5 pt-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Included Privileges:
                      </span>
                      {Array.isArray(plan.benefits) && plan.benefits.length > 0 ? (
                        plan.benefits.map((benefit, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>Free Shipping on Every Order</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>2x Reward Fair Coins on Purchases</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>Daily Guaranteed Spin Wheel</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Subscribe CTA Button */}
                  <div className="p-6 pt-0">
                    <button
                      type="button"
                      onClick={() => handleInitiateSubscribe(plan)}
                      className={`w-full py-3 px-4 rounded-2xl font-black text-xs transition shadow-md flex items-center justify-center gap-2 ${
                        isBestValue
                          ? 'bg-gradient-to-r from-[#ED1C2E] to-[#F7941D] hover:from-[#d01727] hover:to-[#e08316] text-white shadow-red-500/20 active:scale-98'
                          : 'bg-[#30358F] hover:bg-[#20246a] text-white shadow-blue-900/10 active:scale-98'
                      }`}
                    >
                      <span>Subscribe Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction History Section */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm text-[#30358F] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Your Subscription History</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">{history.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Price Paid</th>
                  <th className="py-3 px-4">Started Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => {
                  const planName = h.planNameSnapshot || h.planId?.name || 'VIP Pass';
                  const amount = h.planPriceSnapshot || h.amount || 0;
                  const isCurrent = h.subscriptionStatus === 'Active' || h.status === 'ACTIVE';

                  return (
                    <tr key={h._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{planName}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {h.durationSnapshot?.label || (h.planId?.durationValue ? `${h.planId.durationValue} ${h.planId.durationUnit}` : '1 Month')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">₹{amount}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(h.startDate || h.startedAt || h.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(h.expiryDate || h.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCurrent
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {h.subscriptionStatus || h.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHECKOUT & CONFIRMATION MODAL */}
      <AnimatePresence>
        {showCheckoutModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-5 overflow-hidden"
            >
              {checkoutStep === 'confirm' ? (
                <>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-[#F7941D]" />
                      <h3 className="text-base font-black text-slate-900">Confirm VIP Subscription</h3>
                    </div>
                    <button
                      onClick={() => setShowCheckoutModal(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-semibold">Selected Plan:</span>
                        <strong className="text-slate-900 font-bold">{selectedPlan.name}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-semibold">Plan Duration:</span>
                        <span className="font-bold text-slate-800">
                          {selectedPlan.durationValue} {selectedPlan.durationUnit || 'months'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-semibold">Standard Price:</span>
                        <span className="font-mono text-slate-700">₹{selectedPlan.price}</span>
                      </div>
                      {selectedPlan.discount > 0 && (
                        <div className="flex justify-between items-center text-emerald-600 font-bold">
                          <span>Special Discount:</span>
                          <span className="font-mono">- ₹{selectedPlan.discount}</span>
                        </div>
                      )}
                      <div className="h-px bg-slate-200 my-1" />
                      <div className="flex justify-between items-center text-sm font-black text-[#30358F]">
                        <span>Total Payable:</span>
                        <span className="font-mono text-lg text-[#ED1C2E]">
                          ₹{Math.max(0, (selectedPlan.price || 0) - (selectedPlan.discount || 0)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        Secure transaction verified on the server. Your subscription starts immediately upon payment confirmation.
                      </span>
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowCheckoutModal(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSubscription}
                      disabled={subscribing}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#ED1C2E] to-[#F7941D] hover:from-[#d01727] hover:to-[#e08316] text-white rounded-xl font-black text-xs shadow-md shadow-red-500/20 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      <span>{subscribing ? 'Processing...' : 'Proceed to Pay'}</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Success Celebration View */
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900">Subscription Confirmed!</h3>
                    <p className="text-xs text-slate-500">
                      Welcome to BAAPOO MART VIP Membership. Your plan has been activated successfully!
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs space-y-1 text-emerald-800 font-semibold">
                    <div>Plan: <strong>{selectedPlan.name}</strong></div>
                    <div>Status: <strong>ACTIVE VIP</strong></div>
                    <div>Zero Delivery Fees & 2x Coin Multiplier unlocked!</div>
                  </div>

                  <button
                    onClick={handleFinishSuccess}
                    className="w-full py-3 bg-[#30358F] hover:bg-[#20246a] text-white rounded-2xl font-black text-xs shadow-md transition"
                  >
                    Start Shopping with VIP Benefits
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerSubscription;
