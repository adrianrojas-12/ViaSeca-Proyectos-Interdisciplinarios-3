export const API = (import.meta.env.VITE_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
export const CENTRO = { lat: -6.7714, lng: -79.8409 };
export const RADIO_CIUDAD = 20000;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;