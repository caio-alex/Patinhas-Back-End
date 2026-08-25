// Popula a tabela de produtos com os itens que a loja já usa.
// Rode com: npm run seed  (dentro da pasta server/)
const { PrismaClient } = require("@prisma/client");
const produtos = require("./produtos-seed.json");

const prisma = new PrismaClient();

async function main() {
  console.log(`Inserindo ${produtos.length} produtos...`);

  const idsAtuais = produtos.map((p) => p.id);

  for (const produto of produtos) {
    await prisma.produto.upsert({
      where: { id: produto.id },
      update: {
        titulo: produto.titulo,
        categoria: produto.categoria,
        tipo: produto.tipo,
        preco: produto.preco,
        imagem: produto.imagem,
      },
      create: {
        id: produto.id,
        titulo: produto.titulo,
        categoria: produto.categoria,
        tipo: produto.tipo,
        preco: produto.preco,
        imagem: produto.imagem,
      },
    });
  }

  // Remove do banco qualquer produto que não esteja mais no seed - sem isso,
  // produtos tirados do produtos-seed.json ficavam "presos" no banco pra sempre.
  // Produtos já referenciados por algum pedido não podem ser removidos (violaria
  // a integridade do histórico de compras) - nesse caso só avisamos e seguimos.
  try {
    const removidos = await prisma.produto.deleteMany({
      where: { id: { notIn: idsAtuais } },
    });
    if (removidos.count > 0) {
      console.log(`Removidos ${removidos.count} produtos que não estão mais no seed.`);
    }
  } catch (err) {
    console.warn(
      "Não foi possível remover alguns produtos (provavelmente já referenciados em pedidos existentes):",
      err.message
    );
  }

  console.log("Seed concluído.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
