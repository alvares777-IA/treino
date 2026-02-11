const bcrypt = require('bcrypt');
const { getConnection } = require('../config/database');
const { getMailTransporter } = require('../config/mail');
const usuarioModel = require('../models/usuarioModel');

function isBcryptHash(str) {
    return typeof str === 'string' && str.startsWith('$2b$');
}

async function login(req, res) {
    const { usuario, senha } = req.body;
    let connection;

    try {
        connection = await getConnection();

        console.log('[LOGIN] Tentativa de login:', usuario);
        const result = await usuarioModel.buscarParaLogin(connection, usuario);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Usuario ou senha invalidos ou inativos." });
        }

        const row = result.rows[0];
        const idUsuario = row[0];
        const noLogin = row[1];
        const noUsuario = row[2];
        const senhaArmazenada = row[3];
        const senhaTemp = row[4] === 'S';
        const aoTipo = row[5] || 'USU';

        let senhaValida = false;

        if (isBcryptHash(senhaArmazenada)) {
            senhaValida = await bcrypt.compare(senha, senhaArmazenada);
        } else {
            // Migração: senha ainda em texto puro, comparar case-insensitive
            senhaValida = senhaArmazenada &&
                senhaArmazenada.trim().toUpperCase() === senha.trim().toUpperCase();

            if (senhaValida) {
                // Migrar para bcrypt automaticamente
                const hash = await bcrypt.hash(senha, 10);
                await usuarioModel.atualizarSenhaHash(connection, idUsuario, hash);
                console.log('[LOGIN] Senha migrada para bcrypt, usuario id:', idUsuario);
            }
        }

        if (senhaValida) {
            req.session.usuario = {
                id_usuario: idUsuario,
                no_login: noLogin,
                no_usuario: noUsuario,
                senha_temporaria: senhaTemp,
                ao_tipo: aoTipo
            };
            res.json({ success: true, message: `Bem-vindo, ${noUsuario}!`, senha_temporaria: senhaTemp });
        } else {
            res.status(401).json({ success: false, message: "Usuario ou senha invalidos ou inativos." });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro interno no servidor." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function esqueceuSenha(req, res) {
    const { no_login } = req.body;
    if (!no_login || !no_login.trim()) {
        return res.json({ success: true, message: "Se o login existir, um e-mail sera enviado com a nova senha." });
    }
    let connection;
    try {
        connection = await getConnection();
        const result = await usuarioModel.buscarPorLogin(connection, no_login.trim());

        if (result.rows.length > 0 && result.rows[0][1]) {
            const idUsuario = result.rows[0][0];
            const email = result.rows[0][1];

            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let senhaTmp = '';
            for (let i = 0; i < 8; i++) {
                senhaTmp += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            const hash = await bcrypt.hash(senhaTmp, 10);
            console.log('[ESQUECEU-SENHA] Atualizando senha para usuario id:', idUsuario);
            await usuarioModel.resetarSenha(connection, idUsuario, hash);
            console.log('[ESQUECEU-SENHA] Senha atualizada com sucesso no banco');

            await getMailTransporter().sendMail({
                from: process.env.GMAIL_USER,
                to: email,
                subject: 'Recuperacao de Senha - Sistema de Treinos',
                text: `Sua nova senha temporaria e: ${senhaTmp}\n\nAltere sua senha apos o login.`
            });
        }

        res.json({ success: true, message: "Se o login existir e possuir e-mail cadastrado, um e-mail sera enviado com a nova senha." });
    } catch (err) {
        console.error(err);
        res.json({ success: true, message: "Se o login existir e possuir e-mail cadastrado, um e-mail sera enviado com a nova senha." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function cadastrar(req, res) {
    const { no_usuario, tx_email, no_senha, ao_tipo } = req.body;

    if (!no_usuario || !no_usuario.trim()) {
        return res.status(400).json({ success: false, message: "Nome e obrigatorio." });
    }
    if (!tx_email || !tx_email.trim()) {
        return res.status(400).json({ success: false, message: "E-mail e obrigatorio." });
    }
    if (!no_senha || !no_senha.trim()) {
        return res.status(400).json({ success: false, message: "Senha e obrigatoria." });
    }

    const tipo = (ao_tipo === 'TRE') ? 'TRE' : 'USU';

    let connection;
    try {
        connection = await getConnection();

        const existe = await usuarioModel.buscarPorEmail(connection, tx_email.trim());
        if (existe.rows.length > 0) {
            return res.status(409).json({ success: false, message: "Ja existe um usuario com este e-mail." });
        }

        const hash = await bcrypt.hash(no_senha, 10);
        const result = await usuarioModel.criar(connection, {
            no_usuario: no_usuario.trim(),
            tx_email: tx_email.trim(),
            no_senha: hash,
            ao_tipo: tipo
        });

        const row = result.rows[0];
        req.session.usuario = {
            id_usuario: row[0],
            no_login: row[2],
            no_usuario: row[1],
            senha_temporaria: false,
            ao_tipo: row[3]
        };

        res.json({ success: true, message: `Bem-vindo, ${row[1]}!` });
    } catch (err) {
        console.error('[CADASTRAR]', err);
        res.status(500).json({ success: false, message: "Erro interno no servidor." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function loginGoogle(req, res) {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ success: false, message: "Token do Google nao informado." });
    }

    let connection;
    try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (!response.ok) {
            return res.status(401).json({ success: false, message: "Token do Google invalido." });
        }

        const payload = await response.json();

        if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
            return res.status(401).json({ success: false, message: "Token do Google invalido (aud)." });
        }

        const email = payload.email;
        const nome = payload.name || email;

        connection = await getConnection();

        let result = await usuarioModel.buscarPorEmail(connection, email);

        if (result.rows.length === 0) {
            result = await usuarioModel.criarSocial(connection, {
                no_usuario: nome,
                tx_email: email,
                ao_tipo: 'USU'
            });
        }

        const row = result.rows[0];

        if (row[4] !== 'A') {
            return res.status(401).json({ success: false, message: "Usuario inativo." });
        }

        req.session.usuario = {
            id_usuario: row[0],
            no_login: row[2],
            no_usuario: row[1],
            senha_temporaria: false,
            ao_tipo: row[3]
        };

        res.json({ success: true, message: `Bem-vindo, ${row[1]}!` });
    } catch (err) {
        console.error('[LOGIN-GOOGLE]', err);
        res.status(500).json({ success: false, message: "Erro interno no servidor." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function loginFacebook(req, res) {
    const { accessToken } = req.body;

    if (!accessToken) {
        return res.status(400).json({ success: false, message: "Token do Facebook nao informado." });
    }

    let connection;
    try {
        const response = await fetch(`https://graph.facebook.com/me?fields=name,email&access_token=${encodeURIComponent(accessToken)}`);
        if (!response.ok) {
            return res.status(401).json({ success: false, message: "Token do Facebook invalido." });
        }

        const payload = await response.json();

        if (!payload.email) {
            return res.status(400).json({ success: false, message: "E-mail nao disponivel na conta do Facebook." });
        }

        const email = payload.email;
        const nome = payload.name || email;

        connection = await getConnection();

        let result = await usuarioModel.buscarPorEmail(connection, email);

        if (result.rows.length === 0) {
            result = await usuarioModel.criarSocial(connection, {
                no_usuario: nome,
                tx_email: email,
                ao_tipo: 'USU'
            });
        }

        const row = result.rows[0];

        if (row[4] !== 'A') {
            return res.status(401).json({ success: false, message: "Usuario inativo." });
        }

        req.session.usuario = {
            id_usuario: row[0],
            no_login: row[2],
            no_usuario: row[1],
            senha_temporaria: false,
            ao_tipo: row[3]
        };

        res.json({ success: true, message: `Bem-vindo, ${row[1]}!` });
    } catch (err) {
        console.error('[LOGIN-FACEBOOK]', err);
        res.status(500).json({ success: false, message: "Erro interno no servidor." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

module.exports = { login, esqueceuSenha, cadastrar, loginGoogle, loginFacebook };
