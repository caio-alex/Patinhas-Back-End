const prisma = require("../lib/prisma");

async function listar(req, res, next) {
  try {
    const { categoria, tipo, precoMax } = req.query;

    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true,
        categoria: categoria ? String(categoria) : undefined,
        tipo: tipo ? String(tipo) : undefined,
        preco: precoMax ? { lte: Number(precoMax) } : undefined,
      },
      orderBy: { id: "asc" },
    });

    return res.json({ produtos });
  } catch (err) {
    next(err);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ erro: "Id inválido" });
    }

    const produto = await prisma.produto.findUnique({ where: { id } });
    if (!produto || !produto.ativo) {
      return res.status(404).json({ erro: "Produto não encontrado" });
    }

    return res.json({ produto });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, buscarPorId };
