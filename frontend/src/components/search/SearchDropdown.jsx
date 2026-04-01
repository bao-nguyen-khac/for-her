import React from 'react'
import SearchItem from './SearchItem'

const SearchDropdown = ({
  open,
  loading,
  query,
  items,
  onSelectItem,
  onViewAll,
}) => {
  if (!open) return null

  return (
    <div className='absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 animate-[fadeScale_180ms_ease-out] origin-top'>
      <div className='px-4 py-3 border-b border-gray-100 bg-white'>
        <p className='text-xs text-gray-500 tracking-wide'>
          {query ? `Kết quả cho “${query}”` : 'Nhập từ khoá để tìm kiếm'}
        </p>
      </div>

      {loading ? (
        <div className='px-4 py-4 text-sm text-gray-500'>Đang tìm kiếm...</div>
      ) : items.length === 0 ? (
        <div className='px-4 py-4 text-sm text-gray-500'>
          {query ? 'Không tìm thấy sản phẩm phù hợp.' : 'Bắt đầu nhập để xem gợi ý.'}
        </div>
      ) : (
        <div className='max-h-[360px] overflow-auto py-1'>
          {items.map((p) => (
            <SearchItem
              key={p._id}
              product={p}
              onSelect={() => onSelectItem(p)}
            />
          ))}
        </div>
      )}

      <div className='border-t border-gray-100 bg-white'>
        <button
          type='button'
          onClick={onViewAll}
          className='w-full text-sm px-4 py-3 hover:bg-gray-50 transition-colors text-gray-800 font-medium'
        >
          Xem tất cả kết quả
        </button>
      </div>
    </div>
  )
}

export default SearchDropdown

