import { useState } from "react";

export function useTema() {
  const [oscuro, setOscuro] = useState(() => document.documentElement.classList.contains("dark"));
  const alternar = () => {
    const nuevo = !oscuro;
    document.documentElement.classList.toggle("dark", nuevo);
    try { localStorage.setItem("tema", nuevo ? "oscuro" : "claro"); } catch { /* sin almacenamiento */ }
    setOscuro(nuevo);
  };
  return { oscuro, alternar };
}