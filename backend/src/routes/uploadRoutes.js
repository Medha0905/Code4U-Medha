const router = require('express').Router();
const multer = require('multer');
const upload = require('../config/upload');
const uploadController = require('../controllers/uploadController');
const { authenticate, requireRole } = require('../middlewares/auth');
const { ApiError } = require('../utils/apiResponse');

router.post('/image', authenticate, requireRole('VENDOR'), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError || err) {
      return next(new ApiError(400, err.message || 'Upload failed'));
    }
    next();
  });
}, uploadController.uploadImage);

module.exports = router;
