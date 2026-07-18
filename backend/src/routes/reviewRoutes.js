const router = require('express').Router();
const review = require('../controllers/reviewController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.get('/shop/:shopId', review.listShopReviews);
router.post('/', authenticate, requireRole('STUDENT'), review.createReview);
router.get('/mine/reviewable', authenticate, requireRole('STUDENT'), review.getMyReviewableOrders);

module.exports = router;
