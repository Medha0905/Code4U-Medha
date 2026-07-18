const router = require('express').Router();
const report = require('../controllers/reportController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.use(authenticate, requireRole('VENDOR'));
router.get('/analytics', report.getVendorAnalytics);
router.get('/daily', report.getDailyReport);
router.get('/daily/pdf', report.downloadDailyReportPdf);

module.exports = router;
