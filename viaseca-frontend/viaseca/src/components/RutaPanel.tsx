import { useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "lucide-react";
import Chips from "./Chips";
import { api } from "../api";
import { useAuth } from "../auth";
import { buscarLugar, miUbicacion, type Punto } from "../geo";
import type { Modo, Ruta } from "../types";

const inp = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 disabled:bg-slate-100";

export default function RutaPanel({ onRuta }: { onRuta: (r: Ruta | null) => void }) {
  const { sesion } = useAuth();
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [usarGps, setUsarGps] = useState(false);
  const [modo, setModo] = useState<Modo>("driving-car");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<Ruta | null>(null);

  const calcular = async () => {
    setError("");
    setRes(null);
    onRuta(null);
    if ((!usarGps && !origen.trim()) || !destino.trim()) {
      setError("Indica el origen y el destino.");
      return;
    }
    setBusy(true);
    try {
      const o: Punto | null = usarGps ? await miUbicacion() : await buscarLugar(origen.trim());
      const d = await buscarLugar(destino.trim());
      if (!o || !d) throw new Error("No encontramos una de las direcciones. Prueba con otro nombre.");
      const r = await api.ruta(o, d, modo);
      setRes(r);
      onRuta(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold"><Navigation aria-hidden className="h-5 w-5" />Ruta segura</h2>
      {!sesion ? (
        <p className="text-sm text-slate-600"><Link to="/acceso" className="font-semibold text-navy-900 underline">Inicia sesión</Link> para calcular rutas que eviten las zonas inundadas.</p>
      ) : (
        <>
          <input className={inp} value={origen} disabled={usarGps} onChange={(e) => setOrigen(e.target.value)} placeholder="Origen, ej.: Av. Balta" aria-label="Origen" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={usarGps} onChange={(e) => setUsarGps(e.target.checked)} />Usar mi ubicación actual</label>
          <input className={inp} value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Destino, ej.: Mercado Modelo" aria-label="Destino" />
          <Chips label="Modo" value={modo} onChange={setModo} options={[["driving-car", "En auto"], ["foot-walking", "A pie"]]} />
          <button type="button" disabled={busy} onClick={() => void calcular()} className="w-full rounded-xl bg-navy-900 px-4 py-2.5 font-semibold text-white hover:bg-navy-700 disabled:opacity-60">
            {busy ? "Calculando…" : "Calcular ruta"}
          </button>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {res && (
            <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
              {(res.distanciaMetros / 1000).toFixed(1)} km · {Math.round(res.duracionSegundos / 60)} min · {res.zonasEvitadas} zona(s) inundada(s) evitada(s)
            </p>
          )}
        </>
      )}
    </div>
  );
}