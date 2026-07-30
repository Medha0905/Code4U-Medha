const router = require('express').Router();
const multer = require('multer');
const menu = require('../controllers/menuController');
const upload = require('../config/upload');
const { authenticate, requireRole } = require('../middlewares/auth');
const { ApiError } = require('../utils/apiResponse');

router.get('/shop/:shopId', menu.listMenuForShop);

router.post('/', authenticate, requireRole('VENDOR'), menu.addMenuItem);
router.patch('/:id', authenticate, requireRole('VENDOR'), menu.updateMenuItem);
router.delete('/:id', authenticate, requireRole('VENDOR'), menu.deleteMenuItem);
router.post('/:id/restock', authenticate, requireRole('VENDOR'), menu.restockItem);
router.patch('/:id/threshold', authenticate, requireRole('VENDOR'), menu.setLowStockThreshold);

// AI Menu Photo Extraction
router.post('/extract-from-photo', authenticate, requireRole('VENDOR'), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError || err) return next(new ApiError(400, err.message || 'Upload failed'));
    next();
  });
}, menu.extractMenuFromPhoto);
router.post('/bulk-from-extraction', authenticate, requireRole('VENDOR'), menu.bulkCreateFromExtraction);

module.exports = router;
