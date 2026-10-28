import { Link, NavLink, Outlet } from "react-router-dom";
import { Bell, Droplets, FileText, Info, LogIn, LogOut, Map as MapIcon } from "lucide-react";
import { useAuth } from "../auth";

const links = [
  { to: "/", label: "Mapa de riesgo", short: "Mapa", Icon: MapIcon },
  { to: "/alertas", label: "Alertas", short: "Alertas", Icon: Bell },
  { to: "/reportes", label: "Reportes ciudadanos", short: "Reportes", Icon: FileText },
];

const Brand = () => (
  <div className="flex items-center gap-2 text-xl font-bold"><Droplets aria-hidden className="h-6 w-6 text-sky-300" />VíaSeca</div>
);

function Cuenta({ oscuro }: { oscuro: boolean }) {
  const { sesion, salir } = useAuth();
  const base = "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold";
  if (!sesion) {
    return (
      <Link to="/acceso" className={`${base} ${oscuro ? "bg-white text-navy-900" : "bg-white/20 text-white"}`}>
        <LogIn aria-hidden className="h-4 w-4" />Iniciar sesión
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="truncate">Hola, {sesion.nombre}</span>
      <button type="button" onClick={salir} className={`${base} border border-white/40 hover:bg-navy-700`}>
        <LogOut aria-hidden className="h-4 w-4" />Salir
      </button>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 bg-navy-900 p-4 text-white md:flex">
        <Brand />
        <nav className="flex flex-col gap-1" aria-label="Principal">
          {links.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 ${isActive ? "bg-white text-navy-900 font-semibold" : "hover:bg-navy-700"}`}>
              <Icon aria-hidden className="h-5 w-5" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto"><Cuenta oscuro /></div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 bg-navy-900 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white md:hidden">
          <Brand />
          <Cuenta oscuro={false} />
        </header>
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            Prototipo académico (MVP): los reportes los envía la comunidad y no son información oficial.
          </p>
          <Outlet />
        </main>
      </div>
      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-[2000] grid grid-cols-3 border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {links.map(({ to, short, Icon }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-xs ${isActive ? "font-semibold text-navy-900" : "text-slate-500"}`}>
            <Icon aria-hidden className="h-6 w-6" />{short}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}