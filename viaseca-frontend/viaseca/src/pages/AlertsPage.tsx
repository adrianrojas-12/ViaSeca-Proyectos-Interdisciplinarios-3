import { useState } from "react";
import { BellOff, CloudRain, ShieldCheck, Users } from "lucide-react";
import Chips from "../components/Chips";
import { api } from "../api";
import { CENTRO, RADIO_CIUDAD } from "../config";
import { useCarga } from "../hooks";
import { NIVEL_BADGE, NIVEL_BORDE, NIVEL_ICON } from "../nivel";
import { ESTADO_LABEL, fmt, type AlertaItem, type Origen } from "../types";

function Tarjeta({ a }: { a: AlertaItem }) {
  if (a.oficial || !a.nivel) {
    const Icono = a.origen === "CLIMA" ? CloudRain : ShieldCheck;
    return (
      <article className="rounded-2xl border border-l-4 border-l-blue-600 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-semibold"><Icono aria-hidden className="h-5 w-5 text-blue-700" />{a.titulo}</h3>
          {a.oficial && <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">Oficial</span>}
        </div>
        {a.ubicacion && <p className="mt-1 text-sm font-medium text-slate-700">{a.ubicacion}</p>}
        {a.descripcion && <p className="mt-1 text-sm text-slate-600">{a.descripcion}</p>}
        <p className="mt-3 text-xs text-slate-500">{fmt(a.fecha)}{a.fuente ? ` · Fuente: ${a.fuente}` : ""}</p>
      </article>
    );
  }
  const Icono = NIVEL_ICON[a.nivel];
  return (
    <article className={`rounded-2xl border border-l-4 bg-white p-4 shadow-sm ${NIVEL_BORDE[a.nivel]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold"><Icono aria-hidden className="h-5 w-5" />{a.titulo}</h3>
        {a.estado && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${NIVEL_BADGE[a.nivel]}`}>{ESTADO_LABEL[a.estado]}</span>}
      </div>
      {a.ubicacion && <p className="mt-1 text-sm font-medium text-slate-700">{a.ubicacion}</p>}
      {a.descripcion && <p className="mt-1 text-sm text-slate-600">{a.descripcion}</p>}
      <p className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span>{fmt(a.fecha)}</span>
        <span className="flex items-center gap-1"><Users aria-hidden className="h-3.5 w-3.5" />{a.validaciones ?? 0} validaciones</span>
      </p>
    </article>
  );
}

export default function AlertsPage() {
  const [origen, setOrigen] = useState<Origen>("TODAS");
  const { datos, cargando, error } = useCarga(() => api.alertas(origen, CENTRO.lat, CENTRO.lng, RADIO_CIUDAD), [origen], 30000);
  const items = datos?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-navy-900">Centro de alertas</h1>
      <Chips label="Origen de la alerta" value={origen} onChange={setOrigen} options={[["TODAS", "Todas"], ["OFICIAL", "Oficiales"], ["COMUNIDAD", "Comunidad"]]} />
      <p className="text-sm text-slate-600" aria-live="polite">{cargando && !datos ? "Cargando…" : `${datos?.incidenciasActivas ?? 0} incidencia(s) activa(s)`}</p>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!error && !cargando && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-slate-600">
          <BellOff aria-hidden className="mx-auto mb-2 h-8 w-8" />
          <p>No hay alertas activas con este filtro.</p>
        </div>
      ) : items.map((a) => <Tarjeta key={a.id} a={a} />)}
    </div>
  );
}