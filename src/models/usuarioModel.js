async function buscarParaLogin(conn, login) {
    const sql = `
        SELECT a.id_usuario, a.no_login, a.no_usuario, a.no_senha, NVL(a.ao_senha_temp, 'N') AS ao_senha_temp, a.ao_tipo
        FROM campeonato.usuarios a
        WHERE upper(TRIM(no_login)) = upper(TRIM(:v_login))
        AND ao_ativo = 'A'
    `;
    return await conn.execute(sql, { v_login: login });
}

async function buscarPorId(conn, id) {
    const sql = `
        SELECT no_usuario, no_login, tx_email, ao_tipo, nr_peso, nr_altura, nr_pesometa
        FROM campeonato.usuarios
        WHERE id_usuario = :v_id
    `;
    return await conn.execute(sql, { v_id: id });
}

async function atualizar(conn, id, dados) {
    const sql = `
        UPDATE campeonato.usuarios
        SET no_usuario = :v_nome, tx_email = :v_email,
            nr_peso = :v_peso, nr_altura = :v_altura, nr_pesometa = :v_pesometa
        WHERE id_usuario = :v_id
    `;
    return await conn.execute(sql, {
        v_nome: dados.no_usuario,
        v_email: dados.tx_email,
        v_peso: dados.nr_peso || null,
        v_altura: dados.nr_altura || null,
        v_pesometa: dados.nr_pesometa || null,
        v_id: id
    }, { autoCommit: true });
}

async function atualizarComSenha(conn, id, dados) {
    const sql = `
        UPDATE campeonato.usuarios
        SET no_usuario = :v_nome, no_senha = :v_senha, tx_email = :v_email, ao_senha_temp = 'N',
            nr_peso = :v_peso, nr_altura = :v_altura, nr_pesometa = :v_pesometa
        WHERE id_usuario = :v_id
    `;
    return await conn.execute(sql, {
        v_nome: dados.no_usuario,
        v_senha: dados.no_senha,
        v_email: dados.tx_email,
        v_peso: dados.nr_peso || null,
        v_altura: dados.nr_altura || null,
        v_pesometa: dados.nr_pesometa || null,
        v_id: id
    }, { autoCommit: true });
}

async function buscarPorLogin(conn, login) {
    const sql = `
        SELECT id_usuario, tx_email
        FROM campeonato.usuarios
        WHERE upper(no_login) = upper(:v_login)
        AND ao_ativo = 'A'
    `;
    return await conn.execute(sql, { v_login: login });
}

async function resetarSenha(conn, id, senhaHash) {
    const sql = `
        UPDATE campeonato.usuarios
        SET no_senha = :v_senha, ao_senha_temp = 'S'
        WHERE id_usuario = :v_id
    `;
    return await conn.execute(sql, { v_senha: senhaHash, v_id: id }, { autoCommit: true });
}

async function verificarSenha(conn, id) {
    const sql = `
        SELECT no_senha FROM campeonato.usuarios
        WHERE id_usuario = :v_id
    `;
    return await conn.execute(sql, { v_id: id });
}

async function atualizarSenhaHash(conn, id, senhaHash) {
    const sql = `
        UPDATE campeonato.usuarios
        SET no_senha = :v_senha
        WHERE id_usuario = :v_id
    `;
    return await conn.execute(sql, { v_senha: senhaHash, v_id: id }, { autoCommit: true });
}

async function buscarPorEmail(conn, email) {
    const sql = `
        SELECT id_usuario, no_usuario, tx_email, ao_tipo, ao_ativo
        FROM campeonato.usuarios
        WHERE UPPER(TRIM(tx_email)) = UPPER(TRIM(:v_email))
    `;
    return await conn.execute(sql, { v_email: email });
}

async function criar(conn, dados) {
    const sql = `
        INSERT INTO campeonato.usuarios (id_usuario, no_login, no_usuario, tx_email, no_senha, ao_tipo, ao_ativo, ao_senha_temp)
        VALUES (
            (SELECT NVL(MAX(id_usuario), 0) + 1 FROM campeonato.usuarios),
            :v_login, :v_nome, :v_email, :v_senha, :v_tipo, 'A', 'N'
        )
    `;
    await conn.execute(sql, {
        v_login: dados.tx_email,
        v_nome: dados.no_usuario,
        v_email: dados.tx_email,
        v_senha: dados.no_senha,
        v_tipo: dados.ao_tipo || 'USU'
    }, { autoCommit: true });

    const result = await buscarPorEmail(conn, dados.tx_email);
    return result;
}

async function criarSocial(conn, dados) {
    const sql = `
        INSERT INTO campeonato.usuarios (id_usuario, no_login, no_usuario, tx_email, no_senha, ao_tipo, ao_ativo, ao_senha_temp)
        VALUES (
            (SELECT NVL(MAX(id_usuario), 0) + 1 FROM campeonato.usuarios),
            :v_login, :v_nome, :v_email, NULL, :v_tipo, 'A', 'N'
        )
    `;
    await conn.execute(sql, {
        v_login: dados.tx_email,
        v_nome: dados.no_usuario,
        v_email: dados.tx_email,
        v_tipo: dados.ao_tipo || 'USU'
    }, { autoCommit: true });

    const result = await buscarPorEmail(conn, dados.tx_email);
    return result;
}

module.exports = {
    buscarParaLogin,
    buscarPorId,
    atualizar,
    atualizarComSenha,
    buscarPorLogin,
    resetarSenha,
    verificarSenha,
    atualizarSenhaHash,
    buscarPorEmail,
    criar,
    criarSocial
};
