export interface Punto { lat: number; lng: number }

export const miUbicacion = (): Promise<Punto> =>
  new Promise((ok, fallo) => {
    if (!navigator.geolocation) {
      fallo(new Error("Tu navegador no permite obtener la ubicación."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => fallo(new Error("No pudimos obtener tu ubicación. Revisa el permiso del navegador.")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

export async function buscarLugar(texto: string): Promise<Punto | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=pe&accept-language=es&viewbox=-80.05,-6.65,-79.65,-6.95&q=${encodeURIComponent(texto + ", Chiclayo")}`;
  const r = await fetch(url);
  const d = (await r.json()) as { lat: string; lon: string }[];
  return d.length ? { lat: Number(d[0].lat), lng: Number(d[0].lon) } : null;
}