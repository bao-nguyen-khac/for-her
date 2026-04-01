import React from 'react'
import { assets } from '../../assets/assets'

const SearchInput = ({ value, onChange, onFocus, onKeyDown, onClear, inputRef }) => {
  return (
    <div className='flex items-center gap-3 bg-white px-4 h-11 sm:h-12 rounded-2xl shadow-sm w-full ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-black/10 transition-shadow transition-colors'>
      <img className='w-4 opacity-70' src={assets.search_icon} alt='' />
      <input
        ref={inputRef}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        className='flex-1 outline-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400'
        type='text'
        placeholder='Tìm kiếm sản phẩm...'
        autoComplete='off'
      />

      {value ? (
        <button
          type='button'
          onClick={onClear}
          className='text-gray-400 hover:text-gray-700 text-xl leading-none px-2 transition-colors'
          aria-label='Xoá'
          title='Xoá'
        >
          ×
        </button>
      ) : null}
    </div>
  )
}

export default SearchInput

