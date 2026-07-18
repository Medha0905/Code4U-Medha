const prisma = require('../config/db');
const { ApiError, ok } = require('../utils/apiResponse');
const { asyncHandler } = require('../middlewares/validate');
const aiService = require('../services/aiService');

const getRecommendations = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const recs = await aiService.getRecommendationsForStudent(req.user.profileId, shopId);
  return ok(res, recs);
});

const getKitchenAssistant = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  const suggestions = await aiService.getKitchenAssistantSuggestions(shop.id);
  return ok(res, suggestions);
});

const getBusinessInsights = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findUnique({ where: { vendorId: req.user.profileId } });
  if (!shop) throw new ApiError(404, 'Shop not found');
  const insights = await aiService.getBusinessInsights(shop.id);
  return ok(res, insights);
});

module.exports = { getRecommendations, getKitchenAssistant, getBusinessInsights };
