const express = require('express');
const router = express.Router();
const { verificarSessao } = require('../middleware/auth');
const exercicioController = require('../controllers/exercicioController');

router.get('/treinando/:id_treino', verificarSessao, exercicioController.listar);
router.post('/exercicios', verificarSessao, exercicioController.criar);
router.put('/exercicios/:id_treino/:id_exercicio', verificarSessao, exercicioController.atualizar);
router.delete('/exercicios/:id_treino/:id_exercicio', verificarSessao, exercicioController.excluir);

module.exports = router;
