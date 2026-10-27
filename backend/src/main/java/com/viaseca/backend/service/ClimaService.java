package com.viaseca.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ClimaService {

    private static final Duration VIGENCIA_CACHE = Duration.ofMinutes(10);

    private final RestClient http;
    private final String url;
    private final double umbralMm;
    private final Map<String, Entrada> cache = new ConcurrentHashMap<>();

    public ClimaService(@Value("${app.clima.url}") String url,
                        @Value("${app.clima.umbral-mm}") double umbralMm) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(3));
        this.http = RestClient.builder().requestFactory(factory).build();
        this.url = url;
        this.umbralMm = umbralMm;
    }

    public Optional<Boolean> hayLluvia(double lat, double lng) {
        return precipitacionMm(lat, lng).map(this::superaUmbral);
    }

    public boolean superaUmbral(double mm) {
        return mm >= umbralMm;
    }

    public Optional<Double> precipitacionMm(double lat, double lng) {
        String clave = Math.round(lat * 100) + ":" + Math.round(lng * 100);
        Entrada guardada = cache.get(clave);
        if (guardada != null && guardada.expira().isAfter(Instant.now())) {
            return Optional.of(guardada.valor());
        }
        Optional<Double> consultado = consultar(lat, lng);
        consultado.ifPresent(v -> cache.put(clave, new Entrada(v, Instant.now().plus(VIGENCIA_CACHE))));
        return consultado;
    }

    private Optional<Double> consultar(double lat, double lng) {
        try {
            Respuesta r = http.get()
                    .uri(url + "?latitude={lat}&longitude={lng}&current=precipitation"
                            + "&hourly=precipitation&past_hours=6&forecast_hours=1", lat, lng)
                    .retrieve()
                    .body(Respuesta.class);
            if (r == null) {
                return Optional.empty();
            }
            double actual = (r.current() != null && r.current().precipitation() != null)
                    ? r.current().precipitation() : 0;
            double maximoHorario = (r.hourly() != null && r.hourly().precipitation() != null)
                    ? r.hourly().precipitation().stream()
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .max().orElse(0)
                    : 0;
            return Optional.of(Math.max(actual, maximoHorario));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private record Entrada(double valor, Instant expira) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Respuesta(Current current, Hourly hourly) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Current(Double precipitation) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Hourly(List<Double> precipitation) {}
}