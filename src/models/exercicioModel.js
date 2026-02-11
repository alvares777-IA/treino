async function listar(conn, idTreino) {
    const sql = `
        SELECT id_exercicio, no_exercicio, tx_url, qt_series, nr_peso, qt_repeticao, nr_ordem, qt_calorias, no_musculo
        FROM campeonato.exercicios
        WHERE id_treino = :v_treino
        ORDER BY nr_ordem, no_exercicio
    `;
    return await conn.execute(sql, { v_treino: idTreino });
}

async function criar(conn, dados) {
    const sqlId = `SELECT NVL(MAX(id_exercicio), 0) + 1 FROM campeonato.exercicios WHERE id_treino = :v_treino`;
    const resId = await conn.execute(sqlId, { v_treino: dados.id_treino });
    const novoId = resId.rows[0][0];

    const sqlInsert = `
        INSERT INTO campeonato.exercicios (id_treino, id_exercicio, no_exercicio, tx_url, qt_series, nr_peso, qt_repeticao, nr_ordem, qt_calorias, no_musculo)
        VALUES (:v_treino, :v_id_exercicio, :v_no_exercicio, :v_tx_url, :v_qt_series, :v_nr_peso, :v_qt_repeticao, :v_nr_ordem, :v_qt_calorias, :v_no_musculo)
    `;
    await conn.execute(sqlInsert, {
        v_treino: dados.id_treino,
        v_id_exercicio: novoId,
        v_no_exercicio: dados.no_exercicio,
        v_tx_url: dados.tx_url || null,
        v_qt_series: dados.qt_series || null,
        v_nr_peso: dados.nr_peso || null,
        v_qt_repeticao: dados.qt_repeticao || null,
        v_nr_ordem: dados.nr_ordem || null,
        v_qt_calorias: dados.qt_calorias || null,
        v_no_musculo: dados.no_musculo || null
    }, { autoCommit: true });

    return novoId;
}

async function atualizar(conn, idTreino, idExercicio, dados) {
    const sql = `
        UPDATE campeonato.exercicios
        SET no_exercicio = :v_nome, tx_url = :v_tx_url, qt_series = :v_qt_series, nr_peso = :v_nr_peso, qt_repeticao = :v_qt_repeticao, nr_ordem = :v_nr_ordem, qt_calorias = :v_qt_calorias, no_musculo = :v_no_musculo
        WHERE id_treino = :v_treino AND id_exercicio = :v_id
    `;
    return await conn.execute(sql, {
        v_nome: dados.no_exercicio,
        v_tx_url: dados.tx_url || null,
        v_qt_series: dados.qt_series || null,
        v_nr_peso: dados.nr_peso || null,
        v_qt_repeticao: dados.qt_repeticao || null,
        v_nr_ordem: dados.nr_ordem || null,
        v_qt_calorias: dados.qt_calorias || null,
        v_no_musculo: dados.no_musculo || null,
        v_treino: idTreino,
        v_id: idExercicio
    }, { autoCommit: true });
}

async function excluir(conn, idTreino, idExercicio) {
    const sql = `
        DELETE FROM campeonato.exercicios
        WHERE id_treino = :v_treino AND id_exercicio = :v_id
    `;
    return await conn.execute(sql, {
        v_treino: idTreino,
        v_id: idExercicio
    }, { autoCommit: true });
}

module.exports = { listar, criar, atualizar, excluir };
