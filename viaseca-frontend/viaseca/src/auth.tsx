import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { alCambiarSesion, api, borrarSesion, guardarSesion, sesionGuardada } from "./api";
import type { Sesion } from "./types";

interface Ctx {
  sesion: Sesion | null;
  entrar: (correo: string, password: string) => Promise<void>;
  registrar: (nombre: string, correo: string, password: string) => Promise<void>;
  salir: () => void;
}

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(sesionGuardada);

  useEffect(() => alCambiarSesion(() => setSesion(sesionGuardada())), []);

  const valor = useMemo<Ctx>(() => ({
    sesion,
    entrar: async (correo, password) => {
      const r = await api.login(correo, password);
      guardarSesion({ token: r.token, nombre: r.nombre });
    },
    registrar: async (nombre, correo, password) => {
      const r = await api.registro(nombre, correo, password);
      guardarSesion({ token: r.token, nombre: r.nombre });
    },
    salir: borrarSesion,
  }), [sesion]);

  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return c;
}