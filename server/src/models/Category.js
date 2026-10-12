import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, lowercase: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdByVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null, index: true },
    createdByRole: { type: String, enum: ['SUPER_ADMIN', 'VENDOR'], default: 'SUPER_ADMIN', index: true },
    createdByName: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

// Keep isActive and normalizedName in sync before saving
categorySchema.pre('validate', function (next) {
  if (this.name) {
    this.normalizedName = this.name.trim().toLowerCase();
  }
  if (this.status) {
    this.isActive = this.status === 'ACTIVE';
  } else if (this.isActive !== undefined) {
    this.status = this.isActive ? 'ACTIVE' : 'INACTIVE';
  }
  next();
});

export const Category = mongoose.model('Category', categorySchema);
