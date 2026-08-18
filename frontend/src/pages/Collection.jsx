import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import { useSearchParams } from 'react-router-dom';
import { CATEGORIES, SUBCATEGORIES, getCategoryLabel, normalizeCategorySlug } from '../constants/categories';
import axios from 'axios';

const Collection = () => {
  const { products, search, backendUrl, getFinalPrice } = useContext(ShopContext);
  const [searchParams] = useSearchParams();
  const initialCategoryParam = searchParams.get('category');
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState(initialCategoryParam ? [normalizeCategorySlug(initialCategoryParam)] : []);
  const [SubCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState('relavent');
  const searchTimerRef = useRef(null);
  const cacheRef = useRef(new Map());
  const inFlightKeyRef = useRef('');
  const didInitRef = useRef(false);

  const subCategoryOptions = useMemo(() => {
    const dynamic = products
      .map((p) => p?.subcategory)
      .filter((v) => v && v !== 'Mặc định');
    const combined = [...SUBCATEGORIES, ...dynamic];
    return Array.from(new Set(combined));
  }, [products]);

  const toggleCategory = (e) => {
    const value = e.target.value;
    if (category.includes(value)) {
      setCategory((prev) => prev.filter((item) => item !== value));
    } else {
      setCategory((prev) => [...prev, value]);
    }
  };

  const toggleSubCategory = (e) => {
    const value = e.target.value;
    if (SubCategory.includes(value)) {
      setSubCategory((prev) => prev.filter((item) => item !== value));
    } else {
      setSubCategory((prev) => [...prev, value]);
    }
  };

  const fetchProducts = async ({ nextPage } = {}) => {
    const currentPage = nextPage ?? page;
    const sortMap = {
      relavent: 'newest',
      'low-high': 'price_asc',
      'high-low': 'price_desc',
    };
    const sort = sortMap[sortType] || 'newest';

    const params = new URLSearchParams();
    params.set('compact', '1');
    params.set('page', String(currentPage));
    params.set('limit', '12');
    params.set('sort', sort);

    const q = String(search || '').trim();
    if (q) params.set('search', q);

    if (category.length) params.set('category', category.join(','));
    if (SubCategory.length) params.set('subcategory', SubCategory.join(','));

    const key = params.toString();
    const cached = cacheRef.current.get(key);
    if (cached) {
      setFilterProducts(cached.products);
      setPagination(cached.pagination);
      return;
    }

    if (inFlightKeyRef.current === key) {
      return;
    }
    inFlightKeyRef.current = key;

    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/product/list?${params.toString()}`);
      if (response.data.success) {
        const next = {
          products: response.data.products || [],
          pagination: response.data.pagination || { page: currentPage, limit: 12, total: 0, totalPages: 1 },
        };
        cacheRef.current.set(key, next);
        setFilterProducts(next.products);
        setPagination(next.pagination);
      }
    } catch {
      // fallback to local list if API fails
      let productsCopy = products.slice();
      if (q) productsCopy = productsCopy.filter((item) => item.name?.toLowerCase?.().includes(q.toLowerCase()));
      if (category.length) {
        productsCopy = productsCopy.filter((item) => {
          const itemSlug = normalizeCategorySlug(item.category);
          return category.includes(itemSlug) || category.includes(item.category);
        });
      }
      if (SubCategory.length) {
        productsCopy = productsCopy.filter((item) => SubCategory.includes(item.subcategory));
      }

      if (sortType === 'low-high') {
        productsCopy.sort((a, b) => (getFinalPrice ? getFinalPrice(a) - getFinalPrice(b) : (a.price || 0) - (b.price || 0)));
      } else if (sortType === 'high-low') {
        productsCopy.sort((a, b) => (getFinalPrice ? getFinalPrice(b) - getFinalPrice(a) : (b.price || 0) - (a.price || 0)));
      } else {
        productsCopy.sort((a, b) => (b.date || 0) - (a.date || 0));
      }

      setFilterProducts(productsCopy.slice(0, 48));
      setPagination({ page: 1, limit: 48, total: productsCopy.length, totalPages: 1 });
    } finally {
      setLoading(false);
      if (inFlightKeyRef.current === key) inFlightKeyRef.current = '';
    }
  };

  useEffect(() => {
    // Initial load
    if (didInitRef.current) return;
    didInitRef.current = true;
    fetchProducts({ nextPage: 1 });
    setPage(1);
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPage(1);
      fetchProducts({ nextPage: 1 });
    }, 350);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search, category, SubCategory, sortType, backendUrl]);

  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t'>
      {/* filter Options */}
      <div className='min-w-60'>
        <p onClick={() => setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2'>
          BỘ LỌC
          <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt="" />
        </p>

        {/* Category Filter */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>DANH MỤC</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            {CATEGORIES.map((c) => (
              <p className='flex gap-2' key={c.slug}>
                <input
                  className='w-3 cursor-pointer'
                  type='checkbox'
                  value={c.slug}
                  checked={category.includes(c.slug)}
                  onChange={toggleCategory}
                />
                <span className='cursor-pointer' onClick={() => toggleCategory({ target: { value: c.slug } })}>
                  {c.label}
                </span>
              </p>
            ))}
          </div>
        </div>

        {/* Sub Category Filter */}
        <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>LOẠI</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            {subCategoryOptions.map((v) => (
              <p className='flex gap-2' key={v}>
                <input
                  className='w-3 cursor-pointer'
                  type='checkbox'
                  value={v}
                  checked={SubCategory.includes(v)}
                  onChange={toggleSubCategory}
                />
                <span className='cursor-pointer' onClick={() => toggleSubCategory({ target: { value: v } })}>
                  {v}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className='flex-1'>
        <div className='flex justify-between text-base sm:text-2xl mb-4'>
          <Title text1={'TẤT CẢ'} text2={'BỘ SƯU TẬP'} />

          {/* Product Sort */}
          <select onChange={(e) => setSortType(e.target.value)} className='border-2 border-gray-300 text-sm px-2'>
            <option value='relavent'>Sắp xếp: Liên quan</option>
            <option value='low-high'>Sắp xếp: Giá tăng dần</option>
            <option value='high-low'>Sắp xếp: Giá giảm dần</option>
          </select>
        </div>

        {/* Breadcrumb */}
        <p className='text-sm text-gray-500 mb-4'>
          Trang chủ / Bộ sưu tập
          {category.length > 0 ? ` / ${category.map(getCategoryLabel).join(', ')}` : ''}
          {SubCategory.length > 0 ? ` (${SubCategory.join(', ')})` : ''}
        </p>

        {/* Map Products */}
        {loading ? (
          <div className='py-12 text-center text-gray-400 text-sm'>Đang tải sản phẩm...</div>
        ) : filterProducts.length === 0 ? (
          <div className='py-12 text-center text-gray-400 text-sm'>Không tìm thấy sản phẩm phù hợp.</div>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
            {filterProducts.map((item, index) => (
              <ProductItem
                key={item._id || index}
                name={item.name}
                id={item._id}
                price={item.price}
                discountType={item.discountType}
                discountValue={item.discountValue}
                image={item.image}
              />
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className='flex items-center justify-between mt-8'>
            <button
              type='button'
              onClick={() => {
                const next = Math.max(1, page - 1);
                setPage(next);
                fetchProducts({ nextPage: next });
              }}
              disabled={page <= 1 || loading}
              className='px-4 py-2 border rounded disabled:opacity-50 cursor-pointer'
            >
              Trước
            </button>
            <p className='text-sm text-gray-500'>
              Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} sản phẩm)
            </p>
            <button
              type='button'
              onClick={() => {
                const next = Math.min(pagination.totalPages || 1, page + 1);
                setPage(next);
                fetchProducts({ nextPage: next });
              }}
              disabled={page >= (pagination.totalPages || 1) || loading}
              className='px-4 py-2 border rounded disabled:opacity-50 cursor-pointer'
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;
