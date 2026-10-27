package com.viaseca.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.viaseca.backend.domain.Enums.NivelAgua;
import com.viaseca.backend.domain.Reporte;
import com.viaseca.backend.repo.ReporteRepository;
import com.viaseca.backend.web.ApiException;
import com.viaseca.backend.web.Dtos.RutaResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class RutaService {

    private static final Set<String> MODOS = Set.of("driving-car", "foot-walking");

    private final RestClient http;
    private final ReporteRepository reportes;
    private final String url;
    private final String apiKey;
    private final double radioEvitar;

    public RutaService(ReporteRepository reportes,
                       @Value("${app.ors.url}") String url,
                       @Value("${app.ors.api-key}") String apiKey,
                       @Value("${app.ors.radio-evitar-metros}") double radioEvitar) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.http = RestClient.builder().requestFactory(factory).build();
        this.reportes = reportes;
        this.url = url;
        this.apiKey = apiKey;
        this.radioEvitar = radioEvitar;
    }

    @Transactional(readOnly = true)
    public RutaResponse calcular(double origenLat, double origenLng,
                                 double destinoLat, double destinoLng, String modo) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "El servicio de rutas no está configurado");
        }
        if (!MODOS.contains(modo)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Modo no válido. Usa driving-car o foot-walking");
        }

        double medioLat = (origenLat + destinoLat) / 2;
        double medioLng = (origenLng + destinoLng) / 2;
        double radioBusqueda = ReporteService.distanciaMetros(origenLat, origenLng, destinoLat, destinoLng) / 2 + 500;

        List<Reporte> peligros = reportes.cercanos(medioLat, medioLng, radioBusqueda).stream()
                .filter(r -> r.getNivel() == NivelAgua.INTRANSITABLE || r.getNivel() == NivelAgua.INUNDACION_MEDIA)
                .filter(r -> !r.isSospechoso())
                .limit(50)
                .toList();

        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("coordinates", List.of(List.of(origenLng, origenLat), List.of(destinoLng, destinoLat)));
        if (!peligros.isEmpty()) {
            List<List<List<List<Double>>>> poligonos = new ArrayList<>();
            for (Reporte p : peligros) {
                poligonos.add(List.of(octagono(p.getLat(), p.getLng(), radioEvitar)));
            }
            cuerpo.put("options", Map.of("avoid_polygons",
                    Map.of("type", "MultiPolygon", "coordinates", poligonos)));
        }

        Geo respuesta;
        try {
            respuesta = http.post()
                    .uri(url + "/v2/directions/{modo}/geojson", modo)
                    .header("Authorization", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(cuerpo)
                    .retrieve()
                    .body(Geo.class);
        } catch (RestClientResponseException e) {
            int codigo = e.getStatusCode().value();
            if (codigo == 401 || codigo == 403) {
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "La clave del servicio de rutas no es válida");
            }
            if (e.getStatusCode().is4xxClientError()) {
                throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "No se encontró una ruta que evite las zonas inundadas");
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY, "El servicio de rutas no está disponible");
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "El servicio de rutas no está disponible");
        }

        if (respuesta == null || respuesta.features() == null || respuesta.features().isEmpty()) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "No se encontró una ruta");
        }
        Feature f = respuesta.features().get(0);
        Summary s = f.properties().summary();
        return new RutaResponse(s.distance(), s.duration(), peligros.size(), f.geometry().coordinates());
    }

    private static List<List<Double>> octagono(double lat, double lng, double radio) {
        double dLat = radio / 111_320.0;
        double dLng = radio / (111_320.0 * Math.cos(Math.toRadians(lat)));
        List<List<Double>> anillo = new ArrayList<>();
        for (int k = 0; k < 8; k++) {
            double angulo = Math.toRadians(k * 45);
            anillo.add(List.of(lng + dLng * Math.cos(angulo), lat + dLat * Math.sin(angulo)));
        }
        anillo.add(anillo.get(0));
        return anillo;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Geo(List<Feature> features) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Feature(Props properties, Geometry geometry) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Props(Summary summary) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Summary(double distance, double duration) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Geometry(List<List<Double>> coordinates) {}
}