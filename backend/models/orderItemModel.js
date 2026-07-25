import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'order', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'product_variant', required: true },
    quantity: { type: Number, required: true },
    priceAtOrder: { type: Number, required: true },
  },
  { timestamps: true }
);

const orderItemModel =
  mongoose.models.order_item || mongoose.model('order_item', orderItemSchema);

export default orderItemModel;
