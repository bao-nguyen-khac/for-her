import express from 'express';
import { listProducts, addProduct, removeProduct, singleProduct, productDetail, updateProduct, relatedProducts } from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';
import { getProductReviews, addProductReview } from '../controllers/reviewController.js';


const productRouter = express.Router();

productRouter.post('/add',adminAuth,upload.fields(
    [{name: 'image1', maxCount: 1}, 
    {name: 'image2', maxCount: 1}, 
    {name: 'image3', maxCount: 1}, 
    {name: 'image4', maxCount: 1} 
    ]) , addProduct);
productRouter.post('/remove',adminAuth, removeProduct);
productRouter.post('/single', singleProduct);
productRouter.get('/list', listProducts);
productRouter.get('/:id/related', relatedProducts);
productRouter.get('/:id/reviews', getProductReviews);
productRouter.post('/:id/reviews', addProductReview);
productRouter.get('/:id', productDetail);
productRouter.put('/update', adminAuth, upload.fields(
    [{name: 'image1', maxCount: 1}, 
    {name: 'image2', maxCount: 1}, 
    {name: 'image3', maxCount: 1}, 
    {name: 'image4', maxCount: 1} 
    ]), updateProduct);


export default productRouter

