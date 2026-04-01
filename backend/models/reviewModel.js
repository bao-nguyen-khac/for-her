import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    userId: { type: String },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true },
)

const reviewModel = mongoose.models.review || mongoose.model('review', reviewSchema)

export default reviewModel

