import mongoose from 'mongoose';

const vendorSubscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    planType: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'Custom'],
      default: 'Monthly',
    },
    description: {
      type: String,
      default: '',
    },
    durationValue: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    durationUnit: {
      type: String,
      enum: ['days', 'months', 'years', 'day', 'month', 'year', 'DAYS', 'MONTHS', 'YEARS'],
      default: 'months',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    featureLimits: {
      maxProducts: { type: Number, default: 0 }, // 0 = unlimited
      analyticsAccess: { type: Boolean, default: true },
      prioritySupport: { type: Boolean, default: false },
      promotionalPlacement: { type: Boolean, default: false },
      storeCustomization: { type: Boolean, default: false },
      orderManagementTools: { type: Boolean, default: true },
    },
    badge: {
      type: String,
      default: '',
      trim: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'ACTIVE', 'INACTIVE'],
      default: 'Active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

vendorSubscriptionPlanSchema.virtual('isCurrentlyActive').get(function () {
  return (this.status === 'Active' || this.status === 'ACTIVE') && !this.isDeleted;
});

export const VendorSubscriptionPlan = mongoose.model('VendorSubscriptionPlan', vendorSubscriptionPlanSchema);
