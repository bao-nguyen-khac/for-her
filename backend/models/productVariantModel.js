import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    size: { type: String, required: true },
    color: { type: String, default: 'Mặc định' },
    material: { type: String, default: 'Lụa/Thun' },
    stockQuantity: { type: Number, required: true, default: 100 },
  },
  { timestamps: true }
);

const productVariantModel =
  mongoose.models.product_variant || mongoose.model('product_variant', productVariantSchema);

export default productVariantModel;
