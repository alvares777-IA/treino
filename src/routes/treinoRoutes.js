const express = require('express');
const router = express.Router();
const { verificarSessao } = require('../middleware/auth');
const treinoController = require('../controllers/treinoController');

router.get('/treinos', verificarSessao, treinoController.listar);
router.post('/treinos', verificarSessao, treinoController.criar);
router.post('/treinos/atribuir', verificarSessao, treinoController.atribuir);
router.put('/treinos/:id_treino', verificarSessao, treinoController.atualizar);
router.delete('/treinos/:id_treino', verificarSessao, treinoController.excluir);

module.exports = router;
