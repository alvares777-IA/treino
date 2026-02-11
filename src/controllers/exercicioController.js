const { getConnection } = require('../config/database');
const exercicioModel = require('../models/exercicioModel');

async function listar(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const result = await exercicioModel.listar(connection, req.params.id_treino);
        const exercicios = result.rows.map(row => ({
            id_exercicio: row[0],
            no_exercicio: row[1],
            tx_url: row[2],
            qt_series: row[3],
            nr_peso: row[4],
            qt_repeticao: row[5],
            nr_ordem: row[6],
            qt_calorias: row[7],
            no_musculo: row[8]
        }));
        res.json({ success: true, exercicios });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao buscar exercicios." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function criar(req, res) {
    const { id_treino, no_exercicio } = req.body;
    if (!no_exercicio || !no_exercicio.trim()) {
        return res.status(400).json({ success: false, message: "Nome do exercicio e obrigatorio." });
    }
    let connection;
    try {
        connection = await getConnection();
        await exercicioModel.criar(connection, {
            id_treino,
            no_exercicio: no_exercicio.trim(),
            tx_url: req.body.tx_url ? req.body.tx_url.trim() : null,
            qt_series: req.body.qt_series || null,
            nr_peso: req.body.nr_peso || null,
            qt_repeticao: req.body.qt_repeticao || null,
            nr_ordem: req.body.nr_ordem || null,
            qt_calorias: req.body.qt_calorias || null,
            no_musculo: req.body.no_musculo ? req.body.no_musculo.trim() : null
        });
        res.json({ success: true, message: "Exercicio criado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao criar exercicio." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function atualizar(req, res) {
    const { no_exercicio } = req.body;
    if (!no_exercicio || !no_exercicio.trim()) {
        return res.status(400).json({ success: false, message: "Nome do exercicio e obrigatorio." });
    }
    let connection;
    try {
        connection = await getConnection();
        await exercicioModel.atualizar(connection, req.params.id_treino, req.params.id_exercicio, {
            no_exercicio: no_exercicio.trim(),
            tx_url: req.body.tx_url ? req.body.tx_url.trim() : null,
            qt_series: req.body.qt_series || null,
            nr_peso: req.body.nr_peso || null,
            qt_repeticao: req.body.qt_repeticao || null,
            nr_ordem: req.body.nr_ordem || null,
            qt_calorias: req.body.qt_calorias || null,
            no_musculo: req.body.no_musculo ? req.body.no_musculo.trim() : null
        });
        res.json({ success: true, message: "Exercicio atualizado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao atualizar exercicio." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function excluir(req, res) {
    let connection;
    try {
        connection = await getConnection();
        await exercicioModel.excluir(connection, req.params.id_treino, req.params.id_exercicio);
        res.json({ success: true, message: "Exercicio excluido com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao excluir exercicio." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

module.exports = { listar, criar, atualizar, excluir };
