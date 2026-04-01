import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import ProductItem from './ProductItem'
import Title from './Title'
import axios from 'axios'

const RelatedProducts = ({ productId, category }) => {

    const {products, backendUrl} = useContext(ShopContext)
    const [ related, setRelated ] = useState([]);

    useEffect(() =>{
      const load = async () => {
        if (!productId) return
        try {
          const response = await axios.get(`${backendUrl}/api/product/${productId}/related?limit=5`)
          if (response.data.success) {
            setRelated(response.data.products || [])
            return
          }
        } catch {
          // fallback below
        }

        if (products.length > 0) {
          let productsCopy = products.slice()
          productsCopy = productsCopy.filter((item) => category === item.category)
          productsCopy = productsCopy.filter((item) => String(item._id) !== String(productId))
          setRelated(productsCopy.slice(0, 5))
        }
      }

      load()
    }, [products, backendUrl, productId, category])

  return (
    <div className='my-24'>
      
      <div className='text-center text-3xl py-2'>
        <Title text1={'SẢN PHẨM'} text2={'LIÊN QUAN'} />
       </div>
       <div className='grid grid-col-2 sm:grid-cols-3 md:grid-cols-4  lg:grid-cols-5  gap-4 gap-y-6'>
          {
            related.map((item,index) => (
              <ProductItem key={index} id={item._id} name={item.name} price={item.price} image={item.image} />
            ))
          }
        </div>
      </div>
  )
}

export default RelatedProducts
