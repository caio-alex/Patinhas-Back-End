const { verificarAccessToken } = require("../lib/tokens");

function exigirAutenticacao(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token de acesso ausente" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = verificarAccessToken(token);
    req.usuarioId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ erro: "Token de acesso inválido ou expirado" });
  }
}

module.exports = { exigirAutenticacao };
