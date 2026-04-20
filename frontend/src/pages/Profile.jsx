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

  const onChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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

  const onSubmit = async (e) => {
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
    <div className='border-t pt-16'>
      <div className='text-2xl mb-6'>
        <Title text1={'TÀI'} text2={'KHOẢN'} />
      </div>

      <form onSubmit={onSubmit} className='max-w-[560px] border border-gray-200 rounded-xl p-5 sm:p-6 bg-white'>
        <div className='mb-4'>
          <p className='text-sm mb-1 text-gray-600'>Họ và tên</p>
          <input
            name='name'
            value={formData.name}
            onChange={onChange}
            type='text'
            className='w-full border px-3 py-2 rounded outline-none'
            placeholder='Nhập họ và tên'
            required
          />
        </div>

        <div className='mb-5'>
          <p className='text-sm mb-1 text-gray-600'>Email</p>
          <input
            name='email'
            value={formData.email}
            onChange={onChange}
            type='email'
            className='w-full border px-3 py-2 rounded outline-none'
            placeholder='Nhập email'
            required
          />
        </div>

        <button
          type='submit'
          disabled={saving}
          className='bg-black text-white px-6 py-2 rounded disabled:opacity-60'
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  )
}

export default Profile

