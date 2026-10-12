import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Vendor } from '../models/Vendor.js';
import { User } from '../models/User.js';
import { Payment } from '../models/Payment.js';
import { VendorSettlement } from '../models/VendorSettlement.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { parseDateRange } from './salesAnalyticsController.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

function round2(val) {
  return Math.round((Number(val) || 0) * 100) / 100;
}

/**
 * GET /api/admin/daily-sales
 * Complete Super Admin Daily Sales Report
 */
export const getAdminDailySales = asyncWrapper(async (req, res) => {
  const {
    range = 'TODAY',
    startDate,
    endDate,
    search = '',
    sellerType = 'ALL', // 'ALL', 'VENDOR', 'ADMIN'
    paymentStatus = 'ALL',
    orderStatus = 'ALL',
    page = 1,
    limit = 25,
  } = req.query;

  const { start, end } = parseDateRange(range, startDate, endDate);

  const baseFilter = {
    createdAt: { $gte: start, $lte: end },
  };

  if (paymentStatus && paymentStatus !== 'ALL') {
    baseFilter.paymentStatus = paymentStatus.toUpperCase();
  }

  if (orderStatus && orderStatus !== 'ALL') {
    baseFilter.orderStatus = orderStatus.toUpperCase();
  }

  // Fetch all qualifying orders in the date range
  const allOrdersInRange = await Order.find(baseFilter)
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();

  // Metrics Initialization
  let totalDailySales = 0;
  let vendorSales = 0;
  let adminStoreSales = 0;
  let totalProductsSold = 0;
  let vendorProductsSold = 0;
  let adminProductsSold = 0;

  let successfulPaymentsCount = 0;
  let successfulPaymentsAmount = 0;
  let pendingPaymentsCount = 0;
  let pendingPaymentsAmount = 0;
  let failedPaymentsCount = 0;
  let failedPaymentsAmount = 0;
  let refundsCount = 0;
  let refundsAmount = 0;

  const uniqueCustomerIds = new Set();
  const allLineItems = [];
  const trendMap = {};

  allOrdersInRange.forEach((order) => {
    const isPaid = order.paymentStatus === 'PAID';
    const isPending = order.paymentStatus === 'PENDING';
    const isFailed = order.paymentStatus === 'FAILED';
    const isRefunded = order.paymentStatus === 'REFUNDED' || order.orderStatus === 'CANCELLED';

    if (order.userId?._id) {
      uniqueCustomerIds.add(order.userId._id.toString());
    }

    if (isPaid) {
      successfulPaymentsCount++;
      successfulPaymentsAmount += order.grandTotal || 0;
      totalDailySales += order.grandTotal || 0;
    } else if (isPending) {
      pendingPaymentsCount++;
      pendingPaymentsAmount += order.grandTotal || 0;
    } else if (isFailed) {
      failedPaymentsCount++;
      failedPaymentsAmount += order.grandTotal || 0;
    }

    if (isRefunded) {
      refundsCount++;
      refundsAmount += order.refundAmount || order.grandTotal || 0;
    }

    // Trend grouping by date
    const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
    if (!trendMap[dateKey]) {
      trendMap[dateKey] = { date: dateKey, totalSales: 0, vendorSales: 0, adminSales: 0, orders: 0 };
    }
    trendMap[dateKey].orders++;
    if (isPaid) {
      trendMap[dateKey].totalSales += order.grandTotal || 0;
    }

    // Line items breakdown
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item, idx) => {
      const isVendorItem = Boolean(item.vendorId);
      const itemTotal = Number(item.lineTotal || item.price * item.quantity || 0);
      const itemQty = Number(item.quantity || 1);

      if (isPaid) {
        if (isVendorItem) {
          vendorSales += itemTotal;
          vendorProductsSold += itemQty;
          trendMap[dateKey].vendorSales += itemTotal;
        } else {
          adminStoreSales += itemTotal;
          adminProductsSold += itemQty;
          trendMap[dateKey].adminSales += itemTotal;
        }
        totalProductsSold += itemQty;
      }

      // Check sellerType filter
      if (sellerType === 'VENDOR' && !isVendorItem) return;
      if (sellerType === 'ADMIN' && isVendorItem) return;

      // Check search filter
      const searchLower = search.trim().toLowerCase();
      if (searchLower) {
        const orderNum = (order.orderNumber || order.publicOrderId || '').toLowerCase();
        const prodName = (item.name || item.productNameSnapshot || '').toLowerCase();
        const custName = (order.userId?.name || '').toLowerCase();
        const vendName = (item.vendorNameSnapshot || '').toLowerCase();

        const match =
          orderNum.includes(searchLower) ||
          prodName.includes(searchLower) ||
          custName.includes(searchLower) ||
          vendName.includes(searchLower);

        if (!match) return;
      }

      allLineItems.push({
        orderId: order._id,
        orderNumber: order.orderNumber || order.publicOrderId,
        createdAt: order.createdAt,
        customerName: order.userId?.name || 'Customer',
        customerEmail: order.userId?.email || '',
        productId: item.productId,
        productName: item.name || item.productNameSnapshot || 'Product',
        quantity: itemQty,
        unitPrice: item.unitPrice || item.price,
        itemSubtotal: itemTotal,
        discount: item.discount || 0,
        tax: item.tax || 0,
        shipping: item.shipping || 0,
        finalAmount: itemTotal,
        sellerType: isVendorItem ? 'VENDOR' : 'ADMIN_STORE',
        sellerName: isVendorItem ? item.vendorNameSnapshot || 'Independent Vendor' : 'BAAPOO MART Admin Store',
        vendorId: item.vendorId || null,
        commissionRate: isVendorItem ? item.commissionRate || 5 : 0,
        platformCommission: isVendorItem ? item.platformCommission || round2(itemTotal * 0.05) : 0,
        vendorShare: isVendorItem ? item.vendorShare || round2(itemTotal * 0.95) : 0,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        settlementStatus: item.settlementStatus || 'PENDING_DELIVERY',
      });
    });
  });

  // Pagination for line items table
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 25;
  const totalItemsCount = allLineItems.length;
  const paginatedItems = allLineItems.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  // Daily Trends array
  const trends = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        summary: {
          totalDailySales: round2(totalDailySales),
          totalOrders: allOrdersInRange.length,
          totalProductsSold,
          vendorSales: round2(vendorSales),
          adminStoreSales: round2(adminStoreSales),
          uniqueCustomers: uniqueCustomerIds.size,
          successfulPayments: { count: successfulPaymentsCount, amount: round2(successfulPaymentsAmount) },
          pendingPayments: { count: pendingPaymentsCount, amount: round2(pendingPaymentsAmount) },
          failedPayments: { count: failedPaymentsCount, amount: round2(failedPaymentsAmount) },
          refunds: { count: refundsCount, amount: round2(refundsAmount) },
          vendorProductsSold,
          adminProductsSold,
        },
        items: paginatedItems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalItemsCount,
          pages: Math.ceil(totalItemsCount / limitNum) || 1,
        },
        trends,
        dateRange: { start, end, range },
      },
      'Super Admin Daily Sales Report retrieved'
    )
  );
});

/**
 * GET /api/admin/daily-sales/vendor
 */
export const getAdminDailySalesVendor = asyncWrapper(async (req, res, next) => {
  req.query.sellerType = 'VENDOR';
  return getAdminDailySales(req, res, next);
});

/**
 * GET /api/admin/daily-sales/admin-store
 */
export const getAdminDailySalesAdminStore = asyncWrapper(async (req, res, next) => {
  req.query.sellerType = 'ADMIN';
  return getAdminDailySales(req, res, next);
});

/**
 * GET /api/vendor/daily-sales
 * Individual Vendor Daily Sales Report
 */
export const getVendorDailySales = asyncWrapper(async (req, res) => {
  const {
    range = 'TODAY',
    startDate,
    endDate,
    search = '',
    paymentStatus = 'ALL',
    orderStatus = 'ALL',
    page = 1,
    limit = 25,
  } = req.query;

  // Identify vendor
  const vendor = await Vendor.findOne({ userId: req.user._id }).lean();
  if (!vendor) {
    throw new ApiError(403, 'Vendor profile not found for this account', ERROR_CODES.FORBIDDEN);
  }

  const { start, end } = parseDateRange(range, startDate, endDate);

  const query = {
    'items.vendorId': vendor._id,
    createdAt: { $gte: start, $lte: end },
  };

  if (paymentStatus && paymentStatus !== 'ALL') {
    query.paymentStatus = paymentStatus.toUpperCase();
  }
  if (orderStatus && orderStatus !== 'ALL') {
    query.orderStatus = orderStatus.toUpperCase();
  }

  const orders = await Order.find(query)
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  let todaySales = 0;
  let todayProductsSold = 0;
  let platformCommissionTotal = 0;
  let vendorEarningsTotal = 0;
  let pendingSettlementsTotal = 0;
  let completedPayoutsTotal = 0;
  let refundsAndReversalsTotal = 0;

  const vendorOrderIds = new Set();
  const vendorItems = [];
  const trendMap = {};

  orders.forEach((order) => {
    const isPaid = order.paymentStatus === 'PAID';
    const isCancelledOrRefunded = order.orderStatus === 'CANCELLED' || order.paymentStatus === 'REFUNDED';
    let orderHasVendorItem = false;

    const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
    if (!trendMap[dateKey]) {
      trendMap[dateKey] = { date: dateKey, sales: 0, earnings: 0, itemsCount: 0 };
    }

    order.items.forEach((item) => {
      if (item.vendorId?.toString() === vendor._id.toString()) {
        orderHasVendorItem = true;
        const lineTotal = Number(item.lineTotal || item.price * item.quantity || 0);
        const qty = Number(item.quantity || 1);
        const comm = Number(item.platformCommission !== undefined ? item.platformCommission : round2(lineTotal * 0.05));
        const earn = Number(item.vendorShare !== undefined ? item.vendorShare : round2(lineTotal * 0.95));

        if (isPaid && !isCancelledOrRefunded) {
          todaySales += lineTotal;
          todayProductsSold += qty;
          platformCommissionTotal += comm;
          vendorEarningsTotal += earn;

          trendMap[dateKey].sales += lineTotal;
          trendMap[dateKey].earnings += earn;
          trendMap[dateKey].itemsCount += qty;

          if (item.settlementStatus === 'PAID') {
            completedPayoutsTotal += earn;
          } else {
            pendingSettlementsTotal += earn;
          }
        }

        if (isCancelledOrRefunded) {
          refundsAndReversalsTotal += lineTotal;
        }

        // Search filter
        const searchLower = search.trim().toLowerCase();
        if (searchLower) {
          const orderNum = (order.orderNumber || order.publicOrderId || '').toLowerCase();
          const prodName = (item.name || item.productNameSnapshot || '').toLowerCase();
          if (!orderNum.includes(searchLower) && !prodName.includes(searchLower)) {
            return;
          }
        }

        vendorItems.push({
          orderId: order._id,
          orderNumber: order.orderNumber || order.publicOrderId,
          createdAt: order.createdAt,
          customerName: order.userId?.name ? `${order.userId.name.slice(0, 3)}***` : 'Verified Customer',
          productName: item.name || item.productNameSnapshot || 'Product',
          quantity: qty,
          unitPrice: item.unitPrice || item.price,
          saleAmount: lineTotal,
          platformFee: comm,
          vendorEarnings: earn,
          paymentStatus: order.paymentStatus,
          deliveryStatus: order.orderStatus === 'DELIVERED' ? 'DELIVERED' : order.orderStatus,
          settlementStatus: item.settlementStatus || 'PENDING_DELIVERY',
        });
      }
    });

    if (orderHasVendorItem) {
      vendorOrderIds.add(order._id.toString());
    }
  });

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 25;
  const totalCount = vendorItems.length;
  const paginatedItems = vendorItems.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  const trends = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        summary: {
          todaySales: round2(todaySales),
          todayOrders: vendorOrderIds.size,
          todayProductsSold,
          platformCommission: round2(platformCommissionTotal),
          vendorEarnings: round2(vendorEarningsTotal),
          pendingSettlements: round2(pendingSettlementsTotal),
          completedPayouts: round2(completedPayoutsTotal),
          refundsAndReversals: round2(refundsAndReversalsTotal),
        },
        items: paginatedItems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum) || 1,
        },
        trends,
        dateRange: { start, end, range },
      },
      'Vendor Daily Sales Report retrieved'
    )
  );
});

/**
 * GET /api/customer/daily-purchases
 * Customer Daily Purchase Report
 */
export const getCustomerDailyPurchases = asyncWrapper(async (req, res) => {
  const {
    range = 'TODAY',
    startDate,
    endDate,
    search = '',
    orderStatus = 'ALL',
    page = 1,
    limit = 25,
  } = req.query;

  const { start, end } = parseDateRange(range, startDate, endDate);

  const query = {
    userId: req.user._id,
    createdAt: { $gte: start, $lte: end },
  };

  if (orderStatus && orderStatus !== 'ALL') {
    query.orderStatus = orderStatus.toUpperCase();
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .lean();

  let todayPurchases = 0;
  let productsPurchased = 0;
  let amountPaid = 0;
  let pendingPayments = 0;
  let refundedAmounts = 0;

  const purchaseItems = [];
  const trendMap = {};

  orders.forEach((order) => {
    const isPaid = order.paymentStatus === 'PAID';
    const isPending = order.paymentStatus === 'PENDING';
    const isRefunded = order.paymentStatus === 'REFUNDED' || order.orderStatus === 'CANCELLED';

    const orderGrandTotal = Number(order.grandTotal || 0);

    if (isPaid) {
      todayPurchases += orderGrandTotal;
      amountPaid += orderGrandTotal;
    } else if (isPending) {
      pendingPayments += orderGrandTotal;
    }

    if (isRefunded) {
      refundedAmounts += order.refundAmount || orderGrandTotal;
    }

    const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
    if (!trendMap[dateKey]) {
      trendMap[dateKey] = { date: dateKey, spending: 0, orders: 0 };
    }
    trendMap[dateKey].orders++;
    if (isPaid) {
      trendMap[dateKey].spending += orderGrandTotal;
    }

    order.items.forEach((item) => {
      const isVendorItem = Boolean(item.vendorId);
      const qty = Number(item.quantity || 1);
      const itemTotal = Number(item.lineTotal || item.price * qty || 0);

      if (isPaid) {
        productsPurchased += qty;
      }

      // Search filter
      const searchLower = search.trim().toLowerCase();
      if (searchLower) {
        const orderNum = (order.orderNumber || order.publicOrderId || '').toLowerCase();
        const prodName = (item.name || item.productNameSnapshot || '').toLowerCase();
        if (!orderNum.includes(searchLower) && !prodName.includes(searchLower)) {
          return;
        }
      }

      purchaseItems.push({
        orderId: order._id,
        orderNumber: order.orderNumber || order.publicOrderId,
        createdAt: order.createdAt,
        productName: item.name || item.productNameSnapshot || 'Product',
        sellerName: isVendorItem ? item.vendorNameSnapshot || 'Independent Vendor' : 'BAAPOO MART Admin Store',
        sellerType: isVendorItem ? 'VENDOR' : 'ADMIN_STORE',
        quantity: qty,
        unitPrice: item.unitPrice || item.price,
        orderAmount: itemTotal,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        deliveryStatus: order.orderStatus === 'DELIVERED' ? 'DELIVERED' : order.orderStatus,
      });
    });
  });

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 25;
  const totalCount = purchaseItems.length;
  const paginatedItems = purchaseItems.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  const trends = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        summary: {
          todayPurchases: round2(todayPurchases),
          totalOrders: orders.length,
          productsPurchased,
          amountPaid: round2(amountPaid),
          pendingPayments: round2(pendingPayments),
          refundedAmounts: round2(refundedAmounts),
        },
        items: paginatedItems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum) || 1,
        },
        trends,
        dateRange: { start, end, range },
      },
      'Customer Daily Purchase Report retrieved'
    )
  );
});

/**
 * CSV Export Helpers
 */
export const exportDailySalesCsv = asyncWrapper(async (req, res) => {
  const { type = 'admin', range = 'TODAY', startDate, endDate } = req.query;
  const { start, end } = parseDateRange(range, startDate, endDate);

  let filename = `daily-sales-${range.toLowerCase()}-${Date.now()}.csv`;
  let csvContent = '';

  if (type === 'admin') {
    const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
      .populate('userId', 'name')
      .lean();

    csvContent = 'Order ID,Date,Customer,Product,Qty,Unit Price,Total,Seller Type,Seller Name,Payment Status,Order Status\n';
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const isVendor = Boolean(item.vendorId);
        csvContent += `"${o.orderNumber || o.publicOrderId}","${new Date(o.createdAt).toISOString()}","${o.userId?.name || 'Customer'}","${item.name || item.productNameSnapshot}",${item.quantity},${item.price},${item.lineTotal || item.price * item.quantity},"${isVendor ? 'VENDOR' : 'ADMIN_STORE'}","${isVendor ? item.vendorNameSnapshot || 'Vendor' : 'Admin Store'}","${o.paymentStatus}","${o.orderStatus}"\n`;
      });
    });
  } else if (type === 'vendor') {
    const vendor = await Vendor.findOne({ userId: req.user._id }).lean();
    if (!vendor) throw new ApiError(403, 'Vendor profile not found', ERROR_CODES.FORBIDDEN);

    const orders = await Order.find({
      'items.vendorId': vendor._id,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    filename = `vendor-sales-${range.toLowerCase()}-${Date.now()}.csv`;
    csvContent = 'Order ID,Date,Product,Qty,Price,Sale Amount,5% Platform Fee,95% Vendor Earnings,Payment Status,Delivery Status,Settlement Status\n';
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (item.vendorId?.toString() === vendor._id.toString()) {
          const total = item.lineTotal || item.price * item.quantity;
          const comm = item.platformCommission || round2(total * 0.05);
          const earn = item.vendorShare || round2(total * 0.95);
          csvContent += `"${o.orderNumber || o.publicOrderId}","${new Date(o.createdAt).toISOString()}","${item.name || item.productNameSnapshot}",${item.quantity},${item.price},${total},${comm},${earn},"${o.paymentStatus}","${o.orderStatus}","${item.settlementStatus || 'PENDING_DELIVERY'}"\n`;
        }
      });
    });
  } else if (type === 'customer') {
    const orders = await Order.find({
      userId: req.user._id,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    filename = `customer-purchases-${range.toLowerCase()}-${Date.now()}.csv`;
    csvContent = 'Order ID,Date,Product,Seller,Qty,Price,Total Amount,Payment Status,Order Status\n';
    orders.forEach((o) => {
      o.items.forEach((item) => {
        csvContent += `"${o.orderNumber || o.publicOrderId}","${new Date(o.createdAt).toISOString()}","${item.name || item.productNameSnapshot}","${item.vendorNameSnapshot || 'BAAPOO MART Admin Store'}",${item.quantity},${item.price},${item.lineTotal || item.price * item.quantity},"${o.paymentStatus}","${o.orderStatus}"\n`;
      });
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csvContent);
});
