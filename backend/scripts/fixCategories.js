import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';
import categoryModel from '../models/categoryModel.js';
import productModel from '../models/productModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

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

const AO_DAI_CATEGORIES = [
  'Áo dài truyền thống',
  'Áo dài lụa gấm',
  'Áo dài chéo Hàn',
  'Áo dài thêu',
  'Áo dài tơ ống',
  'Áo dài đính kết',
];

const AO_DAI_SUBCATEGORIES = [
  'Dự tiệc',
  'Cưới & Hỏi',
  'Công sở',
  'Cách tân',
  'Học sinh',
  'Nữ',
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Không tìm thấy MONGODB_URI trong .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Đã kết nối MongoDB');

  // 1. Tạo hoặc cập nhật toàn bộ Categories & SubCategories chuẩn
  const categoryMap = {}; // slug -> doc
  const subCategoryDocs = [];

  for (const catName of AO_DAI_CATEGORIES) {
    const slug = slugify(catName);
    let parentCat = await categoryModel.findOne({ slug, parentId: null });
    if (!parentCat) {
      parentCat = await categoryModel.create({
        name: catName,
        slug,
        parentId: null,
      });
    }
    categoryMap[slug] = parentCat;

    for (const subName of AO_DAI_SUBCATEGORIES) {
      const subSlug = slugify(`${catName}-${subName}`);
      let subCat = await categoryModel.findOne({ name: subName, parentId: parentCat._id });
      if (!subCat) {
        subCat = await categoryModel.create({
          name: subName,
          slug: subSlug,
          parentId: parentCat._id,
        });
      }
      subCategoryDocs.push(subCat);
    }
  }

  // 2. Duyệt qua tất cả sản phẩm, nếu chưa có category hoặc subcategory hợp lệ -> cập nhật
  const products = await productModel.find({});
  console.log(`🔍 Tìm thấy ${products.length} sản phẩm cần kiểm tra...`);

  let updatedCount = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    let cat = p.categoryId ? await categoryModel.findById(p.categoryId) : null;

    // Nếu không có categoryId hoặc categoryId không có parentId (nghĩa là chưa có subcategory)
    if (!cat || !cat.parentId) {
      // Gán vào một subcategory tương ứng
      const targetSub = subCategoryDocs[i % subCategoryDocs.length];
      await productModel.findByIdAndUpdate(p._id, { categoryId: targetSub._id });
      updatedCount++;
    }
  }

  console.log(`✨ Đã cập nhật ${updatedCount} sản phẩm với danh mục và phân loại mới!`);
  await mongoose.disconnect();
  console.log('✅ Hoàn tất!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
