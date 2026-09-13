import { Router } from "express";
import { EnrollmentStatus, Role } from "../lib/enums";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

async function summarizeUsers(userIds: string[]) {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    include: { enrollments: { include: { track: true } } },
  });

  return users.map((u) => {
    const total = u.enrollments.length;
    const completed = u.enrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED).length;
    const inProgress = u.enrollments.filter((e) => e.status === EnrollmentStatus.IN_PROGRESS).length;
    const avgProgress =
      total > 0 ? Math.round(u.enrollments.reduce((s, e) => s + e.progressPercent, 0) / total) : 0;
    return {
      id: u.id,
      name: u.name,
      title: u.title,
      totalEnrollments: total,
      completed,
      inProgress,
      avgProgress,
    };
  });
}

// Visão do gestor sobre sua equipe direta
router.get("/team", requireRole(Role.MANAGER, Role.HR), async (req, res) => {
  const { id } = req.auth!;
  const reports = await prisma.user.findMany({ where: { managerId: id } });
  const summary = await summarizeUsers(reports.map((r) => r.id));

  const recentFeedback = await prisma.feedback.findMany({
    where: { fromUserId: id },
    include: { toUser: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  res.json({
    teamSize: reports.length,
    members: summary,
    recentFeedback: recentFeedback.map((f) => ({
      id: f.id,
      type: f.type,
      message: f.message,
      createdAt: f.createdAt,
      toUser: { id: f.toUser.id, name: f.toUser.name },
    })),
  });
});

// Visão organizacional para RH
router.get("/org", requireRole(Role.HR), async (_req, res) => {
  const [userCount, trackCount, enrollments, feedbackCount] = await Promise.all([
    prisma.user.count(),
    prisma.learningTrack.count(),
    prisma.enrollment.findMany({ include: { track: true } }),
    prisma.feedback.count(),
  ]);

  const completed = enrollments.filter((e) => e.status === EnrollmentStatus.COMPLETED).length;
  const inProgress = enrollments.filter((e) => e.status === EnrollmentStatus.IN_PROGRESS).length;
  const completionRate =
    enrollments.length > 0 ? Math.round((completed / enrollments.length) * 100) : 0;

  const byTrack = new Map<string, { title: string; enrolled: number; completed: number }>();
  for (const e of enrollments) {
    const entry = byTrack.get(e.trackId) ?? { title: e.track.title, enrolled: 0, completed: 0 };
    entry.enrolled += 1;
    if (e.status === EnrollmentStatus.COMPLETED) entry.completed += 1;
    byTrack.set(e.trackId, entry);
  }

  const popularTracks = Array.from(byTrack.values()).sort((a, b) => b.enrolled - a.enrolled);

  const allUsers = await prisma.user.findMany();
  const memberSummary = await summarizeUsers(allUsers.map((u) => u.id));

  res.json({
    userCount,
    trackCount,
    feedbackCount,
    totalEnrollments: enrollments.length,
    completed,
    inProgress,
    completionRate,
    popularTracks,
    members: memberSummary,
  });
});

export default router;
