const { Router } = require("express");
const { exigirAutenticacao } = require("../middleware/auth");
const pedidosController = require("../controllers/pedidos.controller");

const router = Router();

router.use(exigirAutenticacao);
router.post("/", pedidosController.criar);
router.get("/", pedidosController.listarMeus);

module.exports = router;
