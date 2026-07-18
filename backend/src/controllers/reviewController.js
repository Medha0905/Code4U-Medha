const prisma = require('../config/db');
const { ApiError, ok, created } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');

/** Student leaves a review — only allowed for their own COMPLETED order, once. */
const createReview = asyncHandler(async (req, res) => {
  const { orderId, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) throw new ApiError(422, 'Rating must be between 1 and 5');

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { review: true } });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.studentId !== req.user.profileId) throw new ApiError(403, 'This is not your order');
  if (order.status !== 'COMPLETED') throw new ApiError(409, 'You can only review completed orders');
  if (order.review) throw new ApiError(409, 'You have already reviewed this order');

  const review = await prisma.review.create({
    data: { shopId: order.shopId, studentId: req.user.profileId, orderId: order.id, rating, comment },
  });

  return created(res, review, 'Review submitted');
});

const listShopReviews = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const reviews = await prisma.review.findMany({
    where: { shopId },
    include: { student: true },
    orderBy: { createdAt: 'desc' },
  });
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  return ok(res, { reviews, avgRating, count: reviews.length });
});

/** Orders the current student has completed but not yet reviewed — powers a "leave a review" prompt. */
const getMyReviewableOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { studentId: req.user.profileId, status: 'COMPLETED', review: null },
    include: { shop: true },
    orderBy: { completedAt: 'desc' },
    take: 10,
  });
  return ok(res, orders);
});

module.exports = { createReview, listShopReviews, getMyReviewableOrders };
