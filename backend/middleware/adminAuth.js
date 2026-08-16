import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res.json({ success: false, message: 'Không có quyền truy cập, vui lòng đăng nhập lại' });
    }
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return res.json({ success: false, message: 'Không có quyền truy cập, vui lòng đăng nhập lại' });
    }
    next();
  } catch (error) {
    console.log('Lỗi xác thực Admin JWT:', error.message);
    res.json({ success: false, message: 'Phiên làm việc Admin đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại' });
  }
};

export default adminAuth;