// Valida req.body contra um schema Zod antes de deixar a request seguir.
// Isso barra payloads malformados/maliciosos antes de tocarem qualquer lógica de negócio.
function validar(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
      return res.status(400).json({
        erro: "Dados inválidos",
        detalhes: resultado.error.flatten().fieldErrors,
      });
    }

    req.body = resultado.data;
    next();
  };
}

module.exports = { validar };
