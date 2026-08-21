const { z } = require("zod");

const cadastroSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(120),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  senha: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres")
    .max(72, "Senha muito longa") // bcrypt ignora além de 72 bytes
    .regex(/[a-z]/, "A senha precisa de uma letra minúscula")
    .regex(/[A-Z]/, "A senha precisa de uma letra maiúscula")
    .regex(/[0-9]/, "A senha precisa de um número"),
  cpf: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "CPF deve ter 11 dígitos")
    .optional(),
  celular: z.string().trim().max(20).optional(),
  telefone: z.string().trim().max(20).optional(),
  endereco: z
    .object({
      rua: z.string().trim().min(3).max(200),
      cidade: z.string().trim().min(2).max(100),
      estado: z.string().trim().length(2, "Use a sigla do estado, ex: SP"),
      cep: z.string().trim().max(10).optional(),
    })
    .optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

module.exports = { cadastroSchema, loginSchema };
