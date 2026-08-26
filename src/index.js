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
// CORS_ORIGIN aceita uma lista separada por vírgula (ex: dev local + produção).
// Nunca respondemos com "*" - obrigatório porque as requisições usam
// credentials:include (cookie httpOnly do refresh token), e o navegador
// bloqueia qualquer combinação de credentials:include com Access-Control-
// -Allow-Origin curinga.
const origensPermitidas = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origem) => origem.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Sem header Origin (chamada servidor-a-servidor, curl, healthcheck) - libera
      if (!origin || origensPermitidas.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origem não permitida pelo CORS"));
      }
    },
    credentials: true, // necessário para o cookie httpOnly do refresh token
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

// Serve as imagens de produto baixadas localmente (public/imagens/*.jpg).
// Ficam versionadas no Git, então sobrevivem a redeploys mesmo com disco
// "ephemeral" no Render - o arquivo já vem dentro do container a cada build.
app.use("/imagens", express.static("public/imagens"));

app.use("/auth", authRoutes);
app.use("/produtos", produtosRoutes);
app.use("/pedidos", pedidosRoutes);

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada" }));
app.use(errorHandler);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`API do Patinhas Store rodando na porta ${PORT}`);
});
