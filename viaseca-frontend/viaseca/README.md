# VíaSeca (MVP académico)

Frontend de monitoreo colaborativo de inundaciones y rutas alternativas ante El Niño en Chiclayo, Lambayeque. Proyecto de Proyectos Interdisciplinarios, UTEC.

## Instalación y uso
Requiere Node.js 18 o superior.

    npm install
    npm run dev      # abre http://localhost:5173
    npm run build    # compila para producción
    npm run preview  # sirve la versión compilada

## Estructura
    src/data/demo.ts          datos simulados, rutas y zonas
    src/store.tsx             estado + LocalStorage ("viaseca-reports")
    src/components/           Layout, RiskMap (Leaflet), ReportCard, Chips
    src/pages/                MapPage, AlertsPage, ReportsPage

## Funcionalidades
- Navegación real entre Mapa de riesgo, Alertas y Reportes ciudadanos (lateral en escritorio, inferior en móvil con áreas seguras).
- Mapa Leaflet/OpenStreetMap centrado en Chiclayo, marcadores por nivel, rutas de demostración, leyenda fija, filtros y resumen.
- Alertas con filtros por nivel y tipo, iconos además de color y estado vacío.
- Formulario con validación y confirmación; los reportes persisten en LocalStorage y aparecen en lista, alertas y mapa.
- Los datos creados por el usuario se distinguen de los simulados.

## Limitaciones
- Sin backend, sin autenticación, sin fotos ni notificaciones reales.
- Todos los datos de demostración son ficticios; no son oficiales ni en tiempo real. No hay conexión con INDECI ni la Municipalidad.
- La ubicación del reporte se toma con el GPS del navegador (pide permiso; funciona en localhost o HTTPS) o buscando la calle o tocando el mapa. Al marcar el punto se rellena la calle automáticamente.
- Los reportes viven solo en el navegador donde se crearon. Si el mapa base no carga (sin internet), se muestra una simulación sin calles.

## Mapa y búsqueda (100 % gratis, sin claves)
Usa OpenStreetMap para el mapa y Nominatim para buscar calles y obtener la dirección de un punto. No requiere tarjeta ni cuenta. Nominatim es un servicio público con uso razonable (la app solo consulta al pulsar Buscar o al marcar un punto); para mucho tráfico habría que usar un proveedor propio. La cobertura de nombres de calles en Perú puede ser menor que en Google Maps; el pin siempre guarda las coordenadas exactas.
