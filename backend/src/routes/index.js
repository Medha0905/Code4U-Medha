const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/shops', require('./shopRoutes'));
router.use('/menu', require('./menuRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/queue', require('./queueRoutes'));
router.use('/favorites', require('./favoriteRoutes'));
router.use('/bulk-orders', require('./bulkOrderRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/ai', require('./aiRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/vendor', require('./vendorRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/uploads', require('./uploadRoutes'));
router.use('/messages', require('./messageRoutes'));

router.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));

module.exports = router;
