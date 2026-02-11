const express = require('express');
const router = express.Router();
const { verificarSessao } = require('../middleware/auth');
const usuarioController = require('../controllers/usuarioController');
const usuarioMedidaController = require('../controllers/usuarioMedidaController');

router.get('/usuario', verificarSessao, usuarioController.getUsuario);
router.put('/usuario', verificarSessao, usuarioController.updateUsuario);

router.post('/usuario/medidas', verificarSessao, usuarioMedidaController.registrar);
router.get('/usuario/medidas', verificarSessao, usuarioMedidaController.listar);

module.exports = router;
