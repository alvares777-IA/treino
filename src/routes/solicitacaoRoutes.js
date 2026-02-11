const express = require('express');
const router = express.Router();
const { verificarSessao, verificarTipo } = require('../middleware/auth');
const solicitacaoController = require('../controllers/solicitacaoController');

router.post('/solicitacao-treinador', verificarSessao, solicitacaoController.solicitar);
router.get('/solicitacoes-pendentes', verificarSessao, verificarTipo('TRE', 'ADM'), solicitacaoController.listarPendentes);
router.get('/solicitacoes-pendentes/count', verificarSessao, verificarTipo('TRE', 'ADM'), solicitacaoController.contarPendentes);
router.put('/solicitacao-treinador/:id', verificarSessao, verificarTipo('TRE', 'ADM'), solicitacaoController.responder);
router.get('/meus-alunos', verificarSessao, verificarTipo('TRE', 'ADM'), solicitacaoController.meusAlunos);
router.get('/meu-treinador', verificarSessao, solicitacaoController.meuTreinador);
router.delete('/meus-alunos/:id_usuario', verificarSessao, verificarTipo('TRE', 'ADM'), solicitacaoController.desvincularAluno);
router.delete('/meu-treinador', verificarSessao, solicitacaoController.abandonarTreinador);

module.exports = router;
