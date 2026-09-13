import { Router } from "express";
import { z } from "zod";
import { EnrollmentStatus, Role } from "../lib/enums";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const enrollmentInclude = {
  track: { include: { modules: { orderBy: { order: "asc" as const } } } },
  progress: true,
};

function serialize(e: any) {
  return {
    id: e.id,
    userId: e.userId,
    status: e.status,
    progressPercent: e.progressPercent,
    startedAt: e.startedAt,
    completedAt: e.completedAt,
    track: {
      id: e.track.id,
      title: e.track.title,
      category: e.track.category,
      level: e.track.level,
      modules: e.track.modules,
    },
    completedModuleIds: e.progress.filter((p: any) => p.completed).map((p: any) => p.moduleId),
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

router.get("/", async (req, res) => {
  const { id, role } = req.auth!;
  const userId = (req.query.userId as string) || id;

  const allowed = await canViewUser(id, role, userId);
  if (!allowed) return res.status(403).json({ error: "Sem permissão" });

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: enrollmentInclude,
    orderBy: { startedAt: "desc" },
  });
  res.json(enrollments.map(serialize));
});

const createSchema = z.object({ trackId: z.string().min(1) });

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "trackId é obrigatório" });

  const { id: userId } = req.auth!;
  try {
    const enrollment = await prisma.enrollment.create({
      data: { userId, trackId: parsed.data.trackId, status: EnrollmentStatus.IN_PROGRESS },
      include: enrollmentInclude,
    });
    res.status(201).json(serialize(enrollment));
  } catch {
    res.status(409).json({ error: "Você já está inscrito nesta trilha" });
  }
});

router.patch("/:id/modules/:moduleId", async (req, res) => {
  const { id: userId } = req.auth!;
  const { id, moduleId } = req.params;
  const completed = req.body?.completed !== false;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: enrollmentInclude,
  });
  if (!enrollment || enrollment.userId !== userId) {
    return res.status(404).json({ error: "Inscrição não encontrada" });
  }

  await prisma.moduleProgress.upsert({
    where: { enrollmentId_moduleId: { enrollmentId: id, moduleId } },
    update: { completed, completedAt: completed ? new Date() : null },
    create: { enrollmentId: id, moduleId, completed, completedAt: completed ? new Date() : null },
  });

  const totalModules = enrollment.track.modules.length;
  const completedCount = await prisma.moduleProgress.count({
    where: { enrollmentId: id, completed: true },
  });
  const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
  const status =
    progressPercent === 100
      ? EnrollmentStatus.COMPLETED
      : progressPercent > 0
      ? EnrollmentStatus.IN_PROGRESS
      : EnrollmentStatus.NOT_STARTED;

  const updated = await prisma.enrollment.update({
    where: { id },
    data: {
      progressPercent,
      status,
      completedAt: status === EnrollmentStatus.COMPLETED ? new Date() : null,
    },
    include: enrollmentInclude,
  });

  res.json(serialize(updated));
});

export default router;
