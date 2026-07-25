import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'address', required: true },
    status: { type: String, required: true, default: 'Order Placed' },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, required: true, default: 'pending' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);

export default orderModel;