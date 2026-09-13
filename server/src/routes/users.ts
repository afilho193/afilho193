import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

function publicUser(u: {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string | null;
  managerId: string | null;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    title: u.title,
    managerId: u.managerId,
  };
}

router.use(requireAuth);

// Lista usuários visíveis para o papel do solicitante
router.get("/", async (req, res) => {
  const { id, role } = req.auth!;

  let users;
  if (role === Role.HR) {
    users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  } else if (role === Role.MANAGER) {
    users = await prisma.user.findMany({
      where: { OR: [{ id }, { managerId: id }] },
      orderBy: { name: "asc" },
    });
  } else {
    users = await prisma.user.findMany({ where: { id } });
  }

  res.json(users.map(publicUser));
});

// Diretório básico de colegas, usado para selecionar destinatário de feedback
router.get("/directory", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, title: true, role: true },
  });
  res.json(users);
});

router.get("/:id", async (req, res) => {
  const { id, role } = req.auth!;
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Usuário não encontrado" });

  const allowed =
    role === Role.HR || target.id === id || (role === Role.MANAGER && target.managerId === id);
  if (!allowed) return res.status(403).json({ error: "Sem permissão" });

  res.json(publicUser(target));
});

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  title: z.string().optional(),
  managerId: z.string().optional().nullable(),
});

router.post("/", requireRole(Role.HR), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" });
  }
  const { password, ...rest } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { ...rest, passwordHash },
    });
    res.status(201).json(publicUser(user));
  } catch {
    res.status(409).json({ error: "Já existe um usuário com este email" });
  }
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().optional().nullable(),
  role: z.nativeEnum(Role).optional(),
  managerId: z.string().optional().nullable(),
});

router.patch("/:id", requireRole(Role.HR), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(publicUser(user));
  } catch {
    res.status(404).json({ error: "Usuário não encontrado" });
  }
});

router.delete("/:id", requireRole(Role.HR), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Usuário não encontrado" });
  }
});

export default router;
