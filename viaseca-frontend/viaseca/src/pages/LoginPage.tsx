import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { GOOGLE_CLIENT_ID } from "../config";

const inp = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-navy-700";

function BotonGoogle({ registro, onCredential }: { registro: boolean; onCredential: (c: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const iniciar = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      if (!g || !ref.current) return false;
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (r: { credential: string }) => onCredential(r.credential),
      });
      ref.current.innerHTML = "";
      g.accounts.id.renderButton(ref.current, {
        theme: "outline", size: "large", width: 320, locale: "es",
        text: registro ? "signup_with" : "signin_with",
      });
      return true;
    };
    if (iniciar()) return;
    const t = setInterval(() => { if (iniciar()) clearInterval(t); }, 300);
    return () => clearInterval(t);
  }, [registro, onCredential]);
  if (!GOOGLE_CLIENT_ID) return null;
  return <div ref={ref} className="flex justify-center" />;
}

export default function LoginPage() {
  const { sesion, entrar, registrar, entrarGoogle } = useAuth();
  const ir = useNavigate();
  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (sesion) return <Navigate to="/reportes" replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (modoRegistro && nombre.trim().length < 2) { setError("Escribe tu nombre."); return; }
    if (!/^\S+@\S+\.\S+$/.test(correo)) { setError("Escribe un correo válido."); return; }
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    setBusy(true);
    try {
      if (modoRegistro) await registrar(nombre.trim(), correo.trim(), password);
      else await entrar(correo.trim(), password);
      ir("/reportes");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const conGoogle = async (credential: string) => {
    setError("");
    try {
      await entrarGoogle(credential);
      ir("/reportes");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold text-navy-900">{modoRegistro ? "Crear cuenta" : "Iniciar sesión"}</h1>
      <form onSubmit={(e) => void enviar(e)} noValidate className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
        {modoRegistro && (
          <label className="block space-y-1">
            <span className="text-sm font-medium">Nombre</span>
            <input className={inp} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label className="block space-y-1">
          <span className="text-sm font-medium">Correo</span>
          <input type="email" className={inp} value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="email" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Contraseña</span>
          <input type="password" className={inp} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={modoRegistro ? "new-password" : "current-password"} />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-navy-900 px-4 py-3 font-semibold text-white hover:bg-navy-700 disabled:opacity-60">
          {busy ? "Un momento…" : modoRegistro ? "Crear cuenta" : "Entrar"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <hr className="flex-1" />o<hr className="flex-1" />
      </div>
      <BotonGoogle registro={modoRegistro} onCredential={(c) => void conGoogle(c)} />

      <button type="button" onClick={() => { setModoRegistro(!modoRegistro); setError(""); }} className="w-full text-center text-sm font-semibold text-navy-900 underline">
        {modoRegistro ? "Ya tengo cuenta" : "No tengo cuenta, quiero registrarme"}
      </button>
      <p className="text-center text-xs text-slate-500">Tu identidad no se muestra en los reportes que envías.</p>
    </div>
  );
}