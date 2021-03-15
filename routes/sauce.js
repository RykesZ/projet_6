const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const stuffCtrl = require('../controllers/sauce');
const multer = require('../middleware/multer-config');

router.post('/sauces', auth, multer, stuffCtrl.createSauce);
router.get('/sauces/:id', auth, stuffCtrl.getOneSauce);
router.put('/sauces/:id', auth, multer, stuffCtrl.modifySauce);
router.delete('/sauces/:id', auth, stuffCtrl.deleteSauce);
router.get('/sauces' + '', auth, stuffCtrl.getAllSauces);
//router.post('/sauces/:id/like', auth, stuffCtrl.likeSauce);

module.exports = router;