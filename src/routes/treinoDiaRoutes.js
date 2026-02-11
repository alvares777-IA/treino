const express = require('express');
const router = express.Router();
const { verificarSessao } = require('../middleware/auth');
const treinoDiaController = require('../controllers/treinoDiaController');

router.post('/treino-dia', verificarSessao, treinoDiaController.registrar);
router.get('/treino-dia', verificarSessao, treinoDiaController.listar);
router.put('/treino-dia/:id_treino_dia', verificarSessao, treinoDiaController.atualizar);
router.delete('/treino-dia/:id_treino_dia', verificarSessao, treinoDiaController.excluir);

module.exports = router;
