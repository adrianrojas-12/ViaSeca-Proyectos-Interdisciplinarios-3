import { API } from "./config";
import type { AlertasResponse, FiltroMapa, MapaResumen, Modo, NuevoReporte, Origen, Reporte, Ruta, Sesion, TipoVoto } from "./types";
import type { Punto } from "./geo";

const K_TOKEN = "viaseca-token";
const K_NOMBRE = "viaseca-nombre";
const EVENTO = "viaseca-sesion";

export class ApiError extends Error {
  constructor(public status: number, mensaje: string) {
    super(mensaje);
  }
}

export function sesionGuardada(): Sesion | null {
  try {
    const token = localStorage.getItem(K_TOKEN);
    const nombre = localStorage.getItem(K_NOMBRE);
    return token && nombre ? { token, nombre } : null;
  } catch {
    return null;
  }
}

export function guardarSesion(s: Sesion) {
  try {
    localStorage.setItem(K_TOKEN, s.token);
    localStorage.setItem(K_NOMBRE, s.nombre);
  } catch {
    return;
  } finally {
    window.dispatchEvent(new Event(EVENTO));
  }
}

export function borrarSesion() {
  try {
    localStorage.removeItem(K_TOKEN);
    localStorage.removeItem(K_NOMBRE);
  } catch {
    return;
  } finally {
    window.dispatchEvent(new Event(EVENTO));
  }
}

export function alCambiarSesion(fn: () => void) {
  window.addEventListener(EVENTO, fn);
  return () => window.removeEventListener(EVENTO, fn);
}

async function pedir<T>(ruta: string, init: RequestInit = {}, conSesion = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");
  if (conSesion) {
    const s = sesionGuardada();
    if (s) headers.set("Authorization", `Bearer ${s.token}`);
  }
  let r: Response;
  try {
    r = await fetch(`${API}${ruta}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. Verifica que el backend esté en marcha.");
  }
  if (r.status === 401 && conSesion) {
    borrarSesion();
    throw new ApiError(401, "Tu sesión venció. Inicia sesión de nuevo.");
  }
  if (!r.ok) {
    let mensaje = "Ocurrió un error inesperado.";
    try {
      const d = (await r.json()) as { error?: string };
      if (d.error) mensaje = d.error;
    } catch {
      mensaje = "Ocurrió un error inesperado.";
    }
    throw new ApiError(r.status, mensaje);
  }
  return (await r.json()) as T;
}

const json = (cuerpo: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(cuerpo) });

export const api = {
  registro: (nombre: string, correo: string, password: string) =>
    pedir<Sesion & { token: string }>("/auth/registro", json({ nombre, correo, password })),

  login: (correo: string, password: string) =>
    pedir<Sesion & { token: string }>("/auth/login", json({ correo, password })),

  reportesCercanos: (lat: number, lng: number, radio: number, tipo: FiltroMapa) =>
    pedir<Reporte[]>(`/reportes?lat=${lat}&lng=${lng}&radio=${radio}&tipo=${tipo}`),

  crearReporte: (r: NuevoReporte) => pedir<Reporte>("/reportes", json(r), true),

  votar: (id: number, tipo: TipoVoto, p: Punto) =>
    pedir<Reporte>(`/reportes/${id}/votos`, json({ tipo, lat: p.lat, lng: p.lng }), true),

  subirFoto: (archivo: File) => {
    const datos = new FormData();
    datos.append("archivo", archivo);
    return pedir<{ url: string }>("/fotos", { method: "POST", body: datos }, true);
  },

  alertas: (origen: Origen, lat: number, lng: number, radio: number) =>
    pedir<AlertasResponse>(`/alertas?origen=${origen}&lat=${lat}&lng=${lng}&radio=${radio}`),

  resumenMapa: (lat: number, lng: number) => pedir<MapaResumen>(`/mapa/resumen?lat=${lat}&lng=${lng}`),

  ruta: async (o: Punto, d: Punto, modo: Modo): Promise<Ruta> => {
    const r = await pedir<{ distanciaMetros: number; duracionSegundos: number; zonasEvitadas: number; coordenadas: number[][] }>(
      `/rutas?origenLat=${o.lat}&origenLng=${o.lng}&destinoLat=${d.lat}&destinoLng=${d.lng}&modo=${modo}`,
      {},
      true
    );
    return { ...r, coordenadas: r.coordenadas.map(([lng, lat]) => [lat, lng] as [number, number]) };
  },
};