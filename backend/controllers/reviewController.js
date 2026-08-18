import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import reviewModel from '../models/reviewModel.js';
import productModel from '../models/productModel.js';
import productImageModel from '../models/productImageModel.js';
import userModel from '../models/userModel.js';

const DEFAULT_IMG = 'https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp';

function parseUserFromTokenHeader(req) {
  const { token } = req.headers || {};
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.id ? String(decoded.id) : null;
  } catch {
    return null;
  }
}

// Helper to format review for backward compatibility with frontend
async function formatReview(rDoc) {
  if (!rDoc) return null;
  const review = rDoc.toObject ? rDoc.toObject() : rDoc;
  let reviewerName = review.userName || '';

  if (!reviewerName) {
    if (review.userId) {
      if (typeof review.userId === 'object' && review.userId?.name) {
        reviewerName = review.userId.name;
      } else {
        const u = await userModel.findById(review.userId).lean();
        if (u && u.name) reviewerName = u.name;
      }
    }
  }

  if (!reviewerName) reviewerName = 'Khách hàng';

  const pId = review.productId?._id || review.productId;
  let productInfo = review.productId;
  if (pId) {
    let pName = 'Sản phẩm';
    if (typeof productInfo === 'object' && productInfo?.name) {
      pName = productInfo.name;
    } else {
      const prod = await productModel.findById(pId).lean();
      if (prod) pName = prod.name;
    }

    const imgs = await productImageModel
      .find({ productId: pId })
      .sort({ isThumbnail: -1, sortOrder: 1 })
      .lean();

    const imageArray = imgs.length > 0 ? imgs.map((i) => i.url) : [DEFAULT_IMG];

    productInfo = {
      _id: pId,
      name: pName,
      image: imageArray,
    };
  }

  return {
    ...review,
    productId: productInfo,
    name: reviewerName,
  };
}

// GET /api/product/:id/reviews
const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const rawReviews = await reviewModel
      .find({ productId: id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .lean();

    const reviews = await Promise.all(rawReviews.map(formatReview));

    const reviewCount = reviews.length;
    const averageRating =
      reviewCount === 0
        ? 0
        : Math.round(
            (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviewCount) * 10
          ) / 10;

    res.json({
      success: true,
      reviews,
      summary: { averageRating, reviewCount },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// POST /api/product/:id/reviews
const addProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const product = await productModel.findById(id).lean();
    if (!product) {
      return res.json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.json({ success: false, message: 'Điểm đánh giá phải từ 1 đến 5' });
    }

    const commentText = String(comment || '').trim();
    if (!commentText) {
      return res.json({ success: false, message: 'Vui lòng nhập nội dung đánh giá' });
    }

    const userId = parseUserFromTokenHeader(req);

    let finalUserId = userId;
    let finalUserName = name || 'Khách hàng';

    if (userId) {
      const u = await userModel.findById(userId).lean();
      if (u && u.name) finalUserName = u.name;
    } else {
      // Find or create guest user if non-authenticated
      let guestUser = await userModel.findOne({ email: 'guest@example.com' });
      if (!guestUser) {
        guestUser = await userModel.create({
          name: name || 'Khách hàng',
          email: 'guest@example.com',
          password: 'guestpassword',
        });
      }
      finalUserId = guestUser._id;
    }

    const review = await reviewModel.create({
      productId: id,
      userId: finalUserId,
      userName: finalUserName,
      rating: ratingNum,
      comment: commentText,
    });

    const formattedReview = await formatReview(review);
    res.json({ success: true, message: 'Tạo đánh giá thành công', review: formattedReview });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Admin: GET /api/review/list
const listReviews = async (req, res) => {
  try {
    const rawReviews = await reviewModel
      .find({})
      .sort({ createdAt: -1 })
      .populate('productId', 'name price')
      .populate('userId', 'name email')
      .lean();

    const reviews = await Promise.all(rawReviews.map(formatReview));
    res.json({ success: true, reviews });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Admin: POST /api/review/remove
const removeReview = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: 'ID đánh giá không hợp lệ' });
    }
    await reviewModel.findByIdAndDelete(id);
    res.json({ success: true, message: 'Xóa đánh giá thành công' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { getProductReviews, addProductReview, listReviews, removeReview };
