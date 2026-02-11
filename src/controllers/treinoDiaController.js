const { getConnection } = require('../config/database');
const treinoDiaModel = require('../models/treinoDiaModel');
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

async function registrar(req, res) {
    const { id_treino, confirmar } = req.body;
    if (!id_treino) {
        return res.status(400).json({ success: false, message: "Treino nao informado." });
    }
    // Treinador NAO pode registrar treino-dia pelo aluno
    if (req.query.id_usuario && Number(req.query.id_usuario) !== req.session.usuario.id_usuario) {
        return res.status(403).json({ success: false, message: "Apenas o proprio usuario pode registrar treino do dia." });
    }
    let connection;
    try {
        connection = await getConnection();

        // Verificar se ja registrou hoje (e nao veio confirmacao)
        if (!confirmar) {
            const jaRegistrou = await treinoDiaModel.verificarTreinoHoje(connection, req.session.usuario.id_usuario, id_treino);
            if (jaRegistrou) {
                return res.json({ success: false, ja_registrado: true, message: "Voce ja registrou este treino hoje. Deseja registrar novamente?" });
            }
        }

        const resEx = await treinoDiaModel.buscarExercicios(connection, id_treino);

        if (resEx.rows.length === 0) {
            await treinoDiaModel.registrarSemExercicios(connection, req.session.usuario.id_usuario, id_treino);
        } else {
            for (const row of resEx.rows) {
                await treinoDiaModel.registrarComExercicio(connection, req.session.usuario.id_usuario, id_treino, row);
            }
        }
        await connection.commit();
        res.json({ success: true, message: "Treino do dia registrado!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao registrar treino do dia." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function listar(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const idUsuario = await resolverUsuarioAlvo(req, connection);
        if (idUsuario === null) {
            return res.status(403).json({ success: false, message: "Sem permissao para acessar historico deste usuario." });
        }
        // Default: ultimos 7 dias
        var hoje = new Date();
        var seteDiasAtras = new Date();
        seteDiasAtras.setDate(hoje.getDate() - 7);
        var dtInicio = req.query.dt_inicio || seteDiasAtras.toISOString().substring(0, 10);
        var dtFim = req.query.dt_fim || hoje.toISOString().substring(0, 10);
        const result = await treinoDiaModel.listarHistorico(connection, idUsuario, dtInicio, dtFim);
        const historico = result.rows.map(row => ({
            id_treino_dia: row[0],
            no_treino: row[1],
            dt_treino: row[2],
            id_treino: row[3],
            no_exercicio: row[4],
            qt_series: row[5],
            nr_peso: row[6],
            qt_repeticao: row[7],
            qt_calorias: row[8]
        }));
        res.json({ success: true, historico });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao buscar historico." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function atualizar(req, res) {
    const idTreinoDia = Number(req.params.id_treino_dia);
    const { qt_series, nr_peso, qt_repeticao, qt_calorias } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const result = await treinoDiaModel.atualizarRegistro(connection, idTreinoDia, req.session.usuario.id_usuario, {
            qt_series, nr_peso, qt_repeticao, qt_calorias
        });
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: "Registro nao encontrado ou sem permissao." });
        }
        res.json({ success: true, message: "Registro atualizado!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao atualizar registro." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function excluir(req, res) {
    const idTreinoDia = Number(req.params.id_treino_dia);
    let connection;
    try {
        connection = await getConnection();
        const result = await treinoDiaModel.excluirRegistro(connection, idTreinoDia, req.session.usuario.id_usuario);
        if (result.rowsAffected === 0) {
            return res.status(404).json({ success: false, message: "Registro nao encontrado ou sem permissao." });
        }
        res.json({ success: true, message: "Registro excluido!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao excluir registro." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

module.exports = { registrar, listar, atualizar, excluir };
