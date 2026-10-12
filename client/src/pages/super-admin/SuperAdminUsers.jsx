import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  KeyRound,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  RefreshCw,
  X,
  Coins,
  Eye,
  Store,
  MapPin,
  CreditCard,
  FileText,
  Phone,
  Mail,
  Calendar,
  Building,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Landmark,
  UserCheck,
  CheckSquare,
  Sparkles,
  ShoppingBag,
  Award,
  Download,
  Share2,
  FileSpreadsheet
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const isPdfUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return lower.startsWith('data:application/pdf') || lower.includes('.pdf') || lower.includes('/pdf/');
};

const downloadDocument = (url, defaultFileName = 'document.pdf') => {
  if (!url) return;
  try {
    if (url.startsWith('data:')) {
      const parts = url.split(';base64,');
      const contentType = parts[0].split(':')[1] || 'application/octet-stream';
      const b64Data = parts[1] || '';
      const byteCharacters = atob(b64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      const blob = new Blob(byteArrays, { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = defaultFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = defaultFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error('Download failed, opening in new tab:', err);
    window.open(url, '_blank');
  }
};

const openDocument = (url) => {
  if (!url) return;
  if (url.startsWith('data:')) {
    try {
      const parts = url.split(';base64,');
      const contentType = parts[0].split(':')[1] || 'application/pdf';
      const b64Data = parts[1] || '';
      const byteCharacters = atob(b64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      const blob = new Blob(byteArrays, { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      window.open(url, '_blank');
    }
  } else {
    window.open(url, '_blank');
  }
};

const DocumentPreviewBox = ({ url, title, defaultFileName, onZoom }) => {
  const [imgError, setImgError] = useState(false);
  const isPdf = isPdfUrl(url);

  if (!url) {
    return <p className="text-slate-400 italic text-xs py-8 text-center">No document uploaded.</p>;
  }

  const fileName = defaultFileName || `${(title || 'Document').replace(/\s+/g, '_')}.${isPdf ? 'pdf' : 'png'}`;

  return (
    <div className="space-y-2 mt-2">
      {isPdf || imgError ? (
        <div className="w-full h-32 bg-slate-100 rounded-xl border border-slate-300 flex flex-col items-center justify-center p-3 text-center space-y-1">
          <FileText className="w-10 h-10 text-rose-500" />
          <span className="text-xs font-bold text-slate-700">PDF / Document File</span>
          <span className="text-[10px] text-slate-500 max-w-[200px] truncate">{title}</span>
        </div>
      ) : (
        <div className="relative group overflow-hidden rounded-xl border border-slate-300 bg-slate-100">
          <img
            src={url}
            alt={title}
            onError={() => setImgError(true)}
            onClick={() => onZoom && onZoom({ url, title, isPdf: false })}
            className="w-full h-32 object-cover cursor-pointer hover:scale-[1.02] transition"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
            <span className="px-2.5 py-1 bg-white/90 text-slate-900 text-xs font-bold rounded-lg shadow-sm">
              Click to Zoom
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => onZoom && onZoom({ url, title, isPdf: isPdf || imgError })}
          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition shadow-xs"
        >
          <Eye className="w-3.5 h-3.5 text-blue-600" /> View
        </button>
        <button
          type="button"
          onClick={() => openDocument(url)}
          className="inline-flex items-center justify-center p-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition shadow-xs"
          title="Open in New Tab"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
        </button>
        <button
          type="button"
          onClick={() => downloadDocument(url, fileName)}
          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
      </div>
    </div>
  );
};

export const SuperAdminUsers = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || '';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [talukFilter, setTalukFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const roleFromUrl = searchParams.get('role') || '';
    if (roleFromUrl !== roleFilter) {
      setRoleFilter(roleFromUrl);
    }
  }, [searchParams]);

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetPwModalOpen, setResetPwModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Create User Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'USER',
    storeName: '',
  });

  // 360 Full Profile Inspector Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'addresses', 'kyc', 'vendorStore', 'vendorDocs', 'vendorBank'
  const [lightboxImg, setLightboxImg] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [editForm, setEditForm] = useState({ name: '', phone: '', role: '', status: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError('');
      await superAdminService.createUser(createForm);
      setSuccessMsg(`New ${createForm.role === 'USER' ? 'Customer' : createForm.role} account created successfully!`);
      setCreateModalOpen(false);
      setCreateForm({ name: '', email: '', phone: '', password: '', role: 'USER', storeName: '' });
      fetchUsers(1);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const data = await superAdminService.getUsers({
        page,
        limit: pagination.limit,
        search,
        role: roleFilter,
        status: statusFilter,
        district: districtFilter,
        taluk: talukFilter,
        state: stateFilter,
      });
      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter, districtFilter, talukFilter, stateFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const openViewModal = async (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
    setViewLoading(true);
    setActiveTab('personal');
    setViewData(null);
    try {
      const data = await superAdminService.getUserById(user._id);
      setViewData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch full user profile');
    } finally {
      setViewLoading(false);
    }
  };

  // CSV Export Helper for a Single User's Full Profile
  const exportUserProfileCSV = (data) => {
    if (!data || !data.user) return;

    const {
      user,
      customerProfile,
      userAddresses = [],
      kycDocument,
      customerStats,
      vendor,
      vendorDocument,
      vendorBankAccount,
      vendorStats
    } = data;

    const addressesFormatted = userAddresses.map((a, i) =>
      `[Address ${i + 1}${a.isDefault ? ' (Default)' : ''}: ${a.fullName || a.name || 'N/A'}, Phone: ${a.phone || 'N/A'}, Street: ${a.streetAddress || a.street || 'N/A'}, City: ${a.city || 'N/A'}, State: ${a.state || 'N/A'} - ${a.zipCode || a.zip || 'N/A'}, Country: ${a.country || 'India'}]`
    ).join(' | ');

    const rows = [
      ['SECTION', 'FIELD', 'VALUE'],

      // Account Information
      ['Account Information', 'User ID', user._id || ''],
      ['Account Information', 'Full Name', user.name || ''],
      ['Account Information', 'Email Address', user.email || ''],
      ['Account Information', 'Mobile Phone', user.phone || 'N/A'],
      ['Account Information', 'User Role', user.role || ''],
      ['Account Information', 'Account Status', user.status || ''],
      ['Account Information', 'Email Verified', user.emailVerified ? 'Yes' : 'No'],
      ['Account Information', 'Phone Verified', user.phoneVerified ? 'Yes' : 'No'],
      ['Account Information', 'MFA Enabled', user.mfaEnabled ? 'Yes' : 'No'],
      ['Account Information', 'Avatar / Profile Image URL', user.avatar || customerProfile?.profileImage || 'N/A'],
      ['Account Information', 'Account Creation Date', user.createdAt ? new Date(user.createdAt).toLocaleString() : ''],
      ['Account Information', 'Last Login Time', user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'],

      // Customer Profile & Referrals
      ['Profile & Referrals', 'Gender', customerProfile?.gender || 'N/A'],
      ['Profile & Referrals', 'Date of Birth', customerProfile?.dateOfBirth ? new Date(customerProfile.dateOfBirth).toLocaleDateString() : 'N/A'],
      ['Profile & Referrals', 'Referral Code', user.referralCode || 'N/A'],
      ['Profile & Referrals', 'Referred By Name', user.referredBy?.name || 'Direct Signup'],
      ['Profile & Referrals', 'Referred By Email', user.referredBy?.email || 'N/A'],
      ['Profile & Referrals', 'Fair Coin Balance', user.fairCoinBalance || 0],
      ['Profile & Referrals', 'Super Coin Balance', user.superCoinBalance || 0],

      // Customer Stats & Saved Addresses
      ['Customer Activity', 'Total Orders Placed', customerStats?.ordersCount || 0],
      ['Customer Activity', 'Total Money Spent (INR)', customerStats?.totalSpent || 0],
      ['Customer Activity', 'Direct Referrals Count', customerStats?.referralsCount || 0],
      ['Customer Activity', 'Saved Addresses Count', userAddresses.length],
      ['Customer Activity', 'Saved Delivery Addresses List', addressesFormatted || 'None Saved'],

      // Customer Identity KYC
      ['Identity KYC Document', 'KYC Status', kycDocument?.status || 'Not Submitted'],
      ['Identity KYC Document', 'Document Type', kycDocument?.documentType || 'N/A'],
      ['Identity KYC Document', 'Document Number', kycDocument?.documentNumber || 'N/A'],
      ['Identity KYC Document', 'Uploaded Document Image URL', kycDocument?.documentUrl || 'N/A'],
      ['Identity KYC Document', 'Rejection Reason', kycDocument?.rejectionReason || 'N/A'],
      ['Identity KYC Document', 'Submission Date', kycDocument?.createdAt ? new Date(kycDocument.createdAt).toLocaleString() : 'N/A'],

      // Vendor Store Profile (If Vendor)
      ['Vendor Store Profile', 'Store Name', vendor?.storeName || 'N/A'],
      ['Vendor Store Profile', 'Store Slug', vendor?.slug || 'N/A'],
      ['Vendor Store Profile', 'Store Description', vendor?.description || 'N/A'],
      ['Vendor Store Profile', 'Store Phone', vendor?.phone || 'N/A'],
      ['Vendor Store Profile', 'Store Email', vendor?.email || 'N/A'],
      ['Vendor Store Profile', 'Store Status', vendor?.status || 'N/A'],
      ['Vendor Store Profile', 'KYC Status', vendor?.kycStatus || 'N/A'],
      ['Vendor Store Profile', 'Commission Rate (%)', vendor ? `${vendor.commissionRate}%` : 'N/A'],
      ['Vendor Store Profile', 'Available Withdrawal Balance (INR)', vendor?.balance || 0],
      ['Vendor Store Profile', 'Pending Balance (INR)', vendor?.pendingBalance || 0],
      ['Vendor Store Profile', 'Total Platform Sales (INR)', vendor?.totalSales || vendorStats?.totalRevenue || 0],
      ['Vendor Store Profile', 'Total Catalog Products', vendorStats?.totalProducts || 0],
      ['Vendor Store Profile', 'Total Vendor Orders', vendorStats?.totalOrders || 0],
      ['Vendor Store Profile', 'Store Logo Image URL', vendor?.logo || 'N/A'],
      ['Vendor Store Profile', 'Store Banner Image URL', vendor?.banner || 'N/A'],
      ['Vendor Store Profile', 'Store Business Address', vendor?.address ? `${vendor.address.street}, ${vendor.address.city}, ${vendor.address.state} - ${vendor.address.zip}, ${vendor.address.country}` : 'N/A'],

      // Vendor Verification Documents
      ['Vendor Legal Documents', 'Identity Document Type', vendorDocument?.identityDocumentType || 'N/A'],
      ['Vendor Legal Documents', 'Identity Document Number', vendorDocument?.identityDocumentNumber || 'N/A'],
      ['Vendor Legal Documents', 'Identity Document Upload URL', vendorDocument?.identityDocumentUpload || 'N/A'],
      ['Vendor Legal Documents', 'Identity Document Status', vendorDocument?.identityDocumentStatus || 'N/A'],
      ['Vendor Legal Documents', 'PAN Document Upload URL', vendorDocument?.panDocumentUpload || 'N/A'],
      ['Vendor Legal Documents', 'PAN Document Status', vendorDocument?.panDocumentStatus || 'N/A'],
      ['Vendor Legal Documents', 'GST Certificate Upload URL', vendorDocument?.gstCertificateUpload || 'N/A'],
      ['Vendor Legal Documents', 'GST Certificate Status', vendorDocument?.gstCertificateStatus || 'N/A'],
      ['Vendor Legal Documents', 'Business Proof Upload URL', vendorDocument?.businessProofUpload || 'N/A'],
      ['Vendor Legal Documents', 'Business Proof Status', vendorDocument?.businessProofStatus || 'N/A'],

      // Vendor Bank Account
      ['Vendor Bank Account', 'Bank Verification Status', vendorBankAccount?.verificationStatus || 'N/A'],
      ['Vendor Bank Account', 'Account Holder Name', vendorBankAccount?.accountHolderName || 'N/A'],
      ['Vendor Bank Account', 'Bank Name', vendorBankAccount?.bankName || 'N/A'],
      ['Vendor Bank Account', 'Account Number (Masked)', vendorBankAccount?.accountNumberMasked || vendorBankAccount?.accountNumber || 'N/A'],
      ['Vendor Bank Account', 'IFSC Code', vendorBankAccount?.ifscCode || 'N/A'],
      ['Vendor Bank Account', 'Branch Name', vendorBankAccount?.branchName || 'N/A'],
      ['Vendor Bank Account', 'UPI ID', vendorBankAccount?.upiId || 'N/A'],
      ['Vendor Bank Account', 'Bank Cheque/Passbook Proof URL', vendorBankAccount?.bankProofUpload || 'N/A'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows
        .map((row) =>
          row
            .map((cell) => {
              const str = String(cell ?? '').replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(',')
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sanitizedName = (user.name || 'user').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `user_full_details_${sanitizedName}_${user._id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Single User CSV directly from table row
  const handleDownloadUserCSV = async (user) => {
    try {
      setActionLoading(true);
      let data = viewData;
      if (!data || data.user?._id !== user._id) {
        data = await superAdminService.getUserById(user._id);
      }
      exportUserProfileCSV(data);
      setSuccessMsg(`CSV profile report for ${user.name} downloaded!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError('Failed to download user CSV');
    } finally {
      setActionLoading(false);
    }
  };

  // Export Directory Overview CSV
  const handleDownloadDirectoryCSV = () => {
    if (!users || users.length === 0) return;

    const headers = [
      'User ID',
      'Full Name',
      'Email Address',
      'Phone Number',
      'User Role',
      'Account Status',
      'Email Verified',
      'Fair Coin Balance',
      'Super Coin Balance',
      'Referral Code',
      'Account Created Date',
      'Last Login Time'
    ];

    const rows = users.map((u) => [
      u._id,
      u.name || '',
      u.email || '',
      u.phone || '',
      u.role || '',
      u.status || '',
      u.emailVerified ? 'Yes' : 'No',
      u.fairCoinBalance || 0,
      u.superCoinBalance || 0,
      u.referralCode || '',
      u.createdAt ? new Date(u.createdAt).toLocaleString() : '',
      u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              const str = String(cell ?? '').replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(',')
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `user_directory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError('');
      await superAdminService.updateUser(selectedUser._id, editForm);
      setSuccessMsg(`User ${editForm.name} updated successfully`);
      setEditModalOpen(false);
      fetchUsers(pagination.page);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      setError('');
      await superAdminService.updateUser(user._id, { status: newStatus });
      setSuccessMsg(`User status changed to ${newStatus}`);
      fetchUsers(pagination.page);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError('');
      await superAdminService.resetUserPassword(selectedUser._id, newPassword);
      setSuccessMsg(`Password for ${selectedUser.email} reset successfully`);
      setResetPwModalOpen(false);
      setNewPassword('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setActionLoading(true);
      setError('');
      await superAdminService.deleteUser(selectedUser._id);
      setSuccessMsg(`User ${selectedUser.name} deleted successfully`);
      setDeleteModalOpen(false);
      fetchUsers(pagination.page);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" /> Account & Vendor Directory
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User & Vendor Management</h1>
          <p className="text-xs text-slate-500">
            Inspect 360° customer & vendor profiles, uploaded identity documents, store logos, bank details, addresses, and download complete CSV profile reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>+ Add Customer / Vendor</span>
          </button>

          <button
            onClick={handleDownloadDirectoryCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200/80 shadow-sm transition"
            title="Export full list of users to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Directory CSV</span>
          </button>

          <button
            onClick={() => fetchUsers(pagination.page)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Feedback Alerts */}
      {error && (
        <motion.div
          variants={itemVariants}
          className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 font-bold hover:text-rose-700">✕</button>
        </motion.div>
      )}

      {successMsg && (
        <motion.div
          variants={itemVariants}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 font-bold hover:text-emerald-700">✕</button>
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm"
      >
        <form onSubmit={handleSearch} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or referral code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white font-medium transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="USER">Customer (USER)</option>
            <option value="VENDOR">Vendor</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="SHOPKEEPER">Shopkeeper</option>
            <option value="DELIVERY_PARTNER">Delivery Partner</option>
            <option value="HUB_STAFF">Hub Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
          </select>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="">All Districts</option>
            <option value="Chennai">Chennai</option>
            <option value="Coimbatore">Coimbatore</option>
            <option value="Madurai">Madurai</option>
            <option value="Salem">Salem</option>
            <option value="Tiruchirappalli">Tiruchirappalli</option>
            <option value="Chengalpattu">Chengalpattu</option>
          </select>

          <select
            value={talukFilter}
            onChange={(e) => setTalukFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="">All Taluks</option>
            <option value="Egmore">Egmore</option>
            <option value="Coimbatore North">Coimbatore North</option>
            <option value="Madurai South">Madurai South</option>
            <option value="Salem West">Salem West</option>
            <option value="Srirangam">Srirangam</option>
            <option value="Tambaram">Tambaram</option>
          </select>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="">All States</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
          </select>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">User / Avatar</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Active Subscription</th>
                <th className="px-4 py-3.5">Fair Coins</th>
                <th className="px-4 py-3.5">Created Date</th>
                <th className="px-4 py-3.5">District</th>
                <th className="px-4 py-3.5">Taluk</th>
                <th className="px-4 py-3.5">State</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading platform user directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-5 py-12 text-center text-slate-400 font-medium">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900">{u.name}</p>
                            {u.emailVerified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" title="Email Verified" />}
                          </div>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                          {u.phone && <p className="text-[10px] text-slate-400 font-mono">{u.phone}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${u.role === 'SUPER_ADMIN'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : u.role === 'ADMIN'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : u.role === 'VENDOR'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                      >
                        <Shield className="w-2.5 h-2.5" />
                        {u.role}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                          }`}
                      >
                        {u.status === 'ACTIVE' ? (
                          <CheckCircle className="w-2.5 h-2.5" />
                        ) : (
                          <XCircle className="w-2.5 h-2.5" />
                        )}
                        {u.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {u.subscription ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 shadow-xs" title={`Price: ₹${u.subscription.price}`}>
                          <Award className="w-3 h-3 text-purple-600" />
                          {u.subscription.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No Subscription</span>
                      )}
                    </td>

                    <td className="px-4 py-4 font-mono font-bold text-slate-900">
                      {(u.fairCoinBalance || 0).toLocaleString()}
                    </td>

                    <td className="px-4 py-4 text-slate-500 text-[11px] font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-4 text-slate-800 text-xs font-bold whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold text-blue-900 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/60">
                        <Building className="w-3 h-3 text-blue-600 shrink-0" />
                        {u.district || 'Chennai'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-700 text-xs font-semibold whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        {u.taluk || 'Egmore'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600 text-xs font-medium whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                        {u.state || 'Tamil Nadu'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openViewModal(u)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-200/60"
                          title="View 360° Profile & Uploaded Docs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadUserCSV(u)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-200/60"
                          title="Download Full Profile as CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setResetPwModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition-colors ${u.status === 'ACTIVE'
                              ? 'bg-slate-100 hover:bg-rose-50 text-rose-600'
                              : 'bg-slate-100 hover:bg-emerald-50 text-emerald-600'
                            }`}
                          title={u.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                        >
                          {u.status === 'ACTIVE' ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total users)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchUsers(pagination.page - 1)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-bold shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => fetchUsers(pagination.page + 1)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-bold shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* 360° USER & VENDOR FULL PROFILE INSPECTOR MODAL */}
      {/* ========================================== */}
      <AnimatePresence>
        {viewModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 text-white relative flex-shrink-0">
                <div className="absolute top-5 right-5 flex items-center gap-2">
                  <button
                    onClick={() => viewData && exportUserProfileCSV(viewData)}
                    disabled={!viewData}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                    title="Download complete profile & documents as CSV"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>

                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="p-1.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-32">
                  {viewData?.user?.avatar || viewData?.customerProfile?.profileImage || viewData?.vendor?.logo ? (
                    <img
                      src={viewData?.user?.avatar || viewData?.customerProfile?.profileImage || viewData?.vendor?.logo}
                      alt="Avatar"
                      onClick={() => setLightboxImg(viewData?.user?.avatar || viewData?.customerProfile?.profileImage || viewData?.vendor?.logo)}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md cursor-pointer hover:opacity-90 transition"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/50 border border-white/20 text-white flex items-center justify-center font-black text-2xl shadow-md">
                      {selectedUser?.name?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-black text-white tracking-tight">{selectedUser?.name}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/30 text-blue-200 border border-blue-400/40">
                        {selectedUser?.role}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${selectedUser?.status === 'ACTIVE' ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' : 'bg-rose-500/30 text-rose-200'
                        }`}>
                        {selectedUser?.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-blue-400" /> {selectedUser?.email}</span>
                      {selectedUser?.phone && <span className="flex items-center gap-1 font-mono"><Phone className="w-3.5 h-3.5 text-emerald-400" /> {selectedUser?.phone}</span>}
                    </div>
                  </div>
                </div>

                {/* Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/10 text-xs">
                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-300 uppercase font-bold flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" /> Fair Coins
                    </span>
                    <p className="text-base font-black text-amber-400 font-mono mt-0.5">
                      {(selectedUser?.fairCoinBalance || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-300 uppercase font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" /> Super Coins
                    </span>
                    <p className="text-base font-black text-purple-300 font-mono mt-0.5">
                      {(selectedUser?.superCoinBalance || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-300 uppercase font-bold flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-sky-400" /> Customer Orders
                    </span>
                    <p className="text-base font-black text-white font-mono mt-0.5">
                      {viewData?.customerStats?.ordersCount || 0} (₹{(viewData?.customerStats?.totalSpent || 0).toLocaleString()})
                    </p>
                  </div>

                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-300 uppercase font-bold flex items-center gap-1">
                      <Store className="w-3 h-3 text-emerald-400" /> Vendor Store
                    </span>
                    <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                      {viewData?.vendor ? viewData?.vendor.storeName : 'No Store'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="bg-slate-100 border-b border-slate-200 px-6 pt-2 flex items-center gap-2 overflow-x-auto text-xs font-bold flex-shrink-0">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'personal' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <UserCheck className="w-4 h-4" /> Personal & Account
                </button>

                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'addresses' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <MapPin className="w-4 h-4" /> Saved Addresses ({viewData?.userAddresses?.length || 0})
                </button>

                <button
                  onClick={() => setActiveTab('kyc')}
                  className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'kyc' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <ShieldCheck className="w-4 h-4" /> Identity KYC {viewData?.kycDocument && '✓'}
                </button>

                {viewData?.vendor && (
                  <>
                    <button
                      onClick={() => setActiveTab('vendorStore')}
                      className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'vendorStore' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <Store className="w-4 h-4 text-emerald-600" /> Vendor Store Profile
                    </button>

                    <button
                      onClick={() => setActiveTab('vendorDocs')}
                      className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'vendorDocs' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <FileText className="w-4 h-4 text-emerald-600" /> Vendor Documents
                    </button>

                    <button
                      onClick={() => setActiveTab('vendorBank')}
                      className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'vendorBank' ? 'border-blue-600 text-blue-600 font-black' : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <Landmark className="w-4 h-4 text-emerald-600" /> Vendor Bank Account
                    </button>
                  </>
                )}
              </div>

              {/* Tab Body */}
              <div className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
                {viewLoading ? (
                  <div className="py-16 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    Fetching 360° user details & uploaded documents...
                  </div>
                ) : (
                  <>
                    {/* TAB 1: PERSONAL & ACCOUNT INFO */}
                    {activeTab === 'personal' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Full Name</span>
                            <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedUser?.name}</p>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
                            <p className="text-xs font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                              {selectedUser?.email}
                              {selectedUser?.emailVerified ? (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">Verified</span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Unverified</span>
                              )}
                            </p>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile Phone</span>
                            <p className="text-xs font-mono font-semibold text-slate-900 mt-0.5">
                              {selectedUser?.phone || 'Not provided'}
                            </p>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Gender & DOB</span>
                            <p className="text-xs font-semibold text-slate-900 mt-0.5">
                              {viewData?.customerProfile?.gender || 'N/A'} • {viewData?.customerProfile?.dateOfBirth ? new Date(viewData.customerProfile.dateOfBirth).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Referral Code</span>
                            <p className="text-xs font-mono font-bold text-blue-600 mt-0.5">
                              {selectedUser?.referralCode || 'N/A'}
                            </p>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Referred By</span>
                            <p className="text-xs font-semibold text-slate-900 mt-0.5">
                              {selectedUser?.referredBy ? `${selectedUser.referredBy.name} (${selectedUser.referredBy.referralCode})` : 'Direct Signup'}
                            </p>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Account Created</span>
                            <p className="text-xs font-mono text-slate-700 mt-0.5">
                              {new Date(selectedUser?.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Last Login Time</span>
                            <p className="text-xs font-mono text-slate-700 mt-0.5">
                              {selectedUser?.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'}
                            </p>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Multi-Factor Auth (MFA)</span>
                            <p className="text-xs font-bold text-slate-900 mt-0.5">
                              {selectedUser?.mfaEnabled ? '🔐 Enabled' : 'Disabled'}
                            </p>
                          </div>
                        </div>

                        {/* Profile Avatar Card */}
                        {(selectedUser?.avatar || viewData?.customerProfile?.profileImage) && (
                          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                              <ImageIcon className="w-4 h-4 text-blue-600" /> Uploaded Profile Picture
                            </h4>
                            <div className="flex items-center gap-4">
                              <img
                                src={selectedUser?.avatar || viewData?.customerProfile?.profileImage}
                                alt="Profile Avatar"
                                onClick={() => setLightboxImg(selectedUser?.avatar || viewData?.customerProfile?.profileImage)}
                                className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-md cursor-pointer hover:scale-105 transition"
                              />
                              <div className="space-y-1">
                                <p className="text-xs text-slate-600 font-medium">Click image to expand full view.</p>
                                <a
                                  href={selectedUser?.avatar || viewData?.customerProfile?.profileImage}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                                >
                                  Open in new tab <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: SAVED ADDRESSES */}
                    {activeTab === 'addresses' && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-600" /> Customer Delivery Addresses
                        </h4>

                        {viewData?.userAddresses && viewData.userAddresses.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {viewData.userAddresses.map((addr, idx) => (
                              <div key={addr._id || idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 relative">
                                {addr.isDefault && (
                                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-[9px] uppercase rounded-full">
                                    Default Address
                                  </span>
                                )}
                                <p className="font-bold text-slate-900 text-sm">{addr.fullName || addr.name}</p>
                                <p className="text-slate-600 font-mono text-xs">{addr.phone}</p>
                                <p className="text-slate-700 leading-relaxed">
                                  {addr.streetAddress || addr.street}, {addr.city}, {addr.state} - {addr.zipCode || addr.zip}
                                </p>
                                <p className="text-slate-400 font-semibold">{addr.country || 'India'}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 py-8 text-center italic bg-slate-50 rounded-2xl">
                            No saved delivery addresses found for this account.
                          </p>
                        )}

                        {/* Store Address if Vendor */}
                        {viewData?.vendor?.address && (
                          <div className="pt-4 border-t border-slate-200">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                              <Building className="w-4 h-4 text-emerald-600" /> Vendor Registered Business Address
                            </h4>
                            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl leading-relaxed text-slate-800">
                              <p className="font-bold">{viewData.vendor.storeName}</p>
                              <p>{viewData.vendor.address.street}</p>
                              <p>{viewData.vendor.address.city}, {viewData.vendor.address.state} - {viewData.vendor.address.zip}</p>
                              <p>{viewData.vendor.address.country}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: IDENTITY KYC & UPLOADED DOCS */}
                    {activeTab === 'kyc' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">Customer Identity Verification (KYC)</h4>
                            <p className="text-slate-500 text-xs">Official document verification record.</p>
                          </div>

                          {viewData?.kycDocument ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${viewData.kycDocument.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                                viewData.kycDocument.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                              {viewData.kycDocument.status}
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
                              Not Submitted
                            </span>
                          )}
                        </div>

                        {viewData?.kycDocument ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Document Type</span>
                                <p className="font-bold text-slate-900 mt-0.5">{viewData.kycDocument.documentType}</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Document Number</span>
                                <p className="font-bold font-mono text-slate-900 mt-0.5">{viewData.kycDocument.documentNumber}</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Submitted At</span>
                                <p className="font-mono text-slate-700 mt-0.5">{new Date(viewData.kycDocument.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>

                            {viewData.kycDocument.rejectionReason && (
                              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium text-xs">
                                <strong>Rejection Reason:</strong> {viewData.kycDocument.rejectionReason}
                              </div>
                            )}

                            {/* KYC Document Upload Preview */}
                            {viewData.kycDocument.documentUrl && (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                                <span className="font-bold text-slate-900 block">Uploaded Document Proof</span>
                                <DocumentPreviewBox
                                  url={viewData.kycDocument.documentUrl}
                                  title="User Identity KYC Proof"
                                  defaultFileName={`User_KYC_Proof_${selectedUser?.name || 'Document'}`}
                                  onZoom={setLightboxImg}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-500 py-8 text-center italic bg-slate-50 rounded-2xl">
                            Customer has not submitted identity KYC documents.
                          </p>
                        )}
                      </div>
                    )}

                    {/* TAB 4: VENDOR STORE PROFILE */}
                    {activeTab === 'vendorStore' && viewData?.vendor && (
                      <div className="space-y-6">
                        {/* Store Banner & Logo */}
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                          {viewData.vendor.banner ? (
                            <img
                              src={viewData.vendor.banner}
                              alt="Store Banner"
                              onClick={() => setLightboxImg(viewData.vendor.banner)}
                              className="w-full h-36 object-cover cursor-pointer hover:opacity-95 transition"
                            />
                          ) : (
                            <div className="w-full h-28 bg-gradient-to-r from-emerald-700 to-teal-800 flex items-center justify-center text-white/40 font-black text-lg">
                              NO STORE BANNER UPLOADED
                            </div>
                          )}

                          <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {viewData.vendor.logo ? (
                                <img
                                  src={viewData.vendor.logo}
                                  alt="Store Logo"
                                  onClick={() => setLightboxImg(viewData.vendor.logo)}
                                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md cursor-pointer hover:scale-105 transition -mt-8 bg-white"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md -mt-8 border-2 border-white">
                                  {viewData.vendor.storeName?.charAt(0)}
                                </div>
                              )}

                              <div>
                                <h3 className="text-lg font-black text-slate-900">{viewData.vendor.storeName}</h3>
                                <p className="text-xs text-slate-500 font-mono">Slug: /{viewData.vendor.slug}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {viewData.vendor.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Store Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Commission Rate</span>
                            <p className="text-base font-black text-emerald-600 mt-0.5 font-mono">{viewData.vendor.commissionRate}%</p>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Available Balance</span>
                            <p className="text-base font-black text-slate-900 mt-0.5 font-mono">₹{(viewData.vendor.balance || 0).toLocaleString()}</p>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Sales Generated</span>
                            <p className="text-base font-black text-blue-600 mt-0.5 font-mono">₹{(viewData.vendor.totalSales || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <span className="font-bold text-slate-900 block">Store Description</span>
                          <p className="text-slate-600 leading-relaxed">{viewData.vendor.description || 'No description provided.'}</p>
                        </div>
                      </div>
                    )}

                    {/* TAB 5: VENDOR LEGAL & VERIFICATION DOCUMENTS */}
                    {activeTab === 'vendorDocs' && viewData?.vendor && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" /> Vendor Uploaded Legal Documents
                        </h4>

                        {viewData.vendorDocument ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* 1. Identity Document */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">Identity Document</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${viewData.vendorDocument.identityDocumentStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                  {viewData.vendorDocument.identityDocumentStatus}
                                </span>
                              </div>
                              <p className="text-slate-600 text-xs">Type: <strong>{viewData.vendorDocument.identityDocumentType}</strong></p>
                              <p className="text-slate-600 text-xs font-mono">Number: {viewData.vendorDocument.identityDocumentNumber}</p>

                              <DocumentPreviewBox
                                url={viewData.vendorDocument.identityDocumentUpload}
                                title="Identity Document Proof"
                                defaultFileName={`Vendor_Identity_Document_${viewData.vendor.storeName || 'Proof'}`}
                                onZoom={setLightboxImg}
                              />
                            </div>

                            {/* 2. PAN Document */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">PAN Card Document</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${viewData.vendorDocument.panDocumentStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                  {viewData.vendorDocument.panDocumentStatus}
                                </span>
                              </div>

                              <DocumentPreviewBox
                                url={viewData.vendorDocument.panDocumentUpload}
                                title="PAN Card Proof"
                                defaultFileName={`Vendor_PAN_Card_${viewData.vendor.storeName || 'Proof'}`}
                                onZoom={setLightboxImg}
                              />
                            </div>

                            {/* 3. GST Certificate */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">GST Certificate</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${viewData.vendorDocument.gstCertificateStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                  {viewData.vendorDocument.gstCertificateStatus}
                                </span>
                              </div>

                              <DocumentPreviewBox
                                url={viewData.vendorDocument.gstCertificateUpload}
                                title="GST Certificate Proof"
                                defaultFileName={`Vendor_GST_Certificate_${viewData.vendor.storeName || 'Proof'}`}
                                onZoom={setLightboxImg}
                              />
                            </div>

                            {/* 4. Business Registration Proof */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">Business Registration Proof</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${viewData.vendorDocument.businessProofStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                  {viewData.vendorDocument.businessProofStatus}
                                </span>
                              </div>

                              <DocumentPreviewBox
                                url={viewData.vendorDocument.businessProofUpload}
                                title="Business Registration Proof"
                                defaultFileName={`Vendor_Business_Proof_${viewData.vendor.storeName || 'Proof'}`}
                                onZoom={setLightboxImg}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-500 py-8 text-center italic bg-slate-50 rounded-2xl">
                            No verification documents recorded for this vendor.
                          </p>
                        )}
                      </div>
                    )}

                    {/* TAB 6: VENDOR BANK ACCOUNT & PAYOUT DETAILS */}
                    {activeTab === 'vendorBank' && viewData?.vendor && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">Vendor Bank Account for Payouts</h4>
                            <p className="text-slate-500 text-xs">Official bank settlement account details.</p>
                          </div>

                          {viewData?.vendorBankAccount ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${viewData.vendorBankAccount.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                              {viewData.vendorBankAccount.verificationStatus}
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
                              Not Provided
                            </span>
                          )}
                        </div>

                        {viewData?.vendorBankAccount ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Account Holder</span>
                                <p className="font-bold text-slate-900 mt-0.5">{viewData.vendorBankAccount.accountHolderName}</p>
                              </div>

                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</span>
                                <p className="font-bold text-slate-900 mt-0.5">{viewData.vendorBankAccount.bankName}</p>
                              </div>

                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Account Number (Masked)</span>
                                <p className="font-bold font-mono text-slate-900 mt-0.5">{viewData.vendorBankAccount.accountNumberMasked || viewData.vendorBankAccount.accountNumber}</p>
                              </div>

                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">IFSC Code</span>
                                <p className="font-bold font-mono text-slate-900 mt-0.5">{viewData.vendorBankAccount.ifscCode}</p>
                              </div>

                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Branch Name</span>
                                <p className="font-semibold text-slate-800 mt-0.5">{viewData.vendorBankAccount.branchName || 'N/A'}</p>
                              </div>

                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">UPI ID</span>
                                <p className="font-bold font-mono text-blue-600 mt-0.5">{viewData.vendorBankAccount.upiId || 'N/A'}</p>
                              </div>
                            </div>

                            {/* Bank Cheque / Passbook Image Proof */}
                            {viewData.vendorBankAccount.bankProofUpload && (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                                <span className="font-bold text-slate-900 block">Uploaded Bank Passbook / Cancelled Cheque Proof</span>
                                <DocumentPreviewBox
                                  url={viewData.vendorBankAccount.bankProofUpload}
                                  title="Bank Account Passbook / Cheque Proof"
                                  defaultFileName={`Vendor_Bank_Proof_${viewData.vendor.storeName || 'Proof'}`}
                                  onZoom={setLightboxImg}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-500 py-8 text-center italic bg-slate-50 rounded-2xl">
                            Vendor has not submitted bank account details for payouts.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-medium flex-shrink-0">
                <span className="text-slate-500 font-mono text-[11px]">User ID: {selectedUser?._id}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewData && exportUserProfileCSV(viewData)}
                    disabled={!viewData}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Download Full CSV Report
                  </button>
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      openEditModal(selectedUser);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition"
                  >
                    Edit User Info
                  </button>
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-sm"
                  >
                    Close Inspector
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* IMAGE & DOCUMENT LIGHTBOX FULLSCREEN OVERLAY */}
      {/* ========================================== */}
      <AnimatePresence>
        {lightboxImg && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-6 right-6 p-2 text-white bg-white/20 hover:bg-white/40 rounded-full transition z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {(() => {
              const rawUrl = typeof lightboxImg === 'object' ? lightboxImg.url : lightboxImg;
              const title = typeof lightboxImg === 'object' ? lightboxImg.title || 'Document Preview' : 'Document Preview';
              const isPdf = typeof lightboxImg === 'object' ? lightboxImg.isPdf : isPdfUrl(rawUrl);
              const fileName = `${title.replace(/\s+/g, '_')}.${isPdf ? 'pdf' : 'png'}`;

              return (
                <div className="max-w-4xl w-full max-h-[85vh] p-4 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <h4 className="text-white font-bold text-sm truncate flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      {title}
                    </h4>
                  </div>

                  <div className="flex-1 overflow-auto flex items-center justify-center min-h-[300px] max-h-[65vh] bg-slate-950 rounded-xl p-2">
                    {isPdf ? (
                      <iframe
                        src={rawUrl}
                        title="PDF Document Preview"
                        className="w-full h-[60vh] rounded-lg border-0 bg-white"
                      />
                    ) : (
                      <img
                        src={rawUrl}
                        alt={title}
                        className="max-w-full max-h-[60vh] object-contain mx-auto rounded-lg shadow-md"
                      />
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-center gap-3 text-center">
                    <button
                      type="button"
                      onClick={() => openDocument(rawUrl)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" /> Open in New Tab
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadDocument(rawUrl, fileName)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </AnimatePresence>

      {/* Animated Edit User Modal */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setEditModalOpen(false)}
                className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-black text-slate-900">Edit User: {selectedUser?.email}</h3>
              <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="USER">Customer (USER)</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="SHOPKEEPER">Shopkeeper</option>
                    <option value="DELIVERY_PARTNER">Delivery Partner</option>
                    <option value="HUB_STAFF">Hub Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Animated Password Reset Modal */}
      <AnimatePresence>
        {resetPwModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setResetPwModalOpen(false)}
                className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" /> Reset Password
              </h3>
              <p className="text-xs text-slate-500">
                Set a new password for <strong className="text-slate-900">{selectedUser?.email}</strong>.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Password (min 8 chars)</label>
                  <input
                    type="password"
                    placeholder="Enter new password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                    required
                    minLength={8}
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setResetPwModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                  >
                    {actionLoading ? 'Updating...' : 'Set Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Animated Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-rose-200 rounded-3xl w-full max-w-sm p-6 space-y-4 text-center shadow-2xl relative"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">Delete User Account</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently remove <strong className="text-slate-900">{selectedUser?.name}</strong> ({selectedUser?.email})?
              </p>

              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20"
                >
                  {actionLoading ? 'Deleting...' : 'Confirm Deletion'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Animated Create User Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setCreateModalOpen(false)}
                className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" /> Add New Customer or Vendor
              </h3>
              <p className="text-xs text-slate-500">
                Directly register a new Customer, Vendor, or Admin account from the Super Admin dashboard.
              </p>

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="USER">Customer (USER)</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Password *</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters..."
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    required
                    minLength={6}
                  />
                </div>

                {createForm.role === 'VENDOR' && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Vendor Store Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Fashion Store"
                      value={createForm.storeName}
                      onChange={(e) => setCreateForm({ ...createForm, storeName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                  >
                    {actionLoading ? 'Creating...' : `Create ${createForm.role === 'USER' ? 'Customer' : createForm.role}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SuperAdminUsers;
