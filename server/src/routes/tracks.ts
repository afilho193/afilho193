import { Router } from "express";
import { z } from "zod";
import { Role } from "../lib/enums";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const trackInclude = {
  modules: { orderBy: { order: "asc" as const } },
  skills: { include: { skill: true } },
};

function serializeTrack(track: any) {
  return {
    id: track.id,
    title: track.title,
    description: track.description,
    category: track.category,
    level: track.level,
    createdAt: track.createdAt,
    modules: track.modules.map((m: any) => ({
      id: m.id,
      title: m.title,
      order: m.order,
      durationMinutes: m.durationMinutes,
      resourceUrl: m.resourceUrl,
    })),
    skills: track.skills.map((s: any) => s.skill.name),
  };
}

router.get("/", async (_req, res) => {
  const tracks = await prisma.learningTrack.findMany({
    include: trackInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json(tracks.map(serializeTrack));
});

router.get("/:id", async (req, res) => {
  const track = await prisma.learningTrack.findUnique({
    where: { id: req.params.id },
    include: trackInclude,
  });
  if (!track) return res.status(404).json({ error: "Trilha não encontrada" });
  res.json(serializeTrack(track));
});

const moduleSchema = z.object({
  title: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  resourceUrl: z.string().optional().nullable(),
});

const trackSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  level: z.string().min(1),
  skills: z.array(z.string().min(1)).default([]),
  modules: z.array(moduleSchema).default([]),
});

router.post("/", requireRole(Role.HR), async (req, res) => {
  const parsed = trackSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" });
  }
  const { skills, modules, ...trackData } = parsed.data;

  const track = await prisma.learningTrack.create({
    data: {
      ...trackData,
      modules: {
        create: modules.map((m, idx) => ({ ...m, order: idx + 1 })),
      },
      skills: {
        create: await Promise.all(
          skills.map(async (name) => {
            const skill = await prisma.skill.upsert({
              where: { name },
              update: {},
              create: { name },
            });
            return { skillId: skill.id };
          })
        ),
      },
    },
    include: trackInclude,
  });
  res.status(201).json(serializeTrack(track));
});

router.patch("/:id", requireRole(Role.HR), async (req, res) => {
  const parsed = trackSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }
  const { skills, modules, ...trackData } = parsed.data;

  try {
    // Resolvido antes da transação: upsert de Skill usa a mesma conexão do pool
    // e não precisa participar do rollback de módulos/competências da trilha.
    const skillIds = skills
      ? await Promise.all(
          skills.map(async (name) => {
            const skill = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
            return skill.id;
          })
        )
      : undefined;

    const track = await prisma.$transaction(async (tx) => {
      if (modules) {
        await tx.trackModule.deleteMany({ where: { trackId: req.params.id } });
      }
      if (skillIds) {
        await tx.trackSkill.deleteMany({ where: { trackId: req.params.id } });
      }

      return tx.learningTrack.update({
        where: { id: req.params.id },
        data: {
          ...trackData,
          ...(modules && {
            modules: { create: modules.map((m, idx) => ({ ...m, order: idx + 1 })) },
          }),
          ...(skillIds && {
            skills: { create: skillIds.map((skillId) => ({ skillId })) },
          }),
        },
        include: trackInclude,
      });
    });
    res.json(serializeTrack(track));
  } catch {
    res.status(404).json({ error: "Trilha não encontrada" });
  }
});

router.delete("/:id", requireRole(Role.HR), async (req, res) => {
  try {
    await prisma.learningTrack.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: "Trilha não encontrada" });
  }
});

export default router;
