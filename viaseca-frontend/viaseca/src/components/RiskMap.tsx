import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { fmt, NIVEL_COLOR, NIVEL_DESC, NIVEL_LABEL, type Reporte } from "../types";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

interface Props { reportes: Reporte[]; ruta: [number, number][] | null }

export default function RiskMap({ reportes, ruta }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const capaPines = useRef<L.LayerGroup | null>(null);
  const capaRuta = useRef<L.LayerGroup | null>(null);
  const [noTiles, setNoTiles] = useState(false);

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current).setView([-6.7714, -79.8409], 13);
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" });
    tiles.on("tileerror", () => setNoTiles(true));
    tiles.addTo(m);
    capaPines.current = L.layerGroup().addTo(m);
    capaRuta.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; capaPines.current = null; capaRuta.current = null; };
  }, []);

  useEffect(() => {
    const g = capaPines.current;
    if (!g) return;
    g.clearLayers();
    reportes.forEach((r) =>
      L.circleMarker([r.lat, r.lng], { radius: 10, color: "#fff", weight: 2, fillColor: NIVEL_COLOR[r.nivel], fillOpacity: 0.95 })
        .bindPopup(`<b>${NIVEL_LABEL[r.nivel]}</b> · ${NIVEL_DESC[r.nivel]}<br><i>${esc(r.direccion ?? "Sin dirección")}</i><br>${r.validaciones} validaciones · ${fmt(r.creadoEn)}`)
        .addTo(g)
    );
  }, [reportes]);

  useEffect(() => {
    const g = capaRuta.current;
    const m = map.current;
    if (!g || !m) return;
    g.clearLayers();
    if (!ruta || ruta.length < 2) return;
    const linea = L.polyline(ruta, { color: "#2563EB", weight: 6, opacity: 0.85 }).addTo(g);
    m.fitBounds(linea.getBounds(), { padding: [30, 30] });
  }, [ruta]);

  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl border bg-white">
      <div ref={el} className="absolute inset-0 bg-slate-200" role="application" aria-label="Mapa interactivo de Chiclayo" />
      {noTiles && (
        <p className="absolute left-3 right-3 top-3 z-[1000] rounded-lg bg-amber-100 p-2 text-xs text-amber-900" role="status">
          No se pudo cargar el mapa base de OpenStreetMap. Los marcadores siguen funcionando.
        </p>
      )}
      <ul className="absolute bottom-3 left-3 z-[1000] space-y-1 rounded-xl bg-white/95 p-3 text-xs shadow">
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-600" />Intransitable</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange-600" />Inundación media</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-yellow-600" />Charcos</li>
        <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-600" />Vía libre</li>
        <li className="flex items-center gap-2"><span className="h-0 w-4 border-t-4 border-blue-600" />Ruta calculada</li>
      </ul>
    </div>
  );
}