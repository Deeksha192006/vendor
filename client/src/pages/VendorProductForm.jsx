import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft,
  Package,
  DollarSign,
  Truck,
  Sparkles,
  Check,
  AlertCircle,
  Save,
  Send,
  Layers,
  Info,
  HelpCircle,
  Percent,
  UploadCloud,
  Image as ImageIcon,
  Plus,
  Search,
  X,
  Tag,
  Loader2,
} from 'lucide-react';

const STEPS = [
  { id: 0, label: 'Basic Info', desc: 'Title, Category, Details', icon: Package },
  { id: 1, label: 'Pricing & Tax', desc: 'MRP, Selling Price, GST', icon: DollarSign },
  { id: 2, label: 'Inventory & Shipping', desc: 'Stock & Dimensions', icon: Truck },
];

export default function VendorProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  // Category Modal & Search State
  const [categorySearch, setCategorySearch] = useState('');
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryModalError, setCategoryModalError] = useState('');
  const [categorySuccessMessage, setCategorySuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    brand: '',
    shortDescription: '',
    description: '',
    mrp: '',
    price: '',
    taxRate: '5',
    hsnCode: '',
    stock: '',
    lowStockThreshold: '5',
    weight: '',
    weightUnit: 'GRAM',
    length: '',
    width: '',
    height: '',
    dimensionUnit: 'CM',
    images: [],
    imageUrlInput: '',
    status: 'APPROVED'
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const cats = res.data?.data?.categories || res.data?.data || [];
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      console.warn('Failed to load categories directly, trying fallback', err);
      try {
        const res2 = await api.get('/vendor/categories');
        const cats2 = res2.data?.data?.categories || res2.data?.data || [];
        setCategories(Array.isArray(cats2) ? cats2 : []);
      } catch (err2) {
        console.error('Failed to load categories', err2);
      }
    }
  };

  const filteredCategories = categories.filter((c) =>
    categorySearch.trim()
      ? c.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
      : true
  );

  const handleSaveNewCategory = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newCategoryName.trim()) {
      setCategoryModalError('Please enter a valid category name.');
      return;
    }

    try {
      setCreatingCategory(true);
      setCategoryModalError('');

      const res = await api.post('/vendor/categories', {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        image: newCategoryImage.trim(),
      });

      const savedCat = res.data?.data?.category;
      const isAlreadyExisting = res.data?.data?.alreadyExists;

      if (savedCat) {
        setCategories((prev) => {
          const exists = prev.some((c) => c._id === savedCat._id);
          if (!exists) {
            return [...prev, savedCat].sort((a, b) => a.name.localeCompare(b.name));
          }
          return prev;
        });

        setFormData((prev) => ({ ...prev, categoryId: savedCat._id }));

        const msg = isAlreadyExisting
          ? `Category "${savedCat.name}" already exists and has been selected.`
          : 'Category created successfully and made available to all vendors.';
        setCategorySuccessMessage(msg);
        setTimeout(() => setCategorySuccessMessage(''), 6000);

        setIsAddCategoryModalOpen(false);
        setNewCategoryName('');
        setNewCategoryDescription('');
        setNewCategoryImage('');
      }
    } catch (err) {
      console.error('Failed to create category:', err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to create category. Please check your inputs.';
      setCategoryModalError(errMsg);
    } finally {
      setCreatingCategory(false);
    }
  };

  const fetchProduct = async () => {
    try {
      setFetchingProduct(true);
      setError('');
      const res = await api.get(`/vendor/products/${id}`);
      const p = res.data?.data?.product || res.data?.data;
      if (p) {
        setFormData({
          name: p.name || '',
          sku: p.sku || '',
          categoryId: p.categoryId?._id || p.categoryId || '',
          brand: p.brandId?.name || p.brand || '',
          shortDescription: p.shortDescription || '',
          description: p.description || '',
          mrp: p.mrp ? String(p.mrp) : '',
          price: p.price ? String(p.price) : '',
          taxRate: '5',
          hsnCode: p.hsnCode || '',
          stock: p.stock !== undefined ? String(p.stock) : '',
          lowStockThreshold: p.lowStockThreshold !== undefined ? String(p.lowStockThreshold) : '5',
          weight: p.weight ? String(p.weight) : '',
          weightUnit: p.weightUnit || 'GRAM',
          length: p.length ? String(p.length) : '',
          width: p.width ? String(p.width) : '',
          height: p.height ? String(p.height) : '',
          dimensionUnit: p.dimensionUnit || 'CM',
          images: p.images || [],
          imageUrlInput: '',
          status: p.status || 'PENDING_APPROVAL'
        });
      }
    } catch (err) {
      console.error('Failed to fetch product:', err);
      setError(err.response?.data?.message || 'Failed to fetch product details.');
    } finally {
      setFetchingProduct(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateSku = () => {
    const prefix = formData.name
      ? formData.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD')
      : 'SKU';
    const rand = Math.floor(1000 + Math.random() * 9000);
    const time = Date.now().toString().slice(-3);
    setFormData((prev) => ({ ...prev, sku: `${prefix}-${rand}-${time}` }));
  };

  const addImageUrl = () => {
    if (formData.imageUrlInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, prev.imageUrlInput.trim()],
        imageUrlInput: ''
      }));
    }
  };

  const removeImageUrl = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
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
        console.error('Failed to process image file:', err);
      }
    }

    e.target.value = '';
  };

  const validateCurrentStep = () => {
    if (activeStep === 0) {
      if (!formData.name.trim()) {
        setError('Please enter a valid product name.');
        return false;
      }
      if (!formData.sku.trim()) {
        setError('Please enter or generate a unique SKU.');
        return false;
      }
      if (!formData.categoryId) {
        setError('Please select a category for this product.');
        return false;
      }
    } else if (activeStep === 1) {
      const mrpNum = Number(formData.mrp);
      const priceNum = Number(formData.price);
      if (!formData.mrp || isNaN(mrpNum) || mrpNum <= 0) {
        setError('Please enter a valid Maximum Retail Price (MRP).');
        return false;
      }
      if (!formData.price || isNaN(priceNum) || priceNum <= 0) {
        setError('Please enter a valid Selling Price.');
        return false;
      }
      if (priceNum > mrpNum) {
        setError('Selling price cannot exceed the Maximum Retail Price (MRP).');
        return false;
      }
    } else if (activeStep === 2) {
      const stockNum = Number(formData.stock);
      if (formData.stock === '' || isNaN(stockNum) || stockNum < 0) {
        setError('Please specify available stock quantity (0 or more).');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prev) => Math.min(STEPS.length - 1, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft && !validateCurrentStep()) return;

    try {
      setLoading(true);
      setError('');

      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        categoryId: formData.categoryId,
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
        mrp: Number(formData.mrp) || 0,
        price: Number(formData.price) || 0,
        taxRate: 5,
        hsnCode: formData.hsnCode.trim(),
        stock: Number(formData.stock) || 0,
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
        weight: Number(formData.weight) || 0,
        weightUnit: formData.weightUnit || 'GRAM',
        length: Number(formData.length) || 0,
        width: Number(formData.width) || 0,
        height: Number(formData.height) || 0,
        dimensionUnit: formData.dimensionUnit || 'CM',
        images: formData.images,
        status: isDraft ? 'DRAFT' : 'APPROVED'
      };

      if (isEditing) {
        await api.put(`/vendor/products/${id}`, payload);
      } else {
        await api.post('/vendor/products', payload);
      }

      navigate('/vendor/products');
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.message || 'Failed to save product. Please verify all fields.');
    } finally {
      setLoading(false);
    }
  };

  const discountPercent =
    formData.mrp && formData.price && Number(formData.mrp) > Number(formData.price)
      ? Math.round(((Number(formData.mrp) - Number(formData.price)) / Number(formData.mrp)) * 100)
      : null;

  if (fetchingProduct) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-500">Loading product information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/vendor/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Products
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Fill in the details below to list your item on the store catalog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            Save as Draft
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = activeStep > step.id;
            const isCurrent = activeStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (activeStep > step.id) setActiveStep(step.id);
                }}
                disabled={activeStep < step.id}
                className={`text-left p-3 sm:p-4 rounded-xl transition-all border ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60 cursor-pointer'
                    : 'border-slate-100 bg-slate-50/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : step.id + 1}
                  </div>
                  <div className="min-w-0 hidden sm:block">
                    <div className="text-xs font-semibold text-slate-900 truncate">{step.label}</div>
                    <div className="text-[11px] text-slate-500 truncate">{step.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-500" />
          <div className="flex-1 text-sm font-medium">{error}</div>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600 font-bold">×</button>
        </div>
      )}

      {/* Form Content Container */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Step 1: Basic Info */}
        {activeStep === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Basic Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">Define how this product appears to customers</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="e.g. WNH-001"
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={generateSku}
                    className="px-3 py-2.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1 shadow-sm"
                    title="Generate unique SKU"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Auto
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryModalError('');
                      setNewCategoryName('');
                      setNewCategoryDescription('');
                      setNewCategoryImage('');
                      setIsAddCategoryModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#ED1C2E] hover:text-[#c41221] hover:underline transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add New Category
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Category Search Filter */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search shared categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                    />
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => setCategorySearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW__') {
                        setCategoryModalError('');
                        setNewCategoryName('');
                        setNewCategoryDescription('');
                        setNewCategoryImage('');
                        setIsAddCategoryModalOpen(true);
                      } else {
                        handleChange(e);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 cursor-pointer"
                  >
                    <option value="">Select a category</option>
                    <option value="__ADD_NEW__" className="text-[#ED1C2E] font-bold">
                      ➕ + Add New Category...
                    </option>
                    <optgroup label="Shared Global Categories">
                      {filteredCategories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} {c.createdByRole === 'VENDOR' ? '— (Vendor Added)' : ''}
                        </option>
                      ))}
                    </optgroup>
                    {filteredCategories.length === 0 && (
                      <option disabled>No categories found matching "{categorySearch}"</option>
                    )}
                  </select>
                </div>

                {categorySuccessMessage && (
                  <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    {categorySuccessMessage}
                  </p>
                )}
              </div>

              {/* Short Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Short Description
                </label>
                <textarea
                  name="shortDescription"
                  rows={2}
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="Brief 1-2 sentence overview of key features..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Full Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Description & Specifications
                </label>
                <textarea
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed product information, features, materials, warranty, and technical specs..."
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Product Images (Browse & Upload or URL) */}
              <div className="sm:col-span-2 pt-2 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Product Images (Browse & Upload)
                </label>

                {/* File Upload Drop Zone */}
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50 relative group">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">Click to Browse Images from Computer</span>
                      <span className="text-slate-500 text-xs block mt-0.5">Supports PNG, JPG, WEBP formats</span>
                    </div>
                  </div>
                </div>

                {/* Optional Image URL Input */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Or paste Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={formData.imageUrlInput}
                      onChange={(e) => setFormData({ ...formData, imageUrlInput: e.target.value })}
                      placeholder="https://example.com/images/product.jpg"
                      className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors whitespace-nowrap"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Uploaded Images Gallery Preview */}
                {formData.images.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-bold text-slate-600 mb-2">
                      Uploaded Images ({formData.images.length})
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-xs">
                          <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImageUrl(idx)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold opacity-90 hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing & Tax */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pricing & Taxation</h2>
              <p className="text-xs text-slate-500 mt-0.5">Configure prices, discounts, and GST compliance</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* MRP */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Maximum Retail Price (MRP ₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                  <input
                    type="number"
                    name="mrp"
                    min="0"
                    step="0.01"
                    value={formData.mrp}
                    onChange={handleChange}
                    placeholder="999"
                    className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Selling Price (Discounted ₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="799"
                    className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Live Discount Indicator */}
              {discountPercent !== null && (
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-600" />
                    <span>Customer Discount: <strong className="font-bold">{discountPercent}% OFF</strong></span>
                  </div>
                  <span>
                    Savings: <strong>₹{(Number(formData.mrp) - Number(formData.price)).toFixed(2)}</strong>
                  </span>
                </div>
              )}

              {/* Fixed 5% Platform Commission & Vendor Earnings Breakdown */}
              {Number(formData.price) > 0 && (
                <div className="sm:col-span-2 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        %
                      </div>
                      <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                        BAAPOO MART Platform Commission Breakdown
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Fixed 5% Rate
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-[11px] font-medium text-slate-500 block">Customer Selling Price</span>
                      <span className="text-base font-bold text-slate-900">
                        ₹{Number(formData.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-rose-200">
                      <span className="text-[11px] font-medium text-rose-600 block">Platform Commission (5%)</span>
                      <span className="text-base font-bold text-rose-600">
                        -₹{(Number(formData.price) * 0.05).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
                      <span className="text-[11px] font-medium text-emerald-700 block">Your Expected Earnings (95%)</span>
                      <span className="text-base font-bold text-emerald-700">
                        ₹{(Number(formData.price) * 0.95).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-600 bg-white/90 p-3 rounded-lg border border-blue-100">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>BAAPOO MART</strong> charges a fixed 5% platform commission on eligible vendor product sales. You receive the remaining 95% after successful delivery and settlement eligibility.
                    </span>
                  </div>
                </div>
              )}

              {/* Fixed 5% Tax Rate */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    GST Tax Rate (%)
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Fixed 5%
                  </span>
                </div>
                <select
                  name="taxRate"
                  value="5"
                  disabled
                  className="w-full px-4 py-2.5 text-sm bg-slate-100/90 border border-slate-200 rounded-xl text-slate-800 font-medium cursor-not-allowed"
                >
                  <option value="5">5% (Fixed)</option>
                </select>
              </div>

              {/* HSN Code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  placeholder="e.g. 85183000"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Inventory & Shipping */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Inventory & Logistics</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage quantities, stock alerts, and package parcel metrics</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Stock Quantity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Available Stock Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="e.g. 100"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Low Stock Alert Threshold */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  name="lowStockThreshold"
                  min="1"
                  value={formData.lowStockThreshold}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Shipping Weight */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Package Weight
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <input
                      type="number"
                      name="weight"
                      min="0"
                      step="0.01"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="e.g. 250"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <select
                      name="weightUnit"
                      value={formData.weightUnit}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 cursor-pointer"
                    >
                      <option value="GRAM">Grams (g)</option>
                      <option value="KG">Kilograms (kg)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Package Dimensions */}
              <div className="sm:col-span-2 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Package Dimensions (Length × Width × Height in cm)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Length (cm)</label>
                    <input
                      type="number"
                      name="length"
                      min="0"
                      step="0.1"
                      value={formData.length}
                      onChange={handleChange}
                      placeholder="L"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Width (cm)</label>
                    <input
                      type="number"
                      name="width"
                      min="0"
                      step="0.1"
                      value={formData.width}
                      onChange={handleChange}
                      placeholder="W"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      min="0"
                      step="0.1"
                      value={formData.height}
                      onChange={handleChange}
                      placeholder="H"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-colors"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              Save as Draft
            </button>

            {activeStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition-all"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm shadow-md shadow-blue-500/25 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isEditing ? 'Update & Submit' : 'Submit for Approval'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Shared Category Creation Modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-red-50/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-[#ED1C2E] flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Category</h3>
                  <p className="text-[11px] text-slate-500">Shared across all vendors in BAAPOO MART</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveNewCategory} className="p-6 space-y-4">
              {categoryModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{categoryModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Smart Home Devices"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-800 placeholder-slate-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Normalized and added to the central database for all vendors to use.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description <span className="text-slate-400 text-[10px] normal-case">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief description of products in this category..."
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category Image URL <span className="text-slate-400 text-[10px] normal-case">(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newCategoryImage}
                  onChange={(e) => setNewCategoryImage(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCategory || !newCategoryName.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#ED1C2E] hover:bg-[#d41727] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  {creatingCategory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
