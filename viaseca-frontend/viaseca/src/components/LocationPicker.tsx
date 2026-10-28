import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Crosshair, Search } from "lucide-react";

export interface Pin { lat: number; lng: number; accuracy?: number }
interface Props { value: Pin | null; onChange: (p: Pin) => void; onAddress?: (a: string) => void }

const NOMINATIM = "https://nominatim.openstreetmap.org";
const icon = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#13315C;border:3px solid #fff;box-shadow:0 0 0 2px #13315C"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function LocationPicker({ value, onChange, onAddress }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const cb = useRef({ onChange, onAddress });
  cb.current = { onChange, onAddress };
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  // Guarda el punto y trata de obtener el nombre de la calle (OpenStreetMap/Nominatim).
  const commit = (p: Pin) => {
    cb.current.onChange(p);
    fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=18&accept-language=es&lat=${p.lat}&lon=${p.lng}`)
      .then((r) => r.json())
      .then((d: { address?: { road?: string; house_number?: string }; display_name?: string }) => {
        const a = d.address?.road ? `${d.address.road}${d.address.house_number ? " " + d.address.house_number : ""}` : d.display_name?.split(",")[0];
        if (a) cb.current.onAddress?.(a);
      })
      .catch(() => { /* la dirección es opcional */ });
  };

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current).setView([-6.7714, -79.8409], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => commit({ lat: e.latlng.lat, lng: e.latlng.lng }));
    map.current = m;
    return () => { m.remove(); map.current = null; marker.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!value) { marker.current?.remove(); marker.current = null; return; }
    if (!marker.current) {
      const mk = L.marker([value.lat, value.lng], { icon, draggable: true }).addTo(m);
      mk.on("dragend", () => { const p = mk.getLatLng(); commit({ lat: p.lat, lng: p.lng }); });
      marker.current = mk;
    } else marker.current.setLatLng([value.lat, value.lng]);
  }, [value]);

  const locate = () => {
    if (!navigator.geolocation) { setMsg("Tu navegador no permite obtener la ubicación. Busca la calle o toca el mapa."); return; }
    setBusy(true); setMsg("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        commit({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
        map.current?.setView([p.coords.latitude, p.coords.longitude], 17);
      },
      () => { setBusy(false); setMsg("No pudimos obtener tu ubicación. Revisa el permiso del navegador, busca la calle o toca el mapa."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const search = async () => {
    const t = q.trim();
    if (!t) return;
    setMsg("");
    try {
      const r = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=1&countrycodes=pe&accept-language=es&viewbox=-80.05,-6.65,-79.65,-6.95&q=${encodeURIComponent(t + ", Chiclayo")}`);
      const d = (await r.json()) as { lat: string; lon: string }[];
      if (!d.length) { setMsg("No encontramos esa dirección. Prueba con otro nombre o marca el punto en el mapa."); return; }
      const p = { lat: Number(d[0].lat), lng: Number(d[0].lon) };
      commit(p);
      map.current?.setView([p.lat, p.lng], 17);
    } catch { setMsg("No se pudo buscar la dirección. Revisa tu conexión o marca el punto en el mapa."); }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void search(); } }}
          placeholder="Buscar calle, ej.: Av. Balta" aria-label="Buscar calle o dirección" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5" />
        <button type="button" onClick={() => void search()} className="flex items-center gap-1 rounded-xl bg-navy-900 px-4 font-semibold text-white"><Search aria-hidden className="h-4 w-4" />Buscar</button>
      </div>
      <button type="button" onClick={locate} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy-900 px-4 py-2.5 font-semibold text-navy-900 hover:bg-slate-50 disabled:opacity-60">
        <Crosshair aria-hidden className="h-5 w-5" />{busy ? "Buscando tu ubicación…" : "Usar mi ubicación"}
      </button>
      <div ref={el} className="h-56 overflow-hidden rounded-xl border bg-slate-200" role="application" aria-label="Mapa para marcar la ubicación del incidente" />
      <p className="text-sm text-slate-600" aria-live="polite">
        {msg || (value ? `Punto marcado: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}${value.accuracy ? ` (precisión ±${Math.round(value.accuracy)} m)` : ""}. Puedes arrastrarlo para ajustarlo.` : "Busca la calle, usa tu ubicación o toca el mapa para marcar el incidente.")}
      </p>
    </div>
  );
}
