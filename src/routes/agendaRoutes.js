const express = require('express');
const router = express.Router();
const { verificarSessao } = require('../middleware/auth');
const agendaController = require('../controllers/agendaController');

router.get('/agenda', verificarSessao, agendaController.listar);
router.post('/agenda', verificarSessao, agendaController.criar);
router.put('/agenda/:id', verificarSessao, agendaController.atualizar);
router.delete('/agenda/:id', verificarSessao, agendaController.excluir);
router.post('/agenda/:id/clonar', verificarSessao, agendaController.clonar);
router.post('/agenda/:id/repetir', verificarSessao, agendaController.repetir);

module.exports = router;
