import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import { useSearchParams } from 'react-router-dom';
import { CATEGORIES, getCategoryLabel, normalizeCategorySlug } from '../constants/categories';
import axios from 'axios';
const Collection = () => {
  

  const {products, search, showSearch, backendUrl, getFinalPrice } = useContext(ShopContext);
  const [searchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [searchBaseProducts, setSearchBaseProducts] = useState(null);
  const [category, setCategory] = useState([]);
  const [SubCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState('relavent');
  const searchTimerRef = useRef(null);

  const subCategoryOptions = useMemo(() => {
    const values = products.map((p) => p?.subcategory).filter(Boolean)
    return Array.from(new Set(values))
  }, [products])

  const toggleCategory = (e) => {

    if (category.includes(e.target.value)){
      
      setCategory(prev => prev.filter(item => item !== e.target.value));
    }
    else{
      setCategory(prev => [...prev, e.target.value]);

    }
  
  }

  const toggleSubCategory = (e) => {
  
    if(SubCategory.includes(e.target.value)){
      setSubCategory(prev => prev.filter(item => item !== e.target.value));
    }
    else{
      setSubCategory(prev => [...prev,e.target.value]);
    }
  }

  const applyFilter = () => {
    let productsCopy = (showSearch && search && Array.isArray(searchBaseProducts))
      ? searchBaseProducts.slice()
      : products.slice();

    if(category.length > 0){
      productsCopy = productsCopy.filter((item) =>
        category.includes(normalizeCategorySlug(item.category))
      );
    }

    if(SubCategory.length > 0){
      productsCopy =  productsCopy.filter(item => SubCategory.includes(item.subcategory));
    }

    setFilterProducts(productsCopy);
  }


  const sortProducts = () => {
     let fpCopy = filterProducts.slice();

     switch (sortType) {
      case 'low-high':
        setFilterProducts(fpCopy.sort((a,b) => (getFinalPrice(a) - getFinalPrice(b))));
        break;

        case 'high-low':
          setFilterProducts(fpCopy.sort((a,b) => (getFinalPrice(b) - getFinalPrice(a))));
          break;

        default:
          applyFilter();
          break; 

     }
  }


  useEffect(() => {
    setFilterProducts(products);
  },[])

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) setCategory([categoryParam]);
  }, [searchParams]);

  useEffect(() => {
    // Debounced API search (350ms) when user is searching
    if (showSearch && search) {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      searchTimerRef.current = setTimeout(async () => {
        try {
          const response = await axios.get(
            `${backendUrl}/api/product/list?search=${encodeURIComponent(search)}&limit=60`,
          )
          if (response.data.success) {
            setSearchBaseProducts(response.data.products || [])
          } else {
            setSearchBaseProducts(null)
          }
        } catch {
          setSearchBaseProducts(null)
        }
      }, 350)
    } else {
      setSearchBaseProducts(null)
    }

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [showSearch, search, backendUrl])

  useEffect(() => {
    applyFilter()
  }, [category, SubCategory, products, showSearch, search, searchBaseProducts])


  useEffect(() => {
    sortProducts();
  },[sortType])

  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t' >
        
      {/* filter Options */}
      <div className='min-w-60'>
         <p onClick={() => setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2'>BỘ LỌC
          <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt="" />
         </p>

         {/* Category Filter */}

         <div className={`border border-gray-300  pl-5 py-3 mt-6 ${showFilter ? '' : 'hidden'} sm:block`}>
           <p className='mb-3 text-sm font-medium'>DANH MỤC</p>
           <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            {CATEGORIES.map((c) => (
              <p className='flex gap-2' key={c.slug}>
                <input className='w-3' type='checkbox' value={c.slug} onChange={toggleCategory} />
                {c.label}
              </p>
            ))}
           </div>
         </div>

        {/* Sub Category Filter */}
        <div className={`border border-gray-300  pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} sm:block`}>
           <p className='mb-3 text-sm font-medium'>LOẠI</p>
           <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            {subCategoryOptions.length > 0 ? (
              subCategoryOptions.map((v) => (
                <p className='flex gap-2' key={v}>
                  <input className='w-3' type='checkbox' value={v} onChange={toggleSubCategory} />
                  {v}
                </p>
              ))
            ) : (
              <>
                <p className='flex gap-2'>
                  <input className='w-3' type='checkbox' value={"Topwear"} onChange={toggleSubCategory} />Topwear
                </p>
                <p className='flex gap-2'>
                  <input className='w-3' type='checkbox' value={"Bottomwear"} onChange={toggleSubCategory} />Bottomwear
                </p>
                <p className='flex gap-2'>
                  <input className='w-3' type='checkbox' value={"Winterwear"} onChange={toggleSubCategory} />Winterwear
                </p>
              </>
            )}
           </div>
         </div>


      </div>

      {/* Right Side */}
      <div className='flex-1' >
        <div className='flex justify-between text-base sm:text-2xl mb-4'>
          <Title text1={'TẤT CẢ'} text2={'BỘ SƯU TẬP'} />
           
           {/* Product Sort */}

           <select onChange={(e) => setSortType(e.target.value)}  className='border-2 border-gray-300 text-sm px-2'>
            <option value='relavent' >Sắp xếp: Liên quan</option>
            <option value='low-high' >Sắp xếp: Giá tăng dần</option>
            <option value='high-low' >Sắp xếp: Giá giảm dần</option>
           </select>
        </div>

        {/* Breadcrumb (tối giản, tập trung danh mục) */}
        <p className='text-sm text-gray-500 mb-4'>
          Trang chủ / Bộ sưu tập
          {category.length > 0 ? ` / ${category.map(getCategoryLabel).join(', ')}` : ''}
        </p>

        {/* Map Products */}
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
           {
            filterProducts.map((item, index) => (
              <ProductItem
                key={index}
                name={item.name}
                id={item._id}
                price={item.price}
                discountType={item.discountType}
                discountValue={item.discountValue}
                image={item.image}
              />
            ))
           }  
        </div>
      </div>

    </div>
  )
}

export default Collection
