import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Search, Filter, ShoppingBag, Coins, Star, ArrowUpDown, Heart, X, Check, ArrowRight, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';

export const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Pagination stats
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const currentPage = parseInt(searchParams.get('page')) || 1;

  // Filter States synced with URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [rating, setRating] = useState(searchParams.get('rating') || '');
  const [availability, setAvailability] = useState(searchParams.get('availability') || 'all');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  useEffect(() => {
    fetchWishlist();
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchProducts();
    // Sync local states if URL params change externally
    setSearch(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedBrand(searchParams.get('brand') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setRating(searchParams.get('rating') || '');
    setAvailability(searchParams.get('availability') || 'all');
    setSort(searchParams.get('sort') || 'newest');
  }, [searchParams]);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      if (res.data?.success && res.data.data?.wishlist) {
        setWishlistProductIds(res.data.data.wishlist.products.map((p) => p._id));
      }
    } catch (e) {
      // Unauthenticated
    }
  };

  const handleToggleWishlist = async (productId) => {
    try {
      const res = await api.post('/wishlist', { productId });
      if (res.data?.success && res.data.data?.wishlist) {
        setWishlistProductIds(res.data.data.wishlist.products.map((p) => p._id));
      }
    } catch (err) {
      alert('Please login to manage wishlist');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data.categories || []);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands');
      setBrands(res.data.data.brands || []);
    } catch (e) {
      console.error('Failed to fetch brands:', e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 24, // 24 items per page for clean desktop grid
      };

      if (searchParams.get('search')) params.search = searchParams.get('search');
      if (searchParams.get('category')) params.category = searchParams.get('category');
      if (searchParams.get('brand')) params.brand = searchParams.get('brand');
      if (searchParams.get('minPrice')) params.minPrice = Number(searchParams.get('minPrice'));
      if (searchParams.get('maxPrice')) params.maxPrice = Number(searchParams.get('maxPrice'));
      if (searchParams.get('rating')) params.rating = Number(searchParams.get('rating'));
      if (searchParams.get('availability')) params.availability = searchParams.get('availability');
      if (searchParams.get('sort')) params.sort = searchParams.get('sort');

      const res = await api.get('/products', { params });
      setProducts(res.data.data.products || []);
      setTotalPages(res.data.data.pages || 1);
      setTotalCount(res.data.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch catalog products:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (newParams) => {
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (search.trim()) newParams.set('search', search.trim());
    else newParams.delete('search');
    applyFilters(newParams);
  };

  const handleCategoryChange = (slug) => {
    setSelectedCategory(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug) newParams.set('category', slug);
    else newParams.delete('category');
    applyFilters(newParams);
  };

  const handleBrandChange = (slug) => {
    setSelectedBrand(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug) newParams.set('brand', slug);
    else newParams.delete('brand');
    applyFilters(newParams);
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (minPrice) newParams.set('minPrice', minPrice);
    else newParams.delete('minPrice');

    if (maxPrice) newParams.set('maxPrice', maxPrice);
    else newParams.delete('maxPrice');
    applyFilters(newParams);
  };

  const handleRatingChange = (stars) => {
    setRating(stars);
    const newParams = new URLSearchParams(searchParams);
    if (stars) newParams.set('rating', stars);
    else newParams.delete('rating');
    applyFilters(newParams);
  };

  const handleStockChange = (e) => {
    const isChecked = e.target.checked;
    const value = isChecked ? 'in_stock' : 'all';
    setAvailability(value);
    const newParams = new URLSearchParams(searchParams);
    if (value !== 'all') newParams.set('availability', value);
    else newParams.delete('availability');
    applyFilters(newParams);
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setAvailability('all');
    setSort('newest');
    setSearchParams(new URLSearchParams());
  };

  // Helper for rendering pagination page numbers with smart window
  const renderPaginationButtons = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
            currentPage === 1 ? 'bg-[#ED1C2E] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          1
        </button>
      );
      if (start > 2) {
        pages.push(<span key="dots-1" className="text-slate-400 text-xs px-1">...</span>);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
            currentPage === i ? 'bg-[#ED1C2E] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {i}
        </button>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(<span key="dots-2" className="text-slate-400 text-xs px-1">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
            currentPage === totalPages ? 'bg-[#ED1C2E] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  // Reusable Filter Sidebar Content
  const filterSidebarContent = (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <h3 className="font-bold text-sm text-[#222222] flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#ED1C2E]" />
          <span>Filters</span>
        </h3>
        <button
          onClick={clearFilters}
          className="text-[11px] text-[#30358F] hover:text-[#ED1C2E] font-bold transition-colors underline"
        >
          Clear All
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-[#222222] uppercase tracking-wider">Categories</h4>
        <div className="space-y-1 text-xs max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => handleCategoryChange('')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors font-bold ${
              !selectedCategory ? 'bg-red-50 text-[#ED1C2E] border border-red-200' : 'text-slate-600 hover:text-[#ED1C2E] hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors font-bold ${
                selectedCategory === cat.slug ? 'bg-red-50 text-[#ED1C2E] border border-red-200' : 'text-slate-600 hover:text-[#ED1C2E] hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-[#222222] uppercase tracking-wider">Brands</h4>
        <div className="space-y-1 text-xs max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => handleBrandChange('')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors font-bold ${
              !selectedBrand ? 'bg-indigo-50 text-[#30358F] border border-indigo-200' : 'text-slate-600 hover:text-[#30358F] hover:bg-slate-50'
            }`}
          >
            All Brands
          </button>
          {brands.map((b) => (
            <button
              key={b._id}
              onClick={() => handleBrandChange(b.slug)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors font-bold ${
                selectedBrand === b.slug ? 'bg-indigo-50 text-[#30358F] border border-indigo-200' : 'text-slate-600 hover:text-[#30358F] hover:bg-slate-50'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-[#222222] uppercase tracking-wider">Price Range (₹)</h4>
        <form onSubmit={handlePriceApply} className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full bg-[#F7F7F9] text-xs text-slate-800 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#ED1C2E] focus:bg-white"
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full bg-[#F7F7F9] text-xs text-slate-800 p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#ED1C2E] focus:bg-white"
          />
          <button type="submit" className="px-3 py-2 bg-[#ED1C2E] hover:bg-[#D91425] text-white text-xs font-bold rounded-lg transition-colors shadow-xs">
            Go
          </button>
        </form>
      </div>

      {/* Minimum Rating */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-[#222222] uppercase tracking-wider">Minimum Rating</h4>
        <div className="flex flex-col gap-1">
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => handleRatingChange(stars.toString())}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-left transition-colors font-semibold ${
                rating === stars.toString() ? 'bg-orange-50 text-[#F7941D] border border-orange-200' : 'text-slate-600 hover:text-[#F7941D] hover:bg-slate-50'
              }`}
            >
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < stars ? 'fill-current' : 'text-slate-300'}`} />
                ))}
              </div>
              <span>{stars} Stars & Up</span>
            </button>
          ))}
        </div>
      </div>

      {/* Availability / Stock */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer font-bold">
          <input
            type="checkbox"
            checked={availability === 'in_stock'}
            onChange={handleStockChange}
            className="w-4 h-4 accent-[#ED1C2E] rounded"
          />
          <span>Exclude Out of Stock</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#FFFFFF] min-h-screen">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-[#222222] tracking-tight">Marketplace Catalog</h1>
            <span className="text-xs font-black text-[#30358F] bg-[#30358F]/10 border border-[#30358F]/20 px-2.5 py-0.5 rounded-full">
              {totalCount} Products
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Discover verified products from Indian merchants • BUY INDIAN • BUILD INDIA</p>
        </div>

        {/* Search & Mobile Filter Toggle */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 md:flex-initial">
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for products, brands and more"
                className="w-full bg-[#F7F7F9] text-xs text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-9 pr-4 border border-slate-200 focus:outline-none focus:border-[#ED1C2E] focus:bg-white transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#ED1C2E] hover:bg-[#D91425] text-white text-xs font-black rounded-xl shadow-xs transition-all uppercase tracking-wider"
            >
              Search
            </button>
          </form>

          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
            title="Open Filters"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Filters on Left, Product Grid on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs h-fit sticky top-24">
          {filterSidebarContent}
        </aside>

        {/* Mobile Filter Drawer Overlay */}
        <AnimatePresence>
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileFilters(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative bg-white w-80 max-w-full h-full p-6 shadow-2xl z-10 overflow-y-auto flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-black text-base text-[#222222]">Filters</span>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {filterSidebarContent}
                </div>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="mt-6 w-full py-2.5 bg-[#ED1C2E] hover:bg-[#D91425] text-white text-xs font-black rounded-xl shadow-md uppercase tracking-wider"
                >
                  Apply & Close
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Product Catalog Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Filter Chips & Sorting Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/90 px-4 py-3 rounded-2xl shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Showing page {currentPage} of {totalPages}</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-50 text-[#ED1C2E] border border-red-200 px-2.5 py-0.5 rounded-full">
                  Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleCategoryChange('')} />
                </span>
              )}
              {selectedBrand && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-50 text-[#30358F] border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Brand: {brands.find((b) => b.slug === selectedBrand)?.name || selectedBrand}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleBrandChange('')} />
                </span>
              )}
              {rating && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-[#F7941D] border border-amber-200 px-2.5 py-0.5 rounded-full">
                  {rating}★ & up
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleRatingChange('')} />
                </span>
              )}
              {availability === 'in_stock' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  In Stock Only
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleStockChange({ target: { checked: false } })} />
                </span>
              )}
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-bold">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-[#F7F7F9] border border-slate-200 text-[#222222] text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#ED1C2E]"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Catalog Listing */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 animate-pulse">
                  <div className="aspect-square bg-slate-100 rounded-xl" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                  <div className="h-8 bg-slate-100 rounded w-full pt-2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
              <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-[#222222]">No products found</h3>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters, clearing price constraints, or searching with different keywords.</p>
              </div>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ED1C2E] hover:bg-[#D91425] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
              >
                <span>Clear All Filters</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((prod) => (
                  <ProductCard
                    key={prod._id}
                    product={prod}
                    isWishlisted={wishlistProductIds.includes(prod._id)}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-2 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-50 disabled:pointer-events-none shadow-xs"
                  >
                    Previous
                  </button>

                  {renderPaginationButtons()}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-50 disabled:pointer-events-none shadow-xs"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
