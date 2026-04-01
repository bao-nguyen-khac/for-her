import React, { useContext, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'
const ProductItem = ({id, image, name, price, discountType, discountValue}) => {

    const { formatPrice, getFinalPrice, getDiscountLabel } = useContext(ShopContext);
    const finalPrice = getFinalPrice({ price, discountType, discountValue })
    const discountLabel = getDiscountLabel({ price, discountType, discountValue })
    const [loaded, setLoaded] = useState(false)
 
    return (
    <Link className='text-gray-700 cursor-pointer group'  to={`/product/${id}`} >
    <div className='relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-gray-100' >
      {!loaded ? <div className='absolute inset-0 animate-pulse bg-gray-200/70' /> : null}
      <img
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        src={image?.[0]}
        alt={name || ''}
      />
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

export default React.memo(ProductItem)
