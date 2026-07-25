import React, { useContext, useEffect, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const PlaceOrder = () => {
  const [method, setMothod] = useState('Cash On Delivery')
  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products, getFinalPrice } = useContext(ShopContext)

  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('new') // 'new' or addressId

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: '',
  })

  // Load user saved addresses if logged in
  const loadSavedAddresses = async () => {
    if (!token) return
    try {
      const response = await axios.post(
        backendUrl + '/api/user/address/list',
        {},
        { headers: { token } }
      )
      if (response.data.success && response.data.addresses.length > 0) {
        setSavedAddresses(response.data.addresses)
        // Select default address if exists
        const defaultAddr = response.data.addresses.find((a) => a.isDefault) || response.data.addresses[0]
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id)
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    loadSavedAddresses()
  }, [token])

  const onChangeHandler = (event) => {
    const name = event.target.name
    const value = event.target.value
    setFormData((data) => ({ ...data, [name]: value }))
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      let orderItems = []

      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(products.find((product) => product._id === items))
            if (itemInfo) {
              itemInfo.size = item
              itemInfo.quantity = cartItems[items][item]
              itemInfo.price = getFinalPrice(itemInfo)
              orderItems.push(itemInfo)
            }
          }
        }
      }

      if (orderItems.length === 0) {
        toast.error('Giỏ hàng của bạn đang trống')
        return
      }

      // Determine final address payload
      let finalAddress = {}
      if (selectedAddressId !== 'new') {
        const selected = savedAddresses.find((a) => a._id === selectedAddressId)
        if (selected) {
          finalAddress = {
            receiverName: selected.receiverName,
            phone: selected.phone,
            street: selected.addressLine,
          }
        }
      } else {
        finalAddress = formData
      }

      let orderData = {
        address: finalAddress,
        items: orderItems,
        amount: getCartAmount() + delivery_fee,
      }

      switch (method) {
        case 'Cash On Delivery': {
          const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } })
          if (response.data.success) {
            setCartItems({})
            toast.success('Đặt hàng thành công!')
            navigate('/orders')
          } else {
            toast.error(response.data.message)
          }
          break
        }
        default:
          break
      }
    } catch (error) {
      console.log(error)
      toast.error('Có lỗi xảy ra khi đặt hàng')
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
      {/* -------------- Left Side ----------------- */}
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
        <div className='text-xl sm:text-2xl my-3'>
          <Title text1={'THÔNG TIN'} text2={'GIAO HÀNG'} />
        </div>

        {/* Saved Address Selector */}
        {savedAddresses.length > 0 && (
          <div className='mb-4 p-4 border rounded-xl bg-gray-50 flex flex-col gap-3'>
            <p className='font-semibold text-sm text-gray-800 mb-1'>Chọn địa chỉ giao hàng:</p>
            {savedAddresses.map((addr) => (
              <label
                key={addr._id}
                onClick={() => setSelectedAddressId(addr._id)}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedAddressId === addr._id ? 'border-black bg-white shadow-sm' : 'border-gray-200 bg-gray-50 hover:bg-white'
                }`}
              >
                <input
                  type='radio'
                  name='addressSelect'
                  checked={selectedAddressId === addr._id}
                  onChange={() => setSelectedAddressId(addr._id)}
                  className='mt-1 accent-black'
                />
                <div className='text-xs text-gray-700 leading-relaxed'>
                  <div className='flex items-center gap-2 mb-0.5'>
                    <span className='font-semibold text-gray-900 text-sm'>{addr.receiverName}</span>
                    <span className='text-gray-500'>({addr.phone})</span>
                    {addr.isDefault && (
                      <span className='text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-medium'>Mặc định</span>
                    )}
                  </div>
                  <p>{addr.addressLine}</p>
                </div>
              </label>
            ))}

            {/* Option for new address */}
            <label
              onClick={() => setSelectedAddressId('new')}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                selectedAddressId === 'new' ? 'border-black bg-white shadow-sm' : 'border-gray-200 bg-gray-50 hover:bg-white'
              }`}
            >
              <input
                type='radio'
                name='addressSelect'
                checked={selectedAddressId === 'new'}
                onChange={() => setSelectedAddressId('new')}
                className='accent-black'
              />
              <span className='text-xs font-medium text-gray-800'>+ Thêm / Nhập địa chỉ mới</span>
            </label>
          </div>
        )}

        {/* New Address Form Inputs (Show when no saved addresses OR 'new' selected) */}
        {(savedAddresses.length === 0 || selectedAddressId === 'new') && (
          <div className='flex flex-col gap-4'>
            <div className='flex gap-3'>
              <input
                required={selectedAddressId === 'new'}
                onChange={onChangeHandler}
                name='firstName'
                value={formData.firstName}
                className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                type='text'
                placeholder='Tên'
              />
              <input
                required={selectedAddressId === 'new'}
                onChange={onChangeHandler}
                name='lastName'
                value={formData.lastName}
                className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                type='text'
                placeholder='Họ'
              />
            </div>
            <input
              required={selectedAddressId === 'new'}
              onChange={onChangeHandler}
              name='email'
              value={formData.email}
              className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
              type='email'
              placeholder='Email'
            />
            <input
              required={selectedAddressId === 'new'}
              onChange={onChangeHandler}
              name='street'
              value={formData.street}
              className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
              type='text'
              placeholder='Địa chỉ'
            />
            <div className='flex gap-3'>
              <input
                required={selectedAddressId === 'new'}
                onChange={onChangeHandler}
                name='city'
                value={formData.city}
                className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                type='text'
                placeholder='Thành phố'
              />
              <input
                required={selectedAddressId === 'new'}
                onChange={onChangeHandler}
                name='state'
                value={formData.state}
                className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                type='text'
                placeholder='Tỉnh/Thành'
              />
            </div>
            <div className='flex gap-3'>
              <input
                required={selectedAddressId === 'new'}
                onChange={onChangeHandler}
                name='zipcode'
                value={formData.zipcode}
                className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                type='number'
                placeholder='Mã bưu chính'
              />
              <input
                required={selectedAddressId === 'new'}
                onChange={onChangeHandler}
                name='country'
                value={formData.country}
                className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
                type='text'
                placeholder='Quốc gia'
              />
            </div>
            <input
              required={selectedAddressId === 'new'}
              onChange={onChangeHandler}
              name='phone'
              value={formData.phone}
              className='border border-gray-300 rounded py-1.5 px-3.5 w-full'
              type='number'
              placeholder='Số điện thoại'
            />
          </div>
        )}
      </div>

      {/* -------------- Right Side ----------------- */}
      <div className='mt-8'>
        <div className='mt-8 min-w-80'>
          <CartTotal />
        </div>

        <div className='mt-12'>
          <Title text1={'PHƯƠNG THỨC'} text2={'THANH TOÁN'} />
          {/* ----------------- Payment Method Selection ---------------- */}
          <div className='flex gap-3 flex-col lg:flex-row'>
            <div onClick={() => setMothod('Cash On Delivery')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'Cash On Delivery' ? 'bg-green-400' : ''}`}></p>
              <p className='text-gray-500 text-sm font-medium mx-4'>THANH TOÁN KHI NHẬN HÀNG</p>
            </div>
          </div>

          <div className='w-full text-end mt-8'>
            <button type='submit' className='bg-black text-white px-16 py-3 hover:bg-gray-800 transition-colors'>
              ĐẶT HÀNG
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default PlaceOrder
