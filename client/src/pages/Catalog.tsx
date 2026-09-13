import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { LearningTrack } from "../types";
import { Card, EmptyState } from "../components/ui";

export default function Catalog() {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [category, setCategory] = useState("Todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<LearningTrack[]>("/tracks")
      .then(setTracks)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(tracks.map((t) => t.category)))],
    [tracks]
  );

  const filtered = category === "Todas" ? tracks : tracks.filter((t) => t.category === category);

  if (loading) return <div className="text-center text-slate-500">Carregando catálogo...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo de trilhas</h1>
        <p className="text-slate-500">Explore trilhas de aprendizagem e inscreva-se para desenvolver novas competências.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              category === c ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            } border border-slate-200`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState text="Nenhuma trilha encontrada nesta categoria." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Link key={t.id} to={`/trilhas/${t.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {t.category}
                  </span>
                  <span className="text-xs text-slate-400">{t.level}</span>
                </div>
                <h3 className="mb-1 font-semibold">{t.title}</h3>
                <p className="mb-3 line-clamp-2 text-sm text-slate-500">{t.description}</p>
                <div className="flex flex-wrap gap-1">
                  {t.skills.slice(0, 3).map((s) => (
                    <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">{t.modules.length} módulos</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
