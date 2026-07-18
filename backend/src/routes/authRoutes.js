const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../controllers/authController');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

const emailPasswordRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
];

router.post('/register/student', emailPasswordRules, validate, auth.registerStudent);
router.post('/register/vendor', emailPasswordRules, validate, auth.registerVendor);
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  auth.login,
);
router.post('/refresh', auth.refresh);
router.get('/me', authenticate, auth.me);

module.exports = router;
