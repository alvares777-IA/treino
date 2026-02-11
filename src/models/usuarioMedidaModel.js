async function registrar(conn, idUsuario, dados) {
    const sql = `
        INSERT INTO campeonato.usuarios_medidas (id_usuario_medida, id_usuario, nr_peso, nr_altura, nr_pesometa, dt_medida)
        VALUES (campeonato.USUARIOS_MEDIDAS_SEQ.NEXTVAL, :v_usuario, :v_peso, :v_altura, :v_pesometa, SYSDATE)
    `;
    return await conn.execute(sql, {
        v_usuario: idUsuario,
        v_peso: dados.nr_peso || null,
        v_altura: dados.nr_altura || null,
        v_pesometa: dados.nr_pesometa || null
    }, { autoCommit: true });
}

async function listar(conn, idUsuario) {
    const sql = `
        SELECT id_usuario_medida, TO_CHAR(dt_medida, 'DD/MM/YYYY HH24:MI') AS dt_medida,
               nr_peso, nr_altura, nr_pesometa
        FROM campeonato.usuarios_medidas
        WHERE id_usuario = :v_usuario
        ORDER BY dt_medida DESC
    `;
    return await conn.execute(sql, { v_usuario: idUsuario });
}

module.exports = { registrar, listar };
