import { OfflineBill } from '../models/OfflineBill.js';
import { OfflineBillStatusHistory } from '../models/OfflineBillStatusHistory.js';
import { BillRewardRule } from '../models/BillRewardRule.js';
import { BillReward } from '../models/BillReward.js';
import { superCoinService } from './superCoinService.js';
import { fairCoinService } from './fairCoinService.js';
import { fraudDetectionService } from './fraudDetectionService.js';
import { premiumService } from './premiumService.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';

export const offlineBillService = {
  
  async submitBill(customerId, payload) {
    const { billNumber, billDate, storeName, purchaseAmount, fileUrl, storePhone, storeAddress } = payload;
    
    // 1. Age Validation
    const billDateObj = new Date(billDate);
    const now = new Date();
    
    if (billDateObj > now) {
      throw new ApiError(400, 'Bill date cannot be in the future', ERROR_CODES.BAD_REQUEST);
    }

    const maxAgeDays = 30; // Configurable ideally via Settings
    const msDiff = now.getTime() - billDateObj.getTime();
    if (msDiff > (maxAgeDays * 24 * 60 * 60 * 1000)) {
      throw new ApiError(400, `Bill is too old. Maximum allowed age is ${maxAgeDays} days.`, ERROR_CODES.BAD_REQUEST);
    }

    // Monthly Limit Check (Max 5 bills per calendar month per customer)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const monthlyBillCount = await OfflineBill.countDocuments({
      customerId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    if (monthlyBillCount >= 5) {
      throw new ApiError(400, 'Monthly limit reached. You can only upload a maximum of 5 bills per month.', ERROR_CODES.BAD_REQUEST);
    }

    // 2. Fraud / Duplicate Check
    const flags = await fraudDetectionService.checkDuplicateBill({
      customerId,
      billNumber,
      storeName,
      billDate: billDateObj,
    });

    if (flags.includes('DUPLICATE_OWN_BILL')) {
      throw new ApiError(400, 'You have already submitted this exact bill.', ERROR_CODES.BAD_REQUEST);
    }

    // 3. Create Bill
    const status = flags.length > 0 ? 'UNDER_REVIEW' : 'SUBMITTED';

    const bill = await OfflineBill.create({
      customerId,
      billNumber,
      billDate: billDateObj,
      storeName,
      storePhone,
      storeAddress,
      purchaseAmount,
      fileUrl,
      status,
      flags,
    });

    await OfflineBillStatusHistory.create({
      billId: bill._id,
      previousStatus: 'DRAFT',
      newStatus: status,
      reason: flags.length > 0 ? 'Flagged by Fraud Detection' : 'Initial submission',
    });

    return bill;
  },

  async approveBill(billId, adminId) {
    const bill = await OfflineBill.findById(billId);
    if (!bill) throw new ApiError(404, 'Bill not found', ERROR_CODES.NOT_FOUND);

    if (bill.status === 'APPROVED') throw new ApiError(400, 'Bill is already approved', ERROR_CODES.BAD_REQUEST);
    
    // Get active rule if present
    const rule = await BillRewardRule.findOne({ status: 'ACTIVE' }).sort({ createdAt: -1 });

    // Fixed 500 Fair Coins reward per approved offline bill as requested
    const finalAmount = 500;

    // State Mutation
    const previousStatus = bill.status;
    bill.status = 'APPROVED';
    bill.approvedAt = new Date();
    bill.reviewedBy = adminId;
    await bill.save();

    await OfflineBillStatusHistory.create({
      billId: bill._id,
      previousStatus: previousStatus,
      newStatus: 'APPROVED',
      changedBy: adminId,
    });

    // Save Reward Record
    let rewardRecord;
    try {
      rewardRecord = await BillReward.create({
        billId: bill._id,
        customerId: bill.customerId,
        ruleId: rule ? rule._id : null,
        rewardType: 'FIXED_SUPER_COINS',
        purchaseAmount: bill.purchaseAmount,
        calculatedAmount: finalAmount,
        finalAmount: finalAmount,
        status: 'PENDING',
        ruleSnapshot: rule ? rule.toObject() : {},
      });
    } catch (e) {
      if (e.code === 11000) {
        rewardRecord = await BillReward.findOne({ billId: bill._id });
      } else {
        throw e;
      }
    }

    // Credit 500 Fair Coins to Customer (updates User.fairCoinBalance and sends notification)
    const tx = await fairCoinService.creditCoins({
      userId: bill.customerId,
      amount: finalAmount,
      type: 'CREDIT',
      source: 'OFFLINE_BILL_REWARD',
      referenceId: `BILL:${bill._id.toString()}`,
      description: `Reward for approved offline bill #${bill.billNumber}`,
    });

    // Also sync to superCoinService
    try {
      await superCoinService.creditCoins({
        userId: bill.customerId,
        amount: finalAmount,
        type: 'CREDIT',
        source: 'OFFLINE_BILL_REWARD',
        referenceId: `BILL:${bill._id.toString()}`,
        description: `Reward for approved offline bill #${bill.billNumber}`,
      });
    } catch (err) {
      console.error('SuperCoin credit sync log:', err?.message);
    }

    if (rewardRecord) {
      rewardRecord.status = 'CREDITED';
      rewardRecord.superCoinTransactionId = tx?._id;
      await rewardRecord.save();
    }

    return { bill, reward: rewardRecord };
  },

  async rejectBill(billId, adminId, reason) {
    if (!reason) throw new ApiError(400, 'Rejection reason is required', ERROR_CODES.BAD_REQUEST);

    const bill = await OfflineBill.findById(billId);
    if (!bill) throw new ApiError(404, 'Bill not found', ERROR_CODES.NOT_FOUND);

    if (bill.status === 'APPROVED') {
       throw new ApiError(400, 'Cannot reject an already approved bill. Use reversal process.', ERROR_CODES.BAD_REQUEST);
    }

    const oldStatus = bill.status;
    bill.status = 'REJECTED';
    bill.rejectedAt = new Date();
    bill.reviewedBy = adminId;
    bill.rejectionReason = reason;
    await bill.save();

    await OfflineBillStatusHistory.create({
      billId: bill._id,
      previousStatus: oldStatus,
      newStatus: 'REJECTED',
      reason,
      changedBy: adminId,
    });

    return bill;
  }
};
