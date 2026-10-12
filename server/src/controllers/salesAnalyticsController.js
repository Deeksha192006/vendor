import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Vendor } from '../models/Vendor.js';
import { User } from '../models/User.js';
import { Payment } from '../models/Payment.js';
import { moneyUtils } from '../utils/moneyUtils.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

const ADMIN_STORE_NAME = 'BAAPOO MART Admin Store';
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

/**
 * Calculates start and end timestamps in UTC corresponding to IST calendar days
 */
export function parseDateRange(range = 'THIS_MONTH', customStart, customEnd) {
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST_OFFSET);

  const y = nowIST.getUTCFullYear();
  const m = nowIST.getUTCMonth();
  const d = nowIST.getUTCDate();

  const getUtcFromIST = (year, month, day, hour = 0, min = 0, sec = 0, ms = 0) => {
    return new Date(Date.UTC(year, month, day, hour, min, sec, ms) - IST_OFFSET);
  };

  let start, end;
  const upperRange = (range || '').toUpperCase();

  switch (upperRange) {
    case 'TODAY':
      start = getUtcFromIST(y, m, d, 0, 0, 0, 0);
      end = getUtcFromIST(y, m, d, 23, 59, 59, 999);
      break;
    case 'YESTERDAY':
      start = getUtcFromIST(y, m, d - 1, 0, 0, 0, 0);
      end = getUtcFromIST(y, m, d - 1, 23, 59, 59, 999);
      break;
    case 'LAST_7_DAYS':
      start = getUtcFromIST(y, m, d - 6, 0, 0, 0, 0);
      end = getUtcFromIST(y, m, d, 23, 59, 59, 999);
      break;
    case 'LAST_30_DAYS':
      start = getUtcFromIST(y, m, d - 29, 0, 0, 0, 0);
      end = getUtcFromIST(y, m, d, 23, 59, 59, 999);
      break;
    case 'THIS_MONTH':
      start = getUtcFromIST(y, m, 1, 0, 0, 0, 0);
      end = getUtcFromIST(y, m, d, 23, 59, 59, 999);
      break;
    case 'PREVIOUS_MONTH':
    case 'LAST_MONTH': {
      start = getUtcFromIST(y, m - 1, 1, 0, 0, 0, 0);
      const lastDayOfPrevMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
      end = getUtcFromIST(y, m - 1, lastDayOfPrevMonth, 23, 59, 59, 999);
      break;
    }
    case 'THIS_YEAR':
      start = getUtcFromIST(y, 0, 1, 0, 0, 0, 0);
      end = getUtcFromIST(y, m, d, 23, 59, 59, 999);
      break;
    case 'CUSTOM':
      if (customStart && customEnd) {
        start = new Date(customStart);
        end = new Date(customEnd);
        if (customEnd.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
      } else {
        start = getUtcFromIST(y, m, 1, 0, 0, 0, 0);
        end = new Date();
      }
      break;
    default:
      start = getUtcFromIST(y, m, 1, 0, 0, 0, 0);
      end = new Date();
  }

  return { start, end };
}

/**
 * Checks if order counts as a completed qualifying paid sale
 */
export function isQualifyingPaidSale(order) {
  if (!order || order.orderStatus === 'CANCELLED') return false;
  if (order.paymentStatus === 'PAID') return true;
  if (
    order.paymentMethod === 'COD' &&
    ['CONFIRMED', 'PROCESSING', 'PACKED', 'READY_TO_SHIP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)
  ) {
    return true;
  }
  return false;
}

/**
 * Helper to allocate line item financials without double-counting
 */
export function allocateLineItem(order, item) {
  const lineTotal = item.lineTotal || (item.unitPrice || item.price || 0) * (item.quantity || 1);
  const itemsSubtotal = order.itemsSubtotal || order.subtotal || lineTotal || 1;
  const ratio = itemsSubtotal > 0 ? lineTotal / itemsSubtotal : 0;

  const discount = item.discountSnapshot != null && item.discountSnapshot > 0
    ? item.discountSnapshot
    : moneyUtils.roundMoney((order.discountTotal || order.discount || 0) * ratio);

  const tax = item.taxSnapshot != null && item.taxSnapshot > 0
    ? item.taxSnapshot
    : moneyUtils.roundMoney((order.taxTotal || order.tax || 0) * ratio);

  const shipping = moneyUtils.roundMoney((order.shippingTotal || order.shippingFee || 0) * ratio);
  const finalAmount = moneyUtils.roundMoney(lineTotal - discount + tax + shipping);

  const isVendor = Boolean(item.vendorId);
  const sellerType = isVendor ? 'VENDOR' : 'ADMIN';
  const sellerName = isVendor
    ? (item.vendorId?.storeName || item.vendorNameSnapshot || 'Independent Vendor')
    : ADMIN_STORE_NAME;

  return {
    itemId: item._id,
    productId: item.productId?._id || item.productId,
    productName: item.productNameSnapshot || item.name || 'Product',
    sku: item.skuSnapshot || item.variantSku || 'N/A',
    image: item.productImageSnapshot || item.image || '',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || item.price || 0,
    lineTotal,
    discount,
    tax,
    shipping,
    finalAmount,
    isVendor,
    sellerType,
    sellerName,
    vendorId: item.vendorId?._id || item.vendorId || null,
    vendorStoreName: isVendor ? (item.vendorId?.storeName || 'Vendor') : null,
    vendorSlug: isVendor ? (item.vendorId?.slug || '') : null,
  };
}

// =========================================================================
// 1. GET SALES OVERVIEW (8 KPI Summary Cards & Period Metrics)
// =========================================================================
export const getSalesOverview = asyncWrapper(async (req, res) => {
  const { range = 'TODAY', startDate, endDate } = req.query;

  // 1. Calculate Today's boundaries for specific "Today" cards
  const todayRange = parseDateRange('TODAY');
  // 2. Calculate Active Selected Period boundaries
  const selectedRange = parseDateRange(range, startDate, endDate);

  // Fetch orders for both ranges in parallel
  const [todayOrders, periodOrders] = await Promise.all([
    Order.find({ createdAt: { $gte: todayRange.start, $lte: todayRange.end } })
      .populate('items.vendorId', 'storeName slug')
      .lean(),
    Order.find({ createdAt: { $gte: selectedRange.start, $lte: selectedRange.end } })
      .populate('items.vendorId', 'storeName slug')
      .lean(),
  ]);

  const computeMetrics = (orderList) => {
    let qualifyingOrdersCount = 0;
    let qualifyingTotalSales = 0;
    let qualifyingProductsSold = 0;
    let qualifyingVendorSales = 0;
    let qualifyingAdminSales = 0;

    let grossSales = 0;
    let totalDiscounts = 0;
    let totalTaxes = 0;
    let totalShipping = 0;

    let pendingOrdersCount = 0;
    let pendingOrdersAmount = 0;
    let cancelledOrdersCount = 0;
    let cancelledOrdersAmount = 0;
    let refundedOrdersCount = 0;
    let refundedOrdersAmount = 0;
    let successfulPaymentsCount = 0;
    let successfulPaymentsAmount = 0;
    let failedPaymentsCount = 0;
    let failedPaymentsAmount = 0;

    const uniqueCustomerSet = new Set();

    orderList.forEach((order) => {
      const orderTotal = order.grandTotal || order.total || 0;
      const isPaid = isQualifyingPaidSale(order);

      // Track Payment Statuses
      if (isPaid) {
        successfulPaymentsCount += 1;
        successfulPaymentsAmount = moneyUtils.addMoney(successfulPaymentsAmount, orderTotal);
      }
      if (order.paymentStatus === 'FAILED') {
        failedPaymentsCount += 1;
        failedPaymentsAmount = moneyUtils.addMoney(failedPaymentsAmount, orderTotal);
      }

      // Track Cancelled
      if (order.orderStatus === 'CANCELLED') {
        cancelledOrdersCount += 1;
        cancelledOrdersAmount = moneyUtils.addMoney(cancelledOrdersAmount, orderTotal);
        return; // Exclude from sales calculations
      }

      // Track Refunded
      if (order.paymentStatus === 'REFUNDED' || order.orderStatus === 'REFUNDED') {
        refundedOrdersCount += 1;
        refundedOrdersAmount = moneyUtils.addMoney(refundedOrdersAmount, orderTotal);
      }

      // Track Pending (orders awaiting payment or fulfillment, excluding failed or refunded payments)
      if (
        order.paymentStatus !== 'FAILED' &&
        order.paymentStatus !== 'REFUNDED' &&
        order.orderStatus !== 'REFUNDED' &&
        (order.paymentStatus === 'PENDING' || order.orderStatus === 'PENDING')
      ) {
        pendingOrdersCount += 1;
        pendingOrdersAmount = moneyUtils.addMoney(pendingOrdersAmount, orderTotal);
      }

      // Qualifying Sales Calculation
      if (isPaid) {
        qualifyingOrdersCount += 1;
        if (order.userId) uniqueCustomerSet.add(order.userId.toString());

        // Process line items for granular seller attribution
        order.items?.forEach((item) => {
          const allocated = allocateLineItem(order, item);
          qualifyingProductsSold += allocated.quantity;
          grossSales = moneyUtils.addMoney(grossSales, allocated.lineTotal);
          totalDiscounts = moneyUtils.addMoney(totalDiscounts, allocated.discount);
          totalTaxes = moneyUtils.addMoney(totalTaxes, allocated.tax);
          totalShipping = moneyUtils.addMoney(totalShipping, allocated.shipping);

          if (allocated.isVendor) {
            qualifyingVendorSales = moneyUtils.addMoney(qualifyingVendorSales, allocated.finalAmount);
          } else {
            qualifyingAdminSales = moneyUtils.addMoney(qualifyingAdminSales, allocated.finalAmount);
          }
        });
      }
    });

    qualifyingTotalSales = moneyUtils.addMoney(qualifyingVendorSales, qualifyingAdminSales);
    const netSales = moneyUtils.subtractMoney(qualifyingTotalSales, refundedOrdersAmount, true);

    return {
      totalSales: qualifyingTotalSales,
      netSales,
      grossSales,
      totalOrders: qualifyingOrdersCount,
      productsSold: qualifyingProductsSold,
      vendorSales: qualifyingVendorSales,
      adminSales: qualifyingAdminSales,
      uniqueCustomers: uniqueCustomerSet.size,
      successfulPayments: { count: successfulPaymentsCount, amount: successfulPaymentsAmount },
      pendingPayments: { count: pendingOrdersCount, amount: pendingOrdersAmount },
      failedPayments: { count: failedPaymentsCount, amount: failedPaymentsAmount },
      refunds: { count: refundedOrdersCount + cancelledOrdersCount, amount: moneyUtils.addMoney(refundedOrdersAmount, cancelledOrdersAmount) },
      pendingOrdersCount,
      pendingOrdersAmount,
      cancelledOrdersCount,
      cancelledOrdersAmount,
      refundedOrdersCount,
      refundedOrdersAmount,
      totalDiscounts,
      totalTaxes,
      totalShipping,
    };
  };

  const todayMetrics = computeMetrics(todayOrders);
  const periodMetrics = computeMetrics(periodOrders);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        range,
        startDate: selectedRange.start,
        endDate: selectedRange.end,
        today: todayMetrics,
        period: periodMetrics,
      },
      'Sales overview analytics retrieved successfully'
    )
  );
});

// =========================================================================
// 2. GET SALES ORDERS & LINE ITEMS (Combined, Vendor, Admin)
// =========================================================================
export const getSalesOrders = asyncWrapper(async (req, res) => {
  const {
    range = 'THIS_MONTH',
    startDate,
    endDate,
    channel = 'ALL', // 'ALL', 'VENDOR', 'ADMIN'
    vendorId,
    vendorName,
    customerId,
    customerName,
    orderId,
    productName,
    paymentStatus,
    orderStatus,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    viewMode = 'line-items', // 'line-items' | 'orders'
  } = req.query;

  const { start, end } = parseDateRange(range, startDate, endDate);
  const query = { createdAt: { $gte: start, $lte: end } };

  if (orderStatus && orderStatus !== 'ALL') {
    query.orderStatus = orderStatus;
  }
  if (paymentStatus && paymentStatus !== 'ALL') {
    query.paymentStatus = paymentStatus;
  }
  if (orderId) {
    query.$or = [
      { orderNumber: { $regex: orderId, $options: 'i' } },
      { publicOrderId: { $regex: orderId, $options: 'i' } },
    ];
  }
  if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
    query.userId = customerId;
  }

  const rawOrders = await Order.find(query)
    .populate('userId', 'name email phone')
    .populate('items.vendorId', 'storeName slug phone email')
    .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
    .lean();

  // Deconstruct orders into line items while preserving order context
  let lineItems = [];
  const processedOrders = [];

  rawOrders.forEach((order) => {
    // Customer search filter check
    const custName = order.userId?.name || '';
    const custEmail = order.userId?.email || '';
    if (customerName && !custName.toLowerCase().includes(customerName.toLowerCase()) && !custEmail.toLowerCase().includes(customerName.toLowerCase())) {
      return;
    }

    let orderVendorSales = 0;
    let orderAdminSales = 0;
    const orderItemsAllocated = [];

    order.items?.forEach((item) => {
      const allocated = allocateLineItem(order, item);

      // Channel filter
      if (channel === 'VENDOR' && !allocated.isVendor) return;
      if (channel === 'ADMIN' && allocated.isVendor) return;

      // Vendor ID or Vendor Name filter
      if (vendorId && (!allocated.vendorId || allocated.vendorId.toString() !== vendorId.toString())) {
        return;
      }
      if (vendorName && (!allocated.vendorStoreName || !allocated.vendorStoreName.toLowerCase().includes(vendorName.toLowerCase()))) {
        return;
      }

      // Product Name filter
      if (productName && !allocated.productName.toLowerCase().includes(productName.toLowerCase())) {
        return;
      }

      if (allocated.isVendor) {
        orderVendorSales = moneyUtils.addMoney(orderVendorSales, allocated.finalAmount);
      } else {
        orderAdminSales = moneyUtils.addMoney(orderAdminSales, allocated.finalAmount);
      }

      orderItemsAllocated.push(allocated);

      lineItems.push({
        _id: `${order._id}_${item._id}`,
        orderId: order._id,
        orderNumber: order.orderNumber,
        publicOrderId: order.publicOrderId,
        orderDate: order.createdAt,
        customer: {
          _id: order.userId?._id,
          name: order.userId?.name || 'Guest / Unregistered',
          email: order.userId?.email || '',
          phone: order.userId?.phone || '',
        },
        product: {
          _id: allocated.productId,
          name: allocated.productName,
          sku: allocated.sku,
          image: allocated.image,
        },
        sellerType: allocated.sellerType,
        sellerName: allocated.sellerName,
        vendorId: allocated.vendorId,
        vendorStoreName: allocated.vendorStoreName,
        quantity: allocated.quantity,
        unitPrice: allocated.unitPrice,
        itemAmount: allocated.lineTotal,
        discount: allocated.discount,
        tax: allocated.tax,
        shipping: allocated.shipping,
        finalAmount: allocated.finalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        orderGrandTotal: order.grandTotal || order.total,
      });
    });

    if (orderItemsAllocated.length > 0) {
      processedOrders.push({
        ...order,
        allocatedItems: orderItemsAllocated,
        vendorSalesShare: orderVendorSales,
        adminSalesShare: orderAdminSales,
      });
    }
  });

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;

  if (viewMode === 'orders') {
    const total = processedOrders.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedOrders = processedOrders.slice(startIndex, startIndex + limitNum);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: paginatedOrders,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
          },
        },
        'Sales orders retrieved'
      )
    );
  }

  // Line-items view pagination
  const total = lineItems.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedItems = lineItems.slice(startIndex, startIndex + limitNum);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: paginatedItems,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
      'Sales line-items retrieved'
    )
  );
});

// =========================================================================
// 3. GET SELLER-WISE SALES ANALYTICS
// =========================================================================
export const getSalesBySeller = asyncWrapper(async (req, res) => {
  const { range = 'THIS_MONTH', startDate, endDate, channel = 'ALL' } = req.query;
  const { start, end } = parseDateRange(range, startDate, endDate);

  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .populate('items.vendorId', 'storeName slug phone email userId')
    .lean();

  const adminStoreSummary = {
    sellerType: 'ADMIN',
    sellerName: ADMIN_STORE_NAME,
    totalOrders: 0,
    totalUnitsSold: 0,
    grossSales: 0,
    discounts: 0,
    taxes: 0,
    shipping: 0,
    refunds: 0,
    netSales: 0,
    orderIdSet: new Set(),
  };

  const vendorMap = new Map();

  orders.forEach((order) => {
    if (order.orderStatus === 'CANCELLED') return;

    const isPaid = isQualifyingPaidSale(order);
    const isRefunded = order.paymentStatus === 'REFUNDED' || order.orderStatus === 'REFUNDED';

    order.items?.forEach((item) => {
      const allocated = allocateLineItem(order, item);

      if (!allocated.isVendor) {
        // Admin item
        if (isPaid) {
          adminStoreSummary.orderIdSet.add(order._id.toString());
          adminStoreSummary.totalUnitsSold += allocated.quantity;
          adminStoreSummary.grossSales = moneyUtils.addMoney(adminStoreSummary.grossSales, allocated.lineTotal);
          adminStoreSummary.discounts = moneyUtils.addMoney(adminStoreSummary.discounts, allocated.discount);
          adminStoreSummary.taxes = moneyUtils.addMoney(adminStoreSummary.taxes, allocated.tax);
          adminStoreSummary.shipping = moneyUtils.addMoney(adminStoreSummary.shipping, allocated.shipping);
          adminStoreSummary.netSales = moneyUtils.addMoney(adminStoreSummary.netSales, allocated.finalAmount);
        }
        if (isRefunded) {
          adminStoreSummary.refunds = moneyUtils.addMoney(adminStoreSummary.refunds, allocated.finalAmount);
        }
      } else {
        // Vendor item
        const vId = allocated.vendorId?.toString();
        if (!vId) return;

        if (!vendorMap.has(vId)) {
          vendorMap.set(vId, {
            vendorId: vId,
            sellerType: 'VENDOR',
            sellerName: allocated.sellerName,
            storeName: allocated.vendorStoreName || 'Vendor',
            slug: allocated.vendorSlug || '',
            totalOrders: 0,
            totalUnitsSold: 0,
            grossSales: 0,
            discounts: 0,
            taxes: 0,
            shipping: 0,
            refunds: 0,
            netSales: 0,
            orderIdSet: new Set(),
          });
        }

        const vRecord = vendorMap.get(vId);
        if (isPaid) {
          vRecord.orderIdSet.add(order._id.toString());
          vRecord.totalUnitsSold += allocated.quantity;
          vRecord.grossSales = moneyUtils.addMoney(vRecord.grossSales, allocated.lineTotal);
          vRecord.discounts = moneyUtils.addMoney(vRecord.discounts, allocated.discount);
          vRecord.taxes = moneyUtils.addMoney(vRecord.taxes, allocated.tax);
          vRecord.shipping = moneyUtils.addMoney(vRecord.shipping, allocated.shipping);
          vRecord.netSales = moneyUtils.addMoney(vRecord.netSales, allocated.finalAmount);
        }
        if (isRefunded) {
          vRecord.refunds = moneyUtils.addMoney(vRecord.refunds, allocated.finalAmount);
        }
      }
    });
  });

  adminStoreSummary.totalOrders = adminStoreSummary.orderIdSet.size;
  delete adminStoreSummary.orderIdSet;

  const vendorsList = Array.from(vendorMap.values()).map((v) => {
    v.totalOrders = v.orderIdSet.size;
    v.netSales = moneyUtils.subtractMoney(v.netSales, v.refunds, true);
    delete v.orderIdSet;
    return v;
  });

  adminStoreSummary.netSales = moneyUtils.subtractMoney(adminStoreSummary.netSales, adminStoreSummary.refunds, true);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        adminStore: channel === 'VENDOR' ? null : adminStoreSummary,
        vendors: channel === 'ADMIN' ? [] : vendorsList,
      },
      'Seller sales analytics retrieved successfully'
    )
  );
});

// =========================================================================
// 4. GET PRODUCT-WISE SALES ANALYTICS (Top-Selling Products)
// =========================================================================
export const getSalesByProduct = asyncWrapper(async (req, res) => {
  const { range = 'THIS_MONTH', startDate, endDate, channel = 'ALL', limit = 20 } = req.query;
  const { start, end } = parseDateRange(range, startDate, endDate);

  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .populate('items.vendorId', 'storeName slug')
    .lean();

  const productMap = new Map();

  orders.forEach((order) => {
    if (order.orderStatus === 'CANCELLED') return;

    const isPaid = isQualifyingPaidSale(order);
    const isRefunded = order.paymentStatus === 'REFUNDED' || order.orderStatus === 'REFUNDED';

    order.items?.forEach((item) => {
      const allocated = allocateLineItem(order, item);

      if (channel === 'VENDOR' && !allocated.isVendor) return;
      if (channel === 'ADMIN' && allocated.isVendor) return;

      const pKey = allocated.productId ? allocated.productId.toString() : allocated.productName;

      if (!productMap.has(pKey)) {
        productMap.set(pKey, {
          productId: allocated.productId,
          productName: allocated.productName,
          sku: allocated.sku,
          image: allocated.image,
          sellerType: allocated.sellerType,
          sellerName: allocated.sellerName,
          vendorId: allocated.vendorId,
          quantitySold: 0,
          grossSales: 0,
          discounts: 0,
          refunds: 0,
          netSales: 0,
        });
      }

      const pRecord = productMap.get(pKey);
      if (isPaid) {
        pRecord.quantitySold += allocated.quantity;
        pRecord.grossSales = moneyUtils.addMoney(pRecord.grossSales, allocated.lineTotal);
        pRecord.discounts = moneyUtils.addMoney(pRecord.discounts, allocated.discount);
        pRecord.netSales = moneyUtils.addMoney(pRecord.netSales, allocated.finalAmount);
      }
      if (isRefunded) {
        pRecord.refunds = moneyUtils.addMoney(pRecord.refunds, allocated.finalAmount);
      }
    });
  });

  const productsList = Array.from(productMap.values())
    .map((p) => ({
      ...p,
      netSales: moneyUtils.subtractMoney(p.netSales, p.refunds, true),
    }))
    .sort((a, b) => b.netSales - a.netSales)
    .slice(0, parseInt(limit, 10) || 20);

  return res.status(200).json(
    new ApiResponse(200, { products: productsList }, 'Product-wise sales analytics retrieved')
  );
});

// =========================================================================
// 5. GET SALES TRENDS (Daily & Monthly Chart Analytics)
// =========================================================================
export const getSalesTrends = asyncWrapper(async (req, res) => {
  const { range = 'THIS_MONTH', startDate, endDate } = req.query;
  const { start, end } = parseDateRange(range, startDate, endDate);

  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .populate('items.vendorId', 'storeName')
    .lean();

  const dailyTrendMap = new Map();
  const monthlyTrendMap = new Map();
  const vendorDistMap = new Map();
  const statusDistMap = new Map();

  let totalVendorSales = 0;
  let totalAdminSales = 0;
  let totalVendorOrders = 0;
  let totalAdminOrders = 0;

  // Initialize daily buckets
  const curr = new Date(start);
  while (curr <= end) {
    const key = curr.toISOString().split('T')[0];
    dailyTrendMap.set(key, {
      date: key,
      totalSales: 0,
      vendorSales: 0,
      adminSales: 0,
      ordersCount: 0,
      unitsSold: 0,
    });
    curr.setDate(curr.getDate() + 1);
  }

  orders.forEach((order) => {
    // Status distribution (tracks all orders in range)
    const st = order.orderStatus || 'PENDING';
    const currentStatusEntry = statusDistMap.get(st) || { status: st, count: 0, amount: 0 };
    currentStatusEntry.count += 1;
    currentStatusEntry.amount = moneyUtils.addMoney(currentStatusEntry.amount, order.grandTotal || order.total || 0);
    statusDistMap.set(st, currentStatusEntry);

    if (!isQualifyingPaidSale(order)) return;

    const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
    const monthKey = dateKey.slice(0, 7); // YYYY-MM

    if (!monthlyTrendMap.has(monthKey)) {
      monthlyTrendMap.set(monthKey, {
        month: monthKey,
        totalSales: 0,
        vendorSales: 0,
        adminSales: 0,
        ordersCount: 0,
      });
    }

    const dailyEntry = dailyTrendMap.get(dateKey) || {
      date: dateKey,
      totalSales: 0,
      vendorSales: 0,
      adminSales: 0,
      ordersCount: 0,
      unitsSold: 0,
    };
    const monthlyEntry = monthlyTrendMap.get(monthKey);

    dailyEntry.ordersCount += 1;
    monthlyEntry.ordersCount += 1;

    let hasVendorItem = false;
    let hasAdminItem = false;

    order.items?.forEach((item) => {
      const allocated = allocateLineItem(order, item);
      dailyEntry.unitsSold += allocated.quantity;
      dailyEntry.totalSales = moneyUtils.addMoney(dailyEntry.totalSales, allocated.finalAmount);
      monthlyEntry.totalSales = moneyUtils.addMoney(monthlyEntry.totalSales, allocated.finalAmount);

      if (allocated.isVendor) {
        hasVendorItem = true;
        dailyEntry.vendorSales = moneyUtils.addMoney(dailyEntry.vendorSales, allocated.finalAmount);
        monthlyEntry.vendorSales = moneyUtils.addMoney(monthlyEntry.vendorSales, allocated.finalAmount);
        totalVendorSales = moneyUtils.addMoney(totalVendorSales, allocated.finalAmount);

        const vName = allocated.sellerName;
        vendorDistMap.set(vName, moneyUtils.addMoney(vendorDistMap.get(vName) || 0, allocated.finalAmount));
      } else {
        hasAdminItem = true;
        dailyEntry.adminSales = moneyUtils.addMoney(dailyEntry.adminSales, allocated.finalAmount);
        monthlyEntry.adminSales = moneyUtils.addMoney(monthlyEntry.adminSales, allocated.finalAmount);
        totalAdminSales = moneyUtils.addMoney(totalAdminSales, allocated.finalAmount);
      }
    });

    if (hasVendorItem) totalVendorOrders += 1;
    if (hasAdminItem) totalAdminOrders += 1;

    dailyTrendMap.set(dateKey, dailyEntry);
  });

  const dailyTrends = Array.from(dailyTrendMap.values());
  const monthlyTrends = Array.from(monthlyTrendMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  const totalQualifying = moneyUtils.addMoney(totalVendorSales, totalAdminSales);
  const vendorDistribution = Array.from(vendorDistMap.entries()).map(([name, value]) => ({
    name,
    value,
    percentage: totalQualifying > 0 ? Number(((value / totalQualifying) * 100).toFixed(1)) : 0,
  }));

  const orderStatusDistribution = Array.from(statusDistMap.values());

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        dailyTrends,
        monthlyTrends,
        vendorDistribution,
        orderStatusDistribution,
        channelDistribution: {
          vendorSales: totalVendorSales,
          adminSales: totalAdminSales,
          vendorOrders: totalVendorOrders,
          adminOrders: totalAdminOrders,
          totalSales: totalQualifying,
        },
      },
      'Sales trend analytics retrieved'
    )
  );
});

// =========================================================================
// 6. GET ORDER DETAILS (Inspector Modal with Mixed Seller Line Items)
// =========================================================================
export const getSalesOrderDetails = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;

  let order = null;
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    order = await Order.findById(orderId)
      .populate('userId', 'name email phone role address')
      .populate('items.productId', 'name sku images price categoryId')
      .populate('items.vendorId', 'storeName slug phone email userId')
      .lean();
  }

  if (!order) {
    order = await Order.findOne({
      $or: [{ orderNumber: orderId }, { publicOrderId: orderId }],
    })
      .populate('userId', 'name email phone role address')
      .populate('items.productId', 'name sku images price categoryId')
      .populate('items.vendorId', 'storeName slug phone email userId')
      .lean();
  }

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Look up payment record if available
  const payment = await Payment.findOne({
    $or: [{ orderId: order._id }, { razorpayOrderId: order.paymentId }],
  }).lean();

  const vendorItems = [];
  const adminItems = [];

  let vendorSubtotal = 0;
  let adminSubtotal = 0;

  order.items?.forEach((item) => {
    const allocated = allocateLineItem(order, item);
    if (allocated.isVendor) {
      vendorItems.push(allocated);
      vendorSubtotal = moneyUtils.addMoney(vendorSubtotal, allocated.finalAmount);
    } else {
      adminItems.push(allocated);
      adminSubtotal = moneyUtils.addMoney(adminSubtotal, allocated.finalAmount);
    }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        order,
        payment,
        vendorItems,
        adminItems,
        vendorSubtotal,
        adminSubtotal,
        isMixedSellerOrder: vendorItems.length > 0 && adminItems.length > 0,
      },
      'Order details retrieved successfully'
    )
  );
});

// =========================================================================
// 7. GET CUSTOMER PURCHASE HISTORY
// =========================================================================
export const getCustomerPurchaseHistory = asyncWrapper(async (req, res) => {
  const { customerId } = req.params;

  const customer = await User.findById(customerId).select('name email phone role createdAt').lean();
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const orders = await Order.find({ userId: customerId })
    .populate('items.vendorId', 'storeName slug')
    .sort({ createdAt: -1 })
    .lean();

  let totalSpent = 0;
  let totalOrdersCount = orders.length;
  let completedOrdersCount = 0;

  const history = orders.map((order) => {
    const isPaid = isQualifyingPaidSale(order);
    if (isPaid) {
      completedOrdersCount += 1;
      totalSpent = moneyUtils.addMoney(totalSpent, order.grandTotal || order.total || 0);
    }

    const items = order.items?.map((item) => allocateLineItem(order, item)) || [];

    return {
      _id: order._id,
      orderNumber: order.orderNumber,
      publicOrderId: order.publicOrderId,
      createdAt: order.createdAt,
      grandTotal: order.grandTotal || order.total || 0,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      itemsCount: items.reduce((sum, it) => sum + it.quantity, 0),
      items,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        customer,
        metrics: {
          totalOrdersCount,
          completedOrdersCount,
          totalSpent,
        },
        orders: history,
      },
      'Customer purchase history retrieved'
    )
  );
});

// =========================================================================
// 8. EXPORT SALES CSV
// =========================================================================
export const exportSalesCsv = asyncWrapper(async (req, res) => {
  const {
    range = 'THIS_MONTH',
    startDate,
    endDate,
    channel = 'ALL',
    format = 'line-items', // 'line-items' | 'orders' | 'sellers' | 'products'
  } = req.query;

  const { start, end } = parseDateRange(range, startDate, endDate);

  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .populate('userId', 'name email phone')
    .populate('items.vendorId', 'storeName slug phone email')
    .sort({ createdAt: -1 })
    .lean();

  let csvContent = '';

  if (format === 'orders') {
    csvContent = 'Order Number,Date,Customer Name,Customer Email,Customer Phone,Payment Status,Order Status,Payment Method,Grand Total (INR)\n';
    orders.forEach((order) => {
      const row = [
        `"${order.orderNumber || ''}"`,
        `"${new Date(order.createdAt).toISOString()}"`,
        `"${order.userId?.name || 'Guest'}"`,
        `"${order.userId?.email || ''}"`,
        `"${order.userId?.phone || ''}"`,
        `"${order.paymentStatus || ''}"`,
        `"${order.orderStatus || ''}"`,
        `"${order.paymentMethod || ''}"`,
        order.grandTotal || order.total || 0,
      ];
      csvContent += row.join(',') + '\n';
    });
  } else if (format === 'sellers') {
    // Seller summaries export
    csvContent = 'Seller Type,Seller / Store Name,Total Units Sold,Gross Sales (INR),Discounts (INR),Taxes (INR),Shipping (INR),Net Sales (INR)\n';
    // Calculate via aggregation
    const sellerMap = new Map();
    orders.forEach((order) => {
      if (!isQualifyingPaidSale(order)) return;
      order.items?.forEach((item) => {
        const allocated = allocateLineItem(order, item);
        const sKey = allocated.sellerName;
        const entry = sellerMap.get(sKey) || {
          sellerType: allocated.sellerType,
          sellerName: allocated.sellerName,
          units: 0,
          gross: 0,
          discount: 0,
          tax: 0,
          shipping: 0,
          net: 0,
        };
        entry.units += allocated.quantity;
        entry.gross = moneyUtils.addMoney(entry.gross, allocated.lineTotal);
        entry.discount = moneyUtils.addMoney(entry.discount, allocated.discount);
        entry.tax = moneyUtils.addMoney(entry.tax, allocated.tax);
        entry.shipping = moneyUtils.addMoney(entry.shipping, allocated.shipping);
        entry.net = moneyUtils.addMoney(entry.net, allocated.finalAmount);
        sellerMap.set(sKey, entry);
      });
    });

    Array.from(sellerMap.values()).forEach((s) => {
      csvContent += `"${s.sellerType}","${s.sellerName}",${s.units},${s.gross},${s.discount},${s.tax},${s.shipping},${s.net}\n`;
    });
  } else if (format === 'products') {
    csvContent = 'Product Name,SKU,Seller Type,Seller Name,Units Sold,Gross Sales (INR),Discounts (INR),Net Sales (INR)\n';
    const prodMap = new Map();
    orders.forEach((order) => {
      if (!isQualifyingPaidSale(order)) return;
      order.items?.forEach((item) => {
        const allocated = allocateLineItem(order, item);
        const pKey = allocated.productName;
        const entry = prodMap.get(pKey) || {
          productName: allocated.productName,
          sku: allocated.sku,
          sellerType: allocated.sellerType,
          sellerName: allocated.sellerName,
          units: 0,
          gross: 0,
          discount: 0,
          net: 0,
        };
        entry.units += allocated.quantity;
        entry.gross = moneyUtils.addMoney(entry.gross, allocated.lineTotal);
        entry.discount = moneyUtils.addMoney(entry.discount, allocated.discount);
        entry.net = moneyUtils.addMoney(entry.net, allocated.finalAmount);
        prodMap.set(pKey, entry);
      });
    });

    Array.from(prodMap.values()).forEach((p) => {
      csvContent += `"${p.productName}","${p.sku}","${p.sellerType}","${p.sellerName}",${p.units},${p.gross},${p.discount},${p.net}\n`;
    });
  } else {
    // Default: Detailed line-items export
    csvContent = 'Order ID,Order Date,Customer Name,Product Name,SKU,Seller Type,Seller Name,Quantity,Unit Price (INR),Item Subtotal (INR),Discount (INR),Tax (INR),Shipping (INR),Final Amount (INR),Payment Status,Order Status\n';
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const allocated = allocateLineItem(order, item);

        if (channel === 'VENDOR' && !allocated.isVendor) return;
        if (channel === 'ADMIN' && allocated.isVendor) return;

        const row = [
          `"${order.orderNumber || ''}"`,
          `"${new Date(order.createdAt).toISOString()}"`,
          `"${order.userId?.name || 'Guest'}"`,
          `"${(allocated.productName || '').replace(/"/g, '""')}"`,
          `"${allocated.sku || ''}"`,
          `"${allocated.sellerType}"`,
          `"${(allocated.sellerName || '').replace(/"/g, '""')}"`,
          allocated.quantity,
          allocated.unitPrice,
          allocated.lineTotal,
          allocated.discount,
          allocated.tax,
          allocated.shipping,
          allocated.finalAmount,
          `"${order.paymentStatus || ''}"`,
          `"${order.orderStatus || ''}"`,
        ];
        csvContent += row.join(',') + '\n';
      });
    });
  }

  const filename = `baapoo_mart_sales_${format}_${range.toLowerCase()}_${Date.now()}.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csvContent);
});
