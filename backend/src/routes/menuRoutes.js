const router = require('express').Router();
const menu = require('../controllers/menuController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.get('/shop/:shopId', menu.listMenuForShop);

router.post('/', authenticate, requireRole('VENDOR'), menu.addMenuItem);
router.patch('/:id', authenticate, requireRole('VENDOR'), menu.updateMenuItem);
router.delete('/:id', authenticate, requireRole('VENDOR'), menu.deleteMenuItem);
router.post('/:id/restock', authenticate, requireRole('VENDOR'), menu.restockItem);
router.patch('/:id/threshold', authenticate, requireRole('VENDOR'), menu.setLowStockThreshold);

module.exports = router;
