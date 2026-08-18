import orderModel from '../models/orderModel.js';
import orderItemModel from '../models/orderItemModel.js';
import addressModel from '../models/addressModel.js';
import cartModel from '../models/cartModel.js';
import cartItemModel from '../models/cartItemModel.js';
import productVariantModel from '../models/productVariantModel.js';
import productModel from '../models/productModel.js';
import productImageModel from '../models/productImageModel.js';

// Helper to format an order with address and items for backward compatibility
async function formatOrder(orderDoc) {
  if (!orderDoc) return null;
  const oDoc = orderDoc.toObject ? orderDoc.toObject() : orderDoc;

  // Address
  let address = {
    firstName: 'Khách',
    lastName: 'Hàng',
    receiverName: 'Khách hàng',
    phone: '',
    street: '',
    addressLine: '',
  };
  if (oDoc.addressId) {
    const addr = await addressModel.findById(oDoc.addressId).lean();
    if (addr) {
      address = {
        firstName: addr.receiverName ? addr.receiverName.split(' ')[0] : 'Khách',
        lastName: addr.receiverName ? addr.receiverName.split(' ').slice(1).join(' ') : 'Hàng',
        receiverName: addr.receiverName || 'Khách hàng',
        phone: addr.phone || '',
        street: addr.addressLine || '',
        addressLine: addr.addressLine || '',
      };
    }
  }

  // Items
  const orderItems = await orderItemModel.find({ orderId: oDoc._id }).populate('variantId').lean();
  const items = await Promise.all(
    orderItems.map(async (oi) => {
      let pName = 'Sản phẩm';
      let pImages = ['https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp'];
      let size = 'S';
      let pId = null;

      if (oi.variantId) {
        size = oi.variantId.size || 'S';
        pId = oi.variantId.productId;
        const prod = await productModel.findById(pId).lean();
        if (prod) pName = prod.name;

        const imgs = await productImageModel.find({ productId: pId }).sort({ isThumbnail: -1 }).lean();
        if (imgs.length > 0) pImages = imgs.map((i) => i.url);
      }

      return {
        _id: pId || oi._id,
        name: pName,
        price: oi.priceAtOrder,
        quantity: oi.quantity,
        size,
        image: pImages,
      };
    })
  );

  return {
    ...oDoc,
    address,
    items,
    payment: oDoc.paymentStatus === 'paid',
  };
}

// Placing orders using COD Method
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    // Save or resolve address
    let addressDoc;
    if (address && typeof address === 'object') {
      const receiverName = address.receiverName || `${address.firstName || ''} ${address.lastName || ''}`.trim() || 'Khách hàng';
      const addressLine = address.street || [address.street, address.city, address.state, address.country].filter(Boolean).join(', ') || 'N/A';
      addressDoc = await addressModel.create({
        userId,
        receiverName,
        phone: address.phone || '0000000000',
        addressLine,
        isDefault: false,
      });
    } else {
      addressDoc = await addressModel.create({
        userId,
        receiverName: 'Khách hàng',
        phone: '0000000000',
        addressLine: 'N/A',
        isDefault: false,
      });
    }

    // Create Order
    const newOrder = await orderModel.create({
      userId,
      addressId: addressDoc._id,
      amount: Number(amount),
      status: 'Order Placed',
      paymentMethod: 'Cash On Delivery',
      paymentStatus: 'pending',
      date: new Date(),
    });

    // Create Order Items
    if (Array.isArray(items)) {
      for (const item of items) {
        const productId = item._id || item.productId;
        const size = item.size || 'S';

        let variant = await productVariantModel.findOne({ productId, size });
        if (!variant && productId) {
          variant = await productVariantModel.create({
            productId,
            size,
            color: 'Mặc định',
            material: 'Lụa/Thun',
            stockQuantity: 100,
          });
        }

        if (variant) {
          await orderItemModel.create({
            orderId: newOrder._id,
            variantId: variant._id,
            quantity: Number(item.quantity) || 1,
            priceAtOrder: Number(item.price) || 0,
          });
        }
      }
    }

    // Clear Cart
    const userCart = await cartModel.findOne({ userId });
    if (userCart) {
      await cartItemModel.deleteMany({ cartId: userCart._id });
    }

    res.json({ success: true, message: 'Đặt hàng thành công' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// All Orders data for Admin panel
const allOrders = async (req, res) => {
  try {
    const pageNum = Math.max(1, Number(req.body.page) || 1);
    const limitNum = Math.min(Math.max(1, Number(req.body.limit) || 10), 100);
    const skipNum = (pageNum - 1) * limitNum;

    const [rawOrders, total] = await Promise.all([
      orderModel.find({}).sort({ date: -1 }).skip(skipNum).limit(limitNum).lean(),
      orderModel.countDocuments({}),
    ]);

    const orders = await Promise.all(rawOrders.map(formatOrder));

    res.json({
      success: true,
      orders,
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

// User Order Data for Frontend
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const rawOrders = await orderModel.find({ userId }).sort({ date: -1 }).lean();
    const orders = await Promise.all(rawOrders.map(formatOrder));
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Update order status from Admin Panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { placeOrder, allOrders, userOrders, updateStatus };