import { CustomerSubscription } from '../models/CustomerSubscription.js';
import { VendorSubscription } from '../models/VendorSubscription.js';
import { CustomerSubscriptionPlan } from '../models/CustomerSubscriptionPlan.js';
import { VendorSubscriptionPlan } from '../models/VendorSubscriptionPlan.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { Payment } from '../models/Payment.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

/**
 * Standardize a CustomerSubscription document to a unified monitoring format
 */
function normalizeCustomerSubscription(sub) {
  const customer = sub.customerId || {};
  const isPaid = ['Paid', 'PAID', 'SUCCESS', 'Success'].includes(sub.paymentStatus);
  const now = new Date();
  const isExp = sub.expiryDate ? new Date(sub.expiryDate) < now : false;

  let computedStatus = sub.subscriptionStatus || sub.status || 'Active';
  if (computedStatus === 'Active' && isExp) computedStatus = 'Expired';
  if (computedStatus === 'ACTIVE' && isExp) computedStatus = 'Expired';

  const expTime = sub.expiryDate ? new Date(sub.expiryDate).getTime() : 0;
  const remainingDays = expTime > now.getTime() ? Math.ceil((expTime - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return {
    _id: sub._id,
    id: sub._id,
    subscriberType: 'CUSTOMER',
    subscriberId: customer._id || sub.customerId,
    subscriberName: customer.name || 'Customer',
    subscriberEmail: customer.email || 'N/A',
    subscriberPhone: customer.phone || 'N/A',
    businessName: null,
    planId: sub.planId,
    planName: sub.planNameSnapshot || sub.planSnapshot?.name || 'Customer VIP Plan',
    duration: sub.durationSnapshot?.durationValue
      ? `${sub.durationSnapshot.durationValue} ${sub.durationSnapshot.durationUnit || 'months'}`
      : `${sub.planSnapshot?.durationValue || 1} ${sub.planSnapshot?.durationUnit || 'months'}`,
    durationValue: sub.durationSnapshot?.durationValue || sub.planSnapshot?.durationValue || 1,
    durationUnit: sub.durationSnapshot?.durationUnit || sub.planSnapshot?.durationUnit || 'months',
    amount: sub.planPriceSnapshot ?? sub.planSnapshot?.price ?? 0,
    startDate: sub.startDate || sub.startedAt || sub.createdAt,
    expiryDate: sub.expiryDate || sub.expiresAt,
    remainingDays,
    paymentStatus: sub.paymentStatus || (isPaid ? 'Paid' : 'Pending Payment'),
    subscriptionStatus: computedStatus,
    transactionId: sub.transactionId || 'N/A',
    planSnapshot: sub.planSnapshot || {},
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  };
}

/**
 * Standardize a VendorSubscription document to a unified monitoring format
 */
function normalizeVendorSubscription(sub) {
  const vendor = sub.vendorId || {};
  const user = sub.userId || {};
  const isPaid = ['Paid', 'PAID', 'SUCCESS', 'Success'].includes(sub.paymentStatus);
  const now = new Date();
  const isExp = sub.expiryDate ? new Date(sub.expiryDate) < now : false;

  let computedStatus = sub.subscriptionStatus || sub.status || 'Active';
  if (computedStatus === 'Active' && isExp) computedStatus = 'Expired';
  if (computedStatus === 'ACTIVE' && isExp) computedStatus = 'Expired';

  const expTime = sub.expiryDate ? new Date(sub.expiryDate).getTime() : 0;
  const remainingDays = expTime > now.getTime() ? Math.ceil((expTime - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return {
    _id: sub._id,
    id: sub._id,
    subscriberType: 'VENDOR',
    subscriberId: vendor._id || sub.vendorId,
    subscriberName: vendor.storeName || user.name || 'Merchant',
    subscriberEmail: vendor.email || user.email || 'N/A',
    subscriberPhone: vendor.phone || user.phone || 'N/A',
    businessName: vendor.storeName || vendor.businessName || 'Merchant Store',
    planId: sub.planId,
    planName: sub.planNameSnapshot || sub.planSnapshot?.name || 'Vendor Plan',
    duration: sub.durationSnapshot?.durationValue
      ? `${sub.durationSnapshot.durationValue} ${sub.durationSnapshot.durationUnit || 'months'}`
      : `${sub.planSnapshot?.durationValue || 1} ${sub.planSnapshot?.durationUnit || 'months'}`,
    durationValue: sub.durationSnapshot?.durationValue || sub.planSnapshot?.durationValue || 1,
    durationUnit: sub.durationSnapshot?.durationUnit || sub.planSnapshot?.durationUnit || 'months',
    amount: sub.planPriceSnapshot ?? sub.planSnapshot?.price ?? 0,
    startDate: sub.startDate || sub.createdAt,
    expiryDate: sub.expiryDate || sub.endDate,
    remainingDays,
    paymentStatus: sub.paymentStatus || (isPaid ? 'Paid' : 'Pending Payment'),
    subscriptionStatus: computedStatus,
    transactionId: sub.transactionId || 'N/A',
    planSnapshot: sub.planSnapshot || {},
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  };
}

/**
 * Super Admin: Subscription Overview & Top Summary Cards
 */
export const getSubscriptionOverview = async (req, res, next) => {
  try {
    const now = new Date();

    // 1. Fetch raw subscriptions from both collections
    const [custSubs, vendorSubs] = await Promise.all([
      CustomerSubscription.find().lean(),
      VendorSubscription.find().lean(),
    ]);

    const allCustNorm = custSubs.map(normalizeCustomerSubscription);
    const allVendNorm = vendorSubs.map(normalizeVendorSubscription);
    const allNorm = [...allCustNorm, ...allVendNorm];

    // 2. Calculate Unique Subscribers
    const uniqueCustomerIds = new Set(custSubs.map((s) => s.customerId?.toString()).filter(Boolean));
    const uniqueVendorIds = new Set(vendorSubs.map((s) => s.vendorId?.toString()).filter(Boolean));
    const totalUniqueSubscribers = uniqueCustomerIds.size + uniqueVendorIds.size;

    // Status breakdown across unique users
    const activeCustomerSubs = allCustNorm.filter(
      (s) => (s.subscriptionStatus === 'Active' || s.subscriptionStatus === 'ACTIVE') && new Date(s.expiryDate) > now
    );
    const activeVendorSubs = allVendNorm.filter(
      (s) => (s.subscriptionStatus === 'Active' || s.subscriptionStatus === 'ACTIVE') && new Date(s.expiryDate) > now
    );

    const expiredSubs = allNorm.filter(
      (s) => s.subscriptionStatus === 'Expired' || new Date(s.expiryDate) <= now
    );

    const pendingPaymentSubs = allNorm.filter(
      (s) => s.paymentStatus === 'Pending Payment' || s.subscriptionStatus === 'Pending Payment' || s.paymentStatus === 'PENDING'
    );

    const cancelledSubs = allNorm.filter(
      (s) => s.subscriptionStatus === 'Cancelled' || s.subscriptionStatus === 'CANCELLED'
    );

    // 3. Revenue Calculations (Verified Successful Payments Only)
    const validPaidStatuses = ['Paid', 'PAID', 'SUCCESS', 'Success'];

    const customerRevenue = allCustNorm.reduce((sum, s) => {
      if (validPaidStatuses.includes(s.paymentStatus) && s.subscriptionStatus !== 'Payment Failed') {
        return sum + (Number(s.amount) || 0);
      }
      return sum;
    }, 0);

    const vendorRevenue = allVendNorm.reduce((sum, s) => {
      if (validPaidStatuses.includes(s.paymentStatus) && s.subscriptionStatus !== 'Payment Failed') {
        return sum + (Number(s.amount) || 0);
      }
      return sum;
    }, 0);

    const totalRevenue = customerRevenue + vendorRevenue;

    // Time-based revenue breakdowns
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const revenueThisMonth = allNorm.reduce((sum, s) => {
      const pDate = new Date(s.createdAt || s.startDate);
      if (pDate >= startOfMonth && validPaidStatuses.includes(s.paymentStatus)) {
        return sum + (Number(s.amount) || 0);
      }
      return sum;
    }, 0);

    const revenueThisQuarter = allNorm.reduce((sum, s) => {
      const pDate = new Date(s.createdAt || s.startDate);
      if (pDate >= startOfQuarter && validPaidStatuses.includes(s.paymentStatus)) {
        return sum + (Number(s.amount) || 0);
      }
      return sum;
    }, 0);

    const revenueThisYear = allNorm.reduce((sum, s) => {
      const pDate = new Date(s.createdAt || s.startDate);
      if (pDate >= startOfYear && validPaidStatuses.includes(s.paymentStatus)) {
        return sum + (Number(s.amount) || 0);
      }
      return sum;
    }, 0);

    // Expiry alerts count
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringIn7DaysCount = allNorm.filter(
      (s) => (s.subscriptionStatus === 'Active' || s.subscriptionStatus === 'ACTIVE') &&
        new Date(s.expiryDate) > now &&
        new Date(s.expiryDate) <= in7Days
    ).length;

    const expiringIn30DaysCount = allNorm.filter(
      (s) => (s.subscriptionStatus === 'Active' || s.subscriptionStatus === 'ACTIVE') &&
        new Date(s.expiryDate) > now &&
        new Date(s.expiryDate) <= in30Days
    ).length;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          summaryCards: {
            totalSubscribers: totalUniqueSubscribers,
            activeCustomerSubscriptions: activeCustomerSubs.length,
            activeVendorSubscriptions: activeVendorSubs.length,
            expiredSubscriptions: expiredSubs.length,
            pendingPayments: pendingPaymentSubs.length,
            cancelledSubscriptions: cancelledSubs.length,
            totalSubscriptionRevenue: totalRevenue,
            customerSubscriptionRevenue: customerRevenue,
            vendorSubscriptionRevenue: vendorRevenue,
          },
          revenueBreakdown: {
            totalRevenue,
            customerRevenue,
            vendorRevenue,
            revenueThisMonth,
            revenueThisQuarter,
            revenueThisYear,
            successfulPurchasesCount: allNorm.filter((s) => validPaidStatuses.includes(s.paymentStatus)).length,
            pendingPaymentsCount: pendingPaymentSubs.length,
            failedPaymentsCount: allNorm.filter((s) => s.paymentStatus === 'Payment Failed' || s.paymentStatus === 'FAILED').length,
            refundsTotal: 0,
          },
          expirySummary: {
            expiringIn7Days: expiringIn7DaysCount,
            expiringIn30Days: expiringIn30DaysCount,
            totalExpired: expiredSubs.length,
          },
        },
        'Subscription overview statistics calculated successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Super Admin: Get unified subscriptions list (All, Customer, or Vendor) with Search, Filters, Sorting, and Pagination
 */
export const getSubscriptions = async (req, res, next) => {
  try {
    const {
      type = 'ALL', // 'ALL' | 'CUSTOMER' | 'VENDOR'
      status = 'ALL', // 'ALL' | 'Active' | 'Expired' | 'Cancelled' | 'Pending'
      paymentStatus = 'ALL',
      search = '',
      plan = '',
      startDateFrom,
      startDateTo,
      expiryDateFrom,
      expiryDateTo,
      sortBy = 'createdAt', // 'createdAt' | 'expiryDate' | 'amount' | 'name'
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const fetchCustomers = type === 'ALL' || type === 'CUSTOMER';
    const fetchVendors = type === 'ALL' || type === 'VENDOR';

    let customerRecords = [];
    let vendorRecords = [];

    if (fetchCustomers) {
      const custSubs = await CustomerSubscription.find()
        .populate('customerId', 'name email phone role')
        .populate('planId', 'name planType price durationValue durationUnit')
        .lean();
      customerRecords = custSubs.map(normalizeCustomerSubscription);
    }

    if (fetchVendors) {
      const vendSubs = await VendorSubscription.find()
        .populate('vendorId', 'storeName businessName email phone status')
        .populate('userId', 'name email phone')
        .populate('planId', 'name planType price durationValue durationUnit')
        .lean();
      vendorRecords = vendSubs.map(normalizeVendorSubscription);
    }

    // Combine records
    let records = [...customerRecords, ...vendorRecords];

    // Apply Local Filtering & Search
    if (status !== 'ALL') {
      const qStatus = status.toLowerCase();
      records = records.filter((r) => {
        const s = (r.subscriptionStatus || '').toLowerCase();
        if (qStatus === 'active') return s === 'active';
        if (qStatus === 'expired') return s === 'expired' || (r.expiryDate && new Date(r.expiryDate) <= new Date());
        if (qStatus === 'cancelled') return s === 'cancelled';
        if (qStatus === 'pending') return s.includes('pending');
        return s === qStatus;
      });
    }

    if (paymentStatus !== 'ALL') {
      const qPay = paymentStatus.toLowerCase();
      records = records.filter((r) => {
        const p = (r.paymentStatus || '').toLowerCase();
        if (qPay === 'paid') return p === 'paid' || p === 'success';
        if (qPay === 'pending') return p.includes('pending');
        if (qPay === 'failed') return p.includes('fail');
        return p === qPay;
      });
    }

    if (plan && plan.trim()) {
      const qPlan = plan.trim().toLowerCase();
      records = records.filter((r) => (r.planName || '').toLowerCase().includes(qPlan));
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      records = records.filter((r) => {
        return (
          (r.subscriberName && r.subscriberName.toLowerCase().includes(q)) ||
          (r.subscriberEmail && r.subscriberEmail.toLowerCase().includes(q)) ||
          (r.businessName && r.businessName.toLowerCase().includes(q)) ||
          (r.planName && r.planName.toLowerCase().includes(q)) ||
          (r.transactionId && r.transactionId.toLowerCase().includes(q)) ||
          (r.subscriberId && r.subscriberId.toString().toLowerCase().includes(q)) ||
          (r._id && r._id.toString().toLowerCase().includes(q))
        );
      });
    }

    // Date range filters
    if (startDateFrom) {
      const from = new Date(startDateFrom);
      records = records.filter((r) => r.startDate && new Date(r.startDate) >= from);
    }
    if (startDateTo) {
      const to = new Date(startDateTo);
      records = records.filter((r) => r.startDate && new Date(r.startDate) <= to);
    }
    if (expiryDateFrom) {
      const from = new Date(expiryDateFrom);
      records = records.filter((r) => r.expiryDate && new Date(r.expiryDate) >= from);
    }
    if (expiryDateTo) {
      const to = new Date(expiryDateTo);
      records = records.filter((r) => r.expiryDate && new Date(r.expiryDate) <= to);
    }

    // Sorting
    records.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'amount') {
        valA = Number(a.amount) || 0;
        valB = Number(b.amount) || 0;
      } else if (sortBy === 'expiryDate') {
        valA = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
        valB = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
      } else if (sortBy === 'name') {
        valA = (a.subscriberName || '').toLowerCase();
        valB = (b.subscriberName || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        // Default: createdAt or startDate
        valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    const totalRecords = records.length;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const paginatedRecords = records.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscriptions: paginatedRecords,
          pagination: {
            total: totalRecords,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalRecords / limitNum) || 1,
          },
        },
        'Subscriptions retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Super Admin: Get detailed subscription record and user subscription history
 */
export const getSubscriptionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Search in CustomerSubscription first
    let sub = await CustomerSubscription.findById(id)
      .populate('customerId', 'name email phone role createdAt')
      .populate('planId')
      .lean();

    let subscriberType = 'CUSTOMER';
    let userHistory = [];

    if (sub) {
      subscriberType = 'CUSTOMER';
      const custHistory = await CustomerSubscription.find({
        customerId: sub.customerId?._id || sub.customerId,
      })
        .sort({ createdAt: -1 })
        .lean();
      userHistory = custHistory.map(normalizeCustomerSubscription);
      sub = normalizeCustomerSubscription(sub);
    } else {
      // Search in VendorSubscription
      sub = await VendorSubscription.findById(id)
        .populate('vendorId', 'storeName businessName email phone status createdAt')
        .populate('userId', 'name email phone')
        .populate('planId')
        .lean();

      if (!sub) {
        throw new ApiError(404, 'Subscription record not found', ERROR_CODES.NOT_FOUND);
      }

      subscriberType = 'VENDOR';
      const vendHistory = await VendorSubscription.find({
        vendorId: sub.vendorId?._id || sub.vendorId,
      })
        .sort({ createdAt: -1 })
        .lean();
      userHistory = vendHistory.map(normalizeVendorSubscription);
      sub = normalizeVendorSubscription(sub);
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          subscription: sub,
          subscriberType,
          history: userHistory,
        },
        'Subscription details retrieved successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Super Admin: Revenue Analytics (Time-series chart data & Plan distributions)
 */
export const getSubscriptionAnalytics = async (req, res, next) => {
  try {
    const now = new Date();

    const [custSubs, vendorSubs] = await Promise.all([
      CustomerSubscription.find().lean(),
      VendorSubscription.find().lean(),
    ]);

    const allCustNorm = custSubs.map(normalizeCustomerSubscription);
    const allVendNorm = vendorSubs.map(normalizeVendorSubscription);

    const validPaidStatuses = ['Paid', 'PAID', 'SUCCESS', 'Success'];

    // Generate monthly time series (Last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const custRev = allCustNorm
        .filter((s) => {
          const dt = new Date(s.createdAt || s.startDate);
          return dt >= d && dt < nextMonth && validPaidStatuses.includes(s.paymentStatus);
        })
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

      const vendRev = allVendNorm
        .filter((s) => {
          const dt = new Date(s.createdAt || s.startDate);
          return dt >= d && dt < nextMonth && validPaidStatuses.includes(s.paymentStatus);
        })
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

      monthlyData.push({
        month: monthLabel,
        customerRevenue: custRev,
        vendorRevenue: vendRev,
        totalRevenue: custRev + vendRev,
      });
    }

    // Plan distribution of active subscriptions
    const planCounts = {};
    const allActive = [...allCustNorm, ...allVendNorm].filter(
      (s) => s.subscriptionStatus === 'Active' && new Date(s.expiryDate) > now
    );

    allActive.forEach((s) => {
      const key = `${s.planName} (${s.subscriberType === 'CUSTOMER' ? 'Cust' : 'Vend'})`;
      planCounts[key] = (planCounts[key] || 0) + 1;
    });

    const planDistribution = Object.entries(planCounts).map(([name, count]) => ({
      name,
      count,
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          monthlyRevenue: monthlyData,
          planDistribution,
          totalActiveSubscribers: allActive.length,
        },
        'Subscription analytics calculated successfully'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Super Admin: Expiring Subscriptions (Next 7 days & Next 30 days)
 */
export const getExpiringSubscriptionsMonitoring = async (req, res, next) => {
  try {
    const { window = '7' } = req.query; // '7' | '30'
    const days = Number(window) || 7;
    const now = new Date();
    const limitDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const [custSubs, vendorSubs] = await Promise.all([
      CustomerSubscription.find({
        expiryDate: { $gte: now, $lte: limitDate },
        subscriptionStatus: { $in: ['Active', 'ACTIVE'] },
      })
        .populate('customerId', 'name email phone')
        .lean(),
      VendorSubscription.find({
        expiryDate: { $gte: now, $lte: limitDate },
        subscriptionStatus: { $in: ['Active', 'ACTIVE'] },
      })
        .populate('vendorId', 'storeName email phone')
        .lean(),
    ]);

    const expiring = [
      ...custSubs.map(normalizeCustomerSubscription),
      ...vendorSubs.map(normalizeVendorSubscription),
    ].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          expiring,
          windowDays: days,
          count: expiring.length,
        },
        `Subscriptions expiring in ${days} days retrieved`
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Super Admin: Export Subscriptions to CSV
 */
export const exportSubscriptionsCsv = async (req, res, next) => {
  try {
    const { type = 'ALL', status = 'ALL', search = '' } = req.query;

    const [custSubs, vendorSubs] = await Promise.all([
      type === 'ALL' || type === 'CUSTOMER'
        ? CustomerSubscription.find().populate('customerId', 'name email').lean()
        : [],
      type === 'ALL' || type === 'VENDOR'
        ? VendorSubscription.find().populate('vendorId', 'storeName email').lean()
        : [],
    ]);

    let records = [
      ...custSubs.map(normalizeCustomerSubscription),
      ...vendorSubs.map(normalizeVendorSubscription),
    ];

    if (status !== 'ALL') {
      const qStatus = status.toLowerCase();
      records = records.filter((r) => (r.subscriptionStatus || '').toLowerCase() === qStatus);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      records = records.filter(
        (r) =>
          (r.subscriberName && r.subscriberName.toLowerCase().includes(q)) ||
          (r.subscriberEmail && r.subscriberEmail.toLowerCase().includes(q)) ||
          (r.planName && r.planName.toLowerCase().includes(q))
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=BAAPOO_MART_Subscriptions_${Date.now()}.csv`
    );

    const headers = [
      'Subscriber Type',
      'Subscriber Name',
      'Email',
      'Business/Store Name',
      'Plan Name',
      'Duration',
      'Amount (INR)',
      'Start Date',
      'Expiry Date',
      'Payment Status',
      'Subscription Status',
      'Transaction ID',
    ];

    res.write(headers.join(',') + '\n');

    records.forEach((r) => {
      const row = [
        r.subscriberType,
        `"${(r.subscriberName || '').replace(/"/g, '""')}"`,
        `"${(r.subscriberEmail || '').replace(/"/g, '""')}"`,
        `"${(r.businessName || 'N/A').replace(/"/g, '""')}"`,
        `"${(r.planName || '').replace(/"/g, '""')}"`,
        `"${r.duration || ''}"`,
        r.amount || 0,
        r.startDate ? new Date(r.startDate).toISOString().split('T')[0] : '',
        r.expiryDate ? new Date(r.expiryDate).toISOString().split('T')[0] : '',
        r.paymentStatus || '',
        r.subscriptionStatus || '',
        `"${(r.transactionId || '').replace(/"/g, '""')}"`,
      ];
      res.write(row.join(',') + '\n');
    });

    res.end();
  } catch (err) {
    next(err);
  }
};

/**
 * Super Admin: Adjust / Cancel Subscription status
 */
export const updateSubscriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      throw new ApiError(400, 'New subscription status is required', ERROR_CODES.BAD_REQUEST);
    }

    // Try finding in CustomerSubscription
    let custSub = await CustomerSubscription.findById(id);
    if (custSub) {
      custSub.subscriptionStatus = status;
      custSub.status = status.toUpperCase();
      if (status === 'Cancelled' || status === 'CANCELLED') {
        custSub.cancelledAt = new Date();
      }
      await custSub.save();
      return res.status(200).json(
        new ApiResponse(
          200,
          { subscription: normalizeCustomerSubscription(custSub.toObject()) },
          `Customer subscription status updated to ${status}`
        )
      );
    }

    // Try finding in VendorSubscription
    let vendSub = await VendorSubscription.findById(id);
    if (vendSub) {
      vendSub.subscriptionStatus = status;
      vendSub.status = status.toUpperCase();
      if (status === 'Cancelled' || status === 'CANCELLED') {
        vendSub.cancelledAt = new Date();
      }
      await vendSub.save();
      return res.status(200).json(
        new ApiResponse(
          200,
          { subscription: normalizeVendorSubscription(vendSub.toObject()) },
          `Vendor subscription status updated to ${status}`
        )
      );
    }

    throw new ApiError(404, 'Subscription record not found', ERROR_CODES.NOT_FOUND);
  } catch (err) {
    next(err);
  }
};
