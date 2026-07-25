import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'cart', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'product_variant', required: true },
    quantity: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

const cartItemModel =
  mongoose.models.cart_item || mongoose.model('cart_item', cartItemSchema);

export default cartItemModel;
