const { getConnection } = require('../config/database');
const solicitacaoModel = require('../models/solicitacaoModel');

async function solicitar(req, res) {
    const { tx_email_treinador } = req.body;
    if (!tx_email_treinador || !tx_email_treinador.trim()) {
        return res.status(400).json({ success: false, message: "E-mail do treinador e obrigatorio." });
    }
    let connection;
    try {
        connection = await getConnection();

        const resTreinador = await solicitacaoModel.buscarTreinadorPorEmail(connection, tx_email_treinador.trim());
        if (resTreinador.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Treinador nao encontrado com esse e-mail." });
        }

        const idTreinador = resTreinador.rows[0][0];
        if (idTreinador === req.session.usuario.id_usuario) {
            return res.status(400).json({ success: false, message: "Voce nao pode solicitar a si mesmo como treinador." });
        }

        const vinculo = await solicitacaoModel.buscarVinculo(connection, req.session.usuario.id_usuario);
        if (vinculo.rows.length > 0) {
            return res.status(400).json({ success: false, message: "Voce ja possui um treinador vinculado." });
        }

        await solicitacaoModel.criar(connection, req.session.usuario.id_usuario, idTreinador);
        res.json({ success: true, message: "Solicitacao enviada com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao enviar solicitacao." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function listarPendentes(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const result = await solicitacaoModel.listarPendentes(connection, req.session.usuario.id_usuario);
        const solicitacoes = result.rows.map(row => ({
            id_solicitacao: row[0],
            id_usuario: row[1],
            no_usuario: row[2],
            tx_email: row[3],
            dt_solicitacao: row[4]
        }));
        res.json({ success: true, solicitacoes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao buscar solicitacoes." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function responder(req, res) {
    const { ao_status } = req.body;
    const idSolicitacao = Number(req.params.id);
    if (!ao_status || !['A', 'R'].includes(ao_status)) {
        return res.status(400).json({ success: false, message: "Status invalido." });
    }
    let connection;
    try {
        connection = await getConnection();
        const result = await solicitacaoModel.responder(connection, idSolicitacao, req.session.usuario.id_usuario, ao_status);
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: "Solicitacao nao encontrada ou ja respondida." });
        }
        res.json({ success: true, message: ao_status === 'A' ? "Solicitacao aceita!" : "Solicitacao rejeitada." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao responder solicitacao." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function meusAlunos(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const nomeTreino = req.query.no_treino ? req.query.no_treino.trim() : null;
        let result;
        if (nomeTreino) {
            result = await solicitacaoModel.listarAlunosSemTreino(connection, req.session.usuario.id_usuario, nomeTreino);
        } else {
            result = await solicitacaoModel.listarAlunos(connection, req.session.usuario.id_usuario);
        }
        const alunos = result.rows.map(row => ({
            id_usuario: row[0],
            no_usuario: row[1],
            tx_email: row[2]
        }));
        res.json({ success: true, alunos });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao buscar alunos." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function meuTreinador(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const result = await solicitacaoModel.buscarVinculo(connection, req.session.usuario.id_usuario);
        if (result.rows.length === 0) {
            return res.json({ success: true, treinador: null });
        }
        res.json({
            success: true,
            treinador: {
                id_usuario: result.rows[0][0],
                no_usuario: result.rows[0][1],
                tx_email: result.rows[0][2]
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao buscar treinador." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function contarPendentes(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const count = await solicitacaoModel.contarPendentes(connection, req.session.usuario.id_usuario);
        res.json({ success: true, count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao contar solicitacoes." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function desvincularAluno(req, res) {
    const idUsuario = Number(req.params.id_usuario);
    if (!idUsuario) {
        return res.status(400).json({ success: false, message: "ID do aluno invalido." });
    }
    let connection;
    try {
        connection = await getConnection();
        const result = await solicitacaoModel.desvincular(connection, idUsuario, req.session.usuario.id_usuario);
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: "Vinculo nao encontrado." });
        }
        res.json({ success: true, message: "Aluno desvinculado com sucesso." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao desvincular aluno." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function abandonarTreinador(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const vinculo = await solicitacaoModel.buscarVinculo(connection, req.session.usuario.id_usuario);
        if (vinculo.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Voce nao possui treinador vinculado." });
        }
        const idTreinador = vinculo.rows[0][0];
        const result = await solicitacaoModel.desvincular(connection, req.session.usuario.id_usuario, idTreinador);
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: "Vinculo nao encontrado." });
        }
        res.json({ success: true, message: "Treinador desvinculado com sucesso." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao abandonar treinador." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

module.exports = { solicitar, listarPendentes, responder, meusAlunos, meuTreinador, contarPendentes, desvincularAluno, abandonarTreinador };
