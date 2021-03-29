const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userCtrl = require('../controllers/user');

// Les différentes routes associées aux différents controllers pour les users
router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);
router.put('/modify', auth, userCtrl.modifyUser);
router.delete('/delete', auth, userCtrl.deleteUser);

module.exports = router;