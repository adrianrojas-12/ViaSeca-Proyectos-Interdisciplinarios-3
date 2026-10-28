import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Camera, CheckCircle2, Send } from "lucide-react";
import ReportCard from "../components/ReportCard";
import LocationPicker, { type Pin } from "../components/LocationPicker";
import { api } from "../api";
import { useAuth } from "../auth";
import { CENTRO, RADIO_CIUDAD } from "../config";
import { useCarga } from "../hooks";
import { NIVEL_ICON } from "../nivel";
import { NIVEL_DESC, NIVEL_LABEL, type Nivel } from "../types";

const inp = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-navy-700";
const NIVELES: Nivel[] = ["CHARCOS", "INUNDACION_MEDIA", "INTRANSITABLE", "LIBRE"];
const MAX_FOTO = 10 * 1024 * 1024;

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </label>
  );
}

export default function ReportsPage() {
  const { sesion } = useAuth();
  const lista = useCarga(() => api.reportesCercanos(CENTRO.lat, CENTRO.lng, RADIO_CIUDAD, "TODOS"), [], 30000);
  const [nivel, setNivel] = useState<Nivel>("INUNDACION_MEDIA");
  const [pin, setPin] = useState<Pin | null>(null);
  const [street, setStreet] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorEnvio, setErrorEnvio] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const auto = useRef(true);
  const onAddress = (a: string) => { if (auto.current || !street) { setStreet(a); auto.current = true; } };

  const elegirFoto = (f: File | undefined) => {
    if (!f) { setFoto(null); return; }
    if (f.type !== "image/jpeg" && f.type !== "image/png") { setErrors((e) => ({ ...e, foto: "Solo se aceptan imágenes JPG o PNG." })); return; }
    if (f.size > MAX_FOTO) { setErrors((e) => ({ ...e, foto: "La imagen supera los 10 MB." })); return; }
    setErrors((e) => { const { foto: _quitada, ...resto } = e; return resto; });
    setFoto(f);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setOk(false);
    setErrorEnvio("");
    if (!pin) { setErrors({ pin: "Marca el lugar del incidente en el mapa o usa tu ubicación." }); return; }
    setErrors({});
    setBusy(true);
    try {
      const fotoUrl = foto ? (await api.subirFoto(foto)).url : undefined;
      await api.crearReporte({ nivel, lat: pin.lat, lng: pin.lng, direccion: street.trim() || undefined, precisionMetros: pin.accuracy, fotoUrl });
      setPin(null); setStreet(""); setFoto(null); auto.current = true; setOk(true);
      lista.recargar();
    } catch (err) {
      setErrorEnvio((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h1 className="mb-3 text-2xl font-bold text-navy-900">Nuevo reporte</h1>
        {!sesion ? (
          <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
            <p className="text-slate-700">Para enviar un reporte necesitas una cuenta. Tu identidad no se muestra a otros usuarios.</p>
            <Link to="/acceso" className="mt-4 inline-block rounded-xl bg-navy-900 px-5 py-3 font-semibold text-white hover:bg-navy-700">Iniciar sesión o registrarme</Link>
          </div>
        ) : (
          <form onSubmit={(ev) => void submit(ev)} noValidate className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">¿Qué tan alta está el agua?</legend>
              <div className="grid gap-2">
                {NIVELES.map((n) => {
                  const Icono = NIVEL_ICON[n];
                  return (
                    <label key={n} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${nivel === n ? "border-navy-900 bg-slate-50 ring-2 ring-navy-900" : "hover:bg-slate-50"}`}>
                      <input type="radio" name="nivel" className="h-4 w-4" checked={nivel === n} onChange={() => setNivel(n)} />
                      <Icono aria-hidden className="h-5 w-5" />
                      <span><span className="block font-semibold">{NIVEL_LABEL[n]}</span><span className="text-sm text-slate-600">{NIVEL_DESC[n]}</span></span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <p className="mb-1 text-sm font-medium">Ubicación del incidente</p>
              <LocationPicker value={pin} onChange={setPin} onAddress={onAddress} />
              {errors.pin && <p role="alert" className="mt-1 text-sm text-red-700">{errors.pin}</p>}
            </div>
            <Field label="Calle o referencia (opcional)">
              <input className={inp} value={street} onChange={(ev) => { auto.current = false; setStreet(ev.target.value); }} placeholder="Ej.: Av. Balta, cuadra 5" />
            </Field>
            <Field label="Foto (opcional, JPG o PNG, máximo 10 MB)" error={errors.foto}>
              <span className="flex items-center gap-3 rounded-xl border border-dashed p-3">
                <Camera aria-hidden className="h-5 w-5 shrink-0" />
                <input type="file" accept="image/jpeg,image/png" onChange={(ev) => elegirFoto(ev.target.files?.[0])} className="min-w-0 text-sm" />
              </span>
            </Field>
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-3 font-semibold text-white hover:bg-navy-700 disabled:opacity-60">
              <Send aria-hidden className="h-5 w-5" />{busy ? "Enviando…" : "Enviar reporte ahora"}
            </button>
            {errorEnvio && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{errorEnvio}</p>}
            {ok && (
              <p role="status" className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-900">
                <CheckCircle2 aria-hidden className="h-5 w-5" />Reporte enviado. <Link to="/" className="font-semibold underline">Verlo en el mapa</Link>
              </p>
            )}
            <p className="text-xs text-slate-500">Tu reporte será público. No compartimos tu identidad.</p>
          </form>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Reportes activos</h2>
        {lista.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{lista.error}</p>}
        {!lista.error && !lista.cargando && (lista.datos ?? []).length === 0
          ? <p className="rounded-2xl border border-dashed bg-white p-6 text-center text-slate-600">No hay reportes activos. Sé el primero en reportar.</p>
          : (lista.datos ?? []).map((r) => <ReportCard key={r.id} r={r} onCambio={lista.recargar} />)}
      </section>
    </div>
  );
}