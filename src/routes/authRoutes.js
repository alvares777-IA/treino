const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/esqueceu-senha', authController.esqueceuSenha);
router.post('/cadastrar', authController.cadastrar);
router.post('/login-google', authController.loginGoogle);
router.post('/login-facebook', authController.loginFacebook);

router.get('/config-social', (req, res) => {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID || '',
        facebookAppId: process.env.FACEBOOK_APP_ID || ''
    });
});

module.exports = router;
