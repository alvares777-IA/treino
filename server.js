require('dotenv').config();
const express = require('express');
const oracledb = require('oracledb'); // Adicione esta linha se não estiver aí
const session = require('express-session');
const path = require('path');

// ESTA É A LINHA CHAVE:
// Ao chamar sem argumentos, o driver procura as bibliotecas no sistema (que o Docker vai prover)
try {
    oracledb.initOracleClient();
    console.log("Modo Thick (pesado) ativado com sucesso para Oracle 11g!");
} catch (err) {
    console.error("Erro ao inicializar modo Thick:", err);
}
const app = express();
app.use(express.json());
app.use(session({
    secret: 'campeonato-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 } // 30 minutos
}));
app.use(express.static('public'));

// Rotas
app.use('/', require('./src/routes/authRoutes'));
app.use('/', require('./src/routes/usuarioRoutes'));
app.use('/', require('./src/routes/treinoRoutes'));
app.use('/', require('./src/routes/exercicioRoutes'));
app.use('/', require('./src/routes/treinoDiaRoutes'));
app.use('/', require('./src/routes/solicitacaoRoutes'));
app.use('/', require('./src/routes/adminRoutes'));
app.use('/', require('./src/routes/agendaRoutes'));
app.use(express.static('public'))

const port = process.env.PORT || 3010;
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
});
