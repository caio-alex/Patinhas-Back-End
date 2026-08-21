const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function assinarAccessToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, email: usuario.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
}

function assinarRefreshToken(usuario) {
  return jwt.sign(
    { sub: usuario.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
}

function verificarAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verificarRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

// Guardamos apenas o hash do refresh token no banco - se o banco vazar,
// os tokens de sessão dos usuários não vazam junto.
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  assinarAccessToken,
  assinarRefreshToken,
  verificarAccessToken,
  verificarRefreshToken,
  hashToken,
};
