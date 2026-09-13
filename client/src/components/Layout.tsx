import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleLabel: Record<string, string> = {
  EMPLOYEE: "Colaborador(a)",
  MANAGER: "Gestor(a)",
  HR: "RH",
};

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-brand-700">Desenvolvimento de Pessoas</span>
            <nav className="flex gap-1">
              <NavItem to="/" label="Início" />
              <NavItem to="/catalogo" label="Catálogo" />
              <NavItem to="/minhas-trilhas" label="Minhas Trilhas" />
              <NavItem to="/feedback" label="Feedback" />
              {(user.role === "MANAGER" || user.role === "HR") && (
                <NavItem to="/equipe" label="Equipe" />
              )}
              {user.role === "HR" && <NavItem to="/admin" label="Administração" />}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-xs leading-tight text-slate-500">{roleLabel[user.role]}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
