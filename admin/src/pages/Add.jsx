import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl, formatPrice } from '../App'
import { toast } from 'react-toastify'
import { CATEGORIES } from '../constants/categories'



const Add = ({token}) => {

 const [image1,setImage1] = useState(false)
 const [image2,setImage2] = useState(false)
 const [image3,setImage3] = useState(false)
 const [image4,setImage4] = useState(false)
 const [imageUrls, setImageUrls] = useState([])
 const [imageUrlInput, setImageUrlInput] = useState('')

 const [name, setName] = useState('');
 const [description, setDescription] = useState('');
 const [price, setPrice] = useState('');
 const [category, setCategory] = useState(CATEGORIES[0]?.slug || 'ao-dai-truyen-thong');
 const [subCategory, setSubCategory] = useState('');
 const [bestseller, setBestseller] = useState(false);
 const [sizes, setSizes] = useState([]);
 const [subCategoryOptions, setSubCategoryOptions] = useState([]);
 const [discountType, setDiscountType] = useState('none');
 const [discountValue, setDiscountValue] = useState('');

 useEffect(() => {
  const loadSubCategories = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) {
        const values = (response.data.products || [])
          .map((p) => p?.subcategory)
          .filter(Boolean)
        const unique = Array.from(new Set(values))
        setSubCategoryOptions(unique)
        if (!subCategory && unique.length) {
          setSubCategory(unique[0])
        }
      }
    } catch (error) {
      // silent fallback
    }
  }
  loadSubCategories()
 },[])

 const onsubmitHandler = async (e) => {
   e.preventDefault();

   try {
    
   const selectedFiles = [image1, image2, image3, image4].filter(Boolean)
   if (imageUrls.length === 0 && selectedFiles.length === 0) {
    toast.error('Vui lòng thêm ít nhất 1 ảnh')
    return
   }

   const formData = new FormData()

   formData.append("name",name)
   formData.append("description",description)
   formData.append("price",price)
   formData.append("discountType", discountType)
   formData.append("discountValue", discountValue === '' ? 0 : discountValue)
   formData.append("category",category)
   formData.append("subcategory",subCategory)
   formData.append("bestseller",bestseller)
   formData.append("sizes",JSON.stringify(sizes))
   formData.append("existingImages", JSON.stringify(imageUrls))

  image1 && formData.append("image1",image1)
  image2 && formData.append("image2",image2)
  image3 && formData.append("image3",image3)
  image4 && formData.append("image4",image4)

  const response = await axios.post(backendUrl + '/api/product/add', formData, {headers:{token}})

  if(response.data.success) {
    toast.success('Đã thêm sản phẩm')
    setName('')
    setDescription('')
    setImage1(false)
    setImage2(false)
    setImage3(false)
    setImage4(false)
    setImageUrls([])
    setImageUrlInput('')
    setPrice('')
    setDiscountType('none')
    setDiscountValue('')
  } else {
    toast.error('Không thể thêm sản phẩm')
  }
  

   } catch (error) {
    console.log(error);
    toast.error(error.message)
    
   }
 }

 const addImageUrl = () => {
  const url = imageUrlInput.trim()
  if (!url) return
  if (!/^https?:\/\//i.test(url)) {
    toast.error('URL ảnh không hợp lệ')
    return
  }
  setImageUrls((prev) => (prev.includes(url) ? prev : [...prev, url]))
  setImageUrlInput('')
 }

 const removeImageUrl = (url) => {
  setImageUrls((prev) => prev.filter((x) => x !== url))
 }

 const clearFileSlot = (slot) => {
  if (slot === 1) setImage1(false)
  if (slot === 2) setImage2(false)
  if (slot === 3) setImage3(false)
  if (slot === 4) setImage4(false)
 }


  return (
    <form onSubmit={onsubmitHandler}  className='flex flex-col w-full items-start gap-3' >
      
    <div>
      <p className='mb-2'>Thêm ảnh bằng URL</p>
      <div className='flex gap-2 max-w-[500px] mb-3'>
        <input
          value={imageUrlInput}
          onChange={(e) => setImageUrlInput(e.target.value)}
          className='w-full px-3 py-2'
          type='text'
          placeholder='https://...'
        />
        <button type='button' onClick={addImageUrl} className='px-4 py-2 bg-black text-white'>
          Thêm
        </button>
      </div>

      {imageUrls.length > 0 ? (
        <div className='flex flex-wrap gap-2 mb-3'>
          {imageUrls.map((url) => (
            <div key={url} className='relative'>
              <img className='w-20 h-20 object-cover border rounded' src={url} alt='' />
              <button
                type='button'
                onClick={() => removeImageUrl(url)}
                className='absolute -top-2 -right-2 bg-black text-white w-6 h-6 rounded-full text-xs'
                aria-label='Xoá ảnh'
              >
                X
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <p className='mb-2'>Tải ảnh lên</p>


      <div className='flex gap-2' >
        <div className='relative'>
          <label htmlFor="image1">
            <img className='w-20' src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt="" />
            <input onChange={(e) =>setImage1(e.target.files[0]) }  type="file"  id="image1" hidden />
          </label>
          {image1 && (
            <button type='button' onClick={() => clearFileSlot(1)} className='absolute -top-2 -right-2 bg-black text-white w-6 h-6 rounded-full text-xs'>
              X
            </button>
          )}
        </div>
        <div className='relative'>
          <label htmlFor="image2">
            <img className='w-20' src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt="" />
            <input onChange={(e) =>setImage2(e.target.files[0]) } type="file"  id="image2" hidden />
          </label>
          {image2 && (
            <button type='button' onClick={() => clearFileSlot(2)} className='absolute -top-2 -right-2 bg-black text-white w-6 h-6 rounded-full text-xs'>
              X
            </button>
          )}
        </div>
        <div className='relative'>
          <label htmlFor="image3">
            <img className='w-20' src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt="" />
            <input onChange={(e) =>setImage3(e.target.files[0]) } type="file"  id="image3" hidden />
          </label>
          {image3 && (
            <button type='button' onClick={() => clearFileSlot(3)} className='absolute -top-2 -right-2 bg-black text-white w-6 h-6 rounded-full text-xs'>
              X
            </button>
          )}
        </div>
        <div className='relative'>
          <label htmlFor="image4">
            <img className='w-20' src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt="" />
            <input onChange={(e) =>setImage4(e.target.files[0]) } type="file"  id="image4" hidden />
          </label>
          {image4 && (
            <button type='button' onClick={() => clearFileSlot(4)} className='absolute -top-2 -right-2 bg-black text-white w-6 h-6 rounded-full text-xs'>
              X
            </button>
          )}
        </div>
      </div>
    </div>


    <div className='w-full' >
      <p className='mb-2' >Tên sản phẩm</p>
      <input onChange={(e) => setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='Nhập tại đây' required />
    </div>

    <div className='w-full' >
      <p className='mb-2' >Mô tả sản phẩm</p>
      <textarea onChange={(e) => setDescription(e.target.value)} value={description} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='Nhập mô tả tại đây' required />
    </div>

    <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8 '>

      <div>
        <p className='mb-2' >Danh mục</p>
        <select onChange={(e) => setCategory(e.target.value)} className='w-full px-3 py-2'>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <p className='mb-2' >Loại</p>
        <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)}  className='w-full px-3 py-2' >
          {subCategoryOptions.length > 0 ? (
            subCategoryOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))
          ) : (
            <>
              <option value="Topwear">Topwear</option>
              <option value="Bottomwear">Bottomwear</option>
              <option value="Winterwear">Winterwear</option>
            </>
          )}
        </select>
      </div>

      <div>
        <p className='mb-2' >Giá</p>
        <input onChange={(e) => setPrice(e.target.value)} value={price} className='w-full px-3 py-2 sm:w-[120px]'  type='Number' placeholder='25' />
      </div>

    </div>

    <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
      <div>
        <p className='mb-2'>Giảm giá</p>
        <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className='w-full px-3 py-2'>
          <option value='none'>Không</option>
          <option value='percentage'>Theo %</option>
          <option value='fixed'>Giảm số tiền</option>
        </select>
      </div>

      <div>
        <p className='mb-2'>Giá trị giảm</p>
        <input
          onChange={(e) => setDiscountValue(e.target.value)}
          value={discountValue}
          className='w-full px-3 py-2 sm:w-[160px]'
          type='Number'
          placeholder={discountType === 'percentage' ? '10' : '50000'}
          disabled={discountType === 'none'}
        />
        {price && discountType !== 'none' ? (
          <p className='text-xs text-gray-500 mt-1'>
            Giá sau giảm:{' '}
            {formatPrice(
              Math.max(
                0,
                discountType === 'percentage'
                  ? Math.round(Number(price) * (1 - Number(discountValue || 0) / 100))
                  : Number(price) - Number(discountValue || 0),
              ),
            )}
          </p>
        ) : null}
      </div>
    </div>


    <div>
      <p className='mb-2' >Kích cỡ</p>

      <div className='flex gap-3' >
        <div onClick={() => setSizes(prev => prev.includes('S') ? prev.filter(item => item !== 'S') : [...prev, 'S'] )}>
          <p className={`${sizes.includes('S') ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`} >S</p>
        </div>

        <div onClick={() => setSizes(prev => prev.includes('M') ? prev.filter(item => item !== 'M') : [...prev, 'M'] )} >
          <p className={`${sizes.includes('M') ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`} >M</p>
        </div>
        
        <div onClick={() => setSizes(prev => prev.includes('L') ? prev.filter(item => item !== 'L') : [...prev, 'L'])} >
          <p className={`${sizes.includes('L') ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`} >L</p>
        </div>        

        <div onClick={() => setSizes(prev => prev.includes('XL') ? prev.filter(item => item !== 'XL') : [...prev, 'XL'] )} >
          <p className={`${sizes.includes('XL') ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`} >XL</p>
        </div>

        <div onClick={() => setSizes(prev => prev.includes('XXL') ? prev.filter(item => item !== 'XXL') : [...prev, 'XXL'])} >
          <p className={`${sizes.includes('XXL') ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`}>XXL</p>
        </div>
      </div>

    </div>


    <div className='flex gap-2'>
      <input onChange={() => setBestseller(prev => !prev  )} checked={bestseller} type="checkbox" name="" id="bestseller" />
      <label className='cursor-pointer' htmlFor="bestseller">Đánh dấu bán chạy</label>
    </div>


    <button type='submit' className='w-28 py-3 mt-4 bg-black text-white cursor-pointer'>THÊM</button>
    </form>
  )
}

export default Add
