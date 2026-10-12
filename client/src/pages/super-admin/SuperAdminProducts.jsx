import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Tag,
  Store,
  Crown,
  Boxes,
  Coins,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sourceType, setSourceType] = useState(''); // '' | 'SUPER_ADMIN' | 'VENDOR'
  const [selectedVendor, setSelectedVendor] = useState('');
  const [vendors, setVendors] = useState([]);
  const [status, setStatus] = useState('');
  const [stockFilter, setStockFilter] = useState(''); // '' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // Stock Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockAction, setStockAction] = useState('ADD'); // 'ADD' | 'REDUCE' | 'SET'
  const [stockQty, setStockQty] = useState(10);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 15,
        search,
        category: selectedCategory,
        sourceType,
        vendorId: selectedVendor,
        status,
        stockFilter,
      };
      const res = await superAdminService.getProducts(params);
      setProducts(res.products || []);
      setCategories(res.categories || []);
      setVendors(res.vendors || []);
      setPagination(res.pagination || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, sourceType, selectedVendor, status, stockFilter, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleToggleStatus = async (product) => {
    try {
      const newStatus = product.status === 'APPROVED' || product.status === 'ACTIVE' ? 'INACTIVE' : 'APPROVED';
      await superAdminService.updateProduct(product._id, { status: newStatus });
      setSuccessMsg(`Product "${product.name}" status updated to ${newStatus}`);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product status');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete product "${name}"?`)) {
      try {
        await superAdminService.deleteProduct(id);
        setSuccessMsg(`Product "${name}" deleted`);
        fetchProducts();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockQty(10);
    setStockAction('ADD');
    setStockModalOpen(true);
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await superAdminService.updateProductStock(selectedProduct._id, {
        action: stockAction,
        quantity: stockQty,
      });
      setSuccessMsg(`Stock updated for ${selectedProduct.name}`);
      setStockModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock');
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header Banner */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Super Admin Product Control</h1>
              <p className="text-xs text-slate-500">
                Full authority to create, edit, manage inventory, and sell products directly on FairKart.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/super-admin/inventory')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-xs"
          >
            <Boxes className="w-4 h-4 text-slate-600" />
            <span>Inventory Center</span>
          </button>
          <button
            onClick={() => navigate('/super-admin/products/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Super Admin Product</span>
          </button>
        </div>
      </motion.div>

      {successMsg && (
        <motion.div variants={itemVariants} className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> {successMsg}
          </span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 font-bold">✕</button>
        </motion.div>
      )}

      {error && (
        <motion.div variants={itemVariants} className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-600 font-bold">✕</button>
        </motion.div>
      )}

      {/* Filter & Search Toolbar */}
      <motion.div variants={itemVariants} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search product name, SKU, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-2xl bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Product Source Filter */}
            <select
              value={sourceType}
              onChange={(e) => { setSourceType(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700"
            >
              <option value="">All Sources (Super Admin & Vendors)</option>
              <option value="SUPER_ADMIN">👑 Super Admin Direct</option>
              <option value="VENDOR">🏪 Vendor Products</option>
            </select>

            {/* Specific Vendor Filter */}
            <select
              value={selectedVendor}
              onChange={(e) => { setSelectedVendor(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700"
            >
              <option value="">All Vendors</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>
                  🏪 {v.storeName || v.companyName || v.sellerName || 'Vendor'}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>

            {/* Stock Availability Filter */}
            <select
              value={stockFilter}
              onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700"
            >
              <option value="">All Stock Status</option>
              <option value="IN_STOCK">In Stock (&gt; 5)</option>
              <option value="LOW_STOCK">Low Stock (1 - 5)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </motion.div>

      {/* Products Directory Table */}
      <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Product Catalog Ledger ({pagination?.total || products.length})
          </h3>
          <button onClick={fetchProducts} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Fetching products...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Fair Coin Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.length > 0 ? (
                  products.map((p) => {
                    const isSuperAdmin = p.sourceType === 'SUPER_ADMIN' || !p.vendorId;
                    const isLowStock = p.stock > 0 && p.stock <= 5;
                    const isOutOfStock = p.stock === 0;

                    return (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900 leading-tight truncate max-w-xs">{p.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {p.sku || p._id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {isSuperAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                              <Crown className="w-3 h-3 text-amber-500" /> SUPER ADMIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Store className="w-3 h-3" /> {p.vendorId?.storeName || 'Vendor Store'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {p.categoryId?.name || 'General Category'}
                        </td>

                        <td className="py-3 px-4 font-mono font-black text-slate-900">
                          ₹{p.price?.toLocaleString('en-IN')}
                          {p.mrp > p.price && (
                            <span className="line-through text-slate-400 text-[10px] block font-normal">
                              ₹{p.mrp?.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-amber-700">
                          <span className="flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            {(p.fairCoinPrice || p.price * 10).toLocaleString()} Coins
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold text-xs ${
                                isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                              }`}
                            >
                              {p.stock} units
                            </span>
                            <button
                              onClick={() => openStockModal(p)}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600"
                              title="Adjust Stock"
                            >
                              ± Edit
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              p.status === 'APPROVED' || p.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                            }`}
                          >
                            {p.status === 'APPROVED' || p.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/super-admin/products/${p._id}/edit`)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                              title="Edit Product Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(p)}
                              className={`p-1.5 rounded-lg border transition ${
                                p.status === 'APPROVED' || p.status === 'ACTIVE'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title={p.status === 'APPROVED' || p.status === 'ACTIVE' ? 'Deactivate Product' : 'Activate Product'}
                            >
                              {p.status === 'APPROVED' || p.status === 'ACTIVE' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p._id, p.name)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No products found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination?.pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} products)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stock Adjustment Modal */}
      {stockModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4"
          >
            <button
              onClick={() => setStockModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900">Manage Stock Inventory</h3>
            <p className="text-xs text-slate-500">
              Update inventory level for <span className="font-bold text-slate-900">{selectedProduct.name}</span>
            </p>

            <form onSubmit={handleStockUpdate} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stock Action</label>
                <select
                  value={stockAction}
                  onChange={(e) => setStockAction(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="ADD">➕ Add Stock Quantity</option>
                  <option value="REDUCE">➖ Reduce Stock Quantity</option>
                  <option value="SET">🎯 Set Exact Stock Quantity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600">
                Current Stock: <span className="font-bold text-slate-900">{selectedProduct.stock} units</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  Save Stock Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SuperAdminProducts;
