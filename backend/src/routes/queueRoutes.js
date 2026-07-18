const router = require('express').Router();
const queue = require('../controllers/queueController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.get('/shop/:shopId', queue.getShopQueue);
router.get('/mine', authenticate, requireRole('STUDENT'), queue.getMyQueueStatus);

module.exports = router;
