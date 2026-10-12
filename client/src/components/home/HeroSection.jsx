import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Sparkles, Store, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import BrandLogo from '../BrandLogo';

export const HeroSection = () => {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#F7F7F9] to-red-50/40 border border-slate-200/90 shadow-sm">
        {/* Subtle Brand Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-12">
          {/* Left Column: Brand Statement & Primary Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Mission Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAEBFA] text-[#30358F] border border-[#30358F]/20 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#ED1C2E] animate-pulse" />
              <span>BUY INDIAN • BUILD INDIA</span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#222222] tracking-tight leading-tight">
                Shop Indian. <br />
                <span className="text-[#ED1C2E]">Support Indian.</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Discover quality products and support Indian businesses with <span className="font-bold text-[#30358F]">BAAPOO MART</span>. Shop directly from trusted Indian artisans, manufacturers, and verified local merchants.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                to="/products"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#ED1C2E] hover:bg-[#D91425] text-white text-sm font-black uppercase tracking-wider shadow-md shadow-red-500/25 transition-all flex items-center justify-center gap-2 group active:scale-95"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/products?category=all"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#30358F] hover:bg-[#252972] text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Explore Categories</span>
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-200/80 text-left">
              <div>
                <div className="text-base sm:text-lg font-black text-[#222222]">100%</div>
                <div className="text-[11px] text-slate-500 font-semibold leading-tight">Verified Indian Sellers</div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-[#ED1C2E]">₹0</div>
                <div className="text-[11px] text-slate-500 font-semibold leading-tight">Free Delivery on ₹499+</div>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-[#F7941D]">7 Days</div>
                <div className="text-[11px] text-slate-500 font-semibold leading-tight">Hassle-free Returns</div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Product Showcase Card with BAAPOO MART Branding */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Feature Showcase Card */}
              <div className="relative bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xl shadow-slate-900/5 overflow-hidden">
                <div className="relative rounded-2xl overflow-hidden bg-[#F7F7F9] aspect-4/3 flex items-center justify-center p-4">
                  <img
                    src="/images/baapoo-mart-logo.png"
                    alt="BAAPOO MART — BUY INDIAN • BUILD INDIA"
                    className="max-h-52 w-auto object-contain drop-shadow-sm select-none hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[#30358F] font-black text-[10px] uppercase tracking-wider border border-slate-200 shadow-xs">
                    Official Marketplace
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F7941D]">
                      Special Promotion
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      Up to 60% OFF
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-[#222222]">
                    Authentic Made In India Collection
                  </h3>
                  <p className="text-xs text-slate-500">
                    Handloom fashion, electronics, organic groceries, and artisanal home decor curated across Indian states.
                  </p>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2 shadow-lg flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F7941D] flex items-center justify-center font-bold">
                  🇮🇳
                </div>
                <div>
                  <div className="text-xs font-bold text-[#222222]">Make in India</div>
                  <div className="text-[10px] text-slate-400">Direct From Source</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
