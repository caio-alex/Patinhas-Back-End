// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  // Nunca devolvemos err.message/stack cru pro cliente: pode vazar detalhes
  // de implementação (queries, paths, versões de libs) úteis pra um atacante.
  const status = err.status || 500;
  const mensagem = status === 500 ? "Erro interno do servidor" : err.message;

  res.status(status).json({ erro: mensagem });
}

module.exports = { errorHandler };
