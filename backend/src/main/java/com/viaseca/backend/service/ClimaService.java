package com.viaseca.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class ClimaService {

    private final RestClient http;
    private final String url;
    private final double umbralMm;

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
            return Optional.of(Math.max(actual, maximoHorario) >= umbralMm);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Respuesta(Current current, Hourly hourly) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Current(Double precipitation) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Hourly(List<Double> precipitation) {}
}