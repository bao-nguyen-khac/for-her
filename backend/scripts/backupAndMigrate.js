import 'dotenv/config';
import mongoose from 'mongoose';

// Helper slugify function
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

async function backupAndMigrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI không tìm thấy trong environment');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log('✅ Đã kết nối đến MongoDB');

  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  // 1. BACKUP PHASE
  const targetToBackup = ['users', 'products', 'orders', 'reviews'];
  for (const name of targetToBackup) {
    if (collectionNames.includes(name)) {
      const backupName = `${name}_backup`;
      if (collectionNames.includes(backupName)) {
        const count = await db.collection(name).countDocuments();
        if (count === 0) {
          console.log(`⚠️ Collection ${name} đang rỗng (0 docs), giữ nguyên bản backup ${backupName}...`);
          continue;
        }
        console.log(`⚠️ Collection ${backupName} đã tồn tại, đang xóa bản backup cũ...`);
        await db.collection(backupName).drop();
      }
      console.log(`📦 Đổi tên collection ${name} -> ${backupName}...`);
      await db.collection(name).rename(backupName);
    }
  }

  // Reload collection list
  const updatedCollections = (await db.listCollections().toArray()).map((c) => c.name);

  // 2. MIGRATION PHASE
  console.log('🚀 Bắt đầu chuyển đổi dữ liệu từ các collection backup sang 11 collection mới...');

  // Maps to track created categories and variants
  const categoryMap = new Map(); // key: name -> doc
  const variantMap = new Map(); // key: `${productId}_${size}` -> doc

  // A. Categories & Products & Images & Variants (From products_backup)
  if (updatedCollections.includes('products_backup')) {
    const oldProducts = await db.collection('products_backup').find({}).toArray();
    console.log(`🔄 Đang chuyển đổi ${oldProducts.length} sản phẩm từ products_backup...`);

    for (const p of oldProducts) {
      // Handle Category & Subcategory
      let catId = null;
      if (p.category) {
        const catName = p.category;
        const catSlug = slugify(catName);
        if (!categoryMap.has(catName)) {
          let catDoc = await db.collection('categories').findOne({ slug: catSlug });
          if (!catDoc) {
            const res = await db.collection('categories').insertOne({
              name: catName,
              slug: catSlug,
              parentId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            catDoc = { _id: res.insertedId, name: catName, slug: catSlug };
          }
          categoryMap.set(catName, catDoc);
        }

        const parentCat = categoryMap.get(catName);
        catId = parentCat._id;

        if (p.subcategory) {
          const subName = p.subcategory;
          const subSlug = slugify(`${catName}-${subName}`);
          if (!categoryMap.has(`${catName}_${subName}`)) {
            let subDoc = await db.collection('categories').findOne({ slug: subSlug });
            if (!subDoc) {
              const res = await db.collection('categories').insertOne({
                name: subName,
                slug: subSlug,
                parentId: parentCat._id,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              subDoc = { _id: res.insertedId, name: subName, slug: subSlug };
            }
            categoryMap.set(`${catName}_${subName}`, subDoc);
          }
          catId = categoryMap.get(`${catName}_${subName}`)._id;
        }
      }

      // Fallback category if none existed
      if (!catId) {
        let defaultCat = await db.collection('categories').findOne({ slug: 'mac-dinh' });
        if (!defaultCat) {
          const res = await db.collection('categories').insertOne({
            name: 'Mặc định',
            slug: 'mac-dinh',
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          defaultCat = { _id: res.insertedId };
        }
        catId = defaultCat._id;
      }

      // Insert Product
      const productDoc = {
        _id: p._id,
        categoryId: catId,
        name: p.name,
        description: p.description || '',
        price: Number(p.price) || 0,
        discountType: p.discountType || 'none',
        discountValue: Number(p.discountValue) || 0,
        bestseller: Boolean(p.bestseller),
        createdAt: p.date ? new Date(p.date) : new Date(),
        updatedAt: new Date(),
      };
      await db.collection('products').updateOne({ _id: p._id }, { $set: productDoc }, { upsert: true });

      // Insert Product Images
      if (Array.isArray(p.image)) {
        for (let i = 0; i < p.image.length; i++) {
          await db.collection('product_images').insertOne({
            productId: p._id,
            url: p.image[i],
            isThumbnail: i === 0,
            sortOrder: i,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      // Insert Product Variants
      const sizes = Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L'];
      for (const size of sizes) {
        const variantRes = await db.collection('product_variants').insertOne({
          productId: p._id,
          size,
          color: 'Mặc định',
          material: 'Lụa/Thun',
          stockQuantity: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        variantMap.set(`${p._id.toString()}_${size}`, variantRes.insertedId);
      }
    }
  }

  // B. Users & Addresses & Carts & CartItems (From users_backup)
  if (updatedCollections.includes('users_backup')) {
    const oldUsers = await db.collection('users_backup').find({}).toArray();
    console.log(`🔄 Đang chuyển đổi ${oldUsers.length} người dùng từ users_backup...`);

    for (const u of oldUsers) {
      // Insert User
      await db.collection('users').updateOne(
        { _id: u._id },
        {
          $set: {
            name: u.name,
            email: u.email,
            password: u.password,
            createdAt: u.createdAt || new Date(),
            updatedAt: u.updatedAt || new Date(),
          },
        },
        { upsert: true }
      );

      // Create/Get Cart
      let cartDoc = await db.collection('carts').findOne({ userId: u._id });
      let cartId;
      if (!cartDoc) {
        const cartRes = await db.collection('carts').insertOne({
          userId: u._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        cartId = cartRes.insertedId;
      } else {
        cartId = cartDoc._id;
      }

      // Migrate cartData if available
      if (u.cartData && typeof u.cartData === 'object') {
        for (const [prodId, sizeObj] of Object.entries(u.cartData)) {
          if (sizeObj && typeof sizeObj === 'object') {
            for (const [size, qty] of Object.entries(sizeObj)) {
              if (qty > 0) {
                let variantId = variantMap.get(`${prodId}_${size}`);
                if (!variantId) {
                  // Find or create fallback variant
                  const varDoc = await db.collection('product_variants').findOne({ productId: new mongoose.Types.ObjectId(prodId), size });
                  if (varDoc) {
                    variantId = varDoc._id;
                  } else {
                    const newVar = await db.collection('product_variants').insertOne({
                      productId: new mongoose.Types.ObjectId(prodId),
                      size,
                      color: 'Mặc định',
                      material: 'Lụa/Thun',
                      stockQuantity: 100,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    });
                    variantId = newVar.insertedId;
                  }
                }

                await db.collection('cart_items').insertOne({
                  cartId,
                  variantId,
                  quantity: Number(qty),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
              }
            }
          }
        }
      }
    }
  }

  // C. Orders & OrderItems & Addresses (From orders_backup)
  if (updatedCollections.includes('orders_backup')) {
    const oldOrders = await db.collection('orders_backup').find({}).toArray();
    console.log(`🔄 Đang chuyển đổi ${oldOrders.length} đơn hàng từ orders_backup...`);

    for (const o of oldOrders) {
      let userIdObj;
      try {
        userIdObj = new mongoose.Types.ObjectId(o.userId);
      } catch (e) {
        userIdObj = o.userId;
      }

      // Address creation for order
      let addressId;
      if (o.address && typeof o.address === 'object') {
        const receiverName = o.address.firstName
          ? `${o.address.firstName} ${o.address.lastName}`
          : o.address.receiverName || 'Khách hàng';
        const addressLine = [
          o.address.street,
          o.address.city,
          o.address.state,
          o.address.country,
        ]
          .filter(Boolean)
          .join(', ') || 'N/A';

        const addrRes = await db.collection('addresses').insertOne({
          userId: userIdObj,
          receiverName,
          phone: o.address.phone || '0000000000',
          addressLine,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        addressId = addrRes.insertedId;
      } else {
        const addrRes = await db.collection('addresses').insertOne({
          userId: userIdObj,
          receiverName: 'Khách hàng',
          phone: '0000000000',
          addressLine: 'N/A',
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        addressId = addrRes.insertedId;
      }

      // Insert Order
      const orderDoc = {
        _id: o._id,
        userId: userIdObj,
        addressId,
        status: o.status || 'Order Placed',
        amount: Number(o.amount) || 0,
        paymentMethod: o.paymentMethod || 'Cash On Delivery',
        paymentStatus: o.payment ? 'paid' : 'pending',
        date: o.date ? new Date(o.date) : new Date(),
        createdAt: o.createdAt || new Date(),
        updatedAt: new Date(),
      };
      await db.collection('orders').updateOne({ _id: o._id }, { $set: orderDoc }, { upsert: true });

      // Insert Order Items
      if (Array.isArray(o.items)) {
        for (const item of o.items) {
          const pId = item._id || item.productId;
          const size = item.size || 'S';
          let variantId = variantMap.get(`${String(pId)}_${size}`);

          if (!variantId && pId) {
            try {
              const varDoc = await db.collection('product_variants').findOne({ productId: new mongoose.Types.ObjectId(pId), size });
              if (varDoc) {
                variantId = varDoc._id;
              } else {
                const newVar = await db.collection('product_variants').insertOne({
                  productId: new mongoose.Types.ObjectId(pId),
                  size,
                  color: 'Mặc định',
                  material: 'Lụa/Thun',
                  stockQuantity: 100,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
                variantId = newVar.insertedId;
              }
            } catch (e) {
              // Ignore variant resolution failure
            }
          }

          if (variantId) {
            await db.collection('order_items').insertOne({
              orderId: o._id,
              variantId,
              quantity: Number(item.quantity) || 1,
              priceAtOrder: Number(item.price) || 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }
    }
  }

  // D. Reviews (From reviews_backup)
  if (updatedCollections.includes('reviews_backup')) {
    const oldReviews = await db.collection('reviews_backup').find({}).toArray();
    console.log(`🔄 Đang chuyển đổi ${oldReviews.length} đánh giá từ reviews_backup...`);

    for (const r of oldReviews) {
      let userIdObj = r.userId;
      if (typeof r.userId === 'string') {
        try {
          userIdObj = new mongoose.Types.ObjectId(r.userId);
        } catch (e) {}
      }

      await db.collection('reviews').updateOne(
        { _id: r._id },
        {
          $set: {
            productId: r.productId,
            userId: userIdObj,
            rating: Number(r.rating) || 5,
            comment: r.comment || '',
            createdAt: r.createdAt || new Date(),
            updatedAt: r.updatedAt || new Date(),
          },
        },
        { upsert: true }
      );
    }
  }

  console.log('🎉 Hoàn thành backup và chuyển đổi dữ liệu thành công!');
  await mongoose.disconnect();
}

backupAndMigrate().catch((err) => {
  console.error('❌ Lỗi khi backup/migrate:', err);
  process.exit(1);
});
