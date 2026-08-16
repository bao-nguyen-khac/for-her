import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import productModel from '../models/productModel.js';
import productImageModel from '../models/productImageModel.js';
import productVariantModel from '../models/productVariantModel.js';
import categoryModel from '../models/categoryModel.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Helper to format product with images, variants, and category names for frontend/admin backward compatibility
async function formatProduct(productDoc) {
  if (!productDoc) return null;
  const pDoc = productDoc.toObject ? productDoc.toObject() : productDoc;
  const pId = pDoc._id;

  const [images, variants] = await Promise.all([
    productImageModel.find({ productId: pId }).sort({ isThumbnail: -1, sortOrder: 1 }),
    productVariantModel.find({ productId: pId }),
  ]);

  const imageArray = images.map((img) => img.url);
  const sizes = Array.from(new Set(variants.map((v) => v.size)));

  let categoryName = 'Mặc định';
  let subcategoryName = 'Mặc định';
  if (pDoc.categoryId) {
    const cat = await categoryModel.findById(pDoc.categoryId).lean();
    if (cat) {
      if (cat.parentId) {
        const parentCat = await categoryModel.findById(cat.parentId).lean();
        if (parentCat) {
          categoryName = parentCat.name;
          subcategoryName = cat.name;
        } else {
          categoryName = cat.name;
        }
      } else {
        categoryName = cat.name;
      }
    }
  }

  return {
    ...pDoc,
    discountType: pDoc.discountType || 'none',
    discountValue: pDoc.discountValue || 0,
    image: imageArray.length > 0 ? imageArray : ['https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp'],
    sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L'],
    category: categoryName,
    subcategory: subcategoryName,
    variants,
    date: pDoc.createdAt ? new Date(pDoc.createdAt).getTime() : Date.now(),
  };
}

// function for add product
const addProduct = async (req, res) => {
  try {
    const { name, description, category, price, subcategory, bestseller, sizes, discountType, discountValue } = req.body;

    const existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];

    const image1 = req.files?.image1 && req.files.image1[0];
    const image2 = req.files?.image2 && req.files.image2[0];
    const image3 = req.files?.image3 && req.files.image3[0];
    const image4 = req.files?.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
        return result.secure_url;
      })
    );

    const finalImages = [...(Array.isArray(existingImages) ? existingImages : []), ...imagesUrl].filter(Boolean);
    if (!finalImages.length) {
      return res.json({ success: false, message: 'Sản phẩm phải có ít nhất 1 ảnh' });
    }

    // Category lookup/creation
    let parentCat = await categoryModel.findOne({ name: category || 'Áo dài' });
    if (!parentCat) {
      parentCat = await categoryModel.create({
        name: category || 'Áo dài',
        slug: slugify(category || 'Áo dài'),
      });
    }

    let targetCatId = parentCat._id;
    if (subcategory) {
      let subCat = await categoryModel.findOne({ name: subcategory, parentId: parentCat._id });
      if (!subCat) {
        subCat = await categoryModel.create({
          name: subcategory,
          slug: slugify(`${category}-${subcategory}`),
          parentId: parentCat._id,
        });
      }
      targetCatId = subCat._id;
    }

    const validDiscountType = ['percentage', 'fixed', 'none'].includes(discountType) ? discountType : 'none';
    const validDiscountValue = Math.max(0, Number(discountValue) || 0);

    // Save Product
    const product = await productModel.create({
      categoryId: targetCatId,
      name,
      description,
      price: Number(price),
      discountType: validDiscountType,
      discountValue: validDiscountValue,
      bestseller: bestseller === 'true' || bestseller === true,
    });

    // Save Product Images
    for (let i = 0; i < finalImages.length; i++) {
      await productImageModel.create({
        productId: product._id,
        url: finalImages[i],
        isThumbnail: i === 0,
        sortOrder: i,
      });
    }

    // Save Product Variants
    const parsedSizes = sizes ? (typeof sizes === 'string' ? JSON.parse(sizes) : sizes) : ['S', 'M', 'L'];
    for (const size of parsedSizes) {
      await productVariantModel.create({
        productId: product._id,
        size,
        color: 'Mặc định',
        material: 'Lụa/Gấm',
        stockQuantity: 100,
      });
    }

    res.json({ success: true, message: 'Thêm sản phẩm thành công' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for List product
const listProducts = async (req, res) => {
  try {
    const { search, limit, page, sort } = req.query;

    const query = {};
    if (search) {
      const re = new RegExp(String(search).trim(), 'i');
      query.$or = [{ name: re }, { description: re }];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 60), 100);
    const skipNum = (pageNum - 1) * limitNum;

    let q = productModel.find(query);

    if (sort === 'price_asc') q = q.sort({ price: 1 });
    else if (sort === 'price_desc') q = q.sort({ price: -1 });
    else q = q.sort({ createdAt: -1 });

    q = q.skip(skipNum).limit(limitNum);

    const [rawProducts, total] = await Promise.all([q.lean(), productModel.countDocuments(query)]);

    const products = await Promise.all(rawProducts.map(formatProduct));

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
    res.json({ success: false, message: error.message });
  }
};

// function for removing product
const removeProduct = async (req, res) => {
  try {
    const { id } = req.body;
    await Promise.all([
      productModel.findByIdAndDelete(id),
      productImageModel.deleteMany({ productId: id }),
      productVariantModel.deleteMany({ productId: id }),
    ]);
    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for single product info
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const raw = await productModel.findById(productId).lean();
    if (!raw) {
      return res.json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    const product = await formatProduct(raw);
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// GET /api/product/:id (detail)
const productDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }
    const raw = await productModel.findById(id).lean();
    if (!raw) {
      return res.json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    const product = await formatProduct(raw);
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// GET /api/product/:id/related?limit=8
const relatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(Number(req.query.limit) || 8, 12);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const current = await productModel.findById(id).lean();
    if (!current) {
      return res.json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const primaryRaw = await productModel
      .find({ _id: { $ne: id }, categoryId: current.categoryId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const primary = await Promise.all(primaryRaw.map(formatProduct));

    if (primary.length >= limit) {
      return res.json({ success: true, products: primary });
    }

    const remaining = limit - primary.length;
    const excludeIds = [id, ...primaryRaw.map((p) => p._id)];

    const fallbackRaw = await productModel
      .find({ _id: { $nin: excludeIds } })
      .limit(remaining)
      .lean();

    const fallback = await Promise.all(fallbackRaw.map(formatProduct));

    res.json({ success: true, products: [...primary, ...fallback] });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for update product (admin)
const updateProduct = async (req, res) => {
  try {
    const { id, name, description, price, bestseller, discountType, discountValue } = req.body;

    if (!id) {
      return res.json({ success: false, message: 'Thiếu ID sản phẩm' });
    }

    const validDiscountType = ['percentage', 'fixed', 'none'].includes(discountType) ? discountType : 'none';
    const validDiscountValue = Math.max(0, Number(discountValue) || 0);

    const updated = await productModel.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price: Number(price),
        discountType: validDiscountType,
        discountValue: validDiscountValue,
        bestseller: bestseller === 'true' || bestseller === true,
      },
      { new: true }
    );

    const product = await formatProduct(updated);
    res.json({ success: true, message: 'Cập nhật sản phẩm thành công', product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  productDetail,
  updateProduct,
  relatedProducts,
};