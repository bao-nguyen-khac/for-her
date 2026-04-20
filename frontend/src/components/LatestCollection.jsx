import React, { useEffect, useState } from 'react'
import { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import ProductItem from './ProductItem';

const LatestCollection = () => {
  
  const { products} = useContext(ShopContext);

  const [latestProducts, setLatestProducts ] = useState([]);

  useEffect(() => {
     setLatestProducts(products.slice(0,8));
  },[products])
  
    return (
    <div className='my-10'>
      <div className='text-center py-8 text-3xl'>
        <Title  text1={'BỘ SƯU TẬP'} text2={'MỚI'} />
        <p className='w-3/4 m-auto text-xs sm:text-sm md:text-base  text-gray-600'>Thương mại điện tử là hoạt động mua bán hàng hóa và dịch vụ trực tuyến. Internet giúp cá nhân và doanh nghiệp dễ dàng trao đổi nhiều loại sản phẩm và dịch vụ một cách nhanh chóng.</p>     
      </div>
      
      {/* Rendering products */}
      
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 gap-y-6'>
        {latestProducts.map((item,index) => (
          <ProductItem
            key={index}
            id={item._id}
            image={item.image}
            name={item.name}
            price={item.price}
            discountType={item.discountType}
            discountValue={item.discountValue}
          />
        ))}
      </div>

    </div>
  )
}

export default LatestCollection
