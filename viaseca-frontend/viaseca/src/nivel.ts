import { Ban, CheckCircle2, OctagonAlert, TriangleAlert, Waves, type LucideIcon } from "lucide-react";
import type { Nivel } from "./types";

export const NIVEL_ICON: Record<Nivel, LucideIcon> = {
  LIBRE: CheckCircle2,
  CHARCOS: Waves,
  INUNDACION_MEDIA: TriangleAlert,
  INTRANSITABLE: Ban,
};
export const NIVEL_BORDE: Record<Nivel, string> = {
  LIBRE: "border-l-green-600",
  CHARCOS: "border-l-yellow-500",
  INUNDACION_MEDIA: "border-l-orange-500",
  INTRANSITABLE: "border-l-red-600",
};
export const NIVEL_BADGE: Record<Nivel, string> = {
  LIBRE: "bg-green-100 text-green-800",
  CHARCOS: "bg-yellow-100 text-yellow-900",
  INUNDACION_MEDIA: "bg-orange-100 text-orange-900",
  INTRANSITABLE: "bg-red-100 text-red-800",
};
export const ICONO_PELIGRO = OctagonAlert;