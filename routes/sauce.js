const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const stuffCtrl = require('../controllers/sauce');
const multer = require('../middleware/multer-config');

router.post('/', auth, multer, stuffCtrl.createSauce);
router.get('/:id', auth, stuffCtrl.getOneSauce);
router.put('/:id', auth, multer, stuffCtrl.modifySauce);
router.delete('/:id', auth, stuffCtrl.deleteSauce);
router.get('/' + '', auth, stuffCtrl.getAllSauces);
router.post('/:id/like', auth, stuffCtrl.likeSauce);

module.exports = router;