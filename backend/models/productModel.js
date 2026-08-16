import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    discountType: { type: String, enum: ['percentage', 'fixed', 'none'], default: 'none' },
    discountValue: { type: Number, default: 0 },
    bestseller: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const productModel = mongoose.models.product || mongoose.model('product', productSchema);

export default productModel;