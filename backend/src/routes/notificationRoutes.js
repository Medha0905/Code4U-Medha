const router = require('express').Router();
const notif = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', notif.listMyNotifications);
router.patch('/:id/read', notif.markRead);
router.patch('/read-all', notif.markAllRead);

module.exports = router;
