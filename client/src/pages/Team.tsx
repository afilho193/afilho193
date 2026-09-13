import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Enrollment, Feedback, User } from "../types";
import { Card, ProgressBar, StatusBadge, FeedbackTypeBadge, EmptyState } from "../components/ui";

export default function Team() {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [feedback, setFeedback] = useState<{ received: Feedback[]; sent: Feedback[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api
      .get<User[]>("/users")
      .then((users) => {
        const reports = users.filter((u) => u.id !== user?.id);
        setMembers(reports);
        if (reports.length > 0) setSelected(reports[0]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!selected) return;
    setDetailLoading(true);
    Promise.all([
      api.get<Enrollment[]>(`/enrollments?userId=${selected.id}`).then(setEnrollments),
      api.get<{ received: Feedback[]; sent: Feedback[] }>(`/feedback?userId=${selected.id}`).then(setFeedback),
    ]).finally(() => setDetailLoading(false));
  }, [selected]);

  if (loading) return <div className="text-center text-slate-500">Carregando equipe...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Equipe</h1>
        <p className="text-slate-500">
          {user?.role === "HR" ? "Visão de todos os colaboradores da organização." : "Acompanhe o desenvolvimento dos seus liderados."}
        </p>
      </div>

      {members.length === 0 ? (
        <EmptyState text="Nenhum membro de equipe encontrado." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="h-fit lg:col-span-1">
            <h2 className="mb-3 font-semibold">Pessoas</h2>
            <ul className="space-y-1">
              {members.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => setSelected(m)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      selected?.id === m.id ? "bg-brand-50 text-brand-700" : "hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.title}</p>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            {detailLoading || !selected ? (
              <div className="text-center text-slate-500">Carregando detalhes...</div>
            ) : (
              <>
                <Card>
                  <h2 className="mb-3 font-semibold">Trilhas de {selected.name}</h2>
                  {enrollments.length === 0 ? (
                    <EmptyState text="Ainda não está inscrito(a) em nenhuma trilha." />
                  ) : (
                    <ul className="space-y-3">
                      {enrollments.map((e) => (
                        <li key={e.id}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium">{e.track.title}</span>
                            <StatusBadge status={e.status} />
                          </div>
                          <ProgressBar percent={e.progressPercent} />
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card>
                  <h2 className="mb-3 font-semibold">Histórico de feedback</h2>
                  {!feedback || (feedback.received.length === 0 && feedback.sent.length === 0) ? (
                    <EmptyState text="Nenhum feedback registrado ainda." />
                  ) : (
                    <ul className="space-y-3">
                      {[...feedback.received, ...feedback.sent]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((f) => (
                          <li key={f.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                            <div className="mb-1 flex items-center gap-2">
                              <FeedbackTypeBadge type={f.type} />
                              <span className="text-xs text-slate-400">
                                {f.fromUser.id === selected.id
                                  ? `enviado para ${f.toUser.name}`
                                  : `de ${f.fromUser.name}`}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700">{f.message}</p>
                          </li>
                        ))}
                    </ul>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
