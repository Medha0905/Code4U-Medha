const router = require('express').Router();
const message = require('../controllers/messageController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate); // both STUDENT and VENDOR can use these — ownership checked in controller
router.get('/:orderId', message.listMessages);
router.post('/:orderId', message.sendMessage);

module.exports = router;
