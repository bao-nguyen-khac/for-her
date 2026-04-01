import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import reviewModel from '../models/reviewModel.js'
import productModel from '../models/productModel.js'
import userModel from '../models/userModel.js'

function parseUserFromTokenHeader(req) {
  const { token } = req.headers || {}
  if (!token) return null
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded?.id ? String(decoded.id) : null
  } catch {
    return null
  }
}

// GET /api/product/:id/reviews
const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: 'Invalid product id' })
    }

    const reviews = await reviewModel
      .find({ productId: id })
      .sort({ createdAt: -1 })
      .lean()

    const reviewCount = reviews.length
    const averageRating =
      reviewCount === 0
        ? 0
        : Math.round(
            (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviewCount) * 10,
          ) / 10

    res.json({
      success: true,
      reviews,
      summary: { averageRating, reviewCount },
    })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// POST /api/product/:id/reviews
const addProductReview = async (req, res) => {
  try {
    const { id } = req.params
    const { rating, comment, name } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: 'Invalid product id' })
    }

    const product = await productModel.findById(id).lean()
    if (!product) {
      return res.json({ success: false, message: 'Product not found' })
    }

    const ratingNum = Number(rating)
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.json({ success: false, message: 'Rating must be between 1 and 5' })
    }

    const commentText = String(comment || '').trim()
    if (!commentText) {
      return res.json({ success: false, message: 'Comment is required' })
    }

    const userId = parseUserFromTokenHeader(req)

    let reviewerName = String(name || '').trim()
    if (userId) {
      const user = await userModel.findById(userId).lean()
      reviewerName = user?.name || reviewerName || 'Người dùng'
    }

    if (!reviewerName) {
      return res.json({ success: false, message: 'Name is required for guest review' })
    }

    const review = new reviewModel({
      productId: id,
      userId: userId || undefined,
      name: reviewerName,
      rating: ratingNum,
      comment: commentText,
    })

    await review.save()

    res.json({ success: true, message: 'Review created', review })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Admin: GET /api/review/list
const listReviews = async (req, res) => {
  try {
    const reviews = await reviewModel
      .find({})
      .sort({ createdAt: -1 })
      .populate('productId', 'name image price category subcategory')
      .lean()
    res.json({ success: true, reviews })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Admin: POST /api/review/remove
const removeReview = async (req, res) => {
  try {
    const { id } = req.body
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: 'Invalid review id' })
    }
    await reviewModel.findByIdAndDelete(id)
    res.json({ success: true, message: 'Review removed' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { getProductReviews, addProductReview, listReviews, removeReview }

