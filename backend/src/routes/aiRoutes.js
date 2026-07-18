const router = require('express').Router();
const ai = require('../controllers/aiController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.get('/recommendations/:shopId', authenticate, requireRole('STUDENT'), ai.getRecommendations);
router.get('/kitchen-assistant', authenticate, requireRole('VENDOR'), ai.getKitchenAssistant);
router.get('/business-insights', authenticate, requireRole('VENDOR'), ai.getBusinessInsights);

module.exports = router;
