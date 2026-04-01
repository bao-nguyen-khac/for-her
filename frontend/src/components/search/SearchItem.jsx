import React, { useContext } from 'react'
import { ShopContext } from '../../context/ShopContext'

const SearchItem = ({ product, onSelect }) => {
  const { formatPrice, getFinalPrice, getDiscountLabel } = useContext(ShopContext)

  const finalPrice = getFinalPrice(product)
  const discountLabel = getDiscountLabel(product)

  return (
    <button
      type='button'
      onClick={onSelect}
      className='w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10'
    >
      <img
        src={product?.image?.[0]}
        alt=''
        className='w-11 h-11 object-cover rounded-xl border border-gray-200 bg-white'
      />
      <div className='min-w-0 flex-1'>
        <p
          className='text-sm font-medium text-gray-900 leading-5'
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product?.name}
        </p>
        <div className='flex items-center gap-2 mt-0.5'>
          <p className='text-sm font-semibold text-gray-900'>
            {formatPrice(finalPrice)}
          </p>
          {discountLabel ? (
            <>
              <p className='text-xs text-gray-400 line-through'>
                {formatPrice(product?.price)}
              </p>
              <span className='text-[10px] bg-black text-white px-2 py-0.5 rounded-full'>
                {discountLabel}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </button>
  )
}

export default SearchItem

