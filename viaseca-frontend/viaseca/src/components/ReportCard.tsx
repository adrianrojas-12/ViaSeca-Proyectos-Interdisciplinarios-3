import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Hourglass, MapPin, ThumbsDown, ThumbsUp, Users } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { API } from "../config";
import { miUbicacion } from "../geo";
import { NIVEL_BADGE, NIVEL_BORDE, NIVEL_ICON } from "../nivel";
import { ESTADO_LABEL, fmt, NIVEL_DESC, NIVEL_LABEL, type Reporte, type TipoVoto } from "../types";

interface Props { r: Reporte; onCambio?: () => void }

export default function ReportCard({ r, onCambio }: Props) {
  const { sesion } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const Icon = NIVEL_ICON[r.nivel];

  const votar = async (tipo: TipoVoto) => {
    setBusy(true);
    setMsg("");
    try {
      const pos = await miUbicacion();
      await api.votar(r.id, tipo, pos);
      setMsg("Gracias, tu voto fue registrado.");
      onCambio?.();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`rounded-2xl border border-l-4 bg-white p-4 shadow-sm ${NIVEL_BORDE[r.nivel]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold"><Icon aria-hidden className="h-5 w-5" />{NIVEL_LABEL[r.nivel]}</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${NIVEL_BADGE[r.nivel]}`}>{NIVEL_DESC[r.nivel]}</span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-700"><MapPin aria-hidden className="h-4 w-4" />{r.direccion ?? `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`}</p>
      {r.fotoUrl && <img src={`${API}${r.fotoUrl}`} alt="Foto del reporte" loading="lazy" className="mt-3 h-40 w-full rounded-xl object-cover" />}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Clock aria-hidden className="h-3.5 w-3.5" />{fmt(r.creadoEn)}</span>
        <span className="flex items-center gap-1">
          {r.estado === "CONFIRMADO" ? <CheckCircle2 aria-hidden className="h-3.5 w-3.5 text-green-700" /> : <Hourglass aria-hidden className="h-3.5 w-3.5" />}
          {ESTADO_LABEL[r.estado]}
        </span>
        <span className="flex items-center gap-1"><Users aria-hidden className="h-3.5 w-3.5" />{r.validaciones} validaciones</span>
        {r.sospechoso && <span className="rounded-full bg-slate-200 px-2 py-0.5 font-medium text-slate-700">Sin lluvia registrada en la zona</span>}
      </div>
      {onCambio && (
        <div className="mt-3 border-t pt-3">
          {sesion ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void votar("CONFIRMA")} className="flex items-center gap-1.5 rounded-xl border border-navy-900 px-3 py-1.5 text-sm font-semibold text-navy-900 hover:bg-slate-50 disabled:opacity-60">
                <ThumbsUp aria-hidden className="h-4 w-4" />Sigue así
              </button>
              <button type="button" disabled={busy} onClick={() => void votar("DESMIENTE")} className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                <ThumbsDown aria-hidden className="h-4 w-4" />Ya no es cierto
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-600"><Link to="/acceso" className="font-semibold text-navy-900 underline">Inicia sesión</Link> para validar este reporte.</p>
          )}
          {msg && <p role="status" className="mt-2 text-sm text-slate-700">{msg}</p>}
        </div>
      )}
    </article>
  );
}