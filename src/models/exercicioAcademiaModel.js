async function listar(conn) {
    const sql = `
        SELECT id_exercicio, no_exercicio, tx_url, qt_calorias, no_musculo, no_treino
        FROM campeonato.exercicios_academia
        ORDER BY no_treino, no_exercicio
    `;
    return await conn.execute(sql);
}

async function criar(conn, dados) {
    const sql = `
        INSERT INTO campeonato.exercicios_academia (id_exercicio, no_exercicio, tx_url, qt_calorias, no_musculo, no_treino)
        VALUES (campeonato.EXERCICIOS_SEQ.NEXTVAL, :v_nome, :v_url, :v_calorias, :v_musculo, :v_treino)
    `;
    return await conn.execute(sql, {
        v_nome: dados.no_exercicio,
        v_url: dados.tx_url || null,
        v_calorias: dados.qt_calorias || null,
        v_musculo: dados.no_musculo || null,
        v_treino: dados.no_treino || null
    }, { autoCommit: true });
}

async function atualizar(conn, id, dados) {
    const sql = `
        UPDATE campeonato.exercicios_academia
        SET no_exercicio = :v_nome, tx_url = :v_url, qt_calorias = :v_calorias,
            no_musculo = :v_musculo, no_treino = :v_treino
        WHERE id_exercicio = :v_id
    `;
    return await conn.execute(sql, {
        v_nome: dados.no_exercicio,
        v_url: dados.tx_url || null,
        v_calorias: dados.qt_calorias || null,
        v_musculo: dados.no_musculo || null,
        v_treino: dados.no_treino || null,
        v_id: id
    }, { autoCommit: true });
}

async function excluir(conn, id) {
    const sql = `
        DELETE FROM campeonato.exercicios_academia
        WHERE id_exercicio = :v_id
    `;
    return await conn.execute(sql, { v_id: id }, { autoCommit: true });
}

async function listarTreinosDistinct(conn) {
    const sql = `
        SELECT DISTINCT(no_treino)
        FROM campeonato.exercicios_academia
        WHERE no_treino IS NOT NULL
        ORDER BY no_treino
    `;
    return await conn.execute(sql);
}

async function listarPorTreino(conn, noTreino) {
    const sql = `
        SELECT id_exercicio, no_exercicio, tx_url, qt_calorias, no_musculo, no_treino
        FROM campeonato.exercicios_academia
        ORDER BY (CASE WHEN UPPER(no_treino) = UPPER(:v_treino) THEN 1 ELSE 2 END), no_treino, no_exercicio
    `;
    return await conn.execute(sql, { v_treino: noTreino });
}

module.exports = { listar, criar, atualizar, excluir, listarTreinosDistinct, listarPorTreino };
