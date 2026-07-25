import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import { toast } from 'react-toastify'

const Profile = () => {
  const { backendUrl, token, navigate } = useContext(ShopContext)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [addresses, setAddresses] = useState([])

  // Form thêm địa chỉ mới
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingAddr, setAddingAddr] = useState(false)
  const [newAddr, setNewAddr] = useState({
    receiverName: '',
    phone: '',
    addressLine: '',
    isDefault: false,
  })

  const onChangeProfile = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const onChangeNewAddr = (e) => {
    const { name, value, type, checked } = e.target
    setNewAddr((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const loadProfile = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    try {
      setLoading(true)
      const response = await axios.post(
        backendUrl + '/api/user/profile',
        {},
        { headers: { token } },
      )
      if (response.data.success) {
        setFormData({
          name: response.data.user?.name || '',
          email: response.data.user?.email || '',
        })
        setAddresses(response.data.user?.addresses || [])
      } else {
        toast.error(response.data.message || 'Không thể tải thông tin tài khoản')
      }
    } catch (error) {
      console.log(error)
      toast.error('Không thể tải thông tin tài khoản')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitProfile = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const response = await axios.post(
        backendUrl + '/api/user/update',
        formData,
        { headers: { token } },
      )
      if (response.data.success) {
        toast.success('Đã cập nhật thông tin')
        setFormData({
          name: response.data.user?.name || '',
          email: response.data.user?.email || '',
        })
      } else {
        toast.error(response.data.message || 'Không thể cập nhật thông tin')
      }
    } catch (error) {
      console.log(error)
      toast.error('Không thể cập nhật thông tin')
    } finally {
      setSaving(false)
    }
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    if (!newAddr.receiverName || !newAddr.phone || !newAddr.addressLine) {
      toast.error('Vui lòng nhập đầy đủ thông tin địa chỉ')
      return
    }
    try {
      setAddingAddr(true)
      const response = await axios.post(
        backendUrl + '/api/user/address/add',
        newAddr,
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success('Thêm địa chỉ mới thành công')
        setNewAddr({ receiverName: '', phone: '', addressLine: '', isDefault: false })
        setShowAddForm(false)
        loadProfile()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setAddingAddr(false)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return
    try {
      const response = await axios.post(
        backendUrl + '/api/user/address/delete',
        { addressId },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success('Đã xóa địa chỉ')
        loadProfile()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const handleSetDefault = async (addressId) => {
    try {
      const response = await axios.post(
        backendUrl + '/api/user/address/set-default',
        { addressId },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success('Đã đặt làm địa chỉ mặc định')
        loadProfile()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [token])

  if (loading) {
    return (
      <div className='border-t pt-16'>
        <p className='text-gray-500'>Đang tải thông tin tài khoản...</p>
      </div>
    )
  }

  return (
    <div className='border-t pt-10 sm:pt-16 pb-16'>
      <div className='text-2xl mb-8'>
        <Title text1={'TÀI'} text2={'KHOẢN'} />
      </div>

      <div className='flex flex-col lg:flex-row gap-8 items-start'>
        {/* Left Column: Personal Info Form */}
        <form onSubmit={onSubmitProfile} className='w-full lg:w-1/2 border border-gray-200 rounded-xl p-5 sm:p-6 bg-white shadow-sm'>
          <h3 className='text-lg font-semibold text-gray-800 mb-4 pb-2 border-b'>Thông tin cá nhân</h3>
          <div className='mb-4'>
            <p className='text-sm mb-1 text-gray-600'>Họ và tên</p>
            <input
              name='name'
              value={formData.name}
              onChange={onChangeProfile}
              type='text'
              className='w-full border px-3 py-2 rounded outline-none focus:border-black'
              placeholder='Nhập họ và tên'
              required
            />
          </div>

          <div className='mb-6'>
            <p className='text-sm mb-1 text-gray-600'>Email</p>
            <input
              name='email'
              value={formData.email}
              onChange={onChangeProfile}
              type='email'
              className='w-full border px-3 py-2 rounded outline-none focus:border-black'
              placeholder='Nhập email'
              required
            />
          </div>

          <button
            type='submit'
            disabled={saving}
            className='bg-black text-white px-6 py-2.5 rounded font-medium disabled:opacity-60 hover:bg-gray-800 transition-colors'
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>

        {/* Right Column: Address Management */}
        <div className='w-full lg:w-1/2 border border-gray-200 rounded-xl p-5 sm:p-6 bg-white shadow-sm'>
          <div className='flex justify-between items-center mb-4 pb-2 border-b'>
            <h3 className='text-lg font-semibold text-gray-800'>Sổ địa chỉ nhận hàng</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className='text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded transition-colors font-medium'
            >
              {showAddForm ? 'Hủy' : '+ Thêm địa chỉ mới'}
            </button>
          </div>

          {/* Add Address Form */}
          {showAddForm && (
            <form onSubmit={handleAddAddress} className='mb-6 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50'>
              <p className='font-medium text-sm text-gray-700 mb-3'>Thêm địa chỉ mới</p>
              <div className='flex gap-3 mb-3'>
                <input
                  name='receiverName'
                  value={newAddr.receiverName}
                  onChange={onChangeNewAddr}
                  className='w-1/2 border border-gray-300 rounded py-1.5 px-3 text-sm outline-none'
                  placeholder='Tên người nhận'
                  required
                />
                <input
                  name='phone'
                  value={newAddr.phone}
                  onChange={onChangeNewAddr}
                  className='w-1/2 border border-gray-300 rounded py-1.5 px-3 text-sm outline-none'
                  placeholder='Số điện thoại'
                  required
                />
              </div>
              <input
                name='addressLine'
                value={newAddr.addressLine}
                onChange={onChangeNewAddr}
                className='w-full border border-gray-300 rounded py-1.5 px-3 text-sm outline-none mb-3'
                placeholder='Địa chỉ chi tiết (Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành)'
                required
              />
              <div className='flex items-center gap-2 mb-4'>
                <input
                  type='checkbox'
                  id='isDefault'
                  name='isDefault'
                  checked={newAddr.isDefault}
                  onChange={onChangeNewAddr}
                  className='accent-black cursor-pointer'
                />
                <label htmlFor='isDefault' className='text-sm text-gray-600 cursor-pointer'>
                  Đặt làm địa chỉ mặc định
                </label>
              </div>
              <button
                type='submit'
                disabled={addingAddr}
                className='bg-black text-white px-4 py-1.5 rounded text-sm disabled:opacity-60'
              >
                {addingAddr ? 'Đang thêm...' : 'Lưu địa chỉ'}
              </button>
            </form>
          )}

          {/* Address List */}
          {addresses.length === 0 ? (
            <p className='text-gray-500 text-sm py-4'>Bạn chưa lưu địa chỉ giao hàng nào.</p>
          ) : (
            <div className='flex flex-col gap-3'>
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className={`p-3.5 border rounded-lg flex justify-between items-start ${
                    addr.isDefault ? 'border-black bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  <div className='pr-3'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='font-semibold text-gray-900 text-sm'>{addr.receiverName}</span>
                      <span className='text-gray-500 text-xs'>({addr.phone})</span>
                      {addr.isDefault && (
                        <span className='text-[10px] bg-black text-white px-2 py-0.5 rounded font-medium'>
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className='text-xs text-gray-600 leading-relaxed'>{addr.addressLine}</p>
                  </div>
                  <div className='flex flex-col items-end gap-1.5 shrink-0'>
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr._id)}
                        className='text-xs text-gray-500 hover:text-black underline'
                      >
                        Đặt mặc định
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(addr._id)}
                      className='text-xs text-red-500 hover:text-red-700'
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
