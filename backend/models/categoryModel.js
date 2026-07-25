import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'category', default: null },
  },
  { timestamps: true }
);

const categoryModel = mongoose.models.category || mongoose.model('category', categorySchema);

export default categoryModel;
