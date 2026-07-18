const router = require('express').Router();
const fav = require('../controllers/favoriteController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.use(authenticate, requireRole('STUDENT'));
router.get('/', fav.listFavorites);
router.post('/', fav.addFavorite);
router.delete('/:menuItemId', fav.removeFavorite);

module.exports = router;
