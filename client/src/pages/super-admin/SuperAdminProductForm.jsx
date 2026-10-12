import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Save,
  ArrowLeft,
  Crown,
  Store,
  Coins,
  DollarSign,
  Tag,
  Boxes,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Upload,
  Trash2,
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import api from '../../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const SuperAdminProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Global conversion rate
  const [coinsPerRupee, setCoinsPerRupee] = useState(10);

  const [formData, setFormData] = useState({
    sourceType: 'SUPER_ADMIN', // 'SUPER_ADMIN' | 'VENDOR'
    name: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    subCategory: '',
    brandName: 'FairKart Direct',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop'],
    mrp: 999,
    price: 799,
    fairCoinPrice: 7990,
    discountValue: 20,
    stock: 50,
    minStockLevel: 5,
    sku: '',
    weight: 0.5,
    availableSizes: 'M, L, XL',
    availableColors: 'Black, Blue, White',
    status: 'APPROVED',
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch categories & settings
      const [catRes, setRes] = await Promise.all([
        api.get('/categories'),
        superAdminService.getSettings(),
      ]);

      const catList = catRes.data?.data?.categories || catRes.data?.data || [];
      setCategories(catList);

      const rate = setRes?.settings?.FAIR_COINS_PER_RUPEE ? Number(setRes.settings.FAIR_COINS_PER_RUPEE) : 10;
      setCoinsPerRupee(rate);

      if (!isEdit && catList.length > 0) {
        setFormData((prev) => ({ ...prev, categoryId: catList[0]._id }));
      }

      // If Edit mode, load product details
      if (isEdit) {
        const prodRes = await superAdminService.getProducts({ search: id });
        const prod = prodRes?.products?.find((p) => p._id === id || p.sku === id);
        if (prod) {
          setFormData({
            sourceType: prod.sourceType || 'SUPER_ADMIN',
            name: prod.name || '',
            description: prod.description || '',
            shortDescription: prod.shortDescription || '',
            categoryId: prod.categoryId?._id || prod.categoryId || '',
            subCategory: prod.subCategory || '',
            brandName: prod.brandName || 'FairKart Direct',
            images: prod.images?.length > 0 ? prod.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop'],
            imageUrlInput: '',
            mrp: prod.mrp || 0,
            price: prod.price || 0,
            fairCoinPrice: prod.fairCoinPrice || (prod.price * rate),
            discountValue: prod.discountValue || 0,
            stock: prod.stock || 0,
            minStockLevel: prod.minStockLevel || prod.lowStockThreshold || 5,
            sku: prod.sku || '',
            weight: prod.weight || 0,
            availableSizes: Array.isArray(prod.availableSizes) ? prod.availableSizes.join(', ') : '',
            availableColors: Array.isArray(prod.availableColors) ? prod.availableColors.join(', ') : '',
            status: prod.status || 'APPROVED',
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  // Recalculate Fair Coin price when price changes
  const handlePriceChange = (newPrice) => {
    const p = Number(newPrice) || 0;
    const calcFairCoins = Math.round(p * coinsPerRupee);
    const discount = formData.mrp > p ? Math.round(((formData.mrp - p) / formData.mrp) * 100) : 0;
    setFormData((prev) => ({
      ...prev,
      price: p,
      fairCoinPrice: calcFairCoins,
      discountValue: discount,
    }));
  };

  const compressImage = (file, maxWidth = 1000, maxHeight = 1000, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressedBase64 = await compressImage(file);
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, compressedBase64],
        }));
      } catch (err) {
        console.error('Failed to process image:', err);
      }
    }

    e.target.value = '';
  };

  const handleRemoveImage = (idx) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setError('Product name is required');
    if (!formData.categoryId) return setError('Please select a category');

    try {
      setSaving(true);
      setError('');

      const payload = {
        ...formData,
        availableSizes: formData.availableSizes.split(',').map((s) => s.trim()).filter(Boolean),
        availableColors: formData.availableColors.split(',').map((c) => c.trim()).filter(Boolean),
      };

      if (isEdit) {
        await superAdminService.updateProduct(id, payload);
        setSuccessMsg('Product updated successfully and published to Customer Catalog!');
      } else {
        await superAdminService.createProduct(payload);
        setSuccessMsg('Product created successfully and published to Customer Catalog!');
      }

      setTimeout(() => {
        navigate('/super-admin/products');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-5xl mx-auto pb-12"
    >
      {/* Header Banner */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/super-admin/products')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-xs text-slate-500">
              Configure product details, stock, source type, and Fair Coin conversion rules.
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save & Publish Product'}</span>
        </button>
      </motion.div>

      {successMsg && (
        <motion.div variants={itemVariants} className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" /> {successMsg}
        </motion.div>
      )}

      {error && (
        <motion.div variants={itemVariants} className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Product Source Selection */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" /> 1. Product Source Ownership
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                formData.sourceType === 'SUPER_ADMIN'
                  ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="sourceType"
                value="SUPER_ADMIN"
                checked={formData.sourceType === 'SUPER_ADMIN'}
                onChange={(e) => setFormData({ ...formData, sourceType: e.target.value, brandName: 'FairKart Direct' })}
                className="w-4 h-4 accent-blue-600"
              />
              <div>
                <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-500" /> Super Admin Direct Sale
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Product belongs directly to FairKart platform. Revenue recorded as Super Admin Product Sale.
                </p>
              </div>
            </label>

            <label
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                formData.sourceType === 'VENDOR'
                  ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="sourceType"
                value="VENDOR"
                checked={formData.sourceType === 'VENDOR'}
                onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                className="w-4 h-4 accent-blue-600"
              />
              <div>
                <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-600" /> Vendor Merchant Sale
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Product supplied by registered marketplace vendor store.
                </p>
              </div>
            </label>
          </div>
        </motion.div>

        {/* 2. Basic Information */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" /> 2. Basic Product Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Product Title / Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Premium Cotton Casual Shirt"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Category *</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Subcategory / Tag</label>
              <input
                type="text"
                placeholder="e.g. Men's Fashion, Electronics"
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Brand Name</label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">SKU Code</label>
              <input
                type="text"
                placeholder="Auto-generated if left blank"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Product Description</label>
              <textarea
                rows={3}
                placeholder="Detailed description of product features, material, and specifications..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* 3. Pricing & Fair Coin Integration */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" /> 3. Pricing & Fair Coin Conversion
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">MRP Price (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.price}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-black text-blue-700"
              />
            </div>

            <div>
              <label className="block text-amber-900 font-bold mb-1 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-500" /> Fair Coin Price
              </label>
              <input
                type="number"
                min="0"
                value={formData.fairCoinPrice}
                onChange={(e) => setFormData({ ...formData, fairCoinPrice: Number(e.target.value) })}
                className="w-full bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-amber-900 font-mono font-black"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[11px] text-amber-800 font-medium flex items-center justify-between">
            <span>Active Fair Coins Conversion Rate:</span>
            <span className="font-mono font-black">
              {coinsPerRupee} Fair Coins = ₹1 (Auto-calculated: ₹{formData.price} = {formData.fairCoinPrice} Coins)
            </span>
          </div>
        </motion.div>

        {/* 4. Inventory & Stock Controls */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Boxes className="w-4 h-4 text-purple-600" /> 4. Stock & Inventory Governance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Initial Stock Quantity *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-black"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Minimum Stock Alert Level</label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Publishing Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold"
              >
                <option value="APPROVED">Active & Published</option>
                <option value="INACTIVE">Inactive (Hidden)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* 5. Images & Specifications */}
        <motion.div variants={itemVariants} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-600" /> 5. Images & Variants
          </h3>

          <div className="space-y-3 text-xs">
            <label className="block text-slate-700 font-bold">Product Images (Browse & Upload)</label>
            
            {/* File Upload Box */}
            <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFileUpload}
                id="product-image-file-input"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-black text-slate-900 text-sm">Click to Browse Images</span>
                  <span className="text-slate-500 block text-xs mt-0.5">Select image files from your computer (PNG, JPG, WEBP)</span>
                </div>
              </div>
            </div>

            {/* Image Preview Grid */}
            {formData.images.length > 0 && (
              <div className="pt-2">
                <label className="block text-slate-500 font-bold mb-2 text-[11px] uppercase tracking-wider">
                  Uploaded Images ({formData.images.length})
                </label>
                <div className="flex flex-wrap gap-3">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative group w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                      <img src={img} alt={`Product preview ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white font-black text-[9px] rounded-md shadow-sm">
                          Main
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1 right-1 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Available Sizes (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="S, M, L, XL, XXL"
                  value={formData.availableSizes}
                  onChange={(e) => setFormData({ ...formData, availableSizes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Available Colors (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="Black, Blue, White, Red"
                  value={formData.availableColors}
                  onChange={(e) => setFormData({ ...formData, availableColors: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/super-admin/products')}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save & Publish Product'}</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default SuperAdminProductForm;
