import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Reviews = ({ token }) => {
  const [reviews, setReviews] = useState([])

  const fetchReviews = async () => {
    if (!token) return
    try {
      const response = await axios.get(backendUrl + '/api/review/list', { headers: { token } })
      if (response.data.success) {
        setReviews(response.data.reviews || [])
      } else {
        toast.error(response.data.message || 'Không thể tải đánh giá')
      }
    } catch (error) {
      console.log(error)
      toast.error('Không thể tải đánh giá')
    }
  }

  const remove = async (id) => {
    try {
      const response = await axios.post(backendUrl + '/api/review/remove', { id }, { headers: { token } })
      if (response.data.success) {
        toast.success('Đã xoá đánh giá')
        await fetchReviews()
      } else {
        toast.error(response.data.message || 'Không thể xoá đánh giá')
      }
    } catch (error) {
      console.log(error)
      toast.error('Không thể xoá đánh giá')
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [token])

  return (
    <div>
      <p className='mb-2'>Đánh giá sản phẩm</p>

      <div className='flex flex-col gap-2'>
        <div className='hidden md:grid grid-cols-[2fr_1fr_1fr_3fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
          <b>Sản phẩm</b>
          <b>Người đánh giá</b>
          <b>Số sao</b>
          <b>Nội dung</b>
          <b className='text-center'>Thao tác</b>
        </div>

        {reviews.map((r) => (
          <div
            key={r._id}
            className='grid grid-cols-[2fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr_3fr_1fr] items-center gap-2 py-2 px-2 border text-sm'
          >
            <div className='flex items-center gap-3'>
              <img className='w-12 h-12 object-cover border rounded' src={r.productId?.image?.[0]} alt='' />
              <div>
                <p className='font-medium'>{r.productId?.name || '—'}</p>
                <p className='text-xs text-gray-500'>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
            <p>{r.name}</p>
            <p>{r.rating}/5</p>
            <p className='hidden md:block'>{r.comment}</p>
            <div className='flex justify-end md:justify-center'>
              <button
                type='button'
                onClick={() => remove(r._id)}
                className='px-3 py-1 border rounded text-sm hover:bg-gray-50'
              >
                Xoá
              </button>
            </div>
          </div>
        ))}

        {reviews.length === 0 && <p className='text-sm text-gray-500'>Chưa có đánh giá.</p>}
      </div>
    </div>
  )
}

export default Reviews

