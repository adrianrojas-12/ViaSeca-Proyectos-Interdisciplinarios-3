package com.viaseca.backend.domain;

import com.viaseca.backend.domain.Enums.EstadoReporte;
import com.viaseca.backend.domain.Enums.NivelAgua;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "reportes")
@Getter @Setter @NoArgsConstructor
public class Reporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NivelAgua nivel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoReporte estado = EstadoReporte.SIN_CONFIRMAR;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    private String direccion;

    @Column(name = "precision_metros")
    private Double precisionMetros;

    @Column(name = "foto_url")
    private String fotoUrl;

    private int confirmaciones;

    private int desmentidos;

    private boolean sospechoso;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @Column(name = "expira_en", nullable = false)
    private Instant expiraEn;
}