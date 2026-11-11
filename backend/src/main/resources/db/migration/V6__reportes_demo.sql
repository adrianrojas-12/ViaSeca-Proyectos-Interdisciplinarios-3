INSERT INTO usuarios (nombre, correo, password_hash, reputacion, activo)
VALUES ('Reportes de demostración', 'demo@viaseca.invalid', '!sin-acceso', 0, true);

INSERT INTO reportes (usuario_id, nivel, estado, lat, lng, direccion, precision_metros, confirmaciones, desmentidos, sospechoso, creado_en, expira_en)
SELECT u.id, v.nivel, v.estado, v.lat, v.lng, v.direccion, 10, v.conf, 0, false, now() - v.hace, now() + interval '30 days'
FROM usuarios u,
    (VALUES
    ('INTRANSITABLE', 'CONFIRMADO', -6.7714, -79.8409, 'Centro de Chiclayo (demostración)', 5, interval '25 minutes'),
    ('INUNDACION_MEDIA', 'CONFIRMADO', -6.7740, -79.8409, 'Zona sur del centro (demostración)', 3, interval '40 minutes'),
    ('CHARCOS', 'SIN_CONFIRMAR', -6.7714, -79.8440, 'Zona oeste del centro (demostración)', 1, interval '10 minutes'),
    ('LIBRE', 'CONFIRMADO', -6.7690, -79.8380, 'Zona norte del centro (demostración)', 4, interval '1 hour')
    ) AS v(nivel, estado, lat, lng, direccion, conf, hace)
WHERE u.correo = 'demo@viaseca.invalid';