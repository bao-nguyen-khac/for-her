import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'
const ProductItem = ({id, image, name, price, discountType, discountValue}) => {

    const { formatPrice, getFinalPrice, getDiscountLabel } = useContext(ShopContext);
    const finalPrice = getFinalPrice({ price, discountType, discountValue })
    const discountLabel = getDiscountLabel({ price, discountType, discountValue })
 
    return (
    <Link className='text-gray-700 cursor-pointer'  to={`/product/${id}`} >
    <div className='overflow-hidden relative' >
      <img className='hover:scale-110 transition ease-in-out'  src={image[0]} alt="" />
      {discountLabel ? (
        <span className='absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded'>
          {discountLabel}
        </span>
      ) : null}
    </div>
    <p className='pt-3 pb-1 text-sm'>{name}</p>
    <div className='flex items-center gap-2'>
      <p className='text-sm font-medium'>{formatPrice(finalPrice)}</p>
      {discountLabel ? <p className='text-xs text-gray-400 line-through'>{formatPrice(price)}</p> : null}
    </div>
    </Link>
  )
}

export default ProductItem
