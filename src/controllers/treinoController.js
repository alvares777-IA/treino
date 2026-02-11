const { getConnection } = require('../config/database');
const treinoModel = require('../models/treinoModel');
const solicitacaoModel = require('../models/solicitacaoModel');

async function resolverUsuarioAlvo(req, conn) {
    const idAlvo = req.query.id_usuario ? Number(req.query.id_usuario) : null;
    if (!idAlvo || idAlvo === req.session.usuario.id_usuario) {
        return req.session.usuario.id_usuario;
    }
    if (req.session.usuario.ao_tipo !== 'TRE' && req.session.usuario.ao_tipo !== 'ADM') {
        return null;
    }
    const vinculo = await solicitacaoModel.verificarVinculo(conn, idAlvo, req.session.usuario.id_usuario);
    return vinculo ? idAlvo : null;
}

async function listar(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const idUsuario = await resolverUsuarioAlvo(req, connection);
        if (idUsuario === null) {
            return res.status(403).json({ success: false, message: "Sem permissao para acessar treinos deste usuario." });
        }
        const result = await treinoModel.listar(connection, idUsuario);
        const treinos = result.rows.map(row => ({
            no_treino: row[0],
            id_treino: row[1],
            total_calorias: row[2]
        }));
        res.json({ success: true, treinos });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao buscar treinos." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function criar(req, res) {
    const { no_treino } = req.body;
    if (!no_treino || !no_treino.trim()) {
        return res.status(400).json({ success: false, message: "Nome do treino e obrigatorio." });
    }
    let connection;
    try {
        connection = await getConnection();
        const idUsuario = await resolverUsuarioAlvo(req, connection);
        if (idUsuario === null) {
            return res.status(403).json({ success: false, message: "Sem permissao para criar treinos para este usuario." });
        }
        const novoId = await treinoModel.criar(connection, idUsuario, no_treino.trim());
        res.json({ success: true, message: "Treino criado com sucesso!", id_treino: novoId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao criar treino." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function atualizar(req, res) {
    const { no_treino } = req.body;
    if (!no_treino || !no_treino.trim()) {
        return res.status(400).json({ success: false, message: "Nome do treino e obrigatorio." });
    }
    let connection;
    try {
        connection = await getConnection();
        const idUsuario = await resolverUsuarioAlvo(req, connection);
        if (idUsuario === null) {
            return res.status(403).json({ success: false, message: "Sem permissao para atualizar treinos deste usuario." });
        }
        await treinoModel.atualizar(connection, req.params.id_treino, idUsuario, no_treino.trim());
        res.json({ success: true, message: "Treino atualizado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao atualizar treino." });
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
        const idUsuario = await resolverUsuarioAlvo(req, connection);
        if (idUsuario === null) {
            return res.status(403).json({ success: false, message: "Sem permissao para excluir treinos deste usuario." });
        }
        await treinoModel.excluir(connection, req.params.id_treino, idUsuario);
        res.json({ success: true, message: "Treino excluido com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao excluir treino." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function atribuir(req, res) {
    const { id_treino, id_usuario_destino } = req.body;
    if (!id_treino || !id_usuario_destino) {
        return res.status(400).json({ success: false, message: "Treino e aluno sao obrigatorios." });
    }
    if (req.session.usuario.ao_tipo !== 'TRE' && req.session.usuario.ao_tipo !== 'ADM') {
        return res.status(403).json({ success: false, message: "Apenas treinadores podem atribuir treinos." });
    }
    let connection;
    try {
        connection = await getConnection();

        const vinculo = await solicitacaoModel.verificarVinculo(connection, id_usuario_destino, req.session.usuario.id_usuario);
        if (!vinculo) {
            return res.status(403).json({ success: false, message: "Voce nao possui vinculo com este aluno." });
        }

        const resultado = await treinoModel.clonarParaAluno(connection, id_treino, id_usuario_destino);
        if (!resultado) {
            return res.status(404).json({ success: false, message: "Treino nao encontrado." });
        }
        if (resultado.duplicado) {
            return res.status(409).json({ success: false, message: 'O aluno ja possui um treino com o nome "' + resultado.nomeTreino + '".' });
        }

        res.json({ success: true, message: 'Treino "' + resultado.nomeTreino + '" atribuido com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao atribuir treino." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

module.exports = { listar, criar, atualizar, excluir, atribuir };
