import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import userModel from '../models/userModel.js';
import addressModel from '../models/addressModel.js';
import categoryModel from '../models/categoryModel.js';
import productModel from '../models/productModel.js';
import productImageModel from '../models/productImageModel.js';
import productVariantModel from '../models/productVariantModel.js';
import cartModel from '../models/cartModel.js';
import cartItemModel from '../models/cartItemModel.js';
import orderModel from '../models/orderModel.js';
import orderItemModel from '../models/orderItemModel.js';
import reviewModel from '../models/reviewModel.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maybe(p = 0.5) {
  return Math.random() < p;
}

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

function makeEmail(name, i) {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
    .slice(0, 40);
  return `${base}.${Date.now()}.${i}@example.com`;
}

const AO_DAI_CATEGORIES = [
  'Áo dài truyền thống',
  'Áo dài lụa gấm',
  'Áo dài chéo Hàn',
  'Áo dài thêu',
  'Áo dài tơ ống',
  'Áo dài đính kết',
];

const AO_DAI_SUBCATEGORIES = ['Dự tiệc', 'Cưới & Hỏi', 'Công sở', 'Cách tân', 'Học sinh', 'Nữ'];
const SIZES = ['S', 'M', 'L', 'XL'];
const COLORS = ['Đỏ', 'Trắng', 'Xanh', 'Vàng', 'Hồng'];

const PLACEHOLDER_IMAGES = [
  'https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp',
  'https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp',
];

function parseArgs(argv) {
  const args = { reset: false };
  for (const a of argv) {
    if (a === '--reset') args.reset = true;
  }
  return args;
}

async function main() {
  const { reset } = parseArgs(process.argv.slice(2));

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI in environment');
  }

  await mongoose.connect(uri);

  try {
    if (reset) {
      console.log('🧹 Đang làm sạch dữ liệu 11 collections...');
      await Promise.all([
        userModel.deleteMany({}),
        addressModel.deleteMany({}),
        categoryModel.deleteMany({}),
        productModel.deleteMany({}),
        productImageModel.deleteMany({}),
        productVariantModel.deleteMany({}),
        cartModel.deleteMany({}),
        cartItemModel.deleteMany({}),
        orderModel.deleteMany({}),
        orderItemModel.deleteMany({}),
        reviewModel.deleteMany({}),
      ]);
    }

    // 1. CATEGORIES
    console.log('🌱 Creating Categories...');
    const createdCategoryDocs = [];
    const createdSubCategoryDocs = [];
    for (const catName of AO_DAI_CATEGORIES) {
      const parentCat = await categoryModel.create({
        name: catName,
        slug: slugify(catName),
        parentId: null,
      });
      createdCategoryDocs.push(parentCat);

      for (const subName of AO_DAI_SUBCATEGORIES) {
        const subCat = await categoryModel.create({
          name: subName,
          slug: slugify(`${catName}-${subName}`),
          parentId: parentCat._id,
        });
        createdSubCategoryDocs.push({ subCat, parentCat });
      }
    }

    // 2. USERS & ADDRESSES & CARTS
    console.log('🌱 Creating Users, Addresses, Carts...');
    const vietnameseNames = [
      'Nguyễn Thị Mai',
      'Trần Văn Long',
      'Lê Thu Hà',
      'Phạm Minh Anh',
      'Võ Quốc Bảo',
      'Đặng Thùy Dung',
      'Bùi Thanh Tùng',
      'Hồ Ngọc Lan',
      'Đoàn Gia Huy',
      'Phan Khánh Linh',
    ];

    const passwordHash = await bcrypt.hash('12345678', 10);
    const createdUsers = [];
    const createdAddresses = [];
    const createdCarts = [];

    for (let i = 0; i < vietnameseNames.length; i++) {
      const name = vietnameseNames[i];
      const user = await userModel.create({
        name,
        email: makeEmail(name, i),
        password: passwordHash,
      });
      createdUsers.push(user);

      // Address
      const addr = await addressModel.create({
        userId: user._id,
        receiverName: name,
        phone: `0${randInt(90, 99)}${randInt(1000000, 9999999)}`,
        addressLine: `${randInt(10, 999)} Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh`,
        isDefault: true,
      });
      createdAddresses.push(addr);

      // Cart
      const cart = await cartModel.create({
        userId: user._id,
      });
      createdCarts.push(cart);
    }

    // 3. PRODUCTS, IMAGES, VARIANTS
    console.log('🌱 Creating Products, Images, Variants...');
    const createdProducts = [];
    const createdVariants = [];

    for (let i = 0; i < 20; i++) {
      const { subCat, parentCat } = pick(createdSubCategoryDocs);
      const discountType = pick(['none', 'percentage', 'fixed']);
      let discountValue = 0;
      if (discountType === 'percentage') discountValue = pick([10, 15, 20, 25]);
      if (discountType === 'fixed') discountValue = pick([50000, 100000, 150000]);

      const product = await productModel.create({
        categoryId: subCat._id,
        name: `Áo dài ${parentCat.name} - ${subCat.name} Mẫu ${i + 1}`,
        description: `Sản phẩm áo dài cao cấp tôn dáng, chất liệu lụa gấm tự nhiên.`,
        price: randInt(400_000, 1_800_000),
        discountType,
        discountValue,
        bestseller: maybe(0.3),
      });
      createdProducts.push(product);

      // Product Images
      for (let j = 0; j < PLACEHOLDER_IMAGES.length; j++) {
        await productImageModel.create({
          productId: product._id,
          url: PLACEHOLDER_IMAGES[j],
          isThumbnail: j === 0,
          sortOrder: j,
        });
      }

      // Product Variants
      for (const size of SIZES) {
        const variant = await productVariantModel.create({
          productId: product._id,
          size,
          color: pick(COLORS),
          material: 'Lụa tơ tằm',
          stockQuantity: randInt(10, 100),
        });
        createdVariants.push(variant);
      }
    }

    // 4. CART ITEMS
    console.log('🌱 Creating Cart Items...');
    for (const cart of createdCarts) {
      const itemCount = randInt(1, 3);
      for (let j = 0; j < itemCount; j++) {
        const variant = pick(createdVariants);
        await cartItemModel.create({
          cartId: cart._id,
          variantId: variant._id,
          quantity: randInt(1, 2),
        });
      }
    }

    // 5. ORDERS & ORDER ITEMS & REVIEWS
    console.log('🌱 Creating Orders, Order Items, Reviews...');
    const statuses = ['Order Placed', 'Packing', 'Shipped', 'Delivered'];

    for (let i = 0; i < 15; i++) {
      const userIndex = randInt(0, createdUsers.length - 1);
      const user = createdUsers[userIndex];
      const address = createdAddresses[userIndex];

      const orderItemsCount = randInt(1, 3);
      const selectedVariants = [];
      let totalAmount = 0;

      for (let j = 0; j < orderItemsCount; j++) {
        const variant = pick(createdVariants);
        const product = createdProducts.find((p) => p._id.equals(variant.productId));
        const price = product ? product.price : 500000;
        const qty = randInt(1, 2);

        selectedVariants.push({ variant, price, qty });
        totalAmount += price * qty;
      }

      const order = await orderModel.create({
        userId: user._id,
        addressId: address._id,
        status: pick(statuses),
        amount: totalAmount,
        paymentMethod: 'Cash On Delivery',
        paymentStatus: maybe(0.5) ? 'paid' : 'pending',
      });

      for (const item of selectedVariants) {
        await orderItemModel.create({
          orderId: order._id,
          variantId: item.variant._id,
          quantity: item.qty,
          priceAtOrder: item.price,
        });

        // Add review for delivered order items
        if (order.status === 'Delivered' && maybe(0.5)) {
          await reviewModel.create({
            productId: item.variant.productId,
            userId: user._id,
            rating: randInt(4, 5),
            comment: 'Sản phẩm đẹp tuyệt vời, chất vải rất ưng ý!',
          });
        }
      }
    }

    console.log(
      JSON.stringify(
        {
          success: true,
          message: 'Dữ liệu đã được seed thành công vào 11 collections mới!',
          counts: {
            categories: createdCategoryDocs.length,
            users: createdUsers.length,
            products: createdProducts.length,
            variants: createdVariants.length,
          },
        },
        null,
        2
      )
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
