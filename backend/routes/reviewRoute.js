import express from 'express'
import adminAuth from '../middleware/adminAuth.js'
import { listReviews, removeReview } from '../controllers/reviewController.js'

const reviewRouter = express.Router()

reviewRouter.get('/list', adminAuth, listReviews)
reviewRouter.post('/remove', adminAuth, removeReview)

export default reviewRouter

