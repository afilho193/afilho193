import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { Enrollment, LearningTrack } from "../types";
import { Button, Card, ProgressBar, StatusBadge } from "../components/ui";

export default function TrackDetail() {
  const { id } = useParams<{ id: string }>();
  const [track, setTrack] = useState<LearningTrack | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [trackData, enrollments] = await Promise.all([
      api.get<LearningTrack>(`/tracks/${id}`),
      api.get<Enrollment[]>("/enrollments"),
    ]);
    setTrack(trackData);
    setEnrollment(enrollments.find((e) => e.track.id === id) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleEnroll() {
    if (!id) return;
    setEnrolling(true);
    try {
      const e = await api.post<Enrollment>("/enrollments", { trackId: id });
      setEnrollment(e);
    } finally {
      setEnrolling(false);
    }
  }

  async function toggleModule(moduleId: string, completed: boolean) {
    if (!enrollment) return;
    const updated = await api.patch<Enrollment>(
      `/enrollments/${enrollment.id}/modules/${moduleId}`,
      { completed }
    );
    setEnrollment(updated);
  }

  if (loading || !track) return <div className="text-center text-slate-500">Carregando trilha...</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {track.category}
          </span>
          <span className="text-xs text-slate-400">{track.level}</span>
        </div>
        <h1 className="text-2xl font-bold">{track.title}</h1>
        <p className="mt-1 max-w-2xl text-slate-500">{track.description}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {track.skills.map((s) => (
            <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {s}
            </span>
          ))}
        </div>
      </div>

      {!enrollment ? (
        <Button onClick={handleEnroll} disabled={enrolling}>
          {enrolling ? "Inscrevendo..." : "Inscrever-se nesta trilha"}
        </Button>
      ) : (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Seu progresso</span>
            <StatusBadge status={enrollment.status} />
          </div>
          <ProgressBar percent={enrollment.progressPercent} />
          <p className="mt-1 text-xs text-slate-400">{enrollment.progressPercent}% concluído</p>
        </Card>
      )}

      <Card>
        <h2 className="mb-4 font-semibold">Módulos</h2>
        <ul className="space-y-3">
          {track.modules.map((m) => {
            const done = enrollment?.completedModuleIds.includes(m.id) ?? false;
            return (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
              >
                <div className="flex items-center gap-3">
                  {enrollment && (
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={(e) => toggleModule(m.id, e.target.checked)}
                      className="h-4 w-4 accent-brand-600"
                    />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${done ? "text-slate-400 line-through" : ""}`}>
                      {m.order}. {m.title}
                    </p>
                    <p className="text-xs text-slate-400">{m.durationMinutes} min</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {!enrollment && (
          <p className="mt-3 text-xs text-slate-400">
            Inscreva-se para marcar os módulos como concluídos e acompanhar seu progresso.
          </p>
        )}
      </Card>
    </div>
  );
}
