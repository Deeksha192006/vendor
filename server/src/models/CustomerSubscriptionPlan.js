import mongoose from 'mongoose';

const customerSubscriptionPlanSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true, 
      trim: true 
    },
    planType: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'Custom'],
      default: 'Monthly',
    },
    description: { 
      type: String, 
      default: '' 
    },
    durationValue: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    durationUnit: { 
      type: String, 
      enum: ['days', 'months', 'years', 'day', 'month', 'year', 'DAY', 'MONTH', 'YEAR'], 
      default: 'months' 
    },
    price: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    discount: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    benefits: [
      { 
        type: String, 
        trim: true 
      }
    ],
    badge: { 
      type: String, 
      default: '', 
      trim: true 
    },
    currency: { 
      type: String, 
      default: 'INR' 
    },
    displayOrder: { 
      type: Number, 
      default: 0 
    },
    rewardRules: {
      coinsOnSubscribe: { type: Number, default: 0 },
      superCoinsOnSubscribe: { type: Number, default: 0 },
      monthlyCoinAllowance: { type: Number, default: 0 },
    },
    status: { 
      type: String, 
      enum: ['Active', 'Inactive', 'ACTIVE', 'INACTIVE'], 
      default: 'Active' 
    },
    isDeleted: { 
      type: Boolean, 
      default: false 
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      default: null 
    },
  },
  { timestamps: true }
);

// Virtual for checking if plan is active
customerSubscriptionPlanSchema.virtual('isCurrentlyActive').get(function () {
  return (this.status === 'Active' || this.status === 'ACTIVE') && !this.isDeleted;
});

export const CustomerSubscriptionPlan = mongoose.model('CustomerSubscriptionPlan', customerSubscriptionPlanSchema);
