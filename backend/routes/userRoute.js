import express from 'express';
import {
  loginUser,
  registerUser,
  adminLogin,
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/userController.js';
import authUser from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin);
userRouter.post('/profile', authUser, getUserProfile);
userRouter.post('/update', authUser, updateUserProfile);

// Address Management
userRouter.post('/address/list', authUser, getUserAddresses);
userRouter.post('/address/add', authUser, addAddress);
userRouter.post('/address/delete', authUser, deleteAddress);
userRouter.post('/address/set-default', authUser, setDefaultAddress);

export default userRouter;
