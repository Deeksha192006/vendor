import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { Vendor } from '../models/Vendor.js';
import { VendorSettlement } from '../models/VendorSettlement.js';
import { Commission } from '../models/Commission.js';
import { VendorLedger } from '../models/VendorLedger.js';
import { PlatformLedger } from '../models/PlatformLedger.js';
import { User } from '../models/User.js';
import { moneyUtils } from '../utils/moneyUtils.js';

const FIXED_COMMISSION_PERCENT = 5; // Fixed 5% Platform Commission

export const platformCommissionService = {
  /**
   * Pure calculation: 5% platform commission, 95% vendor share
   */
  calculate(amount) {
    const saleAmount = Number(amount) || 0;
    if (saleAmount <= 0) {
      return { saleAmount: 0, commissionRate: FIXED_COMMISSION_PERCENT, platformCommission: 0, vendorShare: 0 };
    }
    const platformCommission = moneyUtils.calculatePercentage(saleAmount, FIXED_COMMISSION_PERCENT);
    const vendorShare = moneyUtils.subtractMoney(saleAmount, platformCommission);
    return {
      saleAmount,
      commissionRate: FIXED_COMMISSION_PERCENT,
      platformCommission,
      vendorShare,
    };
  },

  /**
   * Called when order is placed or paid.
   * Snapshots 5% commission on vendor items in PENDING_DELIVERY status.
   */
  async recordOrderCommission(orderId, sessionArg = null) {
    const session = sessionArg && typeof sessionArg.inTransaction === 'function' ? sessionArg : null;
    const opts = session ? { session } : {};

    let orderQuery = Order.findById(orderId);
    if (session) orderQuery = orderQuery.session(session);
    const order = await orderQuery;
    if (!order) return;

    let adminQuery = User.findOne({ role: 'SUPER_ADMIN' });
    if (session) adminQuery = adminQuery.session(session);
    const adminUser = await adminQuery;
    const adminUserId = adminUser ? adminUser._id : null;

    let subordersQuery = VendorOrder.find({ parentOrderId: orderId });
    if (session) subordersQuery = subordersQuery.session(session);
    const suborders = await subordersQuery;

    let orderUpdated = false;

    // Snapshot on Order line items
    order.items?.forEach((item) => {
      if (item.vendorId) {
        const itemEligible = item.lineTotal || (item.unitPrice || 0) * (item.quantity || 1);
        const { platformCommission, vendorShare } = this.calculate(itemEligible);
        item.commissionRate = FIXED_COMMISSION_PERCENT;
        item.platformCommission = platformCommission;
        item.vendorShare = vendorShare;
        if (!item.settlementStatus) {
          item.settlementStatus = 'PENDING_DELIVERY';
        }
        orderUpdated = true;
      }
    });

    if (orderUpdated) {
      await order.save(opts);
    }

    // Process each Vendor suborder
    for (const suborder of suborders) {
      const grossAmount = suborder.subtotal || suborder.itemsSubtotal || 0;
      const { platformCommission, vendorShare } = this.calculate(grossAmount);

      suborder.platformCommission = platformCommission;
      suborder.vendorEarning = vendorShare;
      if (!suborder.settlementStatus) {
        suborder.settlementStatus = 'PENDING_DELIVERY';
      }
      await suborder.save(opts);

      // Create or update VendorSettlement in PENDING_DELIVERY status
      let settlementQuery = VendorSettlement.findOne({ suborderId: suborder._id });
      if (session) settlementQuery = settlementQuery.session(session);
      let settlement = await settlementQuery;

      if (!settlement) {
        await VendorSettlement.create(
          [
            {
              vendorId: suborder.vendorId,
              suborderId: suborder._id,
              grossAmount,
              platformCommission,
              networkCommission: 0,
              otherDeductions: 0,
              netPayable: vendorShare,
              status: 'PENDING_DELIVERY',
              eligibleAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default fallback
            },
          ],
          opts
        );
      }

      // Create Commission record for Admin tracking
      if (adminUserId && platformCommission > 0) {
        const existingCommission = await Commission.findOne({
          orderId: order._id,
          suborderId: suborder._id,
          type: 'PLATFORM_COMMISSION',
        });

        if (!existingCommission) {
          await Commission.create(
            [
              {
                orderId: order._id,
                suborderId: suborder._id,
                type: 'PLATFORM_COMMISSION',
                recipientUserId: adminUserId,
                vendorId: suborder.vendorId,
                orderAmount: grossAmount,
                commissionPercentage: FIXED_COMMISSION_PERCENT,
                commissionAmount: platformCommission,
                status: 'PENDING',
              },
            ],
            opts
          );
        }
      }
    }
  },

  /**
   * Called when order delivery is confirmed (status === 'DELIVERED').
   * Idempotently releases commission as earned and vendor share as eligible for settlement!
   */
  /**
   * Called when order delivery is confirmed (status === 'DELIVERED').
   * Idempotently releases commission as earned and vendor share as eligible for settlement!
   */
  async onOrderDelivered(orderOrSuborderId, sessionArg = null) {
    const session = sessionArg && typeof sessionArg.inTransaction === 'function' ? sessionArg : null;
    const opts = session ? { session } : {};

    let order = await Order.findById(orderOrSuborderId);
    let suborders = [];

    if (order) {
      suborders = await VendorOrder.find({ parentOrderId: order._id });
    } else {
      const suborder = await VendorOrder.findById(orderOrSuborderId);
      if (suborder) {
        order = await Order.findById(suborder.parentOrderId);
        suborders = [suborder];
      }
    }

    if (!order) return;

    // For COD orders, successful delivery completes payment collection
    if (order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID') {
      order.paymentStatus = 'PAID';
      await order.save(opts);
    }

    // Verify payment qualification (Paid or Confirmed COD)
    const isPaid = order.paymentStatus === 'PAID' || order.paymentMethod === 'COD';
    if (!isPaid) return;

    const deliveryTimestamp = new Date();

    // 1. Update Order line items
    let orderChanged = false;
    order.items?.forEach((item) => {
      const isItemInSuborders = suborders.some(so => so.items.some(si => si.productId?.toString() === item.productId?.toString() || si._id?.toString() === item._id?.toString()));
      if (item.vendorId && (item.settlementStatus === 'PENDING_DELIVERY' || !item.settlementStatus) && isItemInSuborders) {
        item.settlementStatus = 'ELIGIBLE';
        item.deliveredAt = deliveryTimestamp;
        orderChanged = true;
      }
    });
    if (orderChanged) {
      await order.save(opts);
    }

    // 2. Update Suborders & Vendor Settlements
    for (const suborder of suborders) {
      // Idempotency check: only transition if PENDING_DELIVERY or ON_HOLD
      if (['PENDING_DELIVERY', 'ON_HOLD', 'CONFIRMED', 'PROCESSING'].includes(suborder.settlementStatus) || !suborder.settlementStatus) {
        suborder.status = 'DELIVERED';
        suborder.settlementStatus = 'ELIGIBLE';
        suborder.deliveredAt = deliveryTimestamp;
        await suborder.save(opts);
      }

      // Update or create VendorSettlement
      let settlementQuery = VendorSettlement.findOne({ suborderId: suborder._id });
      if (session) settlementQuery = settlementQuery.session(session);
      let settlement = await settlementQuery;

      const grossAmount = suborder.subtotal || suborder.itemsSubtotal || 0;
      const { platformCommission, vendorShare } = this.calculate(grossAmount);

      if (settlement) {
        if (settlement.status === 'PENDING_DELIVERY' || settlement.status === 'ON_HOLD') {
          settlement.status = 'ELIGIBLE';
          settlement.eligibleAt = deliveryTimestamp;
          await settlement.save(opts);
        }
      } else {
        await VendorSettlement.create(
          [
            {
              vendorId: suborder.vendorId,
              suborderId: suborder._id,
              grossAmount,
              platformCommission,
              networkCommission: 0,
              otherDeductions: 0,
              netPayable: vendorShare,
              status: 'ELIGIBLE',
              eligibleAt: deliveryTimestamp,
            },
          ],
          opts
        );
      }

      // Credit vendor payable balance upon delivery
      let vendorQuery = Vendor.findById(suborder.vendorId);
      if (session) vendorQuery = vendorQuery.session(session);
      const vendor = await vendorQuery;

      if (vendor) {
        // Check if ledger entry already exists to avoid duplicate credit
        let existingLedger = await VendorLedger.findOne({
          suborderId: suborder._id,
          transactionType: 'SALE_EARNED',
        });

        if (!existingLedger) {
          const newBalance = moneyUtils.addMoney(vendor.balance || 0, vendorShare);
          vendor.balance = newBalance;
          vendor.totalSales = moneyUtils.addMoney(vendor.totalSales || 0, grossAmount);
          await vendor.save(opts);

          await VendorLedger.create(
            [
              {
                vendorId: vendor._id,
                orderId: order._id,
                suborderId: suborder._id,
                transactionType: 'SALE_EARNED',
                credit: vendorShare,
                debit: 0,
                balanceSnapshot: newBalance,
                description: `Delivered sales earnings (95%) for order ${order.orderNumber} (Gross ₹${grossAmount} less 5% platform fee ₹${platformCommission})`,
              },
            ],
            opts
          );
        }
      }

      // Update Commission record to PAID/EARNED
      await Commission.updateMany(
        { suborderId: suborder._id, type: 'PLATFORM_COMMISSION' },
        { $set: { status: 'PAID' } },
        opts
      );

      // Record earned commission in PlatformLedger idempotently
      if (platformCommission > 0) {
        const existingPlatformLedger = await PlatformLedger.findOne({
          sourceEntityId: order._id.toString(),
          'metadata.suborderId': suborder._id,
          type: 'ORDER_COMMISSION',
        });

        if (!existingPlatformLedger) {
          const latestPlatformRecord = await PlatformLedger.findOne().sort({ createdAt: -1 });
          const currentPlatformBalance = latestPlatformRecord?.balanceSnapshot || 0;
          const nextPlatformBalance = moneyUtils.addMoney(currentPlatformBalance, platformCommission);

          await PlatformLedger.create(
            [
              {
                transactionId: `PL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                type: 'ORDER_COMMISSION',
                sourceEntityType: 'ORDER',
                sourceEntityId: order._id.toString(),
                credit: platformCommission,
                debit: 0,
                balanceSnapshot: nextPlatformBalance,
                description: `5% Platform Commission earned on delivered order ${order.orderNumber} (Vendor: ${suborder.vendorNameSnapshot})`,
                metadata: {
                  orderId: order._id,
                  vendorId: suborder.vendorId,
                  suborderId: suborder._id,
                  grossAmount,
                  commissionRate: FIXED_COMMISSION_PERCENT,
                },
              },
            ],
            opts
          );
        }
      }
    }
  },

  /**
   * Called when order is cancelled.
   * Reverses settlement and commissions.
   */
  async onOrderCancelled(orderId, sessionArg = null) {
    const session = sessionArg && typeof sessionArg.inTransaction === 'function' ? sessionArg : null;
    const opts = session ? { session } : {};

    let orderQuery = Order.findById(orderId);
    if (session) orderQuery = orderQuery.session(session);
    const order = await orderQuery;
    if (!order) return;

    order.items?.forEach((item) => {
      if (item.vendorId) {
        item.settlementStatus = 'CANCELLED';
      }
    });
    await order.save(opts);

    const suborders = await VendorOrder.find({ parentOrderId: orderId });
    for (const suborder of suborders) {
      suborder.status = 'CANCELLED';
      suborder.settlementStatus = 'CANCELLED';
      await suborder.save(opts);

      await VendorSettlement.updateMany(
        { suborderId: suborder._id },
        { $set: { status: 'REVERSED', notes: 'Order cancelled before settlement' } },
        opts
      );

      await Commission.updateMany(
        { suborderId: suborder._id },
        { $set: { status: 'CANCELLED' } },
        opts
      );
    }
  },

  /**
   * Process settlement payout to vendor (Super Admin marks settlement as PAID).
   */
  async processVendorPayout(settlementId, { payoutReference, notes, processedBy }) {
    const settlement = await VendorSettlement.findById(settlementId).populate('vendorId');
    if (!settlement) {
      throw new Error('Settlement record not found');
    }

    if (settlement.status === 'PAID') {
      throw new Error('Settlement has already been paid out');
    }

    const ref = payoutReference || `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const paidTimestamp = new Date();

    settlement.status = 'PAID';
    settlement.paidAt = paidTimestamp;
    settlement.payoutReference = ref;
    if (notes) settlement.notes = notes;
    await settlement.save();

    // Update VendorOrder
    await VendorOrder.findByIdAndUpdate(settlement.suborderId, {
      settlementStatus: 'PAID',
      settlementPaidAt: paidTimestamp,
      payoutReference: ref,
    });

    // Update Order line items
    if (settlement.suborderId) {
      const suborder = await VendorOrder.findById(settlement.suborderId);
      if (suborder?.parentOrderId) {
        await Order.updateOne(
          { _id: suborder.parentOrderId, 'items.vendorId': settlement.vendorId._id },
          {
            $set: {
              'items.$[elem].settlementStatus': 'PAID',
              'items.$[elem].settlementPaidAt': paidTimestamp,
              'items.$[elem].payoutReference': ref,
            },
          },
          {
            arrayFilters: [{ 'elem.vendorId': settlement.vendorId._id }],
          }
        );
      }
    }

    // Ledger record for payout deduction from balance
    if (settlement.vendorId) {
      const vendor = await Vendor.findById(settlement.vendorId._id || settlement.vendorId);
      if (vendor) {
        const remainingBalance = moneyUtils.subtractMoney(vendor.balance || 0, settlement.netPayable, true);
        vendor.balance = remainingBalance;
        await vendor.save();

        await VendorLedger.create({
          vendorId: vendor._id,
          suborderId: settlement.suborderId,
          transactionType: 'PAYOUT',
          credit: 0,
          debit: settlement.netPayable,
          balanceSnapshot: remainingBalance,
          description: `Vendor payout completed: Ref ${ref} (Net ₹${settlement.netPayable})`,
        });
      }
    }

    return settlement;
  },
};
