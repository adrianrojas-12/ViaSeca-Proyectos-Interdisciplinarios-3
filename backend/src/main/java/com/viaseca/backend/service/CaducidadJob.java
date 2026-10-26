package com.viaseca.backend.service;

import com.viaseca.backend.domain.Enums.EstadoReporte;
import com.viaseca.backend.repo.ReporteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CaducidadJob {

    private final ReporteRepository reportes;

    @Scheduled(fixedRate = 300_000)
    @Transactional
    public void expirarVencidos() {
        reportes.expirar(EstadoReporte.EXPIRADO, Instant.now(),
                List.of(EstadoReporte.SIN_CONFIRMAR, EstadoReporte.CONFIRMADO));
    }
}