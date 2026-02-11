const { getConnection } = require('../config/database');
const exercicioAcademiaModel = require('../models/exercicioAcademiaModel');
const solicitacaoModel = require('../models/solicitacaoModel');

// --- EXERCICIOS ACADEMIA ---

async function listarExercicios(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const result = await exercicioAcademiaModel.listar(connection);
        const exercicios = result.rows.map(row => ({
            id_exercicio: row[0],
            no_exercicio: row[1],
            tx_url: row[2],
            qt_calorias: row[3],
            no_musculo: row[4],
            no_treino: row[5]
        }));
        res.json({ success: true, exercicios });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao listar exercicios." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function criarExercicio(req, res) {
    const { no_exercicio, tx_url, qt_calorias, no_musculo, no_treino } = req.body;
    if (!no_exercicio || !no_exercicio.trim()) {
        return res.status(400).json({ success: false, message: "Nome do exercicio e obrigatorio." });
    }
    let connection;
    try {
        connection = await getConnection();
        await exercicioAcademiaModel.criar(connection, { no_exercicio: no_exercicio.trim(), tx_url, qt_calorias, no_musculo, no_treino });
        res.json({ success: true, message: "Exercicio criado!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao criar exercicio." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function atualizarExercicio(req, res) {
    const id = Number(req.params.id);
    const { no_exercicio, tx_url, qt_calorias, no_musculo, no_treino } = req.body;
    if (!no_exercicio || !no_exercicio.trim()) {
        return res.status(400).json({ success: false, message: "Nome do exercicio e obrigatorio." });
    }
    let connection;
    try {
        connection = await getConnection();
        const result = await exercicioAcademiaModel.atualizar(connection, id, { no_exercicio: no_exercicio.trim(), tx_url, qt_calorias, no_musculo, no_treino });
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: "Exercicio nao encontrado." });
        }
        res.json({ success: true, message: "Exercicio atualizado!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao atualizar exercicio." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function excluirExercicio(req, res) {
    const id = Number(req.params.id);
    let connection;
    try {
        connection = await getConnection();
        const result = await exercicioAcademiaModel.excluir(connection, id);
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: "Exercicio nao encontrado." });
        }
        res.json({ success: true, message: "Exercicio excluido!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao excluir exercicio." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function listarTreinosDistinct(req, res) {
    let connection;
    try {
        connection = await getConnection();
        // Se vier id_usuario na query, usa ele (caso do treinador vendo aluno), senao usa o da sessao
        const idUsuario = req.query.id_usuario ? Number(req.query.id_usuario) : req.session.usuario.id_usuario;

        const result = await exercicioAcademiaModel.listarTreinosDistinct(connection, idUsuario);
        const treinos = result.rows.map(row => row[0]);
        res.json({ success: true, treinos });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao listar tipos de treino." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function listarExerciciosPorTreino(req, res) {
    const noTreino = req.query.no_treino || '';
    let connection;
    try {
        connection = await getConnection();
        const result = await exercicioAcademiaModel.listarPorTreino(connection, noTreino);
        const exercicios = result.rows.map(row => ({
            id_exercicio: row[0],
            no_exercicio: row[1],
            tx_url: row[2],
            qt_calorias: row[3],
            no_musculo: row[4],
            no_treino: row[5]
        }));
        res.json({ success: true, exercicios });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao listar exercicios academia." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

// --- VINCULOS ALUNO-TREINADOR ---

async function listarTreinadores(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const result = await solicitacaoModel.listarTreinadores(connection);
        const treinadores = result.rows.map(row => ({
            id_usuario: row[0],
            no_usuario: row[1],
            tx_email: row[2]
        }));
        res.json({ success: true, treinadores });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao listar treinadores." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function alunosTreinador(req, res) {
    const idTreinador = Number(req.params.id);
    let connection;
    try {
        connection = await getConnection();
        const result = await solicitacaoModel.listarAlunos(connection, idTreinador);
        const alunos = result.rows.map(row => ({
            id_usuario: row[0],
            no_usuario: row[1],
            tx_email: row[2]
        }));
        res.json({ success: true, alunos });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao listar alunos do treinador." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function listarSemTreinador(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const result = await solicitacaoModel.listarUsuariosSemTreinador(connection);
        const usuarios = result.rows.map(row => ({
            id_usuario: row[0],
            no_usuario: row[1],
            tx_email: row[2]
        }));
        res.json({ success: true, usuarios });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao listar usuarios sem treinador." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function vincular(req, res) {
    const { id_usuario, id_treinador } = req.body;
    if (!id_usuario || !id_treinador) {
        return res.status(400).json({ success: false, message: "Informe usuario e treinador." });
    }
    let connection;
    try {
        connection = await getConnection();
        await solicitacaoModel.vincularAdmin(connection, Number(id_usuario), Number(id_treinador));
        res.json({ success: true, message: "Vinculo criado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao vincular." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function desvincular(req, res) {
    const idUsuario = Number(req.params.id_usuario);
    const idTreinador = Number(req.params.id_treinador);
    let connection;
    try {
        connection = await getConnection();
        await solicitacaoModel.desvincular(connection, idUsuario, idTreinador);
        res.json({ success: true, message: "Vinculo removido!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao desvincular." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

module.exports = {
    listarExercicios, criarExercicio, atualizarExercicio, excluirExercicio,
    listarTreinosDistinct, listarExerciciosPorTreino,
    listarTreinadores, alunosTreinador, listarSemTreinador, vincular, desvincular
};
