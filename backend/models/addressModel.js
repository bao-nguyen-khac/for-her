import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    receiverName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const addressModel = mongoose.models.address || mongoose.model('address', addressSchema);

export default addressModel;
