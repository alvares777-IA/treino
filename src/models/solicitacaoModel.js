async function criar(conn, idUsuario, idTreinador) {
    const sqlId = `SELECT NVL(MAX(id_solicitacao), 0) + 1 FROM campeonato.solicitacao_treinador`;
    const resId = await conn.execute(sqlId);
    const novoId = resId.rows[0][0];

    const sql = `
        INSERT INTO campeonato.solicitacao_treinador (id_solicitacao, id_usuario, id_treinador, ao_status, dt_solicitacao)
        VALUES (:v_id, :v_usuario, :v_treinador, 'P', SYSDATE)
    `;
    await conn.execute(sql, {
        v_id: novoId,
        v_usuario: idUsuario,
        v_treinador: idTreinador
    }, { autoCommit: true });

    return novoId;
}

async function listarPendentes(conn, idTreinador) {
    const sql = `
        SELECT s.id_solicitacao, s.id_usuario, u.no_usuario, u.tx_email,
               TO_CHAR(s.dt_solicitacao, 'DD/MM/YYYY HH24:MI') AS dt_solicitacao
        FROM campeonato.solicitacao_treinador s
        JOIN campeonato.usuarios u ON u.id_usuario = s.id_usuario
        WHERE s.id_treinador = :v_treinador
        AND s.ao_status = 'P'
        ORDER BY s.dt_solicitacao DESC
    `;
    return await conn.execute(sql, { v_treinador: idTreinador });
}

async function responder(conn, idSolicitacao, idTreinador, status) {
    const sql = `
        UPDATE campeonato.solicitacao_treinador
        SET ao_status = :v_status, dt_resposta = SYSDATE
        WHERE id_solicitacao = :v_id
        AND id_treinador = :v_treinador
        AND ao_status = 'P'
    `;
    return await conn.execute(sql, {
        v_status: status,
        v_id: idSolicitacao,
        v_treinador: idTreinador
    }, { autoCommit: true });
}

async function buscarVinculo(conn, idUsuario) {
    const sql = `
        SELECT s.id_treinador, u.no_usuario, u.tx_email
        FROM campeonato.solicitacao_treinador s
        JOIN campeonato.usuarios u ON u.id_usuario = s.id_treinador
        WHERE s.id_usuario = :v_usuario
        AND s.ao_status = 'A'
        AND ROWNUM = 1
    `;
    return await conn.execute(sql, { v_usuario: idUsuario });
}

async function listarAlunos(conn, idTreinador) {
    const sql = `
        SELECT u.id_usuario, u.no_usuario, u.tx_email
        FROM campeonato.solicitacao_treinador s
        JOIN campeonato.usuarios u ON u.id_usuario = s.id_usuario
        WHERE s.id_treinador = :v_treinador
        AND s.ao_status = 'A'
        ORDER BY u.no_usuario
    `;
    return await conn.execute(sql, { v_treinador: idTreinador });
}

async function listarAlunosSemTreino(conn, idTreinador, nomeTreino) {
    const sql = `
        SELECT u.id_usuario, u.no_usuario, u.tx_email
        FROM campeonato.solicitacao_treinador s
        JOIN campeonato.usuarios u ON u.id_usuario = s.id_usuario
        WHERE s.id_treinador = :v_treinador
        AND s.ao_status = 'A'
        AND NOT EXISTS (
            SELECT 1 FROM campeonato.treinos t
            WHERE t.id_usuario = u.id_usuario
            AND UPPER(TRIM(t.no_treino)) = UPPER(TRIM(:v_nome))
        )
        ORDER BY u.no_usuario
    `;
    return await conn.execute(sql, { v_treinador: idTreinador, v_nome: nomeTreino });
}

async function buscarTreinadorPorEmail(conn, email) {
    const sql = `
        SELECT id_usuario, no_usuario, tx_email
        FROM campeonato.usuarios
        WHERE UPPER(TRIM(tx_email)) = UPPER(TRIM(:v_email))
        AND ao_tipo = 'TRE'
        AND ao_ativo = 'A'
    `;
    return await conn.execute(sql, { v_email: email });
}

async function verificarVinculo(conn, idUsuario, idTreinador) {
    const sql = `
        SELECT 1 FROM campeonato.solicitacao_treinador
        WHERE id_usuario = :v_usuario
        AND id_treinador = :v_treinador
        AND ao_status = 'A'
        AND ROWNUM = 1
    `;
    const result = await conn.execute(sql, { v_usuario: idUsuario, v_treinador: idTreinador });
    return result.rows.length > 0;
}

async function desvincular(conn, idUsuario, idTreinador) {
    const sql = `
        UPDATE campeonato.solicitacao_treinador
        SET ao_status = 'D', dt_resposta = SYSDATE
        WHERE id_usuario = :v_usuario
        AND id_treinador = :v_treinador
        AND ao_status = 'A'
    `;
    return await conn.execute(sql, {
        v_usuario: idUsuario,
        v_treinador: idTreinador
    }, { autoCommit: true });
}

async function contarPendentes(conn, idTreinador) {
    const sql = `
        SELECT COUNT(*) FROM campeonato.solicitacao_treinador
        WHERE id_treinador = :v_treinador
        AND ao_status = 'P'
    `;
    const result = await conn.execute(sql, { v_treinador: idTreinador });
    return result.rows[0][0];
}

async function listarTreinadores(conn) {
    const sql = `
        SELECT id_usuario, no_usuario, tx_email
        FROM campeonato.usuarios
        WHERE ao_tipo = 'TRE'
        AND ao_ativo = 'A'
        ORDER BY no_usuario
    `;
    return await conn.execute(sql);
}

async function listarUsuariosSemTreinador(conn) {
    const sql = `
        select id_usuario, 
                no_usuario||(case when no_treinador is not null then '('||no_treinador||')' else null end) no_usuario, 
                tx_email
            from (
            SELECT (SELECT max(u.no_usuario)
                      FROM campeonato.solicitacao_treinador s
                      join campeonato.usuarios u
                        on u.id_usuario=s.id_treinador
                     WHERE s.id_usuario = campeonato.usuarios.id_usuario
                       AND s.ao_status = 'A'
                    ) no_treinador ,
                    id_usuario, 
                    no_usuario, 
                    tx_email
               FROM campeonato.usuarios
              WHERE ao_ativo = 'A')
            ORDER BY (case when no_treinador is not null then 2 else 1 end), no_usuario
    `;
    return await conn.execute(sql);
}

async function vincularAdmin(conn, idUsuario, idTreinador) {
    const sqlId = `SELECT NVL(MAX(id_solicitacao), 0) + 1 FROM campeonato.solicitacao_treinador`;
    const resId = await conn.execute(sqlId);
    const novoId = resId.rows[0][0];

    const sql = `
        INSERT INTO campeonato.solicitacao_treinador (id_solicitacao, id_usuario, id_treinador, ao_status, dt_solicitacao, dt_resposta)
        VALUES (:v_id, :v_usuario, :v_treinador, 'A', SYSDATE, SYSDATE)
    `;
    await conn.execute(sql, {
        v_id: novoId,
        v_usuario: idUsuario,
        v_treinador: idTreinador
    }, { autoCommit: true });

    return novoId;
}

module.exports = {
    criar,
    listarPendentes,
    responder,
    buscarVinculo,
    listarAlunos,
    listarAlunosSemTreino,
    buscarTreinadorPorEmail,
    verificarVinculo,
    contarPendentes,
    desvincular,
    listarTreinadores,
    listarUsuariosSemTreinador,
    vincularAdmin
};
