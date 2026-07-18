const router = require('express').Router();
const vendor = require('../controllers/vendorController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.use(authenticate, requireRole('VENDOR'));
router.post('/tutorial/seen', vendor.markTutorialSeen);
router.post('/tutorial/replay', vendor.replayTutorial);
router.patch('/auto-pause', vendor.toggleAutoPause);

module.exports = router;
