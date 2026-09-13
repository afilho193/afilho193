import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { LearningTrack, Role, User } from "../types";
import { Button, Card, EmptyState } from "../components/ui";

const roleLabel: Record<Role, string> = {
  EMPLOYEE: "Colaborador(a)",
  MANAGER: "Gestor(a)",
  HR: "RH",
};

function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [title, setTitle] = useState("");
  const [managerId, setManagerId] = useState("");

  async function load() {
    const data = await api.get<User[]>("/users");
    setUsers(data);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const managers = users.filter((u) => u.role === "MANAGER");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/users", {
        name,
        email,
        password,
        role,
        title: title || undefined,
        managerId: managerId || undefined,
      });
      setName("");
      setEmail("");
      setPassword("");
      setTitle("");
      setManagerId("");
      setRole("EMPLOYEE");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar usuário");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este usuário? Esta ação não pode ser desfeita.")) return;
    await api.delete(`/users/${id}`);
    await load();
  }

  if (loading) return <div className="text-center text-slate-500">Carregando usuários...</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h2 className="mb-3 font-semibold">Usuários ({users.length})</h2>
        {users.length === 0 ? (
          <EmptyState text="Nenhum usuário cadastrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">Papel</th>
                  <th className="py-2 pr-4">Gestor</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-2 pr-4">{roleLabel[u.role]}</td>
                    <td className="py-2 pr-4 text-slate-500">
                      {users.find((m) => m.id === u.managerId)?.name ?? "—"}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="h-fit">
        <h2 className="mb-3 font-semibold">Novo usuário</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Cargo (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="EMPLOYEE">Colaborador(a)</option>
            <option value="MANAGER">Gestor(a)</option>
            <option value="HR">RH</option>
          </select>
          {role === "EMPLOYEE" && (
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Sem gestor definido</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Criando..." : "Criar usuário"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

interface ModuleForm {
  title: string;
  durationMinutes: string;
}

function TracksAdmin() {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("Básico");
  const [skills, setSkills] = useState("");
  const [modules, setModules] = useState<ModuleForm[]>([{ title: "", durationMinutes: "20" }]);

  async function load() {
    const data = await api.get<LearningTrack[]>("/tracks");
    setTracks(data);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  function updateModule(idx: number, patch: Partial<ModuleForm>) {
    setModules((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  }

  function addModule() {
    setModules((prev) => [...prev, { title: "", durationMinutes: "20" }]);
  }

  function removeModule(idx: number) {
    setModules((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/tracks", {
        title,
        description,
        category,
        level,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        modules: modules
          .filter((m) => m.title.trim())
          .map((m) => ({
            title: m.title.trim(),
            durationMinutes: Number(m.durationMinutes) || 15,
          })),
      });
      setTitle("");
      setDescription("");
      setCategory("");
      setLevel("Básico");
      setSkills("");
      setModules([{ title: "", durationMinutes: "20" }]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar trilha");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta trilha? Isso também removerá as inscrições associadas.")) return;
    await api.delete(`/tracks/${id}`);
    await load();
  }

  if (loading) return <div className="text-center text-slate-500">Carregando trilhas...</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h2 className="mb-3 font-semibold">Trilhas ({tracks.length})</h2>
        {tracks.length === 0 ? (
          <EmptyState text="Nenhuma trilha cadastrada." />
        ) : (
          <ul className="space-y-3">
            {tracks.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-slate-400">
                    {t.category} · {t.level} · {t.modules.length} módulos
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="h-fit">
        <h2 className="mb-3 font-semibold">Nova trilha</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            required
            rows={2}
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              placeholder="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option>Básico</option>
              <option>Intermediário</option>
              <option>Avançado</option>
            </select>
          </div>
          <input
            placeholder="Competências (separadas por vírgula)"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />

          <div>
            <p className="mb-1 text-xs font-medium text-slate-600">Módulos</p>
            <div className="space-y-2">
              {modules.map((m, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    placeholder={`Módulo ${idx + 1}`}
                    value={m.title}
                    onChange={(e) => updateModule(idx, { title: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    value={m.durationMinutes}
                    onChange={(e) => updateModule(idx, { durationMinutes: e.target.value })}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                  {modules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeModule(idx)}
                      className="text-xs text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addModule} className="mt-2 text-xs text-brand-600 hover:underline">
              + adicionar módulo
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Criando..." : "Criar trilha"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState<"users" | "tracks">("users");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administração</h1>
        <p className="text-slate-500">Gerencie usuários e o catálogo de trilhas da organização.</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("users")}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            tab === "users" ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          Usuários
        </button>
        <button
          onClick={() => setTab("tracks")}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            tab === "tracks" ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          Trilhas
        </button>
      </div>

      {tab === "users" ? <UsersAdmin /> : <TracksAdmin />}
    </div>
  );
}
