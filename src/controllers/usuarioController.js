const bcrypt = require('bcrypt');
const { getConnection } = require('../config/database');
const usuarioModel = require('../models/usuarioModel');

function isBcryptHash(str) {
    return typeof str === 'string' && str.startsWith('$2b$');
}

async function getUsuario(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const result = await usuarioModel.buscarPorId(connection, req.session.usuario.id_usuario);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Usuario nao encontrado." });
        }
        res.json({
            success: true,
            no_usuario: result.rows[0][0],
            no_login: result.rows[0][1],
            tx_email: result.rows[0][2],
            ao_tipo: result.rows[0][3] || 'USU',
            nr_peso: result.rows[0][4],
            nr_altura: result.rows[0][5],
            nr_pesometa: result.rows[0][6]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao buscar dados do usuario." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function updateUsuario(req, res) {
    const { no_usuario, no_senha_atual, no_senha_nova, tx_email, nr_peso, nr_altura, nr_pesometa } = req.body;
    if (!no_usuario || !no_usuario.trim()) {
        return res.status(400).json({ success: false, message: "Nome e obrigatorio." });
    }
    let connection;
    try {
        connection = await getConnection();

        if (no_senha_nova && no_senha_nova.trim()) {
            const isSenhaTemp = req.session.usuario.senha_temporaria;
            if (!isSenhaTemp) {
                if (!no_senha_atual || !no_senha_atual.trim()) {
                    return res.status(400).json({ success: false, message: "Informe a senha atual para alterar a senha." });
                }
                const resCheck = await usuarioModel.verificarSenha(connection, req.session.usuario.id_usuario);
                if (resCheck.rows.length === 0) {
                    return res.status(400).json({ success: false, message: "Senha atual incorreta." });
                }

                const senhaArmazenada = resCheck.rows[0][0];
                let senhaAtualValida = false;

                if (isBcryptHash(senhaArmazenada)) {
                    senhaAtualValida = await bcrypt.compare(no_senha_atual, senhaArmazenada);
                } else {
                    // Fallback para texto puro durante migração
                    senhaAtualValida = senhaArmazenada &&
                        senhaArmazenada.trim().toUpperCase() === no_senha_atual.trim().toUpperCase();
                }

                if (!senhaAtualValida) {
                    return res.status(400).json({ success: false, message: "Senha atual incorreta." });
                }
            }

            const senhaHash = await bcrypt.hash(no_senha_nova.trim(), 10);
            await usuarioModel.atualizarComSenha(connection, req.session.usuario.id_usuario, {
                no_usuario: no_usuario.trim(),
                no_senha: senhaHash,
                tx_email: tx_email ? tx_email.trim() : null,
                nr_peso: nr_peso || null,
                nr_altura: nr_altura || null,
                nr_pesometa: nr_pesometa || null
            });
            req.session.usuario.senha_temporaria = false;
        } else {
            await usuarioModel.atualizar(connection, req.session.usuario.id_usuario, {
                no_usuario: no_usuario.trim(),
                tx_email: tx_email ? tx_email.trim() : null,
                nr_peso: nr_peso || null,
                nr_altura: nr_altura || null,
                nr_pesometa: nr_pesometa || null
            });
        }

        req.session.usuario.no_usuario = no_usuario.trim();
        res.json({ success: true, message: "Dados atualizados com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao atualizar dados do usuario." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

module.exports = { getUsuario, updateUsuario };
