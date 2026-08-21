const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const {
  assinarAccessToken,
  assinarRefreshToken,
  verificarRefreshToken,
  hashToken,
} = require("../lib/tokens");

const SALT_ROUNDS = 12;

function paraDiasMs(str) {
  // "7d" -> ms; suporta só o formato usado no .env por simplicidade
  const dias = parseInt(str, 10) || 7;
  return dias * 24 * 60 * 60 * 1000;
}

async function cadastrar(req, res, next) {
  try {
    const { nome, email, senha, cpf, celular, telefone, endereco } = req.body;

    const emailEmUso = await prisma.usuario.findUnique({ where: { email } });
    if (emailEmUso) {
      return res.status(409).json({ erro: "Este email já está cadastrado" });
    }

    if (cpf) {
      const cpfEmUso = await prisma.usuario.findUnique({ where: { cpf } });
      if (cpfEmUso) {
        return res.status(409).json({ erro: "Este CPF já está cadastrado" });
      }
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        cpf,
        celular,
        telefone,
        enderecos: endereco
          ? { create: [{ ...endereco, principal: true }] }
          : undefined,
      },
    });

    return res.status(201).json({
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  } catch (err) {
    next(err);
  }
}

async function emitirSessao(usuario, res) {
  const accessToken = assinarAccessToken(usuario);
  const refreshToken = assinarRefreshToken(usuario);

  await prisma.refreshToken.create({
    data: {
      usuarioId: usuario.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(
        Date.now() + paraDiasMs(process.env.JWT_REFRESH_EXPIRES_IN)
      ),
    },
  });

  // httpOnly: JS do front não consegue ler o cookie -> mitiga roubo via XSS
  // sameSite: 'strict' mitiga CSRF em navegadores modernos
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: paraDiasMs(process.env.JWT_REFRESH_EXPIRES_IN),
    path: "/auth",
  });

  return accessToken;
}

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    // Mesma mensagem para "email não existe" e "senha errada" -
    // não damos pista de quais emails estão cadastrados no sistema
    const credenciaisInvalidas = () =>
      res.status(401).json({ erro: "Email ou senha inválidos" });

    if (!usuario) return credenciaisInvalidas();

    const senhaOk = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaOk) return credenciaisInvalidas();

    const accessToken = await emitirSessao(usuario, res);

    return res.json({
      accessToken,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ erro: "Sessão não encontrada" });
    }

    let payload;
    try {
      payload = verificarRefreshToken(token);
    } catch {
      return res.status(401).json({ erro: "Sessão inválida ou expirada" });
    }

    const tokenHash = hashToken(token);
    const registro = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!registro || registro.revokedAt || registro.expiresAt < new Date()) {
      return res.status(401).json({ erro: "Sessão inválida ou expirada" });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
    });
    if (!usuario) {
      return res.status(401).json({ erro: "Sessão inválida" });
    }

    // Rotaciona o refresh token: revoga o antigo e emite um novo.
    // Se um refresh token roubado for usado depois do dono já ter renovado,
    // ele vai falhar aqui - sinal de possível token comprometido.
    await prisma.refreshToken.update({
      where: { id: registro.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = await emitirSessao(usuario, res);
    return res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await prisma.refreshToken
        .update({
          where: { tokenHash: hashToken(token) },
          data: { revokedAt: new Date() },
        })
        .catch(() => {}); // token já pode não existir mais - tudo bem
    }
    res.clearCookie("refreshToken", { path: "/auth" });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function meuPerfil(req, res, next) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuarioId },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        celular: true,
        telefone: true,
        enderecos: true,
        createdAt: true,
      },
    });

    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
    return res.json({ usuario });
  } catch (err) {
    next(err);
  }
}

module.exports = { cadastrar, login, refresh, logout, meuPerfil };
