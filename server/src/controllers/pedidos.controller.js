const prisma = require("../lib/prisma");

async function criar(req, res, next) {
  try {
    const { itens } = req.body; // [{ produtoId, quantidade }]

    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: "O pedido precisa ter ao menos um item" });
    }

    const produtoIds = itens.map((i) => Number(i.produtoId));
    const produtos = await prisma.produto.findMany({
      where: { id: { in: produtoIds }, ativo: true },
    });

    if (produtos.length !== new Set(produtoIds).size) {
      return res.status(400).json({ erro: "Um ou mais produtos não existem ou estão indisponíveis" });
    }

    // O preço vem do banco, não do que o front mandou - impede que alguém
    // manipule o preço no client (devtools, requisição direta à API) e pague menos.
    let total = 0;
    const itensParaCriar = itens.map((item) => {
      const produto = produtos.find((p) => p.id === Number(item.produtoId));
      const quantidade = Math.max(1, Math.trunc(Number(item.quantidade) || 1));
      const precoUnit = Number(produto.preco);
      total += precoUnit * quantidade;

      return {
        produtoId: produto.id,
        quantidade,
        precoUnit,
      };
    });

    const pedido = await prisma.pedido.create({
      data: {
        usuarioId: req.usuarioId,
        total,
        itens: { create: itensParaCriar },
      },
      include: { itens: { include: { produto: true } } },
    });

    return res.status(201).json({ pedido });
  } catch (err) {
    next(err);
  }
}

async function listarMeus(req, res, next) {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { usuarioId: req.usuarioId },
      include: { itens: { include: { produto: true } } },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ pedidos });
  } catch (err) {
    next(err);
  }
}

module.exports = { criar, listarMeus };
