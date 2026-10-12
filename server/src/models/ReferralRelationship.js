import mongoose from 'mongoose';

const referralRelationshipSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // A referred account can have at most one direct referrer
      index: true,
    },
    referralType: {
      type: String,
      enum: ['VENDOR', 'CUSTOMER'],
      required: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      index: true,
    },
    qualificationStatus: {
      type: String,
      enum: ['PENDING', 'QUALIFIED', 'REVERSED'],
      default: 'PENDING',
      index: true,
    },
    qualifiedAt: {
      type: Date,
      default: null,
    },

    // Vendor Direct Referral Commission Fields (10% on paid subscription)
    vendorSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    planName: {
      type: String,
      default: '',
    },
    subscriptionAmount: {
      type: Number,
      default: 0,
    },
    commissionRate: {
      type: Number,
      default: 10, // Fixed 10%
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    commissionStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'PAID', 'CANCELLED'],
      default: 'NONE',
      index: true,
    },

    // Customer Direct Referral Reward Fields (500 Super Coins)
    superCoinsAwarded: {
      type: Number,
      default: 0,
    },
    rewardTransactionId: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

referralRelationshipSchema.index({ referrerId: 1, referralType: 1 });
referralRelationshipSchema.index({ createdAt: -1 });

export const ReferralRelationship = mongoose.model('ReferralRelationship', referralRelationshipSchema);
export default ReferralRelationship;
