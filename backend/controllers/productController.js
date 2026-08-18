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

const CATEGORY_MAP = {
  'ao-dai-truyen-thong': 'Áo dài truyền thống',
  'ao-dai-lua-gam': 'Áo dài lụa gấm',
  'ao-dai-cheo-han': 'Áo dài chéo Hàn',
  'ao-dai-theu': 'Áo dài thêu',
  'ao-dai-to-ong': 'Áo dài tơ ống',
  'ao-dai-dinh-ket': 'Áo dài đính kết',
  Men: 'Áo dài truyền thống',
  Women: 'Áo dài truyền thống',
  Kids: 'Áo dài truyền thống',
};

async function findOrCreateCategory(categoryInput, subcategoryInput) {
  if (!categoryInput) return null;
  const catSlug = slugify(categoryInput);
  const catName = CATEGORY_MAP[categoryInput] || CATEGORY_MAP[catSlug] || categoryInput;

  let parentCat = await categoryModel.findOne({
    $or: [{ slug: catSlug }, { name: catName }, { name: categoryInput }, { slug: slugify(catName) }],
    parentId: null,
  });

  if (!parentCat) {
    parentCat = await categoryModel.create({
      name: catName,
      slug: slugify(catName) || catSlug,
      parentId: null,
    });
  }

  if (subcategoryInput && subcategoryInput !== 'Mặc định') {
    const subSlug = slugify(`${catName}-${subcategoryInput}`);
    let subCat = await categoryModel.findOne({
      name: subcategoryInput,
      parentId: parentCat._id,
    });
    if (!subCat) {
      subCat = await categoryModel.create({
        name: subcategoryInput,
        slug: subSlug,
        parentId: parentCat._id,
      });
    }
    return subCat._id;
  }

  return parentCat._id;
}

// Helper to calculate discounted final price
function calcFinalPrice(pDoc) {
  const base = Number(pDoc?.price ?? 0);
  const type = pDoc?.discountType || 'none';
  const value = Number(pDoc?.discountValue ?? 0);

  if (!value || type === 'none') return Math.max(0, base);

  if (type === 'percentage') {
    return Math.max(0, Math.round(base * (1 - value / 100)));
  }
  if (type === 'fixed') {
    return Math.max(0, base - value);
  }
  return Math.max(0, base);
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

  let categoryName = 'Áo dài truyền thống';
  let subcategoryName = 'Nữ';
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
          subcategoryName = '';
        }
      } else {
        categoryName = cat.name;
        subcategoryName = '';
      }
    }
  }

  return {
    ...pDoc,
    discountType: pDoc.discountType || 'none',
    discountValue: pDoc.discountValue || 0,
    finalPrice: calcFinalPrice(pDoc),
    image: imageArray.length > 0 ? imageArray : ['https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp'],
    sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L'],
    category: categoryName,
    subcategory: subcategoryName || 'Nữ',
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

    // Category lookup / creation
    const targetCatId = await findOrCreateCategory(category || 'ao-dai-truyen-thong', subcategory);

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
    const { search, limit, page, sort, category, subcategory } = req.query;

    const query = {};
    if (search) {
      const re = new RegExp(String(search).trim(), 'i');
      query.$or = [{ name: re }, { description: re }];
    }

    // Filter by category / subcategory
    const catList = category ? String(category).split(',').map((s) => s.trim()).filter(Boolean) : [];
    const subList = subcategory ? String(subcategory).split(',').map((s) => s.trim()).filter(Boolean) : [];

    if (catList.length > 0 || subList.length > 0) {
      let matchedCategoryIds = [];

      if (catList.length > 0) {
        const searchConditions = [];
        for (const cat of catList) {
          const slug = slugify(cat);
          const name = CATEGORY_MAP[cat] || CATEGORY_MAP[slug] || cat;
          searchConditions.push(
            { slug: cat },
            { slug: slug },
            { name: name },
            { name: new RegExp(`^${cat}$`, 'i') }
          );
        }

        const parentCats = await categoryModel.find({ $or: searchConditions }).lean();
        const parentIds = parentCats.map((c) => c._id);

        const childCats = await categoryModel.find({ parentId: { $in: parentIds } }).lean();
        const childIds = childCats.map((c) => c._id);

        matchedCategoryIds = [...parentIds, ...childIds];
      }

      if (subList.length > 0) {
        const subCats = await categoryModel.find({
          name: { $in: subList.map((s) => new RegExp(`^${s}$`, 'i')) },
        }).lean();
        const subCatIds = subCats.map((c) => c._id);

        if (catList.length > 0) {
          const subSet = new Set(subCatIds.map(String));
          matchedCategoryIds = matchedCategoryIds.filter((id) => subSet.has(String(id)));
        } else {
          matchedCategoryIds = subCatIds;
        }
      }

      if (matchedCategoryIds.length === 0) {
        return res.json({
          success: true,
          products: [],
          pagination: {
            page: Math.max(1, Number(page) || 1),
            limit: Math.min(Math.max(1, Number(limit) || 60), 100),
            total: 0,
            totalPages: 0,
          },
        });
      }

      query.categoryId = { $in: matchedCategoryIds };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 60), 100);
    const skipNum = (pageNum - 1) * limitNum;

    const finalPriceExpr = {
      $switch: {
        branches: [
          {
            case: {
              $and: [
                { $eq: ['$discountType', 'percentage'] },
                { $gt: [{ $ifNull: ['$discountValue', 0] }, 0] },
              ],
            },
            then: {
              $max: [
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        '$price',
                        {
                          $subtract: [
                            1,
                            { $divide: [{ $ifNull: ['$discountValue', 0] }, 100] },
                          ],
                        },
                      ],
                    },
                    0,
                  ],
                },
              ],
            },
          },
          {
            case: {
              $and: [
                { $eq: ['$discountType', 'fixed'] },
                { $gt: [{ $ifNull: ['$discountValue', 0] }, 0] },
              ],
            },
            then: {
              $max: [
                0,
                { $subtract: ['$price', { $ifNull: ['$discountValue', 0] }] },
              ],
            },
          },
        ],
        default: '$price',
      },
    };

    let sortStage = { createdAt: -1, _id: 1 };
    if (sort === 'price_asc') {
      sortStage = { finalPrice: 1, price: 1, _id: 1 };
    } else if (sort === 'price_desc') {
      sortStage = { finalPrice: -1, price: -1, _id: 1 };
    } else if (sort === 'newest') {
      sortStage = { createdAt: -1, _id: 1 };
    }

    const aggregatePipeline = [
      { $match: query },
      {
        $addFields: {
          finalPrice: finalPriceExpr,
        },
      },
      { $sort: sortStage },
      { $skip: skipNum },
      { $limit: limitNum },
    ];

    const [rawProducts, total] = await Promise.all([
      productModel.aggregate(aggregatePipeline),
      productModel.countDocuments(query),
    ]);

    const products = await Promise.all(rawProducts.map(formatProduct));

    res.json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
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
    const { id, name, description, category, subcategory, price, bestseller, discountType, discountValue } = req.body;

    if (!id) {
      return res.json({ success: false, message: 'Thiếu ID sản phẩm' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (bestseller !== undefined) updateData.bestseller = bestseller === 'true' || bestseller === true;

    if (discountType !== undefined) {
      updateData.discountType = ['percentage', 'fixed', 'none'].includes(discountType) ? discountType : 'none';
    }
    if (discountValue !== undefined) {
      updateData.discountValue = Math.max(0, Number(discountValue) || 0);
    }

    if (category) {
      const targetCatId = await findOrCreateCategory(category, subcategory);
      if (targetCatId) {
        updateData.categoryId = targetCatId;
      }
    }

    // 1. Xử lý ảnh: existingImages (URL) và file ảnh upload mới
    let existingImages = [];
    if (req.body.existingImages !== undefined) {
      try {
        existingImages = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
      } catch {
        existingImages = [];
      }
    }

    const image1 = req.files?.image1 && req.files.image1[0];
    const image2 = req.files?.image2 && req.files.image2[0];
    const image3 = req.files?.image3 && req.files.image3[0];
    const image4 = req.files?.image4 && req.files.image4[0];
    const newFiles = [image1, image2, image3, image4].filter((item) => item !== undefined);

    let newImagesUrl = [];
    if (newFiles.length > 0) {
      newImagesUrl = await Promise.all(
        newFiles.map(async (item) => {
          let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
          return result.secure_url;
        })
      );
    }

    const finalImages = [...(Array.isArray(existingImages) ? existingImages : []), ...newImagesUrl].filter(Boolean);

    if (req.body.existingImages !== undefined || newFiles.length > 0) {
      if (finalImages.length === 0) {
        return res.json({ success: false, message: 'Sản phẩm phải có ít nhất 1 ảnh' });
      }

      await productImageModel.deleteMany({ productId: id });
      for (let i = 0; i < finalImages.length; i++) {
        await productImageModel.create({
          productId: id,
          url: finalImages[i],
          isThumbnail: i === 0,
          sortOrder: i,
        });
      }
    }

    // 2. Xử lý kích cỡ / biến thể
    if (req.body.sizes !== undefined) {
      let parsedSizes = [];
      try {
        parsedSizes = typeof req.body.sizes === 'string' ? JSON.parse(req.body.sizes) : req.body.sizes;
      } catch {
        parsedSizes = ['S', 'M', 'L'];
      }

      if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
        const existingVariants = await productVariantModel.find({ productId: id }).lean();
        const existingSizes = new Set(existingVariants.map((v) => v.size));

        await productVariantModel.deleteMany({ productId: id, size: { $nin: parsedSizes } });

        for (const size of parsedSizes) {
          if (!existingSizes.has(size)) {
            await productVariantModel.create({
              productId: id,
              size,
              color: 'Mặc định',
              material: 'Lụa/Gấm',
              stockQuantity: 100,
            });
          }
        }
      }
    }

    const updated = await productModel.findByIdAndUpdate(
      id,
      updateData,
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