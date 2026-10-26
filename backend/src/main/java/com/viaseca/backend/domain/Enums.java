package com.viaseca.backend.domain;

public final class Enums {
    private Enums() {}

    public enum NivelAgua { LIBRE, CHARCOS, INUNDACION_MEDIA, INTRANSITABLE }

    public enum EstadoReporte { SIN_CONFIRMAR, CONFIRMADO, RECHAZADO, EXPIRADO }

    public enum TipoVoto { CONFIRMA, DESMIENTE }

    public enum FuenteAlerta { INDECI, MINEDU, SENAMHI }
}