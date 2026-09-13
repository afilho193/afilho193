import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Enrollment, Feedback, OrgDashboard, TeamDashboard } from "../types";
import { Card, ProgressBar, StatusBadge, FeedbackTypeBadge, EmptyState } from "../components/ui";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand-700">{value}</p>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [received, setReceived] = useState<Feedback[]>([]);
  const [team, setTeam] = useState<TeamDashboard | null>(null);
  const [org, setOrg] = useState<OrgDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const requests: Promise<any>[] = [
      api.get<Enrollment[]>("/enrollments").then(setEnrollments),
      api.get<{ received: Feedback[] }>("/feedback").then((d) => setReceived(d.received.slice(0, 4))),
    ];
    if (user.role === "MANAGER") {
      requests.push(api.get<TeamDashboard>("/dashboard/team").then(setTeam));
    }
    if (user.role === "HR") {
      requests.push(api.get<OrgDashboard>("/dashboard/org").then(setOrg));
    }
    Promise.all(requests).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="text-center text-slate-500">Carregando painel...</div>;

  const inProgress = enrollments.filter((e) => e.status === "IN_PROGRESS").length;
  const completed = enrollments.filter((e) => e.status === "COMPLETED").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Olá, {user.name.split(" ")[0]}</h1>
        <p className="text-slate-500">Aqui está um resumo do seu desenvolvimento.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Trilhas em andamento" value={inProgress} />
        <StatTile label="Trilhas concluídas" value={completed} />
        <StatTile label="Feedbacks recebidos" value={received.length} />
        {org && <StatTile label="Taxa de conclusão (org)" value={`${org.completionRate}%`} />}
        {team && !org && <StatTile label="Pessoas na equipe" value={team.teamSize} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Minhas trilhas em andamento</h2>
            <Link to="/minhas-trilhas" className="text-sm text-brand-600 hover:underline">
              ver todas
            </Link>
          </div>
          {enrollments.filter((e) => e.status !== "COMPLETED").length === 0 ? (
            <EmptyState text="Nenhuma trilha em andamento. Explore o catálogo para começar." />
          ) : (
            <ul className="space-y-3">
              {enrollments
                .filter((e) => e.status !== "COMPLETED")
                .slice(0, 4)
                .map((e) => (
                  <li key={e.id}>
                    <Link to={`/trilhas/${e.track.id}`} className="block">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{e.track.title}</span>
                        <StatusBadge status={e.status} />
                      </div>
                      <ProgressBar percent={e.progressPercent} />
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Feedback recente</h2>
            <Link to="/feedback" className="text-sm text-brand-600 hover:underline">
              ver todos
            </Link>
          </div>
          {received.length === 0 ? (
            <EmptyState text="Você ainda não recebeu feedback." />
          ) : (
            <ul className="space-y-3">
              {received.map((f) => (
                <li key={f.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="mb-1 flex items-center gap-2">
                    <FeedbackTypeBadge type={f.type} />
                    <span className="text-xs text-slate-400">de {f.fromUser.name}</span>
                  </div>
                  <p className="text-sm text-slate-700">{f.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {team && (
        <Card>
          <h2 className="mb-3 font-semibold">Progresso da equipe</h2>
          {team.members.length === 0 ? (
            <EmptyState text="Você ainda não tem liderados cadastrados." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-4">Nome</th>
                    <th className="py-2 pr-4">Trilhas concluídas</th>
                    <th className="py-2 pr-4">Em andamento</th>
                    <th className="py-2">Progresso médio</th>
                  </tr>
                </thead>
                <tbody>
                  {team.members.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4 font-medium">{m.name}</td>
                      <td className="py-2 pr-4">{m.completed}</td>
                      <td className="py-2 pr-4">{m.inProgress}</td>
                      <td className="w-40 py-2">
                        <ProgressBar percent={m.avgProgress} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {org && (
        <Card>
          <h2 className="mb-3 font-semibold">Trilhas mais populares</h2>
          <ul className="space-y-2">
            {org.popularTracks.slice(0, 5).map((t) => (
              <li key={t.title} className="flex items-center justify-between text-sm">
                <span>{t.title}</span>
                <span className="text-slate-500">
                  {t.enrolled} inscrições · {t.completed} concluídas
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
