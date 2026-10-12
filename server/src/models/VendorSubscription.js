import mongoose from 'mongoose';

const vendorSubscriptionSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorSubscriptionPlan',
      required: true,
    },
    planNameSnapshot: {
      type: String,
      required: true,
    },
    planPriceSnapshot: {
      type: Number,
      required: true,
    },
    durationSnapshot: {
      durationValue: { type: Number, default: 1 },
      durationUnit: { type: String, default: 'months' },
      planType: { type: String, default: 'Monthly' },
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending Payment', 'Paid', 'Payment Failed', 'PENDING', 'PAID', 'FAILED', 'SUCCESS'],
      default: 'Paid',
    },
    subscriptionStatus: {
      type: String,
      enum: ['Active', 'Pending Payment', 'Expired', 'Cancelled', 'Payment Failed', 'ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED'],
      default: 'Active',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED', 'PAYMENT_FAILED', 'Active', 'Pending Payment', 'Expired', 'Cancelled'],
      default: 'ACTIVE',
      index: true,
    },
    transactionId: {
      type: String,
      default: '',
    },
    paymentId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    planSnapshot: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

vendorSubscriptionSchema.pre('save', function (next) {
  if (this.expiryDate && !this.endDate) this.endDate = this.expiryDate;
  if (this.endDate && !this.expiryDate) this.expiryDate = this.endDate;

  if (this.subscriptionStatus && !this.status) {
    this.status = this.subscriptionStatus.toUpperCase();
  }
  if (this.status && !this.subscriptionStatus) {
    this.subscriptionStatus = this.status === 'ACTIVE' ? 'Active' : this.status;
  }
  next();
});

export const VendorSubscription = mongoose.model('VendorSubscription', vendorSubscriptionSchema);
