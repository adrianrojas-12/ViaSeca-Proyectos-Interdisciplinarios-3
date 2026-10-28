export type Nivel = "LIBRE" | "CHARCOS" | "INUNDACION_MEDIA" | "INTRANSITABLE";
export type Estado = "SIN_CONFIRMAR" | "CONFIRMADO" | "RECHAZADO" | "EXPIRADO";
export type TipoVoto = "CONFIRMA" | "DESMIENTE";
export type Origen = "TODAS" | "OFICIAL" | "COMUNIDAD";
export type FiltroMapa = "TODOS" | "PELIGRO" | "LIBRE";
export type Modo = "driving-car" | "foot-walking";

export interface Reporte {
  id: number;
  nivel: Nivel;
  estado: Estado;
  lat: number;
  lng: number;
  direccion: string | null;
  fotoUrl: string | null;
  validaciones: number;
  desmentidos: number;
  creadoEn: string;
  sospechoso: boolean;
}

export interface AlertaItem {
  id: string;
  origen: string;
  titulo: string;
  ubicacion: string | null;
  descripcion: string | null;
  nivel: Nivel | null;
  estado: Estado | null;
  fecha: string;
  validaciones: number | null;
  fuente: string | null;
  oficial: boolean;
}

export interface AlertasResponse { incidenciasActivas: number; items: AlertaItem[] }
export interface MapaResumen { alertaLluvia: AlertaItem | null; rutaSegura: Reporte | null }
export interface Ruta { distanciaMetros: number; duracionSegundos: number; zonasEvitadas: number; coordenadas: [number, number][] }
export interface Sesion { token: string; nombre: string }
export interface NuevoReporte { nivel: Nivel; lat: number; lng: number; direccion?: string; precisionMetros?: number; fotoUrl?: string }

export const NIVEL_LABEL: Record<Nivel, string> = {
  LIBRE: "Vía libre",
  CHARCOS: "Charcos",
  INUNDACION_MEDIA: "Inundación media",
  INTRANSITABLE: "Intransitable",
};
export const NIVEL_DESC: Record<Nivel, string> = {
  LIBRE: "Ya no hay agua en la vía",
  CHARCOS: "Se puede pasar",
  INUNDACION_MEDIA: "Pase con cuidado",
  INTRANSITABLE: "Vía bloqueada",
};
export const NIVEL_COLOR: Record<Nivel, string> = {
  LIBRE: "#16A34A",
  CHARCOS: "#CA8A04",
  INUNDACION_MEDIA: "#EA580C",
  INTRANSITABLE: "#DC2626",
};
export const ESTADO_LABEL: Record<Estado, string> = {
  SIN_CONFIRMAR: "Sin confirmar",
  CONFIRMADO: "Confirmado por vecinos",
  RECHAZADO: "Rechazado",
  EXPIRADO: "Expirado",
};
export const fmt = (iso: string | number) => new Date(iso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });