import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js'
import mongoose from 'mongoose'


// function for add product
const addProduct = async (req, res) => {
    try {        
      const { name, description, category, price, subcategory, bestseller, sizes, discountType, discountValue } = req.body

      const existingImages = req.body.existingImages
        ? JSON.parse(req.body.existingImages)
        : []

      const image1 = req.files?.image1 && req.files.image1[0]
      const image2 = req.files?.image2 && req.files.image2[0]
      const image3 = req.files?.image3 && req.files.image3[0]
      const image4 = req.files?.image4 && req.files.image4[0]

      const  images = [image1, image2, image3, image4].filter((item) => item !== undefined )

      const imagesUrl = await Promise.all(
        images.map(async (item) => {
          let result = await cloudinary.uploader.upload(item.path, {resource_type: 'image'});
          return result.secure_url
        })
      );
     

      const finalImages = [...(Array.isArray(existingImages) ? existingImages : []), ...imagesUrl].filter(Boolean)
      if (!finalImages.length) {
        return res.json({ success: false, message: 'Sản phẩm phải có ít nhất 1 ảnh' })
      }

      const productData = {
        name,
        description,
        category,
        price: Number(price),
        discountType: discountType || 'none',
        discountValue: discountValue !== undefined ? Number(discountValue) : 0,
        subcategory,
        bestseller: bestseller === "true" ? true : false,
        sizes: JSON.parse(sizes),
        image: finalImages,
        date: Date.now()
      }


      const product = new productModel(productData);
      await product.save()

      res.json({ success: true, message: 'Thêm sản phẩm thành công' });
      
    } catch (error) {
      console.log(error);
      res.json({success:false, message: error.message})
    }
 
}


// function for List product
const listProducts = async (req, res) => {
  try {
    const { search, limit, page, category, subcategory, sort, compact } = req.query

    const query = {}
    if (search) {
      const re = new RegExp(String(search).trim(), 'i')
      query.$or = [{ name: re }, { description: re }]
    }

    if (category) {
      const categories = String(category)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (categories.length) query.category = { $in: categories }
    }

    if (subcategory) {
      const subcategories = String(subcategory)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (subcategories.length) query.subcategory = { $in: subcategories }
    }

    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.min(Math.max(1, Number(limit) || 60), 100)
    const skipNum = (pageNum - 1) * limitNum

    const isCompact = String(compact || '') === '1' || String(compact || '') === 'true'

    const projection = isCompact
      ? {
          name: 1,
          price: 1,
          discountType: 1,
          discountValue: 1,
          bestseller: 1,
          category: 1,
          subcategory: 1,
          image: { $slice: 1 },
          date: 1,
        }
      : undefined

    let q = productModel.find(query, projection)

    // sort
    if (sort === 'price_asc') q = q.sort({ price: 1 })
    else if (sort === 'price_desc') q = q.sort({ price: -1 })
    else if (sort === 'newest') q = q.sort({ date: -1 })
    else q = q.sort({ date: -1 })

    q = q.skip(skipNum).limit(limitNum)

    const [products, total] = await Promise.all([q.lean(), productModel.countDocuments(query)])

    res.json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }
}



// function for removing product
const removeProduct = async (req,res) => {
   try {
    await productModel.findByIdAndDelete(req.body.id)
    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
   } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }
}




// function for single product info
const singleProduct = async (req,res) => {
  try {  
    const {productId} = req.body
    const product = await productModel.findById(productId)
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }
}

// GET /api/product/:id (detail)
const productDetail = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: 'ID sản phẩm không hợp lệ' })
    }
    const product = await productModel.findById(id).lean()
    if (!product) {
      return res.json({ success: false, message: 'Không tìm thấy sản phẩm' })
    }
    res.json({ success: true, product })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// GET /api/product/:id/related?limit=8
const relatedProducts = async (req, res) => {
  try {
    const { id } = req.params
    const limit = Math.min(Number(req.query.limit) || 8, 12)
    const isCompact = String(req.query.compact || '') === '1' || String(req.query.compact || '') === 'true'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: 'ID sản phẩm không hợp lệ' })
    }

    const product = await productModel.findById(id).lean()
    if (!product) {
      return res.json({ success: false, message: 'Không tìm thấy sản phẩm' })
    }

    const projection = isCompact
      ? {
          name: 1,
          price: 1,
          discountType: 1,
          discountValue: 1,
          category: 1,
          subcategory: 1,
          image: { $slice: 1 },
          date: 1,
        }
      : undefined

    const primary = await productModel
      .find({ _id: { $ne: id }, category: product.category }, projection)
      .sort({ date: -1 })
      .limit(limit)
      .lean()

    if (primary.length >= limit) {
      return res.json({ success: true, products: primary })
    }

    const remaining = limit - primary.length
    const excludeIds = [id, ...primary.map((p) => String(p._id))]

    const fallback = await productModel
      .aggregate([
        { $match: { _id: { $nin: excludeIds.map((x) => new mongoose.Types.ObjectId(x)) } } },
        { $sample: { size: remaining } },
      ])

    res.json({ success: true, products: [...primary, ...fallback] })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// function for update product (admin)
const updateProduct = async (req, res) => {
  try {
    const { id, name, description, category, price, subcategory, bestseller, sizes, discountType, discountValue } = req.body

    if (!id) {
      return res.json({ success: false, message: 'Thiếu ID sản phẩm' })
    }

    const existingImages = req.body.existingImages
      ? JSON.parse(req.body.existingImages)
      : null

    const image1 = req.files?.image1 && req.files.image1[0]
    const image2 = req.files?.image2 && req.files.image2[0]
    const image3 = req.files?.image3 && req.files.image3[0]
    const image4 = req.files?.image4 && req.files.image4[0]

    const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' })
        return result.secure_url
      })
    )

    // If caller doesn't send existingImages, fall back to current images
    const current = await productModel.findById(id)
    if (!current) {
      return res.json({ success: false, message: 'Không tìm thấy sản phẩm' })
    }

    const baseImages = Array.isArray(existingImages) ? existingImages : current.image
    const finalImages = [...baseImages, ...imagesUrl].filter(Boolean)

    if (!finalImages.length) {
      return res.json({ success: false, message: 'Sản phẩm phải có ít nhất 1 ảnh' })
    }

    const updatedData = {
      name,
      description,
      category,
      subcategory,
      price: price !== undefined ? Number(price) : current.price,
      discountType: discountType || current.discountType || 'none',
      discountValue: discountValue !== undefined ? Number(discountValue) : (current.discountValue || 0),
      bestseller: bestseller === "true" ? true : false,
      sizes: sizes ? JSON.parse(sizes) : current.sizes,
      image: finalImages,
    }

    const product = await productModel.findByIdAndUpdate(id, updatedData, { new: true })
    res.json({ success: true, message: 'Cập nhật sản phẩm thành công', product })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}


export {listProducts, addProduct, removeProduct, singleProduct, productDetail, updateProduct, relatedProducts}