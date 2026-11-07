import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { CENTRO, RADIO_CIUDAD } from "./config";
import { NIVEL_LABEL, type Estado, type Nivel } from "./types";

export interface Aviso {
  clave: string;
  titulo: string;
  detalle: string;
  nivel: Nivel;
}

export function useAvisos(intervaloMs = 15000) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const vistos = useRef<Map<number, Estado> | null>(null);

  useEffect(() => {
    let vivo = true;

    const revisar = async () => {
      try {
        const lista = await api.reportesCercanos(CENTRO.lat, CENTRO.lng, RADIO_CIUDAD, "TODOS");
        if (!vivo) return;
        const previos = vistos.current;
        if (previos) {
          const nuevos: Aviso[] = [];
          for (const r of lista) {
            const antes = previos.get(r.id);
            const lugar = r.direccion ?? "tu zona";
            if (antes === undefined) {
              nuevos.push({
                clave: `${r.id}-${r.estado}`,
                titulo: r.estado === "CONFIRMADO" ? "Reporte confirmado" : "Nuevo reporte cerca",
                detalle: `${NIVEL_LABEL[r.nivel]} en ${lugar}${r.estado === "CONFIRMADO" ? "" : " (sin confirmar)"}`,
                nivel: r.nivel,
              });
            } else if (antes !== "CONFIRMADO" && r.estado === "CONFIRMADO") {
              nuevos.push({
                clave: `${r.id}-${r.estado}`,
                titulo: "Reporte confirmado por vecinos",
                detalle: `${NIVEL_LABEL[r.nivel]} en ${lugar}`,
                nivel: r.nivel,
              });
            }
          }
          if (nuevos.length > 0) setAvisos((a) => [...a, ...nuevos].slice(-4));
        }
        vistos.current = new Map(lista.map((r) => [r.id, r.estado]));
      } catch {
        return;
      }
    };

    void revisar();
    const t = setInterval(() => void revisar(), intervaloMs);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [intervaloMs]);

  const cerrar = (clave: string) => setAvisos((a) => a.filter((x) => x.clave !== clave));

  return { avisos, cerrar };
}