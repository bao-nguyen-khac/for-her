import orderModel from '../models/orderModel.js';
import orderItemModel from '../models/orderItemModel.js';
import productModel from '../models/productModel.js';
import productImageModel from '../models/productImageModel.js';
import productVariantModel from '../models/productVariantModel.js';
import userModel from '../models/userModel.js';
import addressModel from '../models/addressModel.js';

const DEFAULT_PLACEHOLDER_IMG = 'https://forhershop.vn/wp-content/uploads/2026/03/AD05244-QUA40XMI-2-1365x2048.webp';

// Get dashboard statistics with dynamic range filtering
const getDashboardStats = async (req, res) => {
  try {
    const range = req.query.range || 'all';
    const now = Date.now();
    let query = {};

    if (range === 'today') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      query.date = { $gte: new Date(todayStart) };
    } else if (range === '7days') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      query.date = { $gte: new Date(sevenDaysAgo) };
    } else if (range === '30days') {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      query.date = { $gte: new Date(thirtyDaysAgo) };
    }

    const [orders, totalProducts, totalUsers] = await Promise.all([
      orderModel.find(query).sort({ date: 1 }).lean(),
      productModel.countDocuments({}),
      userModel.countDocuments({}),
    ]);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);

    const statusDistribution = {
      'Order Placed': 0,
      Packing: 0,
      Shipped: 0,
      'Out for delivery': 0,
      Delivered: 0,
    };
    orders.forEach((o) => {
      if (statusDistribution[o.status] !== undefined) {
        statusDistribution[o.status]++;
      } else {
        statusDistribution[o.status] = (statusDistribution[o.status] || 0) + 1;
      }
    });

    // Calculate top-selling products from orderItemModel
    const orderIds = orders.map((o) => o._id);
    const orderItems = await orderItemModel
      .find({ orderId: { $in: orderIds } })
      .populate('variantId')
      .lean();

    const productSales = {};
    for (const item of orderItems) {
      if (item.variantId && item.variantId.productId) {
        const pId = item.variantId.productId.toString();
        const prod = await productModel.findById(pId).lean();
        // Skip orphaned order items where product was deleted
        if (!prod) continue;

        if (!productSales[pId]) {
          const imgDoc = await productImageModel
            .findOne({ productId: pId })
            .sort({ isThumbnail: -1, sortOrder: 1 })
            .lean();

          productSales[pId] = {
            name: prod.name,
            quantity: 0,
            revenue: 0,
            image: imgDoc?.url || DEFAULT_PLACEHOLDER_IMG,
          };
        }
        productSales[pId].quantity += Number(item.quantity) || 1;
        productSales[pId].revenue += (Number(item.priceAtOrder) || 0) * (Number(item.quantity) || 1);
      }
    }

    let topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // If fewer than 5 sold products, supplement with existing bestseller/popular products
    if (topProducts.length < 5) {
      const existingProductIds = Object.keys(productSales);
      const fallbackProducts = await productModel
        .find({ _id: { $nin: existingProductIds } })
        .sort({ bestseller: -1, createdAt: -1 })
        .limit(5 - topProducts.length)
        .lean();

      for (const prod of fallbackProducts) {
        const imgDoc = await productImageModel
          .findOne({ productId: prod._id })
          .sort({ isThumbnail: -1, sortOrder: 1 })
          .lean();

        topProducts.push({
          name: prod.name,
          quantity: 0,
          revenue: 0,
          image: imgDoc?.url || DEFAULT_PLACEHOLDER_IMG,
        });
      }
    }

    // Chart Data
    let chartLabels = [];
    let chartData = [];

    if (range === 'today') {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const revenueByHour = hours.reduce((acc, h) => {
        acc[h] = 0;
        return acc;
      }, {});

      orders.forEach((o) => {
        const hr = new Date(o.date).getHours();
        revenueByHour[hr] += o.amount || 0;
      });

      chartLabels = hours.map((h) => `${String(h).padStart(2, '0')}:00`);
      chartData = hours.map((h) => revenueByHour[h]);
    } else if (range === '7days') {
      const days = [];
      const revenueByDay = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now - i * 24 * 60 * 60 * 1000);
        const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        days.push(dateStr);
        revenueByDay[dateStr] = 0;
      }

      orders.forEach((o) => {
        const d = new Date(o.date);
        const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (revenueByDay[dateStr] !== undefined) {
          revenueByDay[dateStr] += o.amount || 0;
        }
      });

      chartLabels = days;
      chartData = days.map((d) => revenueByDay[d]);
    } else if (range === '30days') {
      const days = [];
      const revenueByDay = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now - i * 24 * 60 * 60 * 1000);
        const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        days.push(dateStr);
        revenueByDay[dateStr] = 0;
      }

      orders.forEach((o) => {
        const d = new Date(o.date);
        const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (revenueByDay[dateStr] !== undefined) {
          revenueByDay[dateStr] += o.amount || 0;
        }
      });

      chartLabels = days;
      chartData = days.map((d) => revenueByDay[d]);
    } else {
      const months = [];
      const revenueByMonth = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        months.push(monthStr);
        revenueByMonth[monthStr] = 0;
      }

      orders.forEach((o) => {
        const d = new Date(o.date);
        const monthStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        if (revenueByMonth[monthStr] !== undefined) {
          revenueByMonth[monthStr] += o.amount || 0;
        }
      });

      chartLabels = months;
      chartData = months.map((m) => revenueByMonth[m]);
    }

    // Populate recent orders with address info
    const rawRecentOrders = await orderModel
      .find(query)
      .sort({ date: -1 })
      .limit(5)
      .lean();

    const recentOrders = await Promise.all(
      rawRecentOrders.map(async (o) => {
        let address = {
          firstName: 'Khách',
          lastName: 'Hàng',
          receiverName: 'Khách hàng',
          phone: '',
          street: '',
        };
        if (o.addressId) {
          const addr = await addressModel.findById(o.addressId).lean();
          if (addr) {
            address = {
              firstName: addr.receiverName ? addr.receiverName.split(' ')[0] : 'Khách',
              lastName: addr.receiverName ? addr.receiverName.split(' ').slice(1).join(' ') : 'Hàng',
              receiverName: addr.receiverName,
              phone: addr.phone || '',
              street: addr.addressLine || '',
            };
          }
        }
        return {
          ...o,
          address,
        };
      })
    );

    res.json({
      success: true,
      data: {
        totals: {
          revenue: totalRevenue,
          orders: totalOrders,
          products: totalProducts,
          users: totalUsers,
        },
        statusDistribution,
        topProducts,
        recentOrders,
        chart: {
          labels: chartLabels,
          data: chartData,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu thống kê:', error);
    res.json({ success: false, message: error.message });
  }
};

export { getDashboardStats };
