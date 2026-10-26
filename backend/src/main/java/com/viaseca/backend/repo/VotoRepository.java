package com.viaseca.backend.repo;

import com.viaseca.backend.domain.Voto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VotoRepository extends JpaRepository<Voto, Long> {
    boolean existsByReporteIdAndUsuarioId(Long reporteId, Long usuarioId);
}