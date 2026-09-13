import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Enrollment } from "../types";
import { Card, ProgressBar, StatusBadge, EmptyState } from "../components/ui";

export default function MyTracks() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Enrollment[]>("/enrollments")
      .then(setEnrollments)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-slate-500">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minhas trilhas</h1>
        <p className="text-slate-500">Acompanhe seu progresso nas trilhas em que você está inscrito(a).</p>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState text="Você ainda não se inscreveu em nenhuma trilha. Explore o catálogo!" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {enrollments.map((e) => (
            <Link key={e.id} to={`/trilhas/${e.track.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{e.track.title}</h3>
                  <StatusBadge status={e.status} />
                </div>
                <ProgressBar percent={e.progressPercent} />
                <p className="mt-2 text-xs text-slate-400">
                  {e.completedModuleIds.length} de {e.track.modules.length} módulos concluídos
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
