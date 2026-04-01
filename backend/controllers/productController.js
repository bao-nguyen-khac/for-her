import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js'
import mongoose from 'mongoose'


// function for add product
const addProduct = async (req, res) => {
    try {        
      const { name, description, category, price, subcategory, bestseller, sizes, discountType, discountValue } = req.body

      const image1 = req.files.image1 &&  req.files.image1[0]
      const image2 = req.files.image2 &&  req.files.image2[0]
      const image3 = req.files.image3 &&  req.files.image3[0]
      const image4 = req.files.image4 &&  req.files.image4[0]

      const  images = [image1, image2, image3, image4].filter((item) => item !== undefined )

      const imagesUrl = await Promise.all(
        images.map(async (item) => {
          let result = await cloudinary.uploader.upload(item.path, {resource_type: 'image'});
          return result.secure_url
        })
      );
     

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
        image: imagesUrl,
        date: Date.now()
      }


      const product = new productModel(productData);
      await product.save()

      res.json({ success: true, message: 'Product Added successfully' });
      
    } catch (error) {
      console.log(error);
      res.json({success:false, message: error.message})
    }
 
}


// function for List product
const listProducts = async (req, res) => {
  try {
    const { search, limit } = req.query

    const query = {}
    if (search) {
      const re = new RegExp(String(search).trim(), 'i')
      query.$or = [{ name: re }, { description: re }]
    }

    let q = productModel.find(query)
    if (limit) q = q.limit(Math.min(Number(limit) || 0, 100))

    const products = await q
    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }
}



// function for removing product
const removeProduct = async (req,res) => {
   try {
    await productModel.findByIdAndDelete(req.body.id)
    res.json({ success: true, message: 'Product removed successfully' });
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

// GET /api/product/:id/related?limit=8
const relatedProducts = async (req, res) => {
  try {
    const { id } = req.params
    const limit = Math.min(Number(req.query.limit) || 8, 12)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: 'Invalid product id' })
    }

    const product = await productModel.findById(id).lean()
    if (!product) {
      return res.json({ success: false, message: 'Product not found' })
    }

    const primary = await productModel
      .find({ _id: { $ne: id }, category: product.category })
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
      return res.json({ success: false, message: 'Missing product id' })
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
      return res.json({ success: false, message: 'Product not found' })
    }

    const baseImages = Array.isArray(existingImages) ? existingImages : current.image
    const finalImages = [...baseImages, ...imagesUrl].filter(Boolean)

    if (!finalImages.length) {
      return res.json({ success: false, message: 'Product must have at least 1 image' })
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
    res.json({ success: true, message: 'Product Updated successfully', product })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}


export {listProducts, addProduct, removeProduct, singleProduct, updateProduct, relatedProducts}