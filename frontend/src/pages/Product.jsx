import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import { toast } from 'react-toastify';
import axios from 'axios';

const Product = () => {

  const { productId } = useParams();
  const { products, formatPrice, getFinalPrice, getDiscountLabel, addToCart, backendUrl, token } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState('');
  const [size, setSize] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, reviewCount: 0 });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', name: '' });

  const fetchProductData = async () => {
     products.map((item) => {
      if(item._id === productId){
        setProductData(item);
        setImage(item.image[0]);
        return null;
      }
     })
  }

  useEffect(() => {
   fetchProductData();
  }, [productId, products])

  const loadReviews = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/${productId}/reviews`)
      if (response.data.success) {
        setReviews(response.data.reviews || [])
        setReviewSummary(response.data.summary || { averageRating: 0, reviewCount: 0 })
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (productId) loadReviews()
  }, [productId])

  const submitReview = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      }
      if (!token) payload.name = reviewForm.name

      const response = await axios.post(
        `${backendUrl}/api/product/${productId}/reviews`,
        payload,
        token ? { headers: { token } } : undefined,
      )
      if (response.data.success) {
        toast.success('Đã gửi đánh giá')
        setReviewForm((prev) => ({ ...prev, comment: '' }))
        await loadReviews()
      } else {
        toast.error(response.data.message || 'Không thể gửi đánh giá')
      }
    } catch (error) {
      console.log(error)
      toast.error('Không thể gửi đánh giá')
    }
  }

  const renderStars = (avg) => {
    const rounded = Math.round(Number(avg || 0))
    return (
      <div className='flex items-center gap-1 mt-2'>
        {[1, 2, 3, 4, 5].map((i) => (
          <img
            key={i}
            src={i <= rounded ? assets.star_icon : assets.star_dull_icon}
            alt=''
            className='w-3 5'
          />
        ))}
        <p className='pl-2'>({reviewSummary.reviewCount || 0})</p>
      </div>
    )
  }

  return productData ? (
    <div  className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
      {/* ---------------- product Data --------------- */}
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>

      {/* --------------- product Images --------------- */}
      <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
        <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full' >
           {
            productData.image.map((item,index) => (
              <img onClick={() =>setImage(item)}  src={item}  key={index} className='w-[24%] sm:w-full sm:mb-3 flex-shrink cursor-pointer' alt="" />
            ))
           }
        </div>
        <div className='w-full sm:w-[80%]'>
          <img className='w-full h-auto'  src={image} alt="" />
        </div>
      </div>

      {/* -------------- Product Info --------------- */}

      <div className='flex-1'>
        <h1 className='font medium text-2xl mt-2 ' >{productData.name}</h1>
        {renderStars(reviewSummary.averageRating)}
        <p className='text-sm text-gray-500 mt-1'>
          {reviewSummary.reviewCount ? `${reviewSummary.averageRating}/5` : 'Chưa có đánh giá'}
        </p>
        <div className='mt-5 flex items-baseline gap-3 flex-wrap'>
          <p className='text-3xl font-medium'>
            {formatPrice(getFinalPrice(productData))}
          </p>
          {getDiscountLabel(productData) ? (
            <>
              <p className='text-base text-gray-400 line-through'>{formatPrice(productData.price)}</p>
              <span className='text-xs bg-black text-white px-2 py-1 rounded'>{getDiscountLabel(productData)}</span>
            </>
          ) : null}
        </div>
        <p  className='mt-5 text-gray-500 md:w-4/5'>{productData.description}</p>
        <div className='flex flex-col gap-4 my-8'>
            <p>Chọn kích cỡ</p>
            <div className='flex gap-2'>
              {
                productData.sizes.map((item,index) => (
                  <button onClick={() => setSize(item)} className={`border py-2 px-4 bg-gray-100 ${item === size ? 'border-orange-500': ''}`}  key={index}>{item}</button>
                ))}
            </div>
        </div>
        <button onClick={() => addToCart(productData._id,size)} className='bg-black text-white px-8 py-3 text-sm active:bg-gray-700'>THÊM VÀO GIỎ</button>
        <hr className='mt-8 sm:w-4/5'/>
        <div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
           <p>Cam kết sản phẩm chính hãng.</p>
           <p>Hỗ trợ thanh toán khi nhận hàng.</p>
           <p>Đổi trả dễ dàng trong 7 ngày.</p>
        </div>
      </div>
    </div>
       
       {/* --------------- Description & review Section ---------------- */}
      
      <div className='mt-20' >
        <div className='flex'>
            <b className='border px-5 py-3  text-sm'>Mô tả</b>
            <p className='border px-5 py-3 text-sm'>Đánh giá ({reviewSummary.reviewCount || 0})</p>
        </div>
        <div className='flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500'>
           <p>Sản phẩm được lựa chọn kỹ lưỡng, mang lại trải nghiệm thoải mái khi sử dụng và phù hợp nhiều dịp.</p>
           <p>Chúng tôi luôn cập nhật mẫu mã mới và đảm bảo chất lượng để bạn yên tâm mua sắm.</p>
        </div>
      </div>

      {/* ---------------- Reviews ---------------- */}
      <div className='mt-10 border px-6 py-6'>
        <div className='flex items-center justify-between gap-4 flex-wrap'>
          <div>
            <p className='text-lg font-medium'>Đánh giá sản phẩm</p>
            <p className='text-sm text-gray-500'>
              {reviewSummary.reviewCount ? `${reviewSummary.averageRating}/5 • ${reviewSummary.reviewCount} đánh giá` : 'Chưa có đánh giá'}
            </p>
          </div>
        </div>

        <div className='mt-6 space-y-4'>
          {reviews.length === 0 ? (
            <p className='text-sm text-gray-500'>Chưa có đánh giá nào.</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className='border rounded px-4 py-3'>
                <div className='flex items-center justify-between gap-3 flex-wrap'>
                  <p className='font-medium'>{r.name}</p>
                  <p className='text-sm text-gray-500'>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className='flex items-center gap-1 mt-2'>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <img key={i} src={i <= r.rating ? assets.star_icon : assets.star_dull_icon} alt='' className='w-3 5' />
                  ))}
                </div>
                <p className='text-sm text-gray-700 mt-2'>{r.comment}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={submitReview} className='mt-8 border-t pt-6'>
          <p className='font-medium'>Viết đánh giá</p>

          {!token && (
            <div className='mt-3'>
              <p className='text-sm mb-1'>Tên của bạn</p>
              <input
                value={reviewForm.name}
                onChange={(e) => setReviewForm((p) => ({ ...p, name: e.target.value }))}
                className='w-full max-w-[520px] border px-3 py-2'
                type='text'
                placeholder='Nhập tên'
                required
              />
            </div>
          )}

          <div className='mt-3'>
            <p className='text-sm mb-1'>Số sao</p>
            <select
              value={reviewForm.rating}
              onChange={(e) => setReviewForm((p) => ({ ...p, rating: Number(e.target.value) }))}
              className='border px-3 py-2'
            >
              <option value={5}>5 - Rất tốt</option>
              <option value={4}>4 - Tốt</option>
              <option value={3}>3 - Bình thường</option>
              <option value={2}>2 - Chưa tốt</option>
              <option value={1}>1 - Tệ</option>
            </select>
          </div>

          <div className='mt-3'>
            <p className='text-sm mb-1'>Nhận xét</p>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
              className='w-full border px-3 py-2 min-h-[100px]'
              placeholder='Chia sẻ cảm nhận của bạn...'
              required
            />
          </div>

          <button type='submit' className='mt-4 bg-black text-white px-6 py-2'>
            Gửi đánh giá
          </button>
        </form>
      </div>

      {/* -------------- display related products ----------------- */}

          <RelatedProducts productId={productId} category={productData.category} />

    </div>
  ): <div className='opacity-0'></div>
}

export default Product
