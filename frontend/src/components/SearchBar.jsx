import React, { useContext, useEffect, useRef, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchInput from './search/SearchInput';
import SearchDropdown from './search/SearchDropdown';
const SearchBar = () => {

   const {search, setSearch, backendUrl, showSearch, setShowSearch} = useContext(ShopContext);
   const navigate = useNavigate();

   const rootRef = useRef(null);
   const inputRef = useRef(null);
   const timerRef = useRef(null);
   const lastQueryRef = useRef('');

   const [open, setOpen] = useState(false);
   const [loading, setLoading] = useState(false);
   const [items, setItems] = useState([]);

   useEffect(() => {
    const onDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
   }, []);

   useEffect(() => {
    if (!showSearch) return;
    setOpen(true);
    const t = setTimeout(() => {
      inputRef.current?.focus?.();
    }, 0);
    return () => clearTimeout(t);
   }, [showSearch]);

   useEffect(() => {
    if (!showSearch) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowSearch(false);
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
   }, [showSearch, setShowSearch]);

   useEffect(() => {
    if (!open || !showSearch) return;

    const q = String(search || '').trim();
    if (!q) {
      setItems([]);
      setLoading(false);
      lastQueryRef.current = '';
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        lastQueryRef.current = q;
        const response = await axios.get(
          `${backendUrl}/api/product/list?compact=1&search=${encodeURIComponent(q)}&limit=6&page=1`,
        );
        if (response.data.success && lastQueryRef.current === q) {
          setItems(response.data.products || []);
        }
      } catch {
        if (lastQueryRef.current === q) setItems([]);
      } finally {
        if (lastQueryRef.current === q) setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
   }, [search, open, showSearch, backendUrl]);

   const onViewAll = () => {
    setOpen(false);
    setShowSearch(false);
    navigate('/collection');
   };

   const onSelectItem = (p) => {
    setOpen(false);
    setShowSearch(false);
    navigate(`/product/${p._id}`);
   };

   const close = () => {
    setShowSearch(false);
    setOpen(false);
   };

  if (!showSearch) return null;

  return (
    <div
      className='fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center px-4 pt-20 sm:pt-24'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className='w-full max-w-3xl'>
        <div
          ref={rootRef}
          className='relative bg-transparent animate-[fadeIn_180ms_ease-out]'
        >
          <div className='flex items-center gap-3'>
            <div className='flex-1'>
              <SearchInput
                inputRef={inputRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => (e.key === 'Enter' ? onViewAll() : null)}
                onClear={() => {
                  setSearch('');
                  setItems([]);
                  setOpen(true);
                }}
              />
            </div>
            <button
              type='button'
              onClick={close}
              className='h-11 sm:h-12 px-4 rounded-2xl bg-white/90 hover:bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors'
              aria-label='Đóng'
              title='Đóng'
            >
              Đóng
            </button>
          </div>

          <div className='relative'>
            <SearchDropdown
              open={open}
              loading={loading}
              query={String(search || '').trim()}
              items={items}
              onSelectItem={onSelectItem}
              onViewAll={onViewAll}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchBar
