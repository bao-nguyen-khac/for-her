import React from 'react'
import { assets } from '../assets/assets'

const OurPolicy = () => {
  return (
    <div className='flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-20 text-xs sm:text-sm  md:text-base text-gray-700 ' >
      
      <div>
        <img src={assets.exchange_icon} alt="" className='w-12 m-auto mb-5'/>
        <p className='font-semibold'>Đổi hàng dễ dàng</p>
        <p className='text-gray-400'>Hỗ trợ đổi hàng nhanh chóng, thuận tiện</p>
      </div>

      <div>
        <img src={assets.quality_icon} alt="" className='w-12 m-auto mb-5'/>
        <p className='font-semibold'>Hoàn trả trong 7 ngày</p>
        <p className='text-gray-400'>Chính sách hoàn trả miễn phí trong 7 ngày</p>
      </div>
      
      <div>
        <img src={assets.support_img} alt="" className='w-12 m-auto mb-5'/>
        <p className='font-semibold'>Hỗ trợ khách hàng tận tâm</p>
        <p className='text-gray-400'>Hỗ trợ 24/7 khi bạn cần</p>
      </div>
    
    </div>
  )
}

export default OurPolicy
