import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { updateCoinBalance, updateSuperCoins, fetchCurrentUser } from '../store/authSlice';
import { Coins, Award, Sparkles, Loader2, CheckCircle2, AlertCircle, Package, ArrowRight, X, Crown } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

export const SpinWheel = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [wheelData, setWheelData] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [wonReward, setWonReward] = useState(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const controls = useAnimation();

  useEffect(() => {
    fetchWheelConfig();
  }, []);

  const fetchWheelConfig = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/spin/wheel');
      setWheelData(res.data.data.wheel);
      setEligibility(res.data.data.eligibility);
    } catch (e) {
      console.error(e);
      setErrorMsg(e.response?.data?.message || 'Failed to load Spin Wheel configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async () => {
    if (spinning || !eligibility?.eligible) return;
    setSpinning(true);
    setWonReward(null);
    setShowPrizeModal(false);
    setErrorMsg('');

    try {
      const idempotencyKey = `spin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const res = await api.post('/spin/spin', { idempotencyKey });
      const { winningSegmentIndex, reward, newCoinBalance, newSuperCoinBalance } = res.data.data;

      const rewardsCount = wheelData?.rewards?.length || 5;
      const segmentAngle = 360 / rewardsCount; // 72 deg per segment for 5 divisions
      
      // Calculate target angle to land top pointer right in center of winning segment
      const targetAngle = 360 * 6 + (360 - winningSegmentIndex * segmentAngle - segmentAngle / 2);

      await controls.start({
        rotate: targetAngle,
        transition: { duration: 4.5, ease: [0.15, 0.9, 0.2, 1] },
      });

      setWonReward(reward);
      setShowPrizeModal(true);

      setEligibility((prev) => ({
        ...prev,
        eligible: (prev?.spinsRemaining || 1) > 1,
        spinsRemaining: Math.max(0, (prev?.spinsRemaining || 1) - 1),
      }));

      if (newCoinBalance !== undefined) {
        dispatch(updateCoinBalance(newCoinBalance));
      }
      if (newSuperCoinBalance !== undefined) {
        dispatch(updateSuperCoins(newSuperCoinBalance));
      }
      if (newCoinBalance === undefined && newSuperCoinBalance === undefined) {
        dispatch(fetchCurrentUser());
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Spin request failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSpinning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading Daily Spin Wheel...</span>
      </div>
    );
  }

  const rewards = wheelData?.rewards || [];
  const cost = wheelData?.coinsRequiredPerSpin || 0;
  const spinsLeft = eligibility?.spinsRemaining ?? 0;
  const isEligible = eligibility?.eligible ?? false;
  const isVip = Boolean(eligibility?.isPremium || user?.isVip || user?.isPremium || user?.role === 'SUPER_ADMIN');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-center">
      {/* Header Info */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>FairKart Daily Lucky Spin (5 Divisions)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {wheelData?.title || 'Daily FairKart Spin & Win'}
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          {wheelData?.description || 'Spin the 5-division wheel every day to win instant Fair Coins & Free Marketplace Products!'}
        </p>
      </div>

      {/* User Balance & Eligibility Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Fair Coins Balance</div>
          <div className="text-base font-black text-amber-600 flex items-center justify-center gap-1 mt-0.5">
            <Coins className="w-4 h-4" />
            {Number(user?.fairCoinBalance ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Account Status</div>
          <div className="text-base font-black text-blue-600 flex items-center justify-center gap-1 mt-0.5">
            <Award className="w-4 h-4" />
            {isVip ? 'VIP Member' : 'Standard'}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Cost per Spin</div>
          <div className="text-base font-black text-slate-900 mt-0.5">
            {cost === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `${cost} FC`}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500">Spins Remaining</div>
          <div className={`text-base font-black mt-0.5 ${spinsLeft > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
            {spinsLeft}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-md mx-auto p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2 text-left">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Wheel Canvas Container */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 mx-auto flex items-center justify-center py-4">
        {/* Top Indicator Pointer (Golden Teardrop Pin / Triangle at top) */}
        <div className="absolute -top-2 z-30 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-amber-500 filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.5)]" />

        {/* Animated 5-Division SVG Wheel */}
        <motion.div
          animate={controls}
          className="w-full h-full rounded-full shadow-2xl relative overflow-hidden bg-white"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {rewards.map((reward, i) => {
              const count = rewards.length || 5; // 5 divisions = 72 deg
              const angle = 360 / count;
              const startAngle = i * angle;
              const endAngle = (i + 1) * angle;

              const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

              const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

              return (
                <path
                  key={i}
                  d={pathData}
                  fill={reward.color || (i % 2 === 0 ? '#eab308' : '#15803d')}
                  stroke="#ffffff"
                  strokeWidth="0.8"
                />
              );
            })}
          </svg>

          {/* Dynamic Radial Labels Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {rewards.map((reward, i) => {
              const count = rewards.length || 5;
              const angle = (360 / count) * i + (360 / count) / 2;
              const isProduct = reward.type === 'PRODUCT';

              return (
                <div
                  key={i}
                  className="absolute w-full text-center text-[11px] sm:text-xs font-black text-white uppercase tracking-wider drop-shadow-md px-2 truncate flex items-center justify-center gap-1"
                  style={{
                    transform: `rotate(${angle}deg) translate(110px) rotate(90deg)`,
                  }}
                >
                  {isProduct ? '🎁 ' : '🪙 '}
                  <span>{reward.title || reward.productTitle}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Center Spin Button (Black Teardrop / Sleek Circular Pin) */}
        <button
          onClick={handleSpin}
          disabled={spinning || !isEligible}
          className="absolute z-20 w-24 h-24 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 hover:scale-105 active:scale-95 text-white font-black text-lg shadow-2xl flex flex-col items-center justify-center border-4 border-amber-400 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed"
        >
          {spinning ? (
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          ) : (
            <>
              <span className="text-amber-400 tracking-wider">SPIN</span>
              {cost > 0 && <span className="text-[10px] font-bold text-slate-300">{cost} FC</span>}
            </>
          )}
        </button>
      </div>

      {/* Won Reward Banner */}
      {wonReward && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-50 border border-amber-300 p-5 rounded-3xl max-w-lg mx-auto flex items-center justify-between gap-4 text-amber-950 font-bold text-sm shadow-md"
        >
          <div className="flex items-center gap-3 text-left">
            {wonReward.type === 'PRODUCT' ? (
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-emerald-700" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
                <Coins className="w-6 h-6 text-amber-600 animate-bounce" />
              </div>
            )}
            <div>
              <div className="font-black text-base text-slate-900">🎉 Congratulations!</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">
                {wonReward.type === 'PRODUCT'
                  ? `You won a free Product: ${wonReward.productTitle || wonReward.title}`
                  : `You won ${wonReward.title}!`}
              </div>
            </div>
          </div>
          {wonReward.type === 'PRODUCT' && (
            <Link
              to="/products"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1 transition"
            >
              <span>View Product</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </motion.div>
      )}

      {/* Winner Celebration Modal */}
      <AnimatePresence>
        {showPrizeModal && wonReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden"
            >
              <button
                onClick={() => setShowPrizeModal(false)}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 border-4 border-amber-200 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-1">Congratulations!</h2>
              <p className="text-xs text-slate-500 mb-5">You landed on the spin wheel reward!</p>

              {wonReward.type === 'PRODUCT' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 text-center space-y-3">
                  {wonReward.productImage && (
                    <img
                      src={wonReward.productImage}
                      alt={wonReward.productTitle}
                      className="w-24 h-24 object-cover rounded-xl mx-auto shadow-sm border border-emerald-200"
                    />
                  )}
                  <div>
                    <div className="text-xs font-extrabold uppercase text-emerald-700 tracking-wider">Product Won</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">
                      {wonReward.productTitle || wonReward.title}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-center space-y-2">
                  <Coins className="w-10 h-10 text-amber-500 mx-auto" />
                  <div className="text-2xl font-black text-amber-600">{wonReward.title}</div>
                  <p className="text-xs font-semibold text-amber-800">
                    {wonReward.value} Fair Coins have been credited directly to your FairKart Wallet!
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowPrizeModal(false)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl shadow-md text-sm transition"
              >
                Claim & Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Membership Status & Upgrade Callout */}
      {!eligibility?.isPremium && (
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-black text-xs text-amber-900">
              <Crown className="w-4 h-4 text-amber-600" />
              <span>Regular Customer: 1 Free Spin Per Month</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              Regular accounts receive 1 spin per month. Upgrade to VIP Pass Premium to unlock <strong className="text-slate-900 font-extrabold">Daily Spins</strong>!
            </p>
          </div>
          <Link
            to="/customer/subscription"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex-shrink-0 flex items-center gap-1 transition"
          >
            <span>Upgrade to VIP</span>
            <Crown className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Eligibility status text */}
      <div className="text-xs">
        {isEligible ? (
          <span className="text-emerald-700 font-bold inline-flex items-center gap-1.5 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {eligibility?.isPremium ? 'VIP Pass Active: Daily Spin Available Today!' : 'Regular Member: 1 Monthly Free Spin Available!'}
          </span>
        ) : (
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 text-slate-700 font-semibold">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>
                {eligibility?.isPremium
                  ? 'Daily Spin Limit Reached. Come back tomorrow for your next VIP spin!'
                  : 'Monthly Spin Limit Reached: Regular accounts get 1 spin per month.'}
              </span>
            </div>
            {!eligibility?.isPremium && (
              <Link
                to="/customer/subscription"
                className="text-amber-700 font-extrabold text-xs underline hover:text-amber-800"
              >
                Upgrade to VIP for Daily Spins →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpinWheel;
