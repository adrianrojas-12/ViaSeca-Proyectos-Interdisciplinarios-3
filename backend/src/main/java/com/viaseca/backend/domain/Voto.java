package com.viaseca.backend.domain;

import com.viaseca.backend.domain.Enums.TipoVoto;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "votos",
        uniqueConstraints = @UniqueConstraint(columnNames = {"reporte_id", "usuario_id"}))
@Getter @Setter @NoArgsConstructor
public class Voto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporte_id")
    private Reporte reporte;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoVoto tipo;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn = Instant.now();
}