import cartModel from '../models/cartModel.js';
import cartItemModel from '../models/cartItemModel.js';
import productVariantModel from '../models/productVariantModel.js';

// Helper to get or create cart for user
async function getOrCreateCart(userId) {
  let cart = await cartModel.findOne({ userId });
  if (!cart) {
    cart = await cartModel.create({ userId });
  }
  return cart;
}

// Helper to get or create variant by productId and size
async function getOrCreateVariant(productId, size) {
  let variant = await productVariantModel.findOne({ productId, size });
  if (!variant) {
    variant = await productVariantModel.create({
      productId,
      size,
      color: 'Mặc định',
      material: 'Lụa/Thun',
      stockQuantity: 100,
    });
  }
  return variant;
}

// Add products to user cart
const addToCart = async (req, res) => {
  try {
    const { userId, itemId, size } = req.body;

    const cart = await getOrCreateCart(userId);
    const variant = await getOrCreateVariant(itemId, size);

    let item = await cartItemModel.findOne({ cartId: cart._id, variantId: variant._id });
    if (item) {
      item.quantity += 1;
      await item.save();
    } else {
      await cartItemModel.create({
        cartId: cart._id,
        variantId: variant._id,
        quantity: 1,
      });
    }

    res.json({ success: true, message: 'Đã thêm vào giỏ hàng' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Update user cart
const updateCart = async (req, res) => {
  try {
    const { userId, itemId, size, quantity } = req.body;

    const cart = await getOrCreateCart(userId);
    const variant = await getOrCreateVariant(itemId, size);

    if (quantity <= 0) {
      await cartItemModel.deleteOne({ cartId: cart._id, variantId: variant._id });
    } else {
      await cartItemModel.updateOne(
        { cartId: cart._id, variantId: variant._id },
        { $set: { quantity: Number(quantity) } },
        { upsert: true }
      );
    }

    res.json({ success: true, message: 'Cập nhật giỏ hàng thành công' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Get user cart data in backward-compatible format { [itemId]: { [size]: qty } }
const getUserCart = async (req, res) => {
  try {
    const { userId } = req.body;
    const cart = await cartModel.findOne({ userId });

    const cartData = {};
    if (cart) {
      const items = await cartItemModel.find({ cartId: cart._id }).populate('variantId');
      for (const item of items) {
        if (item.variantId) {
          const pId = item.variantId.productId.toString();
          const size = item.variantId.size;
          if (!cartData[pId]) cartData[pId] = {};
          cartData[pId][size] = item.quantity;
        }
      }
    }

    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart };