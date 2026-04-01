import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl, formatPrice } from '../App'
import { toast } from 'react-toastify'
import { CATEGORIES, getCategoryLabel } from '../constants/categories'

const Edit = ({ token }) => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)

  const [imageUrls, setImageUrls] = useState([])
  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)
  const [imageUrlInput, setImageUrlInput] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [discountType, setDiscountType] = useState('none')
  const [discountValue, setDiscountValue] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0]?.slug || 'ao-dai-truyen-thong')
  const [subCategory, setSubCategory] = useState('')
  const [subCategoryOptions, setSubCategoryOptions] = useState([])
  const [bestseller, setBestseller] = useState(false)
  const [sizes, setSizes] = useState([])

  const categoryOptions = useMemo(() => {
    const has = CATEGORIES.some((c) => c.slug === category)
    if (has || !category) return CATEGORIES
    return [{ slug: category, label: getCategoryLabel(category) }, ...CATEGORIES]
  }, [category])

  const filePreviews = useMemo(() => {
    const files = [image1, image2, image3, image4].filter(Boolean)
    return files.map((f) => ({ file: f, url: URL.createObjectURL(f) }))
  }, [image1, image2, image3, image4])

  useEffect(() => {
    return () => {
      filePreviews.forEach((p) => URL.revokeObjectURL(p.url))
    }
  }, [filePreviews])

  const loadProduct = async () => {
    try {
      setLoading(true)
      const response = await axios.post(backendUrl + '/api/product/single', { productId: id })
      if (!response.data.success) {
        toast.error(response.data.message || 'Không thể tải sản phẩm')
        return
      }
      const p = response.data.product
      setName(p?.name || '')
      setDescription(p?.description || '')
      setPrice(String(p?.price ?? ''))
      setDiscountType(p?.discountType || 'none')
      setDiscountValue(p?.discountValue !== undefined && p?.discountValue !== null ? String(p.discountValue) : '')
      setCategory(p?.category || (CATEGORIES[0]?.slug || 'ao-dai-truyen-thong'))
      setSubCategory(p?.subcategory || '')
      setBestseller(Boolean(p?.bestseller))
      setSizes(Array.isArray(p?.sizes) ? p.sizes : [])
      setImageUrls(Array.isArray(p?.image) ? p.image : [])
    } catch (error) {
      console.log(error)
      toast.error('Không thể tải sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProduct()
  }, [id])

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
        }
      } catch (error) {
        // silent fallback
      }
    }
    loadSubCategories()
  }, [])

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

  const onsubmitHandler = async (e) => {
    e.preventDefault()
    try {
      const selectedFiles = [image1, image2, image3, image4].filter(Boolean)
      if (imageUrls.length === 0 && selectedFiles.length === 0) {
        toast.error('Vui lòng thêm ít nhất 1 ảnh')
        return
      }

      const formData = new FormData()
      formData.append('id', id)
      formData.append('name', name)
      formData.append('description', description)
      formData.append('price', price)
      formData.append('discountType', discountType)
      formData.append('discountValue', discountValue === '' ? 0 : discountValue)
      formData.append('category', category)
      formData.append('subcategory', subCategory)
      formData.append('bestseller', bestseller)
      formData.append('sizes', JSON.stringify(sizes))
      formData.append('existingImages', JSON.stringify(imageUrls))

      image1 && formData.append('image1', image1)
      image2 && formData.append('image2', image2)
      image3 && formData.append('image3', image3)
      image4 && formData.append('image4', image4)

      const response = await axios.put(backendUrl + '/api/product/update', formData, { headers: { token } })
      if (response.data.success) {
        toast.success('Đã cập nhật sản phẩm')
        navigate('/list')
      } else {
        toast.error(response.data.message || 'Không thể cập nhật sản phẩm')
      }
    } catch (error) {
      console.log(error)
      toast.error('Không thể cập nhật sản phẩm')
    }
  }

  if (loading) {
    return <p>Đang tải...</p>
  }

  return (
    <form onSubmit={onsubmitHandler} className='flex flex-col w-full items-start gap-3'>
      <p className='text-lg font-medium'>Chỉnh sửa sản phẩm</p>

      <div className='w-full'>
        <p className='mb-2'>Ảnh hiện tại</p>
        {imageUrls.length === 0 ? (
          <p className='text-sm text-gray-500'>Chưa có ảnh</p>
        ) : (
          <div className='flex flex-wrap gap-2'>
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
        )}
      </div>

      <div className='w-full'>
        <p className='mb-2'>Thêm ảnh bằng URL</p>
        <div className='flex gap-2 max-w-[500px]'>
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
      </div>

      <div>
        <p className='mb-2'>Tải ảnh lên (tối đa 4 ảnh)</p>
        <div className='flex gap-2 flex-wrap'>
          <div className='relative'>
            <label htmlFor='image1'>
              <img className='w-20' src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt='' />
              <input onChange={(e) => setImage1(e.target.files[0])} type='file' id='image1' hidden />
            </label>
            {image1 && (
              <button type='button' onClick={() => clearFileSlot(1)} className='absolute -top-2 -right-2 bg-black text-white w-6 h-6 rounded-full text-xs'>
                X
              </button>
            )}
          </div>
          <div className='relative'>
            <label htmlFor='image2'>
              <img className='w-20' src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt='' />
              <input onChange={(e) => setImage2(e.target.files[0])} type='file' id='image2' hidden />
            </label>
            {image2 && (
              <button type='button' onClick={() => clearFileSlot(2)} className='absolute -top-2 -right-2 bg-black text-white w-6 h-6 rounded-full text-xs'>
                X
              </button>
            )}
          </div>
          <div className='relative'>
            <label htmlFor='image3'>
              <img className='w-20' src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt='' />
              <input onChange={(e) => setImage3(e.target.files[0])} type='file' id='image3' hidden />
            </label>
            {image3 && (
              <button type='button' onClick={() => clearFileSlot(3)} className='absolute -top-2 -right-2 bg-black text-white w-6 h-6 rounded-full text-xs'>
                X
              </button>
            )}
          </div>
          <div className='relative'>
            <label htmlFor='image4'>
              <img className='w-20' src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt='' />
              <input onChange={(e) => setImage4(e.target.files[0])} type='file' id='image4' hidden />
            </label>
            {image4 && (
              <button type='button' onClick={() => clearFileSlot(4)} className='absolute -top-2 -right-2 bg-black text-white w-6 h-6 rounded-full text-xs'>
                X
              </button>
            )}
          </div>
        </div>
      </div>

      <div className='w-full'>
        <p className='mb-2'>Tên sản phẩm</p>
        <input onChange={(e) => setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2' type='text' placeholder='Nhập tại đây' required />
      </div>

      <div className='w-full'>
        <p className='mb-2'>Mô tả sản phẩm</p>
        <textarea onChange={(e) => setDescription(e.target.value)} value={description} className='w-full max-w-[500px] px-3 py-2' type='text' placeholder='Nhập mô tả tại đây' required />
      </div>

      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2'>Danh mục</p>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className='w-full px-3 py-2'>
            {categoryOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className='mb-2'>Loại</p>
          <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className='w-full px-3 py-2'>
            {subCategoryOptions.length > 0 ? (
              subCategoryOptions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))
            ) : (
              <>
                <option value='Topwear'>Topwear</option>
                <option value='Bottomwear'>Bottomwear</option>
                <option value='Winterwear'>Winterwear</option>
              </>
            )}
          </select>
        </div>

        <div>
          <p className='mb-2'>Giá</p>
          <input onChange={(e) => setPrice(e.target.value)} value={price} className='w-full px-3 py-2 sm:w-[160px]' type='Number' placeholder='300000' />
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
        <p className='mb-2'>Kích cỡ</p>
        <div className='flex gap-3 flex-wrap'>
          {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
            <div key={s} onClick={() => setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))}>
              <p className={`${sizes.includes(s) ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className='flex gap-2'>
        <input onChange={() => setBestseller((prev) => !prev)} checked={bestseller} type='checkbox' id='bestseller' />
        <label className='cursor-pointer' htmlFor='bestseller'>
          Đánh dấu bán chạy
        </label>
      </div>

      <div className='flex gap-2'>
        <button type='button' onClick={() => navigate('/list')} className='w-28 py-3 mt-4 bg-gray-200 text-black cursor-pointer'>
          Huỷ
        </button>
        <button type='submit' className='w-40 py-3 mt-4 bg-black text-white cursor-pointer'>
          Lưu thay đổi
        </button>
      </div>
    </form>
  )
}

export default Edit

