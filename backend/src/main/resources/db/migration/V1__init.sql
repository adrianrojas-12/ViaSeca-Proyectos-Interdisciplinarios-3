CREATE TABLE usuarios (
                          id            BIGSERIAL PRIMARY KEY,
                          nombre        VARCHAR(100) NOT NULL,
                          correo        VARCHAR(150) NOT NULL UNIQUE,
                          password_hash VARCHAR(100) NOT NULL,
                          reputacion    INTEGER NOT NULL DEFAULT 0,
                          activo        BOOLEAN NOT NULL DEFAULT TRUE,
                          creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reportes (
                          id               BIGSERIAL PRIMARY KEY,
                          usuario_id       BIGINT NOT NULL REFERENCES usuarios(id),
                          nivel            VARCHAR(30) NOT NULL,
                          estado           VARCHAR(30) NOT NULL,
                          lat              DOUBLE PRECISION NOT NULL,
                          lng              DOUBLE PRECISION NOT NULL,
                          direccion        VARCHAR(200),
                          precision_metros DOUBLE PRECISION,
                          foto_url         VARCHAR(300),
                          confirmaciones   INTEGER NOT NULL DEFAULT 0,
                          desmentidos      INTEGER NOT NULL DEFAULT 0,
                          creado_en        TIMESTAMPTZ NOT NULL,
                          expira_en        TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_reportes_geo ON reportes (lat, lng);
CREATE INDEX idx_reportes_estado ON reportes (estado, expira_en);

CREATE TABLE votos (
                       id         BIGSERIAL PRIMARY KEY,
                       reporte_id BIGINT NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
                       usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
                       tipo       VARCHAR(20) NOT NULL,
                       creado_en  TIMESTAMPTZ NOT NULL,
                       UNIQUE (reporte_id, usuario_id)
);

CREATE TABLE alertas_oficiales (
                                   id            BIGSERIAL PRIMARY KEY,
                                   fuente        VARCHAR(20) NOT NULL,
                                   titulo        VARCHAR(150) NOT NULL,
                                   ubicacion     VARCHAR(200),
                                   descripcion   VARCHAR(400),
                                   publicada_en  TIMESTAMPTZ NOT NULL,
                                   vigente_hasta TIMESTAMPTZ NOT NULL
);