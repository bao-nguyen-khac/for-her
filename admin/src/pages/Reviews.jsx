import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const DEFAULT_IMG = 'https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp';

const Reviews = ({ token }) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchReviews = async () => {
    if (!token) return
    try {
      setLoading(true)
      const response = await axios.get(backendUrl + '/api/review/list', { headers: { token } })
      if (response.data.success) {
        setReviews(response.data.reviews || [])
      } else {
        toast.error(response.data.message || 'Không thể tải đánh giá')
      }
    } catch (error) {
      console.log(error)
      toast.error('Không thể tải đánh giá')
    } finally {
      setLoading(false)
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
    <div className='flex flex-col gap-5'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
        <div>
          <h1 className='text-xl font-bold text-gray-800'>Đánh giá sản phẩm</h1>
          <p className='text-xs text-gray-500 mt-0.5'>Quản lý nhận xét và phản hồi từ khách hàng</p>
        </div>
        <div className='self-start sm:self-auto'>
          <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-100'>
            Tổng: {reviews.length} đánh giá
          </span>
        </div>
      </div>

      {/* Modern Table Container */}
      <div className='bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left border-collapse min-w-[700px]'>
            <thead>
              <tr className='bg-gray-50/90 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider'>
                <th className='py-3.5 px-4 w-[34%]'>Sản phẩm</th>
                <th className='py-3.5 px-4 w-[18%]'>Người đánh giá</th>
                <th className='py-3.5 px-4 w-[12%] text-center'>Số sao</th>
                <th className='py-3.5 px-4 w-[26%]'>Nội dung</th>
                <th className='py-3.5 px-4 w-[10%] text-center'>Thao tác</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100 text-sm text-gray-700'>
              {reviews.map((r) => (
                <tr key={r._id} className='hover:bg-gray-50/60 transition-colors'>
                  {/* Product */}
                  <td className='py-3.5 px-4'>
                    <div className='flex items-center gap-3'>
                      <img
                        className='w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0 bg-gray-50'
                        src={r.productId?.image?.[0] || DEFAULT_IMG}
                        alt={r.productId?.name || ''}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_IMG;
                        }}
                      />
                      <div className='min-w-0'>
                        <p className='font-medium text-gray-800 text-xs sm:text-sm line-clamp-1' title={r.productId?.name}>
                          {r.productId?.name || 'Sản phẩm'}
                        </p>
                        <p className='text-[11px] text-gray-400 mt-0.5'>
                          {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Reviewer */}
                  <td className='py-3.5 px-4'>
                    <div className='flex items-center gap-2'>
                      <div className='w-7 h-7 rounded-full bg-pink-100 text-pink-700 font-bold text-xs flex items-center justify-center shrink-0'>
                        {(r.name || 'K').charAt(0).toUpperCase()}
                      </div>
                      <span className='font-medium text-gray-800 text-xs sm:text-sm truncate'>
                        {r.name || 'Người dùng'}
                      </span>
                    </div>
                  </td>

                  {/* Rating */}
                  <td className='py-3.5 px-4 text-center'>
                    <div className='inline-flex items-center gap-1 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-full text-xs font-bold text-amber-700'>
                      <span>{r.rating}</span>
                      <span className='text-amber-500 text-sm leading-none'>★</span>
                    </div>
                  </td>

                  {/* Comment */}
                  <td className='py-3.5 px-4'>
                    <p className='text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed'>
                      {r.comment}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className='py-3.5 px-4 text-center'>
                    <button
                      type='button'
                      onClick={() => remove(r._id)}
                      className='px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg text-xs font-medium transition-colors cursor-pointer'
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!loading && reviews.length === 0 && (
          <div className='text-center py-12 text-gray-400 text-sm'>
            Chưa có đánh giá nào từ khách hàng.
          </div>
        )}

        {/* Loading State */}
        {loading && reviews.length === 0 && (
          <div className='text-center py-12 text-gray-400 text-sm animate-pulse'>
            Đang tải dữ liệu đánh giá...
          </div>
        )}
      </div>
    </div>
  )
}

export default Reviews
