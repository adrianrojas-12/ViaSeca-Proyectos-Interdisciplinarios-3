package com.viaseca.backend.web;

import com.viaseca.backend.domain.Enums.EstadoReporte;
import com.viaseca.backend.domain.Enums.NivelAgua;
import com.viaseca.backend.domain.Enums.TipoVoto;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;

public final class Dtos {
    private Dtos() {}

    public record RegistroRequest(
            @NotBlank String nombre,
            @NotBlank @Email String correo,
            @NotBlank @Size(min = 8, message = "Mínimo 8 caracteres") String password) {}

    public record LoginRequest(
            @NotBlank @Email String correo,
            @NotBlank String password) {}

    public record TokenResponse(String token, String nombre) {}

    public record FotoResponse(String url) {}

    public record ReporteRequest(
            @NotNull NivelAgua nivel,
            @NotNull @DecimalMin("-90") @DecimalMax("90") Double lat,
            @NotNull @DecimalMin("-180") @DecimalMax("180") Double lng,
            @Size(max = 200) String direccion,
            Double precisionMetros,
            @Size(max = 300) String fotoUrl) {}

    public record VotoRequest(
            @NotNull TipoVoto tipo,
            @NotNull Double lat,
            @NotNull Double lng) {}

    public record ReporteResponse(
            Long id, NivelAgua nivel, EstadoReporte estado,
            double lat, double lng, String direccion, String fotoUrl,
            int validaciones, int desmentidos, Instant creadoEn, boolean sospechoso) {}

    public record AlertaItem(
            String id, String origen, String titulo, String ubicacion,
            String descripcion, NivelAgua nivel, EstadoReporte estado,
            Instant fecha, Integer validaciones, String fuente, boolean oficial) {}

    public record AlertasResponse(long incidenciasActivas, List<AlertaItem> items) {}

    public record MapaResumen(AlertaItem alertaLluvia, ReporteResponse rutaSegura) {}

    public record RutaResponse(
            double distanciaMetros, double duracionSegundos,
            int zonasEvitadas, List<List<Double>> coordenadas) {}

    public record HoraLluvia(String hora, double mm, int probabilidad) {}

    public record DiaLluvia(String fecha, double mm, int probabilidad) {}

    public record Pronostico(
            String nivel, String titulo, String mensaje, String recomendacion,
            double mmAhora, double mmMaxHora, int probabilidadMax, double mmTotal24h,
            String inicioLluvia, List<HoraLluvia> horas, List<DiaLluvia> dias, String fuente) {}
}