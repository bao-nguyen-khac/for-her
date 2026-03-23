import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import productModel from '../models/productModel.js';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';

/**
 * Usage:
 * - Seed (append):      node scripts/seed.js
 * - Seed (reset DB):    node scripts/seed.js --reset
 * - Use UI statuses:    node scripts/seed.js --status=ui
 *
 * Requires:
 * - MONGODB_URI in env
 */

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maybe(p = 0.5) {
  return Math.random() < p;
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

const AO_DAI_SUBCATEGORIES = ['Nữ', 'Cưới', 'Dự tiệc', 'Công sở', 'Học sinh'];

const SIZES = ['S', 'M', 'L'];

const PLACEHOLDER_IMAGES = [
  'https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp',
  'https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp',
  'https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp',
];

function buildAoDaiName(category) {
  const motifs = [
    'hoa sen',
    'hoa đào',
    'hoa mai',
    'chim hạc',
    'trống đồng',
    'cẩm tú',
    'phượng hoàng',
    'nét thư pháp',
  ];
  const tones = ['đỏ', 'trắng', 'xanh', 'vàng', 'hồng', 'be', 'tím', 'đen'];
  const cuts = ['cổ cao', 'cổ tròn', 'tay lỡ', 'tay dài'];
  return `${category} ${pick(motifs)} ${pick(tones)} ${pick(cuts)}`.replace(
    /\s+/g,
    ' ',
  );
}

function buildDescription(category) {
  const lines = [
    'Chất liệu mềm mại, thoáng mát, tôn dáng.',
    'Đường may tinh tế, phù hợp nhiều dịp.',
    'Thiết kế hiện đại nhưng vẫn giữ nét truyền thống.',
    'Form chuẩn, dễ phối phụ kiện.',
  ];
  return `${category}. ${pick(lines)}`;
}

function buildAddress(i) {
  const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  const districts = ['Quận 1', 'Quận 3', 'Ba Đình', 'Cầu Giấy', 'Hải Châu'];
  return {
    firstName: 'Khách',
    lastName: `Hàng ${i + 1}`,
    email: `customer.${Date.now()}.${i}@example.com`,
    street: `${randInt(10, 999)} ${pick([
      'Nguyễn Trãi',
      'Lê Lợi',
      'Trần Hưng Đạo',
      'Hai Bà Trưng',
      'Điện Biên Phủ',
    ])}`,
    city: pick(cities),
    state: pick(districts),
    zipcode: String(randInt(10000, 99999)),
    country: 'Việt Nam',
    phone: `0${randInt(90, 99)}${randInt(1000000, 9999999)}`,
  };
}

function parseArgs(argv) {
  const args = {
    reset: false,
    statusMode: 'requested', // 'requested' | 'ui'
  };
  for (const a of argv) {
    if (a === '--reset') args.reset = true;
    if (a.startsWith('--status=')) {
      const v = a.split('=')[1];
      if (v === 'ui') args.statusMode = 'ui';
    }
  }
  return args;
}

function pickOrderStatus(statusMode) {
  if (statusMode === 'ui') {
    // Statuses currently used by the admin UI dropdown.
    return pick([
      'Order Placed',
      'Packing',
      'Shipped',
      'Out for delivery',
      'Delivered',
    ]);
  }
  // Requested by the task.
  return pick(['pending', 'completed', 'cancelled']);
}

async function main() {
  const { reset, statusMode } = parseArgs(process.argv.slice(2));

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI in environment');
  }

  await mongoose.connect(uri);

  try {
    if (reset) {
      await Promise.all([
        orderModel.deleteMany({}),
        productModel.deleteMany({}),
        userModel.deleteMany({}),
      ]);
    }

    // USERS
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

    const userCount = randInt(5, 10);
    const passwordPlain = '12345678';
    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    const users = [];
    for (let i = 0; i < userCount; i++) {
      const name = vietnameseNames[i] ?? `Khách ${i + 1}`;
      users.push(
        new userModel({
          name,
          email: makeEmail(name, i),
          password: passwordHash,
          cartData: {},
        }),
      );
    }
    await userModel.insertMany(users);

    // PRODUCTS
    const productCount = randInt(30, 50);
    const products = [];
    for (let i = 0; i < productCount; i++) {
      const category = pick(AO_DAI_CATEGORIES);
      const name = `Áo dài ${buildAoDaiName(
        category.replace(/^Áo dài\s+/i, ''),
      )}`;
      products.push(
        new productModel({
          name,
          description: buildDescription(category),
          price: randInt(300_000, 2_000_000),
          image: PLACEHOLDER_IMAGES,
          category,
          subcategory: pick(AO_DAI_SUBCATEGORIES),
          sizes: SIZES,
          bestseller: maybe(0.25),
          date: Date.now() - randInt(0, 60) * 24 * 60 * 60 * 1000,
        }),
      );
    }
    await productModel.insertMany(products);

    // CARTS (embedded in user.cartData)
    const productDocs = await productModel.find({}).lean();
    const userDocs = await userModel.find({}).lean();

    for (let i = 0; i < userDocs.length; i++) {
      const u = userDocs[i];
      const cartData = {};
      const cartLines = randInt(0, 5);
      for (let j = 0; j < cartLines; j++) {
        const p = pick(productDocs);
        const size = pick(SIZES);
        const qty = randInt(1, 3);
        if (!cartData[p._id]) cartData[p._id] = {};
        cartData[p._id][size] = (cartData[p._id][size] ?? 0) + qty;
      }
      await userModel.findByIdAndUpdate(u._id, { cartData });
    }

    // ORDERS (with embedded order items)
    const orderCount = randInt(10, 20);
    const orders = [];
    for (let i = 0; i < orderCount; i++) {
      const user = pick(userDocs);
      const itemsCount = randInt(1, 3);

      const items = [];
      let amount = 0;
      for (let j = 0; j < itemsCount; j++) {
        const p = pick(productDocs);
        const quantity = randInt(1, 2);
        const size = pick(SIZES);

        items.push({
          _id: p._id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          category: p.category,
          subcategory: p.subcategory,
          sizes: p.sizes,
          size,
          quantity,
        });
        amount += p.price * quantity;
      }

      const status = pickOrderStatus(statusMode);
      const payment = statusMode === 'requested' ? status === 'completed' : maybe(0.6);

      orders.push(
        new orderModel({
          userId: String(user._id),
          items,
          amount,
          address: buildAddress(i),
          status,
          paymentMethod: 'Cash On Delivery',
          payment,
          date: Date.now() - randInt(0, 45) * 24 * 60 * 60 * 1000,
        }),
      );
    }

    await orderModel.insertMany(orders);

    // Summary
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          success: true,
          reset,
          statusMode,
          seeded: {
            users: users.length,
            products: products.length,
            orders: orders.length,
          },
          note: {
            defaultUserPassword: passwordPlain,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

