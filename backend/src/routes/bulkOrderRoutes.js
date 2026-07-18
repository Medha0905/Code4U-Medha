const router = require('express').Router();
const bulk = require('../controllers/bulkOrderController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.post('/', authenticate, requireRole('STUDENT'), bulk.placeBulkOrder);
router.get('/mine', authenticate, requireRole('STUDENT'), bulk.listMyBulkOrders);
router.get('/shop', authenticate, requireRole('VENDOR'), bulk.listShopBulkOrders);

module.exports = router;
