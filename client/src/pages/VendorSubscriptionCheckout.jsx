import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Loader2, ShieldCheck, CheckCircle, ArrowRight, Sparkles, Store, Calendar, CreditCard } from 'lucide-react';

export const VendorSubscriptionCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [order, setOrder] = useState(null);
  const [activatedSub, setActivatedSub] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const targetPlanId = params.planId || location.state?.planId;
  const billingCycle = location.state?.billingCycle || 'MONTHLY';

  useEffect(() => {
    if (!targetPlanId) {
      navigate('/vendor/subscription');
      return;
    }
    createOrder();
  }, [targetPlanId, billingCycle]);

  const createOrder = async () => {
    try {
      setLoading(true);
      const res = await api.post('/vendor-subscriptions/order', { planId: targetPlanId, billingCycle });
      setOrder(res.data.data.order);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating subscription order');
      navigate('/vendor/subscription');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMock = async () => {
    try {
      setVerifying(true);
      const res = await api.post('/vendor-subscriptions/verify', {
        orderId: order._id,
        paymentId: `pay_mock_${Date.now()}`,
        paymentStatus: 'SUCCESS'
      });
      setActivatedSub(res.data?.data?.subscription);
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-600">Preparing subscription checkout details...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl shadow-xl text-center border border-emerald-100 relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-black uppercase text-emerald-600 tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Subscription Plan Activated
          </span>
          <h1 className="text-2xl font-black text-slate-900 pt-2">Vendor Plan Selected Successfully!</h1>
          <p className="text-xs text-slate-500">
            Your store subscription has been activated and is now live on the platform.
          </p>
        </div>

        {/* Plan Details Card */}
        <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl text-left space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Selected Duration</span>
            <span className="font-extrabold text-blue-600 uppercase">{order?.billingCycle || billingCycle}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Total Amount Paid</span>
            <span className="font-black text-slate-900 font-mono text-sm">₹{order?.amount?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Plan Status</span>
            <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">ACTIVE</span>
          </div>
          {activatedSub?.endDate && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Valid Until</span>
              <span className="font-mono font-bold text-slate-800">{new Date(activatedSub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button 
            onClick={() => navigate('/vendor/subscription')}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            View Active Subscription
          </button>
          <button 
            onClick={() => navigate('/vendor/dashboard')}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all"
          >
            Go to Merchant Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Complete Checkout</h1>
      
      {order && (
        <div className="bg-white rounded-2xl shadow border p-6">
          <h2 className="text-lg font-bold border-b pb-4 mb-4">Order Summary</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Plan</span>
              <span className="font-bold text-slate-800">{billingCycle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Amount</span>
              <span className="font-bold text-slate-800 text-xl">₹{order.amount}</span>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border mb-6 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              This is a secure 256-bit SSL encrypted payment. For the purpose of this module, clicking "Proceed to Pay" will simulate a successful payment gateway response and activate your subscription server-side.
            </p>
          </div>

          <button 
            disabled={verifying}
            onClick={handlePaymentMock}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70 flex justify-center items-center gap-2 transition-all"
          >
            {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proceed to Pay'}
          </button>
        </div>
      )}
    </div>
  );
};
