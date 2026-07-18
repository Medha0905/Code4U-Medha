const router = require('express').Router();
const order = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.post('/', authenticate, requireRole('STUDENT'), order.placeOrder);
router.get('/mine', authenticate, requireRole('STUDENT'), order.getMyOrders);

router.get('/shop', authenticate, requireRole('VENDOR'), order.getShopOrders);
router.patch('/:id/status', authenticate, requireRole('VENDOR'), order.updateOrderStatus);
router.post('/:id/no-show', authenticate, requireRole('VENDOR'), order.markNoShow);

router.post('/scan', authenticate, requireRole('VENDOR'), order.scanQrToken);
router.post('/scan/complete', authenticate, requireRole('VENDOR'), order.completeOrderByQr);

module.exports = router;
