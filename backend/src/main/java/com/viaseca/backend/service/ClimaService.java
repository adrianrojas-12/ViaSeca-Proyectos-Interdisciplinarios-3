package com.viaseca.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.viaseca.backend.web.Dtos.DiaLluvia;
import com.viaseca.backend.web.Dtos.HoraLluvia;
import com.viaseca.backend.web.Dtos.Pronostico;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
    private final double vigilanciaProbabilidad;
    private final double vigilanciaMmDia;
    private final double precaucionProbabilidad;
    private final double precaucionMmHora;
    private final double precaucionMmDia;
    private final double alertaMmHora;
    private final double alertaMmDia;
    private final Map<String, Entrada> cache = new ConcurrentHashMap<>();
    private final Map<String, EntradaPronostico> cachePronostico = new ConcurrentHashMap<>();

    public ClimaService(@Value("${app.clima.url}") String url,
                        @Value("${app.clima.umbral-mm}") double umbralMm,
                        @Value("${app.clima.vigilancia-probabilidad}") double vigilanciaProbabilidad,
                        @Value("${app.clima.vigilancia-mm-dia}") double vigilanciaMmDia,
                        @Value("${app.clima.precaucion-probabilidad}") double precaucionProbabilidad,
                        @Value("${app.clima.precaucion-mm-hora}") double precaucionMmHora,
                        @Value("${app.clima.precaucion-mm-dia}") double precaucionMmDia,
                        @Value("${app.clima.alerta-mm-hora}") double alertaMmHora,
                        @Value("${app.clima.alerta-mm-dia}") double alertaMmDia) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(3));
        this.http = RestClient.builder().requestFactory(factory).build();
        this.url = url;
        this.umbralMm = umbralMm;
        this.vigilanciaProbabilidad = vigilanciaProbabilidad;
        this.vigilanciaMmDia = vigilanciaMmDia;
        this.precaucionProbabilidad = precaucionProbabilidad;
        this.precaucionMmHora = precaucionMmHora;
        this.precaucionMmDia = precaucionMmDia;
        this.alertaMmHora = alertaMmHora;
        this.alertaMmDia = alertaMmDia;
    }

    public Optional<Boolean> hayLluvia(double lat, double lng) {
        return precipitacionMm(lat, lng).map(this::superaUmbral);
    }

    public boolean superaUmbral(double mm) {
        return mm >= umbralMm;
    }

    public Optional<Double> precipitacionMm(double lat, double lng) {
        String clave = clave(lat, lng);
        Entrada guardada = cache.get(clave);
        if (guardada != null && guardada.expira().isAfter(Instant.now())) {
            return Optional.of(guardada.valor());
        }
        Optional<Double> consultado = consultar(lat, lng);
        consultado.ifPresent(v -> cache.put(clave, new Entrada(v, Instant.now().plus(VIGENCIA_CACHE))));
        return consultado;
    }

    public Optional<Pronostico> pronostico(double lat, double lng) {
        String clave = clave(lat, lng);
        EntradaPronostico guardada = cachePronostico.get(clave);
        if (guardada != null && guardada.expira().isAfter(Instant.now())) {
            return Optional.of(guardada.valor());
        }
        Optional<Pronostico> consultado = consultarPronostico(lat, lng);
        consultado.ifPresent(v -> cachePronostico.put(clave, new EntradaPronostico(v, Instant.now().plus(VIGENCIA_CACHE))));
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

    private Optional<Pronostico> consultarPronostico(double lat, double lng) {
        try {
            PronResp r = http.get()
                    .uri(url + "?latitude={lat}&longitude={lng}"
                            + "&hourly=precipitation,precipitation_probability"
                            + "&daily=precipitation_sum,precipitation_probability_max"
                            + "&timezone=America/Lima&forecast_days=3&forecast_hours=24", lat, lng)
                    .retrieve()
                    .body(PronResp.class);
            if (r == null || r.hourly() == null || r.hourly().time() == null) {
                return Optional.empty();
            }
            PronHorario h = r.hourly();
            List<HoraLluvia> horas = new ArrayList<>();
            double total = 0;
            double maxMm = 0;
            double maxProb = 0;
            String inicio = null;
            for (int i = 0; i < h.time().size(); i++) {
                double mm = valor(h.precipitation(), i);
                double prob = valor(h.probabilidad(), i);
                horas.add(new HoraLluvia(h.time().get(i), redondear(mm), (int) Math.round(prob)));
                total += mm;
                maxMm = Math.max(maxMm, mm);
                maxProb = Math.max(maxProb, prob);
                if (inicio == null && mm >= umbralMm) {
                    inicio = hora(h.time().get(i));
                }
            }
            List<DiaLluvia> dias = new ArrayList<>();
            PronDiario d = r.daily();
            if (d != null && d.time() != null) {
                for (int i = 0; i < d.time().size(); i++) {
                    dias.add(new DiaLluvia(d.time().get(i), redondear(valor(d.suma(), i)),
                            (int) Math.round(valor(d.probabilidadMax(), i))));
                }
            }
            String nivel = nivel(maxMm, maxProb, total);
            double ahora = horas.isEmpty() ? 0 : horas.get(0).mm();
            return Optional.of(new Pronostico(nivel, titulo(nivel), mensaje(nivel, maxMm, total, inicio),
                    recomendacion(nivel), ahora, redondear(maxMm), (int) Math.round(maxProb),
                    redondear(total), inicio, horas, dias, "Open-Meteo.com"));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private String nivel(double maxMm, double maxProb, double total) {
        if (maxMm >= alertaMmHora || total >= alertaMmDia) {
            return "ALERTA";
        }
        if ((maxProb >= precaucionProbabilidad && maxMm >= precaucionMmHora) || total >= precaucionMmDia) {
            return "PRECAUCION";
        }
        if (maxProb >= vigilanciaProbabilidad || total >= vigilanciaMmDia) {
            return "VIGILANCIA";
        }
        return "NINGUNA";
    }

    private static String titulo(String nivel) {
        return switch (nivel) {
            case "ALERTA" -> "Lluvias intensas previstas";
            case "PRECAUCION" -> "Lluvias probables";
            case "VIGILANCIA" -> "Posibles lluvias";
            default -> "Sin lluvias previstas";
        };
    }

    private static String mensaje(String nivel, double maxMm, double total, String inicio) {
        String desde = inicio != null ? ", con inicio estimado hacia las " + inicio : "";
        return switch (nivel) {
            case "ALERTA", "PRECAUCION" -> String.format(Locale.ROOT,
                    "Se esperan hasta %.1f mm/h y cerca de %.1f mm acumulados en las próximas 24 horas%s.", maxMm, total, desde);
            case "VIGILANCIA" -> "Hay probabilidad de lluvias ligeras en las próximas 24 horas" + desde + ".";
            default -> "No se esperan lluvias significativas en las próximas 24 horas.";
        };
    }

    private static String recomendacion(String nivel) {
        return switch (nivel) {
            case "ALERTA" -> "No cruces calles inundadas. Aléjate de canales y quebradas y evita desplazamientos innecesarios.";
            case "PRECAUCION" -> "Evita las zonas bajas y los canales. Planifica tu ruta con anticipación.";
            case "VIGILANCIA" -> "Mantente informado y revisa el mapa antes de salir.";
            default -> "Consulta el mapa antes de salir.";
        };
    }

    private static String clave(double lat, double lng) {
        return Math.round(lat * 100) + ":" + Math.round(lng * 100);
    }

    private static double valor(List<Double> lista, int i) {
        return lista != null && i < lista.size() && lista.get(i) != null ? lista.get(i) : 0;
    }

    private static double redondear(double v) {
        return Math.round(v * 10) / 10.0;
    }

    private static String hora(String iso) {
        return iso.length() >= 16 ? iso.substring(11, 16) : iso;
    }

    private record Entrada(double valor, Instant expira) {}

    private record EntradaPronostico(Pronostico valor, Instant expira) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Respuesta(Current current, Hourly hourly) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Current(Double precipitation) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Hourly(List<Double> precipitation) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PronResp(PronHorario hourly, PronDiario daily) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PronHorario(List<String> time, List<Double> precipitation,
                              @JsonProperty("precipitation_probability") List<Double> probabilidad) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PronDiario(List<String> time,
                             @JsonProperty("precipitation_sum") List<Double> suma,
                             @JsonProperty("precipitation_probability_max") List<Double> probabilidadMax) {}
}