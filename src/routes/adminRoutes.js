const express = require('express');
const router = express.Router();
const { verificarSessao, verificarTipo } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Consultas exercicios_academia (qualquer usuario logado)
router.get('/exercicios-academia/treinos', verificarSessao, adminController.listarTreinosDistinct);
router.get('/exercicios-academia/catalogo', verificarSessao, adminController.listarExerciciosPorTreino);

// Exercicios Academia (CRUD admin)
router.get('/admin/exercicios-academia', verificarSessao, verificarTipo('ADM'), adminController.listarExercicios);
router.post('/admin/exercicios-academia', verificarSessao, verificarTipo('ADM'), adminController.criarExercicio);
router.put('/admin/exercicios-academia/:id', verificarSessao, verificarTipo('ADM'), adminController.atualizarExercicio);
router.delete('/admin/exercicios-academia/:id', verificarSessao, verificarTipo('ADM'), adminController.excluirExercicio);

// Vinculos Aluno-Treinador
router.get('/admin/treinadores', verificarSessao, verificarTipo('ADM'), adminController.listarTreinadores);
router.get('/admin/treinadores/:id/alunos', verificarSessao, verificarTipo('ADM'), adminController.alunosTreinador);
router.get('/admin/usuarios-sem-treinador', verificarSessao, verificarTipo('ADM'), adminController.listarSemTreinador);
router.post('/admin/vincular', verificarSessao, verificarTipo('ADM'), adminController.vincular);
router.delete('/admin/vincular/:id_usuario/:id_treinador', verificarSessao, verificarTipo('ADM'), adminController.desvincular);

module.exports = router;
