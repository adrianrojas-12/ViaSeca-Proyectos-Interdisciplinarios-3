package com.viaseca.backend.repo;

import com.viaseca.backend.domain.AlertaOficial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface AlertaOficialRepository extends JpaRepository<AlertaOficial, Long> {
    List<AlertaOficial> findByVigenteHastaAfterOrderByPublicadaEnDesc(Instant ahora);
}