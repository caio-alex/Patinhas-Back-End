require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const produtosRoutes = require("./routes/produtos.routes");
const pedidosRoutes = require("./routes/pedidos.routes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "*", // Permite requisições de qualquer lugar (ótimo para portfólio e testes públicos)
    credentials: true,
  })
);
app.use(express.json({ limit: "50kb" })); // limite evita payloads gigantes de DoS
app.use(cookieParser());

// Rate limit geral, além do específico de /auth (mais rígido)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/produtos", produtosRoutes);
app.use("/pedidos", pedidosRoutes);

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada" }));
app.use(errorHandler);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`API do Patinhas Store rodando na porta ${PORT}`);
});
