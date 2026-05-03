import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl, formatPrice } from '../App'
import { toast } from 'react-toastify'
import { getCategoryLabel } from '../constants/categories'
import { useNavigate } from 'react-router-dom'
import AdminPagination from '../components/AdminPagination'

const PAGE_SIZE = 10

const List = ({token}) => {
  
  const [list,setList] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const navigate = useNavigate()
  
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await axios.get(backendUrl + '/api/product/list', {
          params: { page, limit: PAGE_SIZE },
        })
        if (cancelled) return
        if (response.data.success) {
          setList(response.data.products)
          setPagination(response.data.pagination ?? null)
        } else {
          toast.error('Không thể tải danh sách sản phẩm')
        }
      } catch (error) {
        if (!cancelled) {
          console.log(error)
          toast.error('Không thể tải danh sách sản phẩm')
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [page])

  const removeproduct = async (id) => {
    try {
      
    const response = await axios.post(backendUrl + '/api/product/remove', {id}, {headers:{token}})
    if(response.data.success){
      toast.success('Đã xoá sản phẩm')
      const r = await axios.get(backendUrl + '/api/product/list', {
        params: { page, limit: PAGE_SIZE },
      })
      if (r.data.success) {
        const { products, pagination: pag } = r.data
        if (products.length === 0 && page > 1) {
          setPage((p) => p - 1)
        } else {
          setList(products)
          setPagination(pag ?? null)
        }
      }
    }
    else {
     toast.error('Không thể xoá sản phẩm')
    }

    } catch (error) {
      console.log(error)
      toast.error('Không thể xoá sản phẩm')
    }
  } 
  
  
  return (
    <>
      <p className='mb-2' >Danh sách sản phẩm</p>
      <div className='flex flex-col gap-2'>

        {/* --------------- List Table Title ----------------- */}
      <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm ' >
        <b>Ảnh</b>
        <b>Tên</b>
        <b>Danh mục</b>
        <b>Giá</b>
        <b className='text-center'>Thao tác</b>
      </div>

      {/* -------------- Product List --------------- */}
      {
        list.map((item) => (
          (() => {
            const base = Number(item.price || 0)
            const type = item.discountType || 'none'
            const value = Number(item.discountValue || 0)
            const finalPrice =
              !value || type === 'none'
                ? base
                : type === 'percentage'
                  ? Math.max(0, Math.round(base * (1 - value / 100)))
                  : Math.max(0, base - value)

            const discountLabel =
              !value || type === 'none'
                ? ''
                : type === 'percentage'
                  ? `-${value}%`
                  : `Giảm ${formatPrice(value)}`

            return (
          <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm ' key={item._id}>
            <img className='w-12' src={item.image[0]} alt="" />
              <p>{item.name}</p>
              <p>{getCategoryLabel(item.category)}</p>
              <div>
                <p className='font-medium'>{formatPrice(finalPrice)}</p>
                {discountLabel ? (
                  <p className='text-xs text-gray-400'>
                    <span className='line-through'>{formatPrice(base)}</span>{' '}
                    <span>({discountLabel})</span>
                  </p>
                ) : null}
              </div>
              <div className='flex justify-end md:justify-center gap-2'>
                <button
                  type='button'
                  onClick={() => navigate(`/products/${item._id}/edit`)}
                  className='px-3 py-1 border rounded text-sm hover:bg-gray-50'
                >
                  Chỉnh sửa
                </button>
                <button
                  type='button'
                  onClick={() => removeproduct(item._id)}
                  className='px-3 py-1 border rounded text-sm hover:bg-gray-50'
                >
                  Xoá
                </button>
              </div>
          </div>
            )
          })()
        ))
      }

      <AdminPagination
        page={pagination?.page ?? page}
        totalPages={pagination?.totalPages ?? 1}
        total={pagination?.total ?? 0}
        pageSize={pagination?.limit ?? PAGE_SIZE}
        onPageChange={setPage}
        itemLabel="sản phẩm"
      />
    
      </div>
    </>
  )
}

export default List
