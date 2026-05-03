import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const Footer = () => {

  const navigate = useNavigate()

  const handleNavigation = (path) => {
    navigate(path)
    window.scrollTo(0, 0)
  }

  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
        <div>
          <img src={assets.logo} alt="" className='mb-5 w-32'/>
            <p className='w-full md:w-2/3 text-gray-600'>
              ForHer – Điểm đến mua sắm tiện lợi với sản phẩm chất lượng và giá hợp lý.
              Chúng tôi mang đến trải nghiệm mua sắm online mượt mà,
              để phong cách của bạn luôn bền lâu theo thời gian.
            </p>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>CÔNG TY</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li 
                  onClick={() => handleNavigation('/')} 
                  className='cursor-pointer hover:text-black transition-colors'
                >
                  Trang chủ
                </li>
                <li 
                  onClick={() => handleNavigation('/about')} 
                  className='cursor-pointer hover:text-black transition-colors'
                >
                  Giới thiệu
                </li>
                <li 
                  onClick={() => handleNavigation('/contact')} 
                  className='cursor-pointer hover:text-black transition-colors'
                >
                  Liên hệ
                </li>
                <li className='cursor-pointer hover:text-black transition-colors'>
                  Chính sách bảo mật
                </li>
            </ul>
        </div>

        <div>
            <p className='text-xl font-medium mb-5'>LIÊN HỆ</p>
            <ul className='flex flex-col gap-1 text-gray-600'>
                <li>Điện thoại: +84 123456789</li>
                <li>Email: admin@gmail.com</li>
            </ul>
        </div>

      </div>

      <div>
        <hr />
        <p className='py-5 text-sm text-center'>
          Bản quyền © 2026 forher.com - Đã đăng ký bản quyền
        </p>    
      </div> 

    </div>
  )
}

export default Footer
