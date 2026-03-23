import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl, formatPrice } from '../App'
import { toast } from 'react-toastify'
import { getCategoryLabel } from '../constants/categories'

const List = ({token}) => {
  
  const [list,setList] = useState([])
  
  const fetchList = async () => {
    try {
      
    const response = await axios.get(backendUrl + '/api/product/list')
    if (response.data.success) {
      setList(response.data.products);
    }
    else {
      toast.error('Không thể tải danh sách sản phẩm')
    }
    
    } catch (error) {
      console.log(error)
      toast.error('Không thể tải danh sách sản phẩm')
    }
  }

  const removeproduct = async (id) => {
    try {
      
    const response = await axios.post(backendUrl + '/api/product/remove', {id}, {headers:{token}})
    if(response.data.success){
      toast.success('Đã xoá sản phẩm')
      await fetchList();
    }
    else {
     toast.error('Không thể xoá sản phẩm')
    }

    } catch (error) {
      console.log(error)
      toast.error('Không thể xoá sản phẩm')
    }
  } 

  useEffect(() => {
    fetchList()
  },[])
  
  
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
        list.map((item,index) => (
          <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm ' key={index}>
            <img className='w-12' src={item.image[0]} alt="" />
              <p>{item.name}</p>
              <p>{getCategoryLabel(item.category)}</p>
              <p>{formatPrice(item.price)}</p>
              <p onClick={() => removeproduct(item._id)} className='text-right md:text-center cursor-pointer text-lg ' >X</p>
          </div>
        ))
      }
    
      </div>
    </>
  )
}

export default List
