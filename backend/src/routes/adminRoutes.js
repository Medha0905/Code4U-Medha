const router = require('express').Router();
const admin = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.use(authenticate, requireRole('ADMIN'));
router.get('/students', admin.listStudents);
router.get('/vendors', admin.listVendors);
router.get('/shops', admin.listShops);
router.get('/analytics', admin.getPlatformAnalytics);
router.patch('/users/:userId/active', admin.setUserActive);
router.patch('/shops/:shopId/approve', admin.approveShop);
router.delete('/shops/:shopId', admin.forceRemoveShop);
router.patch('/shops/:shopId/restore', admin.restoreShop);

module.exports = router;
