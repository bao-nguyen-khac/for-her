import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import addressModel from "../models/addressModel.js";
import cartModel from "../models/cartModel.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// Route for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Tài khoản không tồn tại" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = createToken(user._id);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Sai thông tin đăng nhập" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for user registration
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Checking user already exists or not
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "Tài khoản đã tồn tại" });
    }

    // Validating email format & strong password
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Vui lòng nhập email hợp lệ" });
    }

    if (password.length < 8) {
      return res.json({ success: false, message: "Mật khẩu phải có ít nhất 8 ký tự" });
    }

    // Hashing User password
    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedpassword,
    });

    const user = await newUser.save();

    // Create cart for new user
    await cartModel.create({ userId: user._id });

    const token = createToken(user._id);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Sai thông tin đăng nhập" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for getting user profile
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId).select("-password").lean();
    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }
    const addresses = await addressModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, user: { ...user, addresses } });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Route for updating user profile
const updateUserProfile = async (req, res) => {
  try {
    const { userId, name, email } = req.body;

    if (!name || !email) {
      return res.json({ success: false, message: "Tên và email là bắt buộc" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Vui lòng nhập email hợp lệ" });
    }

    const existed = await userModel.findOne({ email, _id: { $ne: userId } });
    if (existed) {
      return res.json({ success: false, message: "Email đã tồn tại" });
    }

    const user = await userModel.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.json({ success: false, message: "Không tìm thấy người dùng" });
    }

    res.json({ success: true, message: "Cập nhật hồ sơ thành công", user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Address Management
const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.body;
    const addresses = await addressModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, addresses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const addAddress = async (req, res) => {
  try {
    const { userId, receiverName, phone, addressLine, isDefault } = req.body;
    if (!receiverName || !phone || !addressLine) {
      return res.json({ success: false, message: "Vui lòng nhập đầy đủ thông tin địa chỉ" });
    }

    if (isDefault) {
      await addressModel.updateMany({ userId }, { isDefault: false });
    }

    const count = await addressModel.countDocuments({ userId });
    const address = await addressModel.create({
      userId,
      receiverName,
      phone,
      addressLine,
      isDefault: Boolean(isDefault) || count === 0,
    });

    res.json({ success: true, message: "Thêm địa chỉ thành công", address });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.body;
    await addressModel.findOneAndDelete({ _id: addressId, userId });
    res.json({ success: true, message: "Xóa địa chỉ thành công" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.body;
    await addressModel.updateMany({ userId }, { isDefault: false });
    await addressModel.findOneAndUpdate({ _id: addressId, userId }, { isDefault: true });
    res.json({ success: true, message: "Đặt làm địa chỉ mặc định thành công" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export {
  loginUser,
  registerUser,
  adminLogin,
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
};