import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';
import orderModel from '../models/orderModel.js';
import orderItemModel from '../models/orderItemModel.js';
import productModel from '../models/productModel.js';
import productVariantModel from '../models/productVariantModel.js';
import addressModel from '../models/addressModel.js';
import userModel from '../models/userModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Không tìm thấy MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Đã kết nối MongoDB');

  // 1. Lấy tất cả variants hợp lệ của các sản phẩm hiện có
  const validVariants = await productVariantModel.find().lean();
  if (validVariants.length === 0) {
    console.log('Chưa có variants nào trong database');
    process.exit(0);
  }

  // 2. Tìm các orderItem mồ côi
  const allOrderItems = await orderItemModel.find().populate('variantId').lean();
  let relinkedCount = 0;

  for (let i = 0; i < allOrderItems.length; i++) {
    const item = allOrderItems[i];
    let isValid = false;

    if (item.variantId && item.variantId.productId) {
      const prod = await productModel.findById(item.variantId.productId).lean();
      if (prod) isValid = true;
    }

    if (!isValid) {
      // Gán vào một variant ngẫu nhiên hợp lệ
      const randomVariant = validVariants[i % validVariants.length];
      await orderItemModel.findByIdAndUpdate(item._id, {
        variantId: randomVariant._id,
      });
      relinkedCount++;
    }
  }
  console.log(`✨ Đã liên kết lại ${relinkedCount} order items sang sản phẩm hợp lệ!`);

  // 3. Kiểm tra orders và addresses
  const allOrders = await orderModel.find().lean();
  const defaultAddress = await addressModel.findOne().lean();

  let fixedOrders = 0;
  for (const o of allOrders) {
    let hasAddr = false;
    if (o.addressId) {
      const addr = await addressModel.findById(o.addressId).lean();
      if (addr) hasAddr = true;
    }

    if (!hasAddr && defaultAddress) {
      await orderModel.findByIdAndUpdate(o._id, { addressId: defaultAddress._id });
      fixedOrders++;
    }
  }
  console.log(`✨ Đã sửa ${fixedOrders} đơn hàng thiếu địa chỉ hợp lệ!`);

  await mongoose.disconnect();
  console.log('✅ Hoàn tất dọn dẹp dữ liệu!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
