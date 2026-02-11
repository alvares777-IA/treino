const oracledb = require('oracledb');

try {
    oracledb.initOracleClient({ libDir: '/opt/oracle/instantclient_21_13' });
} catch (e) {
    // Ja inicializado
}

const dbConfig = {
    user: process.env.DB_USER || "CAMPEONATO",
    password: process.env.DB_PASSWORD || "!Adr1294",
    connectString: process.env.DB_CONNECTION_STRING || "200.143.179.35:1521/serverdb"
};

async function getConnection() {
    return await oracledb.getConnection(dbConfig);
}

module.exports = { getConnection };
