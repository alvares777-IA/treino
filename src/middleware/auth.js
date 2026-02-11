function verificarSessao(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({ success: false, message: "Sessao expirada. Faca login novamente." });
    }
    next();
}

function verificarTipo(...tipos) {
    return (req, res, next) => {
        if (!tipos.includes(req.session.usuario.ao_tipo)) {
            return res.status(403).json({ success: false, message: "Sem permissao." });
        }
        next();
    };
}

module.exports = { verificarSessao, verificarTipo };
