import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js'


// function for add product
const addProduct = async (req, res) => {
    try {        
      const { name, description, category, price, subcategory, bestseller, sizes } = req.body

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
    const products = await productModel.find({});
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

// function for update product (admin)
const updateProduct = async (req, res) => {
  try {
    const { id, name, description, category, price, subcategory, bestseller, sizes } = req.body

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


export {listProducts, addProduct, removeProduct, singleProduct, updateProduct}