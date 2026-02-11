async function listar(conn, idUsuario) {
    const sql = `
        SELECT t.no_treino, t.id_treino,
               NVL((SELECT SUM(NVL(e.qt_calorias,0) * NVL(e.qt_repeticao,0))
                    FROM campeonato.exercicios e
                    WHERE e.id_treino = t.id_treino), 0) AS total_calorias
        FROM campeonato.treinos t
        WHERE t.id_usuario = :v_id
    `;
    return await conn.execute(sql, { v_id: idUsuario });
}

async function criar(conn, idUsuario, nome) {
    const sqlId = `SELECT NVL(MAX(id_treino), 0) + 1 AS novo_id FROM campeonato.treinos`;
    const resId = await conn.execute(sqlId);
    const novoId = resId.rows[0][0];

    const sqlInsert = `
        INSERT INTO campeonato.treinos (id_usuario, id_treino, no_treino)
        VALUES (:v_usuario, :v_id_treino, :v_no_treino)
    `;
    await conn.execute(sqlInsert, {
        v_usuario: idUsuario,
        v_id_treino: novoId,
        v_no_treino: nome
    }, { autoCommit: true });

    return novoId;
}

async function atualizar(conn, idTreino, idUsuario, nome) {
    const sql = `
        UPDATE campeonato.treinos
        SET no_treino = :v_nome
        WHERE id_treino = :v_id_treino
        AND id_usuario = :v_usuario
    `;
    return await conn.execute(sql, {
        v_nome: nome,
        v_id_treino: idTreino,
        v_usuario: idUsuario
    }, { autoCommit: true });
}

async function excluir(conn, idTreino, idUsuario) {
    const sql = `
        DELETE FROM campeonato.treinos
        WHERE id_treino = :v_id_treino
        AND id_usuario = :v_usuario
    `;
    return await conn.execute(sql, {
        v_id_treino: idTreino,
        v_usuario: idUsuario
    }, { autoCommit: true });
}

async function verificarNomeDuplicado(conn, idUsuario, nomeTreino) {
    const sql = `
        SELECT 1 FROM campeonato.treinos
        WHERE id_usuario = :v_usuario
        AND UPPER(TRIM(no_treino)) = UPPER(TRIM(:v_nome))
        AND ROWNUM = 1
    `;
    const result = await conn.execute(sql, { v_usuario: idUsuario, v_nome: nomeTreino });
    return result.rows.length > 0;
}

async function clonarParaAluno(conn, idTreinoOrigem, idUsuarioDestino) {
    const sqlTreino = `SELECT no_treino FROM campeonato.treinos WHERE id_treino = :v_id`;
    const resTreino = await conn.execute(sqlTreino, { v_id: idTreinoOrigem });
    if (resTreino.rows.length === 0) return null;
    const nomeTreino = resTreino.rows[0][0];

    const duplicado = await verificarNomeDuplicado(conn, idUsuarioDestino, nomeTreino);
    if (duplicado) return { duplicado: true, nomeTreino };

    const novoIdTreino = await criar(conn, idUsuarioDestino, nomeTreino);

    const sqlExercicios = `
        SELECT no_exercicio, tx_url, qt_series, nr_peso, qt_repeticao, nr_ordem, qt_calorias, no_musculo
        FROM campeonato.exercicios
        WHERE id_treino = :v_treino
        ORDER BY nr_ordem, no_exercicio
    `;
    const resExercicios = await conn.execute(sqlExercicios, { v_treino: idTreinoOrigem });

    for (let i = 0; i < resExercicios.rows.length; i++) {
        const ex = resExercicios.rows[i];
        const sqlInsertEx = `
            INSERT INTO campeonato.exercicios (id_treino, id_exercicio, no_exercicio, tx_url, qt_series, nr_peso, qt_repeticao, nr_ordem, qt_calorias, no_musculo)
            VALUES (:v_treino, :v_id_ex, :v_nome, :v_url, :v_series, :v_peso, :v_repeticao, :v_ordem, :v_calorias, :v_musculo)
        `;
        await conn.execute(sqlInsertEx, {
            v_treino: novoIdTreino,
            v_id_ex: i + 1,
            v_nome: ex[0],
            v_url: ex[1],
            v_series: ex[2],
            v_peso: ex[3],
            v_repeticao: ex[4],
            v_ordem: ex[5],
            v_calorias: ex[6],
            v_musculo: ex[7]
        }, { autoCommit: true });
    }

    return { duplicado: false, nomeTreino, novoIdTreino };
}

module.exports = { listar, criar, atualizar, excluir, verificarNomeDuplicado, clonarParaAluno };
