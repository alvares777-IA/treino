const { getConnection } = require('../config/database');
const usuarioMedidaModel = require('../models/usuarioMedidaModel');

async function registrar(req, res) {
    const { nr_peso, nr_altura, nr_pesometa } = req.body;
    let connection;
    try {
        connection = await getConnection();
        await usuarioMedidaModel.registrar(connection, req.session.usuario.id_usuario, {
            nr_peso, nr_altura, nr_pesometa
        });
        res.json({ success: true, message: "Medida registrada com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao registrar medida." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

async function listar(req, res) {
    let connection;
    try {
        connection = await getConnection();
        const result = await usuarioMedidaModel.listar(connection, req.session.usuario.id_usuario);
        const medidas = result.rows.map(row => ({
            id_usuario_medida: row[0],
            dt_medida: row[1],
            nr_peso: row[2],
            nr_altura: row[3],
            nr_pesometa: row[4]
        }));
        res.json({ success: true, medidas });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erro ao buscar medidas." });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}

module.exports = { registrar, listar };
