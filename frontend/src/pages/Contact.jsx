import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsLetterBox from '../components/NewsLetterBox'

const Contact = () => {
  return (
    <div>

      <div className='text-center text-2xl  pt-10 border-t'>
        <Title text1={'LIÊN HỆ'} text2={''} />
      </div>

      <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28' >
        <img className='w-full md:max-w-[480px]' src={assets.contact_img} alt="" />
        <div className='flex flex-col justify-center items-start gap-6'>
          <p className='font-semibold text-xl text-gray-600 ' >Cửa hàng</p>
          <p className='text-gray-500' >152 Hậu Giang P.6, Q.6, TP. Hồ Chí Minh</p>
          <p className='text-gray-500' >Điện thoại: +84 123456789 <br /> Email: admin@gmail.com</p>
          <p className='font-semibold text-xl text-gray-600'>Hỗ trợ khách hàng</p>
          <p className='text-gray-500'>
            Chúng tôi luôn sẵn sàng hỗ trợ! Liên hệ để được tư vấn,<br/> 
            theo dõi đơn hàng, đổi trả hoặc thông tin sản phẩm.
          </p>
          <p className='text-gray-500'>
            <b>Giờ làm việc:</b> Thứ 2 - Thứ 7, 9:00 - 21:00
          </p>
        </div>
      </div>
      
       <NewsLetterBox />

    </div>
  )
}

export default Contact
