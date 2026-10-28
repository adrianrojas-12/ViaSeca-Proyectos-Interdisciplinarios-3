import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CloudRain, FileText, ShieldCheck } from "lucide-react";
import Chips from "../components/Chips";
import RiskMap from "../components/RiskMap";
import RutaPanel from "../components/RutaPanel";
import { api } from "../api";
import { CENTRO, RADIO_CIUDAD } from "../config";
import { useCarga } from "../hooks";
import type { FiltroMapa, Nivel, Ruta } from "../types";

const OPTS: [FiltroMapa, string][] = [["TODOS", "Todos"], ["PELIGRO", "Peligros"], ["LIBRE", "Vías libres"]];
const NIVELES: [Nivel, string][] = [["INTRANSITABLE", "Intransitables"], ["INUNDACION_MEDIA", "Inundación media"], ["CHARCOS", "Charcos"], ["LIBRE", "Vías libres"]];

export default function MapPage() {
  const [filtro, setFiltro] = useState<FiltroMapa>("TODOS");
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const reportes = useCarga(() => api.reportesCercanos(CENTRO.lat, CENTRO.lng, RADIO_CIUDAD, filtro), [filtro], 30000);
  const resumen = useCarga(() => api.resumenMapa(CENTRO.lat, CENTRO.lng), [], 60000);
  const lista = useMemo(() => reportes.datos ?? [], [reportes.datos]);
  const lluvia = resumen.datos?.alertaLluvia ?? null;
  const segura = resumen.datos?.rutaSegura ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-navy-900">Mapa de riesgo</h1>
          <span className="text-sm text-slate-600" aria-live="polite">{reportes.cargando && !reportes.datos ? "Cargando…" : `Mostrando ${lista.length} reporte(s)`}</span>
        </div>
        {lluvia && (
          <p role="status" className="flex items-start gap-2 rounded-xl border border-sky-300 bg-sky-50 p-3 text-sm text-sky-900">
            <CloudRain aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span><b>{lluvia.titulo}</b>{lluvia.descripcion ? `. ${lluvia.descripcion}` : ""}{lluvia.fuente ? ` Fuente: ${lluvia.fuente}.` : ""}</span>
          </p>
        )}
        {reportes.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{reportes.error}</p>}
        <Chips label="Filtrar reportes" value={filtro} options={OPTS} onChange={setFiltro} />
        <div className="h-[58vh] lg:h-[calc(100vh-15rem)]"><RiskMap reportes={lista} ruta={ruta?.coordenadas ?? null} /></div>
      </section>
      <aside className="space-y-3 lg:pt-12">
        {segura && (
          <div className="flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm">
            <ShieldCheck aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-green-700" />
            <div>
              <p className="text-xs font-semibold uppercase text-green-800">Ruta segura cercana</p>
              <p className="font-semibold">{segura.direccion ?? "Vía libre"} está libre</p>
              <p className="text-xs text-slate-600">Validado por {segura.validaciones} vecino(s)</p>
            </div>
          </div>
        )}
        <RutaPanel onRuta={setRuta} />
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Resumen de reportes</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {NIVELES.map(([n, t]) => (
              <div key={n} className="rounded-xl bg-slate-50 p-3"><dd className="text-2xl font-bold text-navy-900">{lista.filter((r) => r.nivel === n).length}</dd><dt className="text-slate-600">{t}</dt></div>
            ))}
          </dl>
        </div>
        <Link to="/reportes" className="flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-3 font-semibold text-white hover:bg-navy-700">
          <FileText aria-hidden className="h-5 w-5" />Reportar un incidente
        </Link>
      </aside>
    </div>
  );
}