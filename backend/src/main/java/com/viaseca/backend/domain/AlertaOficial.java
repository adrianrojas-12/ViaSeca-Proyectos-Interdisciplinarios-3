package com.viaseca.backend.domain;

import com.viaseca.backend.domain.Enums.FuenteAlerta;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "alertas_oficiales")
@Getter @Setter @NoArgsConstructor
public class AlertaOficial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FuenteAlerta fuente;

    @Column(nullable = false)
    private String titulo;

    private String ubicacion;

    private String descripcion;

    @Column(name = "publicada_en", nullable = false)
    private Instant publicadaEn;

    @Column(name = "vigente_hasta", nullable = false)
    private Instant vigenteHasta;
}