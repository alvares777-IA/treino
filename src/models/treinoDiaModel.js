async function buscarExercicios(conn, idTreino) {
    const sql = `
        SELECT id_exercicio, qt_series, nr_peso, qt_repeticao, qt_calorias
        FROM campeonato.exercicios
        WHERE id_treino = :v_treino
        ORDER BY nr_ordem, no_exercicio
    `;
    return await conn.execute(sql, { v_treino: idTreino });
}

async function registrarSemExercicios(conn, idUsuario, idTreino) {
    const sql = `
        INSERT INTO campeonato.treino_dia (id_treino_dia, id_usuario, id_treino, id_exercicio, dt_treino)
        VALUES (campeonato.TREINO_DIA_SEQ.NEXTVAL, :v_usuario, :v_treino, 0, SYSDATE)
    `;
    return await conn.execute(sql, {
        v_usuario: idUsuario,
        v_treino: idTreino
    });
}

async function registrarComExercicio(conn, idUsuario, idTreino, exercicio) {
    const sql = `
        INSERT INTO campeonato.treino_dia (id_treino_dia, id_usuario, id_treino, id_exercicio, qt_series, nr_peso, qt_repeticao, qt_calorias, dt_treino)
        VALUES (campeonato.TREINO_DIA_SEQ.NEXTVAL, :v_usuario, :v_treino, :v_exercicio, :v_qt_series, :v_nr_peso, :v_qt_repeticao, :v_qt_calorias, SYSDATE)
    `;
    return await conn.execute(sql, {
        v_usuario: idUsuario,
        v_treino: idTreino,
        v_exercicio: exercicio[0],
        v_qt_series: exercicio[1],
        v_nr_peso: exercicio[2],
        v_qt_repeticao: exercicio[3],
        v_qt_calorias: exercicio[4] || null
    });
}

async function listarHistorico(conn, idUsuario, dtInicio, dtFim) {
    const sql = `
        SELECT td.id_treino_dia,
               t.no_treino,
               TO_CHAR(td.dt_treino, 'DD/MM/YYYY HH24:MI') AS dt_treino,
               td.id_treino,
               e.no_exercicio,
               td.qt_series,
               td.nr_peso,
               td.qt_repeticao,
               td.qt_calorias
        FROM campeonato.treino_dia td
        JOIN campeonato.treinos t ON t.id_treino = td.id_treino AND t.id_usuario = td.id_usuario
        LEFT JOIN campeonato.exercicios e ON e.id_treino = td.id_treino AND e.id_exercicio = td.id_exercicio
        WHERE td.id_usuario = :v_usuario
        AND td.dt_treino >= TO_DATE(:v_dt_inicio, 'YYYY-MM-DD')
        AND td.dt_treino < TO_DATE(:v_dt_fim, 'YYYY-MM-DD') + 1
        ORDER BY td.dt_treino DESC, e.no_exercicio
    `;
    return await conn.execute(sql, { v_usuario: idUsuario, v_dt_inicio: dtInicio, v_dt_fim: dtFim });
}

async function verificarTreinoHoje(conn, idUsuario, idTreino) {
    const sql = `
        SELECT 1 FROM campeonato.treino_dia
        WHERE id_usuario = :v_usuario
        AND id_treino = :v_treino
        AND TRUNC(dt_treino) = TRUNC(SYSDATE)
        AND ROWNUM = 1
    `;
    const result = await conn.execute(sql, { v_usuario: idUsuario, v_treino: idTreino });
    return result.rows.length > 0;
}

async function atualizarRegistro(conn, idTreinoDia, idUsuario, dados) {
    const sql = `
        UPDATE campeonato.treino_dia
        SET qt_series = :v_series, nr_peso = :v_peso, qt_repeticao = :v_repeticao, qt_calorias = :v_calorias
        WHERE id_treino_dia = :v_id
        AND id_usuario = :v_usuario
    `;
    return await conn.execute(sql, {
        v_series: dados.qt_series || null,
        v_peso: dados.nr_peso || null,
        v_repeticao: dados.qt_repeticao || null,
        v_calorias: dados.qt_calorias || null,
        v_id: idTreinoDia,
        v_usuario: idUsuario
    }, { autoCommit: true });
}

async function excluirRegistro(conn, idTreinoDia, idUsuario) {
    const sql = `
        DELETE FROM campeonato.treino_dia
        WHERE id_treino_dia = :v_id
        AND id_usuario = :v_usuario
    `;
    return await conn.execute(sql, {
        v_id: idTreinoDia,
        v_usuario: idUsuario
    }, { autoCommit: true });
}

module.exports = { buscarExercicios, registrarSemExercicios, registrarComExercicio, listarHistorico, verificarTreinoHoje, atualizarRegistro, excluirRegistro };
