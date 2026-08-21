const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const { validar } = require("../middleware/validar");
const { exigirAutenticacao } = require("../middleware/auth");
const { cadastroSchema, loginSchema } = require("../validators/auth.validator");
const authController = require("../controllers/auth.controller");

const router = Router();

// Limita tentativas de login/cadastro por IP - dificulta força bruta de senha
// e enumeração de emails cadastrados.
const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas. Tente novamente em alguns minutos." },
});

router.post("/cadastro", limiteAuth, validar(cadastroSchema), authController.cadastrar);
router.post("/login", limiteAuth, validar(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/perfil", exigirAutenticacao, authController.meuPerfil);

module.exports = router;
