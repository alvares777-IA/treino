async function listar(conn, idUsuario) {
    const sql = `
        SELECT a.id_agenda, a.id_treino, t.no_treino,
               TO_CHAR(a.dt_treino, 'YYYY-MM-DD') AS dt_treino,
               a.tx_observacao
        FROM campeonato.treino_agenda a
        LEFT JOIN campeonato.treinos t ON t.id_treino = a.id_treino
        WHERE a.id_usuario = :v_id
        ORDER BY a.dt_treino
    `;
    return await conn.execute(sql, { v_id: idUsuario });
}

async function buscarPorId(conn, idAgenda, idUsuario) {
    const sql = `
        SELECT a.id_agenda, a.id_treino, t.no_treino,
               TO_CHAR(a.dt_treino, 'YYYY-MM-DD') AS dt_treino,
               a.tx_observacao
        FROM campeonato.treino_agenda a
        LEFT JOIN campeonato.treinos t ON t.id_treino = a.id_treino
        WHERE a.id_agenda = :v_id_agenda
        AND a.id_usuario = :v_id_usuario
    `;
    const result = await conn.execute(sql, { v_id_agenda: idAgenda, v_id_usuario: idUsuario });
    return result.rows.length > 0 ? result.rows[0] : null;
}

async function criar(conn, { idUsuario, idTreino, dtTreino, txObservacao }) {
    const sql = `
        INSERT INTO campeonato.treino_agenda (id_agenda, id_usuario, id_treino, dt_treino, tx_observacao)
        VALUES (campeonato.treino_agenda_seq.NEXTVAL, :v_usuario, :v_treino, TO_DATE(:v_dt, 'YYYY-MM-DD'), :v_obs)
    `;
    await conn.execute(sql, {
        v_usuario: idUsuario,
        v_treino: idTreino,
        v_dt: dtTreino,
        v_obs: txObservacao || null
    }, { autoCommit: true });
}

async function atualizar(conn, idAgenda, idUsuario, { idTreino, dtTreino, txObservacao }) {
    const sql = `
        UPDATE campeonato.treino_agenda
        SET id_treino = :v_treino,
            dt_treino = TO_DATE(:v_dt, 'YYYY-MM-DD'),
            tx_observacao = :v_obs
        WHERE id_agenda = :v_id_agenda
        AND id_usuario = :v_id_usuario
    `;
    return await conn.execute(sql, {
        v_treino: idTreino,
        v_dt: dtTreino,
        v_obs: txObservacao || null,
        v_id_agenda: idAgenda,
        v_id_usuario: idUsuario
    }, { autoCommit: true });
}

async function excluir(conn, idAgenda, idUsuario) {
    const sql = `
        DELETE FROM campeonato.treino_agenda
        WHERE id_agenda = :v_id_agenda
        AND id_usuario = :v_id_usuario
    `;
    return await conn.execute(sql, {
        v_id_agenda: idAgenda,
        v_id_usuario: idUsuario
    }, { autoCommit: true });
}

async function clonar(conn, idAgenda, idUsuario, novaData) {
    const sql = `
        INSERT INTO campeonato.treino_agenda (id_agenda, id_usuario, id_treino, dt_treino, tx_observacao)
        SELECT campeonato.treino_agenda_seq.NEXTVAL, id_usuario, id_treino, TO_DATE(:v_dt, 'YYYY-MM-DD'), tx_observacao
        FROM campeonato.treino_agenda
        WHERE id_agenda = :v_id_agenda
        AND id_usuario = :v_id_usuario
    `;
    return await conn.execute(sql, {
        v_dt: novaData,
        v_id_agenda: idAgenda,
        v_id_usuario: idUsuario
    }, { autoCommit: true });
}

async function repetir(conn, idAgenda, idUsuario, dataInicio, qtRepeticoes) {
    const agenda = await buscarPorId(conn, idAgenda, idUsuario);
    if (!agenda) return null;

    for (let i = 0; i < qtRepeticoes; i++) {
        // Garantimos que estamos partindo da data original e adicionando os dias
        const dt = new Date(dataInicio);
        
        // Usamos UTC para evitar que mudanças de horário de verão ou fuso local 
        // alterem o valor do dia inesperadamente
        dt.setUTCDate(dt.getUTCDate() + (i * 7));
        
        // Formatação manual YYYY-MM-DD para evitar o desvio do toISOString()
        const ano = dt.getUTCFullYear();
        const mes = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const dia = String(dt.getUTCDate()).padStart(2, '0');
        const dtStr = `${ano}-${mes}-${dia}`;

        const sql = `
            INSERT INTO campeonato.treino_agenda (id_agenda, id_usuario, id_treino, dt_treino, tx_observacao)
            VALUES (campeonato.treino_agenda_seq.NEXTVAL, :v_usuario, :v_treino, TO_DATE(:v_dt, 'YYYY-MM-DD'), :v_obs)
        `;

        await conn.execute(sql, {
            v_usuario: idUsuario,
            v_treino: agenda[1],
            v_dt: dtStr,
            v_obs: agenda[4] || null
        }, { autoCommit: true });
    }
    return qtRepeticoes;
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir, clonar, repetir };
