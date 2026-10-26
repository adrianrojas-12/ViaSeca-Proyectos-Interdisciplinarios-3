package com.viaseca.backend.repo;

import com.viaseca.backend.domain.Enums.EstadoReporte;
import com.viaseca.backend.domain.Reporte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface ReporteRepository extends JpaRepository<Reporte, Long> {

    @Query(value = """
            SELECT * FROM reportes r
            WHERE r.estado NOT IN ('EXPIRADO', 'RECHAZADO')
              AND r.expira_en > now()
              AND (6371000 * acos(LEAST(1.0,
                    cos(radians(:lat)) * cos(radians(r.lat)) * cos(radians(r.lng) - radians(:lng))
                  + sin(radians(:lat)) * sin(radians(r.lat))))) <= :radio
            ORDER BY r.creado_en DESC
            """, nativeQuery = true)
    List<Reporte> cercanos(@Param("lat") double lat,
                           @Param("lng") double lng,
                           @Param("radio") double radio);

    long countByUsuarioIdAndCreadoEnAfter(Long usuarioId, Instant desde);

    @Modifying
    @Query("update Reporte r set r.estado = :nuevo where r.expiraEn < :ahora and r.estado in (:activos)")
    int expirar(@Param("nuevo") EstadoReporte nuevo,
                @Param("ahora") Instant ahora,
                @Param("activos") Collection<EstadoReporte> activos);
}