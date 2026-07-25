import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, unique: true },
  },
  { timestamps: true }
);

const cartModel = mongoose.models.cart || mongoose.model('cart', cartSchema);

export default cartModel;
