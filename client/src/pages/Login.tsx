import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui";

const DEMO_USERS = [
  { label: "RH — Renata Souza", email: "rh@empresa.com" },
  { label: "Gestor — Carlos Mendes", email: "carlos.gestor@empresa.com" },
  { label: "Colaboradora — Ana Paula Rocha", email: "ana.rocha@empresa.com" },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("senha123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-brand-700">
          Desenvolvimento de Pessoas
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Trilhas de aprendizagem e feedback contínuo
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="voce@empresa.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="mb-2 font-medium text-slate-600">Usuários de demonstração</p>
          <p className="mb-2 text-xs text-slate-400">Senha para todos: senha123</p>
          <ul className="space-y-1">
            {DEMO_USERS.map((u) => (
              <li key={u.email}>
                <button
                  type="button"
                  className="text-brand-600 hover:underline"
                  onClick={() => setEmail(u.email)}
                >
                  {u.label} ({u.email})
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
