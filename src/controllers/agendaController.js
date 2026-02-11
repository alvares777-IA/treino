const { getConnection } = require('../config/database');
const agendaModel = require('../models/agendaModel');
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
            return res.status(403).json({ success: false, message: "Sem permissao para acessar agenda deste usuario." });
        }
        const result = await agendaModel.listar(connection, idUsuario);
        const agendas = result.rows.map(row => ({
            id_agenda: row[0],
            id_treino: row[1],
            no_treino: row[2],
            dt_treino: row[3],
            tx_observacao: row[4]
        }));
        res.json({ success: true, agendas });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao buscar agenda." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function criar(req, res) {
    const { id_treino, dt_treino, tx_observacao } = req.body;
    if (!id_treino || !dt_treino) {
        return res.status(400).json({ success: false, message: "Treino e data sao obrigatorios." });
    }
    let connection;
    try {
        connection = await getConnection();
        const idUsuario = await resolverUsuarioAlvo(req, connection);
        if (idUsuario === null) {
            return res.status(403).json({ success: false, message: "Sem permissao para criar agenda para este usuario." });
        }
        await agendaModel.criar(connection, { idUsuario, idTreino: id_treino, dtTreino: dt_treino, txObservacao: tx_observacao });
        res.json({ success: true, message: "Agendamento criado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao criar agendamento." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function atualizar(req, res) {
    const { id_treino, dt_treino, tx_observacao } = req.body;
    if (!id_treino || !dt_treino) {
        return res.status(400).json({ success: false, message: "Treino e data sao obrigatorios." });
    }
    let connection;
    try {
        connection = await getConnection();
        const idUsuario = await resolverUsuarioAlvo(req, connection);
        if (idUsuario === null) {
            return res.status(403).json({ success: false, message: "Sem permissao para atualizar agenda deste usuario." });
        }
        await agendaModel.atualizar(connection, req.params.id, idUsuario, { idTreino: id_treino, dtTreino: dt_treino, txObservacao: tx_observacao });
        res.json({ success: true, message: "Agendamento atualizado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao atualizar agendamento." });
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
            return res.status(403).json({ success: false, message: "Sem permissao para excluir agenda deste usuario." });
        }
        await agendaModel.excluir(connection, req.params.id, idUsuario);
        res.json({ success: true, message: "Agendamento excluido com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao excluir agendamento." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function clonar(req, res) {
    const { dt_treino } = req.body;
    if (!dt_treino) {
        return res.status(400).json({ success: false, message: "Nova data e obrigatoria." });
    }
    let connection;
    try {
        connection = await getConnection();
        const idUsuario = await resolverUsuarioAlvo(req, connection);
        if (idUsuario === null) {
            return res.status(403).json({ success: false, message: "Sem permissao." });
        }
        await agendaModel.clonar(connection, req.params.id, idUsuario, dt_treino);
        res.json({ success: true, message: "Agendamento clonado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao clonar agendamento." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function repetir(req, res) {
    const { dt_treino, qt_repeticoes } = req.body;
    if (!dt_treino || !qt_repeticoes || qt_repeticoes < 1) {
        return res.status(400).json({ success: false, message: "Data inicio e quantidade de repeticoes sao obrigatorios." });
    }
    if (qt_repeticoes > 52) {
        return res.status(400).json({ success: false, message: "Maximo de 52 repeticoes." });
    }
    let connection;
    try {
        connection = await getConnection();
        const idUsuario = await resolverUsuarioAlvo(req, connection);
        if (idUsuario === null) {
            return res.status(403).json({ success: false, message: "Sem permissao." });
        }
        const total = await agendaModel.repetir(connection, req.params.id, idUsuario, dt_treino, qt_repeticoes);
        if (total === null) {
            return res.status(404).json({ success: false, message: "Agendamento nao encontrado." });
        }
        res.json({ success: true, message: total + " agendamento(s) criado(s) com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao repetir agendamento." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

module.exports = { listar, criar, atualizar, excluir, clonar, repetir };
