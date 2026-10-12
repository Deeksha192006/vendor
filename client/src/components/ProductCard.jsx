import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingBag, Check, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

export const ProductCard = ({
  product,
  isWishlisted = false,
  onToggleWishlist,
  onCartUpdated,
}) => {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [localWishlisted, setLocalWishlisted] = useState(isWishlisted);

  if (!product) return null;

  const {
    _id,
    name,
    slug,
    price = 0,
    mrp = 0,
    rating = 4.5,
    reviewsCount = 0,
    images = [],
    stock = 10,
    category,
    origin,
    isMadeInIndia,
  } = product;

  // Calculate discount percentage
  const effectiveMrp = mrp > price ? mrp : null;
  const discountPercent = effectiveMrp
    ? Math.round(((effectiveMrp - price) / effectiveMrp) * 100)
    : null;

  const displayImage = images && images.length > 0
    ? (typeof images[0] === 'string' ? images[0] : images[0]?.url)
    : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60';

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (stock <= 0 || adding) return;

    setAdding(true);
    try {
      await api.post('/cart/add', {
        productId: _id,
        quantity: 1,
      });
      setAdded(true);
      if (onCartUpdated) onCartUpdated();
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Error adding product to cart:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalWishlisted(!localWishlisted);
    if (onToggleWishlist) {
      onToggleWishlist(_id);
    }
  };

  const isIndianProduct = isMadeInIndia || origin === 'India' || origin === 'INDIA';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden hover:border-[#ED1C2E]/40 hover:shadow-xl hover:shadow-[#ED1C2E]/5 transition-all flex flex-col h-full"
    >
      {/* Product Image Container */}
      <Link to={`/products/${slug || _id}`} className="relative block aspect-square bg-[#F7F7F9] overflow-hidden">
        <img
          src={displayImage}
          alt={name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discountPercent && discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#F7941D] text-white shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {isIndianProduct && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#30358F] text-white shadow-xs flex items-center gap-1">
              <span>🇮🇳</span> Made in India
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          aria-label="Save to Wishlist"
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#ED1C2E] hover:border-[#ED1C2E]/40 transition-colors shadow-xs"
        >
          <Heart className={`w-4 h-4 ${localWishlisted ? 'fill-[#ED1C2E] text-[#ED1C2E]' : ''}`} />
        </button>

        {/* Out of Stock Ribbon */}
        {stock <= 0 && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex items-center justify-center z-10">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-800 text-white">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Content Details */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Category Tag */}
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#30358F] mb-1 line-clamp-1">
            {typeof category === 'object' ? category?.name : (category || 'BAAPOO MART')}
          </div>

          {/* Product Title */}
          <Link to={`/products/${slug || _id}`}>
            <h3 className="font-bold text-xs sm:text-sm text-[#222222] group-hover:text-[#ED1C2E] transition-colors line-clamp-2 leading-snug">
              {name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold text-[11px]">
              <span>{rating ? Number(rating).toFixed(1) : '4.5'}</span>
              <Star className="w-3 h-3 fill-emerald-600 text-emerald-600 ml-0.5" />
            </div>
            {reviewsCount > 0 && (
              <span className="text-[11px] text-slate-400 font-medium">({reviewsCount})</span>
            )}
          </div>
        </div>

        {/* Pricing & Add to Cart Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-[#222222]">
                ₹{Number(price).toLocaleString('en-IN')}
              </span>
              {effectiveMrp && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{Number(effectiveMrp).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {discountPercent && discountPercent > 0 && (
              <span className="text-[10px] font-bold text-[#F7941D] block -mt-0.5">
                Save ₹{(effectiveMrp - price).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={stock <= 0 || adding}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs ${
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-[#ED1C2E] hover:bg-[#D91425] text-white active:scale-95 disabled:opacity-50 disabled:pointer-events-none'
            }`}
          >
            {adding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
