import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    bestseller: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const productModel = mongoose.models.product || mongoose.model('product', productSchema);

export default productModel;