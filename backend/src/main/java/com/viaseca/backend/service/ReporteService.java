package com.viaseca.backend.service;

import com.viaseca.backend.domain.Enums.EstadoReporte;
import com.viaseca.backend.domain.Enums.NivelAgua;
import com.viaseca.backend.domain.Enums.TipoVoto;
import com.viaseca.backend.domain.Reporte;
import com.viaseca.backend.domain.Usuario;
import com.viaseca.backend.domain.Voto;
import com.viaseca.backend.repo.ReporteRepository;
import com.viaseca.backend.repo.UsuarioRepository;
import com.viaseca.backend.repo.VotoRepository;
import com.viaseca.backend.web.ApiException;
import com.viaseca.backend.web.Dtos.ReporteRequest;
import com.viaseca.backend.web.Dtos.ReporteResponse;
import com.viaseca.backend.web.Dtos.VotoRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final ReporteRepository reportes;
    private final VotoRepository votos;
    private final UsuarioRepository usuarios;

    @Value("${app.reportes.consenso-minimo}") private int consensoMinimo;
    @Value("${app.reportes.max-por-hora}") private int maxPorHora;
    @Value("${app.reportes.duracion-horas}") private int duracionHoras;
    @Value("${app.reportes.precision-maxima-metros}") private double precisionMaxima;
    @Value("${app.reportes.radio-voto-metros}") private double radioVoto;
    @Value("${app.reputacion.suspension}") private int umbralSuspension;

    @Transactional
    public ReporteResponse crear(Long usuarioId, ReporteRequest req) {
        Usuario u = usuarios.findById(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        if (!u.isActivo()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cuenta suspendida por reportes falsos");
        }
        if (req.precisionMetros() != null && req.precisionMetros() > precisionMaxima) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "La precisión del GPS es insuficiente. Intenta de nuevo al aire libre.");
        }
        long recientes = reportes.countByUsuarioIdAndCreadoEnAfter(
                usuarioId, Instant.now().minus(Duration.ofHours(1)));
        if (recientes >= maxPorHora) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Alcanzaste el límite de reportes por hora");
        }

        Instant ahora = Instant.now();
        Reporte r = new Reporte();
        r.setUsuario(u);
        r.setNivel(req.nivel());
        r.setEstado(EstadoReporte.SIN_CONFIRMAR);
        r.setLat(req.lat());
        r.setLng(req.lng());
        r.setDireccion(req.direccion());
        r.setPrecisionMetros(req.precisionMetros());
        r.setFotoUrl(req.fotoUrl());
        r.setConfirmaciones(1); // el autor cuenta como primera confirmación
        r.setCreadoEn(ahora);
        r.setExpiraEn(ahora.plus(Duration.ofHours(duracionHoras)));
        reportes.save(r);

        Voto v = new Voto();
        v.setReporte(r);
        v.setUsuario(u);
        v.setTipo(TipoVoto.CONFIRMA);
        votos.save(v);

        return aRespuesta(r);
    }

    @Transactional
    public ReporteResponse votar(Long usuarioId, Long reporteId, VotoRequest req) {
        Reporte r = reportes.findById(reporteId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reporte no encontrado"));

        if (r.getEstado() == EstadoReporte.EXPIRADO || r.getEstado() == EstadoReporte.RECHAZADO) {
            throw new ApiException(HttpStatus.CONFLICT, "Este reporte ya no está activo");
        }
        if (r.getUsuario().getId().equals(usuarioId)) {
            throw new ApiException(HttpStatus.CONFLICT, "No puedes votar tu propio reporte");
        }
        if (distanciaMetros(req.lat(), req.lng(), r.getLat(), r.getLng()) > radioVoto) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Debes estar cerca del punto para validarlo");
        }
        if (votos.existsByReporteIdAndUsuarioId(reporteId, usuarioId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya votaste este reporte");
        }

        Voto v = new Voto();
        v.setReporte(r);
        v.setUsuario(usuarios.getReferenceById(usuarioId));
        v.setTipo(req.tipo());
        votos.save(v);

        Usuario autor = r.getUsuario();

        if (req.tipo() == TipoVoto.CONFIRMA) {
            r.setConfirmaciones(r.getConfirmaciones() + 1);
            // reconfirmar renueva la vigencia del reporte
            r.setExpiraEn(Instant.now().plus(Duration.ofHours(duracionHoras)));
            if (r.getEstado() == EstadoReporte.SIN_CONFIRMAR
                    && r.getConfirmaciones() >= consensoMinimo) {
                r.setEstado(EstadoReporte.CONFIRMADO);
                autor.setReputacion(autor.getReputacion() + 1);
            }
        } else {
            r.setDesmentidos(r.getDesmentidos() + 1);
            if (r.getDesmentidos() >= consensoMinimo
                    && r.getDesmentidos() > r.getConfirmaciones()) {
                r.setEstado(EstadoReporte.RECHAZADO);
                autor.setReputacion(autor.getReputacion() - 2);
                if (autor.getReputacion() <= umbralSuspension) {
                    autor.setActivo(false);
                }
            }
        }
        return aRespuesta(r);
    }

    @Transactional(readOnly = true)
    public List<ReporteResponse> cercanos(double lat, double lng, double radio, String tipo) {
        return reportes.cercanos(lat, lng, radio).stream()
                .filter(r -> switch (tipo.toUpperCase()) {
                    case "PELIGRO" -> r.getNivel() != NivelAgua.LIBRE;
                    case "LIBRE" -> r.getNivel() == NivelAgua.LIBRE;
                    default -> true;
                })
                .map(ReporteService::aRespuesta)
                .toList();
    }

    public static ReporteResponse aRespuesta(Reporte r) {
        return new ReporteResponse(r.getId(), r.getNivel(), r.getEstado(),
                r.getLat(), r.getLng(), r.getDireccion(), r.getFotoUrl(),
                r.getConfirmaciones(), r.getDesmentidos(), r.getCreadoEn());
    }

    public static double distanciaMetros(double lat1, double lng1, double lat2, double lng2) {
        double radioTierra = 6_371_000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * radioTierra * Math.asin(Math.sqrt(a));
    }
}