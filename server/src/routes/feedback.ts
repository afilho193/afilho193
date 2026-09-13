import { Router } from "express";
import { z } from "zod";
import { FeedbackType, Role } from "../lib/enums";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

function serialize(f: any) {
  return {
    id: f.id,
    type: f.type,
    message: f.message,
    actionItems: f.actionItems,
    createdAt: f.createdAt,
    fromUser: { id: f.fromUser.id, name: f.fromUser.name },
    toUser: { id: f.toUser.id, name: f.toUser.name },
  };
}

async function canViewUser(authId: string, authRole: Role, targetId: string) {
  if (authRole === Role.HR || authId === targetId) return true;
  if (authRole === Role.MANAGER) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    return target?.managerId === authId;
  }
  return false;
}

// Feedback recebido e enviado por um usuário (default: o próprio solicitante)
router.get("/", async (req, res) => {
  const { id, role } = req.auth!;
  const userId = (req.query.userId as string) || id;

  const allowed = await canViewUser(id, role, userId);
  if (!allowed) return res.status(403).json({ error: "Sem permissão" });

  const [received, sent] = await Promise.all([
    prisma.feedback.findMany({
      where: { toUserId: userId },
      include: { fromUser: true, toUser: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.feedback.findMany({
      where: { fromUserId: userId },
      include: { fromUser: true, toUser: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  res.json({
    received: received.map(serialize),
    sent: sent.map(serialize),
  });
});

const createSchema = z.object({
  toUserId: z.string().min(1),
  type: z.nativeEnum(FeedbackType),
  message: z.string().min(1),
  actionItems: z.string().optional().nullable(),
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" });
  }
  const { id: fromUserId, role } = req.auth!;
  const { toUserId, type, message, actionItems } = parsed.data;

  if (toUserId === fromUserId) {
    return res.status(400).json({ error: "Não é possível enviar feedback para si mesmo" });
  }

  if (type === FeedbackType.CHECKIN) {
    const target = await prisma.user.findUnique({ where: { id: toUserId } });
    const isManagerOfTarget = role === Role.MANAGER && target?.managerId === fromUserId;
    if (!isManagerOfTarget && role !== Role.HR) {
      return res
        .status(403)
        .json({ error: "Apenas o gestor direto pode registrar um check-in 1:1" });
    }
  }

  const feedback = await prisma.feedback.create({
    data: { fromUserId, toUserId, type, message, actionItems },
    include: { fromUser: true, toUser: true },
  });
  res.status(201).json(serialize(feedback));
});

export default router;
