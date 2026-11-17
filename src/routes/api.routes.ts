import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { CurrencyController } from '../controllers/currency.controller';
import { OrderController } from '../controllers/order.controller';
import { AdminController } from '../controllers/admin.controller';

const router = Router();

// Products & Categories
router.get('/products', ProductController.getProducts);
router.get('/products/:id', ProductController.getProductById);
router.post('/products', ProductController.createProduct);
router.put('/products/:id', ProductController.updateProduct);
router.delete('/products/:id', ProductController.deleteProduct);
router.get('/categories', ProductController.getCategories);

// Currencies
router.get('/currencies', CurrencyController.getCurrencies);
router.put('/currencies', CurrencyController.updateRate);

// Checkout & Orders
router.post('/checkout', OrderController.checkout);
router.get('/orders/:id', OrderController.getOrder);

// Admin
router.get('/admin/orders', OrderController.getAllOrders);
router.put('/admin/orders/:id/status', OrderController.updateStatus);
router.get('/admin/stats', AdminController.getStats);
router.post('/admin/reset', AdminController.resetData);

export default router;
