// Popula a tabela de produtos com os itens que a loja já usa.
// Rode com: npm run seed  (dentro da pasta server/)
const { PrismaClient } = require("@prisma/client");
const produtos = require("./produtos-seed.json");

const prisma = new PrismaClient();

async function main() {
  console.log(`Inserindo ${produtos.length} produtos...`);

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

  console.log("Seed concluído.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
