import React from 'react'

const Home = () => {
  return (
    <div className='flex flex-col gap-4'>
      <h1 className='text-2xl font-semibold text-gray-800'>Trang chủ quản trị</h1>
      <p className='text-sm text-gray-600'>
        Chào mừng bạn quay lại hệ thống quản trị. Chọn một mục ở menu bên trái để bắt đầu làm việc.
      </p>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2'>
        <div className='bg-white border border-gray-200 rounded p-4'>
          <p className='text-sm text-gray-500'>Sản phẩm</p>
          <p className='text-lg font-medium text-gray-800'>Quản lý danh mục sản phẩm</p>
        </div>
        <div className='bg-white border border-gray-200 rounded p-4'>
          <p className='text-sm text-gray-500'>Đơn hàng</p>
          <p className='text-lg font-medium text-gray-800'>Theo dõi trạng thái xử lý</p>
        </div>
        <div className='bg-white border border-gray-200 rounded p-4'>
          <p className='text-sm text-gray-500'>Đánh giá</p>
          <p className='text-lg font-medium text-gray-800'>Kiểm duyệt phản hồi khách hàng</p>
        </div>
      </div>
    </div>
  )
}

export default Home
