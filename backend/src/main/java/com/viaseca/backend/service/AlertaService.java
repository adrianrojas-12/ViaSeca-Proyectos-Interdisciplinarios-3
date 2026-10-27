package com.viaseca.backend.service;

import com.viaseca.backend.domain.AlertaOficial;
import com.viaseca.backend.domain.Enums.NivelAgua;
import com.viaseca.backend.domain.Reporte;
import com.viaseca.backend.repo.AlertaOficialRepository;
import com.viaseca.backend.repo.ReporteRepository;
import com.viaseca.backend.web.Dtos.AlertaItem;
import com.viaseca.backend.web.Dtos.AlertasResponse;
import com.viaseca.backend.web.Dtos.MapaResumen;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AlertaService {

    private final ReporteRepository reportes;
    private final AlertaOficialRepository oficiales;
    private final ClimaService clima;

    @Transactional(readOnly = true)
    public AlertasResponse listar(String origen, double lat, double lng, double radio) {
        String o = origen.toUpperCase();
        List<AlertaItem> items = new ArrayList<>();

        if (!o.equals("OFICIAL")) {
            reportes.cercanos(lat, lng, radio).forEach(r -> items.add(deReporte(r)));
        }
        if (!o.equals("COMUNIDAD")) {
            oficiales.findByVigenteHastaAfterOrderByPublicadaEnDesc(Instant.now())
                    .forEach(a -> items.add(deOficial(a)));
        }
        items.sort(Comparator.comparing(AlertaItem::fecha).reversed());
        return new AlertasResponse(items.size(), items);
    }

    @Transactional(readOnly = true)
    public MapaResumen resumenMapa(double lat, double lng) {
        AlertaItem lluvia = clima.precipitacionMm(lat, lng)
                .filter(clima::superaUmbral)
                .map(AlertaService::deClima)
                .orElseGet(() -> oficiales.findByVigenteHastaAfterOrderByPublicadaEnDesc(Instant.now())
                        .stream().findFirst().map(AlertaService::deOficial).orElse(null));

        var rutaSegura = reportes.cercanos(lat, lng, 3000).stream()
                .filter(r -> r.getNivel() == NivelAgua.LIBRE)
                .max(Comparator.comparingInt(Reporte::getConfirmaciones))
                .map(ReporteService::aRespuesta)
                .orElse(null);

        return new MapaResumen(lluvia, rutaSegura);
    }

    private static AlertaItem deClima(double mm) {
        return new AlertaItem("C-lluvia", "CLIMA", "Alerta de lluvias activa", "Tu zona",
                String.format(Locale.ROOT, "Precipitación de %.1f mm/h en tu zona.", mm),
                null, null, Instant.now(), null, "OPEN-METEO", false);
    }

    private static AlertaItem deReporte(Reporte r) {
        return new AlertaItem("R-" + r.getId(), "COMUNIDAD", titulo(r.getNivel()),
                r.getDireccion(), descripcion(r.getNivel()), r.getNivel(), r.getEstado(),
                r.getCreadoEn(), r.getConfirmaciones(), null, false);
    }

    private static AlertaItem deOficial(AlertaOficial a) {
        return new AlertaItem("O-" + a.getId(), "OFICIAL", a.getTitulo(), a.getUbicacion(),
                a.getDescripcion(), null, null, a.getPublicadaEn(), null,
                a.getFuente().name(), true);
    }

    private static String titulo(NivelAgua n) {
        return switch (n) {
            case INTRANSITABLE -> "Vía intransitable";
            case INUNDACION_MEDIA -> "Inundación media";
            case CHARCOS -> "Charcos en la vía";
            case LIBRE -> "Vía nuevamente libre";
        };
    }

    private static String descripcion(NivelAgua n) {
        return switch (n) {
            case INTRANSITABLE -> "Vía bloqueada. Evita esta zona.";
            case INUNDACION_MEDIA -> "Tránsito lento. Pasa con cuidado.";
            case CHARCOS -> "Se puede pasar.";
            case LIBRE -> "El nivel de agua descendió.";
        };
    }
}