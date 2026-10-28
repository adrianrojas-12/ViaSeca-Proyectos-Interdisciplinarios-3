import { useEffect, useState } from "react";

export function useCarga<T>(fn: () => Promise<T>, deps: unknown[], cadaMs?: number) {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [n, setN] = useState(0);

  useEffect(() => {
    let vivo = true;
    const cargar = () => {
      fn()
        .then((d) => { if (vivo) { setDatos(d); setError(""); } })
        .catch((e: Error) => { if (vivo) setError(e.message); })
        .finally(() => { if (vivo) setCargando(false); });
    };
    setCargando(true);
    cargar();
    const t = cadaMs ? setInterval(cargar, cadaMs) : undefined;
    return () => { vivo = false; if (t) clearInterval(t); };
  }, [...deps, n, cadaMs]);

  return { datos, cargando, error, recargar: () => setN((x) => x + 1) };
}