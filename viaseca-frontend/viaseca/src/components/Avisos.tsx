import { useEffect } from "react";
import { BellRing, X } from "lucide-react";
import { NIVEL_BORDE } from "../nivel";
import type { Aviso } from "../useAvisos";

function Tarjeta({ aviso, cerrar }: { aviso: Aviso; cerrar: (clave: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => cerrar(aviso.clave), 12000);
    return () => clearTimeout(t);
  }, [aviso.clave, cerrar]);

  return (
    <div className={`flex items-start gap-3 rounded-xl border border-l-4 bg-white p-3 shadow-lg ${NIVEL_BORDE[aviso.nivel]}`}>
      <BellRing aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-navy-900" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{aviso.titulo}</p>
        <p className="text-sm text-slate-700">{aviso.detalle}</p>
      </div>
      <button type="button" onClick={() => cerrar(aviso.clave)} aria-label="Cerrar aviso" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
        <X aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function Avisos({ avisos, cerrar }: { avisos: Aviso[]; cerrar: (clave: string) => void }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-3 z-[3000] ml-auto max-w-sm space-y-2 [&>*]:pointer-events-auto">
      {avisos.map((a) => <Tarjeta key={a.clave} aviso={a} cerrar={cerrar} />)}
    </div>
  );
}