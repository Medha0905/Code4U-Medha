const router = require('express').Router();
const shop = require('../controllers/shopController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.get('/', shop.listShops);
router.get('/:id', shop.getShopById);

router.post('/', authenticate, requireRole('VENDOR'), shop.createShop);
router.get('/me/mine', authenticate, requireRole('VENDOR'), shop.getMyShop);
router.patch('/me/mine', authenticate, requireRole('VENDOR'), shop.updateMyShop);
router.patch('/me/status', authenticate, requireRole('VENDOR'), shop.toggleShopStatus);
router.patch('/me/seat-status', authenticate, requireRole('VENDOR'), shop.updateSeatStatus);
router.delete('/me/mine', authenticate, requireRole('VENDOR'), shop.deleteMyShop);

module.exports = router;
