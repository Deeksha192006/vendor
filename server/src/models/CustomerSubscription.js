import mongoose from 'mongoose';

const customerSubscriptionSchema = new mongoose.Schema(
  {
    customerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    planId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'CustomerSubscriptionPlan', 
      required: true 
    },
    planNameSnapshot: { 
      type: String, 
      default: '' 
    },
    planPriceSnapshot: { 
      type: Number, 
      default: 0 
    },
    durationSnapshot: { 
      type: mongoose.Schema.Types.Mixed, 
      default: null 
    },
    startDate: { 
      type: Date, 
      default: Date.now 
    },
    expiryDate: { 
      type: Date, 
      required: true, 
      index: true 
    },
    // Backwards-compatible aliases
    startedAt: { 
      type: Date, 
      default: null 
    },
    expiresAt: { 
      type: Date, 
      default: null, 
      index: true 
    },
    paymentStatus: { 
      type: String, 
      enum: ['Pending Payment', 'Paid', 'Payment Failed', 'PENDING', 'PAID', 'FAILED'], 
      default: 'Paid' 
    },
    subscriptionStatus: { 
      type: String, 
      enum: ['Active', 'Pending Payment', 'Expired', 'Cancelled', 'Payment Failed', 'ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED'], 
      default: 'Active', 
      index: true 
    },
    status: { 
      type: String, 
      enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'PAYMENT_FAILED', 'Active', 'Pending Payment', 'Expired', 'Cancelled', 'Payment Failed'], 
      default: 'ACTIVE',
      index: true
    },
    transactionId: { 
      type: String, 
      default: '' 
    },
    paymentId: { 
      type: mongoose.Schema.Types.Mixed, 
      default: null 
    },
    autoRenew: { 
      type: Boolean, 
      default: false 
    },
    cancelledAt: { 
      type: Date, 
      default: null 
    },
    planSnapshot: { 
      type: Object, 
      required: true 
    },
  },
  { timestamps: true }
);

// Keep aliases in sync before save
customerSubscriptionSchema.pre('save', function (next) {
  if (this.startDate && !this.startedAt) this.startedAt = this.startDate;
  if (this.startedAt && !this.startDate) this.startDate = this.startedAt;
  if (this.expiryDate && !this.expiresAt) this.expiresAt = this.expiryDate;
  if (this.expiresAt && !this.expiryDate) this.expiryDate = this.expiresAt;

  if (this.subscriptionStatus && !this.status) {
    this.status = this.subscriptionStatus.toUpperCase();
  }
  if (this.status && !this.subscriptionStatus) {
    this.subscriptionStatus = this.status === 'ACTIVE' ? 'Active' : this.status;
  }
  next();
});

export const CustomerSubscription = mongoose.model('CustomerSubscription', customerSubscriptionSchema);
