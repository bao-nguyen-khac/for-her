import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res.json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục' });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = token_decode.id;
    next();
  } catch (error) {
    console.log('Lỗi xác thực JWT:', error.message);
    res.json({ success: false, message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại' });
  }
};

export default authUser;