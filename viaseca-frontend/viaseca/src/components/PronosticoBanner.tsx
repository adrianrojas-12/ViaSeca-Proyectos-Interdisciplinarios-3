import { useState } from "react";
import { ChevronDown, ChevronUp, CloudDrizzle, CloudLightning, CloudRain, CloudSun, type LucideIcon } from "lucide-react";
import { api } from "../api";
import { CENTRO } from "../config";
import { useCarga } from "../hooks";
import type { NivelAviso } from "../types";

const ESTILO: Record<NivelAviso, { caja: string; barra: string; etiqueta: string; Icono: LucideIcon }> = {
  NINGUNA: { caja: "border-sky-200 bg-sky-50 text-sky-900", barra: "bg-sky-500", etiqueta: "Sin avisos", Icono: CloudSun },
  VIGILANCIA: { caja: "border-yellow-300 bg-yellow-50 text-yellow-900", barra: "bg-yellow-500", etiqueta: "Vigilancia", Icono: CloudDrizzle },
  PRECAUCION: { caja: "border-orange-300 bg-orange-50 text-orange-900", barra: "bg-orange-500", etiqueta: "Precaución", Icono: CloudRain },
  ALERTA: { caja: "border-red-300 bg-red-50 text-red-900", barra: "bg-red-600", etiqueta: "Alerta", Icono: CloudLightning },
};

const hora = (iso: string) => iso.slice(11, 16);
const dia = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" });

export default function PronosticoBanner() {
  const [abierto, setAbierto] = useState(false);
  const { datos, cargando, error } = useCarga(() => api.pronostico(CENTRO.lat, CENTRO.lng), [], 600000);

  if (!datos) {
    return (
      <p role="status" className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
        {cargando ? "Cargando pronóstico de lluvias…" : error || "No se pudo cargar el pronóstico."}
      </p>
    );
  }

  const { caja, barra, etiqueta, Icono } = ESTILO[datos.nivel];
  const maximo = Math.max(1, ...datos.horas.map((h) => h.mm));

  return (
    <section aria-label="Pronóstico de lluvias" className={`rounded-xl border p-3 ${caja}`}>
      <div className="flex items-start gap-3">
        <Icono aria-hidden className="mt-0.5 h-6 w-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {datos.titulo}
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">{etiqueta}</span>
          </p>
          <p className="text-sm">{datos.mensaje}</p>
          <p className="mt-1 text-sm font-medium">{datos.recomendacion}</p>
        </div>
        <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold hover:bg-white/60">
          {abierto ? "Ocultar" : "Detalle"}
          {abierto ? <ChevronUp aria-hidden className="h-4 w-4" /> : <ChevronDown aria-hidden className="h-4 w-4" />}
        </button>
      </div>
      {abierto && (
        <div className="mt-3 space-y-3 border-t border-black/10 pt-3">
          <div>
            <p className="mb-1 text-xs font-semibold">Próximas 24 horas (mm por hora)</p>
            <div className="flex h-16 items-end gap-0.5" role="img" aria-label="Gráfico de lluvia por hora">
              {datos.horas.map((h) => (
                <div key={h.hora} title={`${hora(h.hora)} · ${h.mm.toFixed(1)} mm · ${h.probabilidad}%`} className="flex h-full flex-1 items-end">
                  <div className={`w-full rounded-t ${h.mm > 0 ? barra : "bg-black/10"}`} style={{ height: `${Math.max(6, (h.mm / maximo) * 100)}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px]">
              <span>{datos.horas.length > 0 ? hora(datos.horas[0].hora) : ""}</span>
              <span>{datos.horas.length > 12 ? hora(datos.horas[12].hora) : ""}</span>
              <span>{datos.horas.length > 0 ? hora(datos.horas[datos.horas.length - 1].hora) : ""}</span>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-white/60 p-2"><dd className="text-base font-bold">{datos.mmTotal24h.toFixed(1)} mm</dd><dt>acumulado 24 h</dt></div>
            <div className="rounded-lg bg-white/60 p-2"><dd className="text-base font-bold">{datos.mmMaxHora.toFixed(1)} mm/h</dd><dt>intensidad máxima</dt></div>
            <div className="rounded-lg bg-white/60 p-2"><dd className="text-base font-bold">{datos.probabilidadMax}%</dd><dt>probabilidad máx.</dt></div>
          </dl>
          <ul className="grid gap-1 text-sm sm:grid-cols-3">
            {datos.dias.map((d) => (
              <li key={d.fecha} className="rounded-lg bg-white/60 p-2"><b className="capitalize">{dia(d.fecha)}</b><br />{d.mm.toFixed(1)} mm · {d.probabilidad}%</li>
            ))}
          </ul>
          <p className="text-xs">Datos: {datos.fuente}. Pronóstico referencial; sigue siempre los comunicados oficiales de SENAMHI, ENFEN e INDECI.</p>
        </div>
      )}
    </section>
  );
}