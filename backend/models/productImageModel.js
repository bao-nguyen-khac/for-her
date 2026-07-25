import mongoose from 'mongoose';

const productImageSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    url: { type: String, required: true },
    isThumbnail: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const productImageModel =
  mongoose.models.product_image || mongoose.model('product_image', productImageSchema);

export default productImageModel;
