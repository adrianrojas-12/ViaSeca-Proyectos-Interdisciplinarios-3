package com.viaseca.backend.service;

import com.viaseca.backend.domain.Usuario;
import com.viaseca.backend.repo.UsuarioRepository;
import com.viaseca.backend.security.TokenService;
import com.viaseca.backend.web.ApiException;
import com.viaseca.backend.web.Dtos.LoginRequest;
import com.viaseca.backend.web.Dtos.RegistroRequest;
import com.viaseca.backend.web.Dtos.TokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final TokenService tokens;

    public TokenResponse registrar(RegistroRequest req) {
        String correo = req.correo().trim().toLowerCase();
        if (usuarios.existsByCorreo(correo)) {
            throw new ApiException(HttpStatus.CONFLICT, "El correo ya está registrado");
        }
        Usuario u = new Usuario();
        u.setNombre(req.nombre().trim());
        u.setCorreo(correo);
        u.setPasswordHash(encoder.encode(req.password()));
        usuarios.save(u);
        return new TokenResponse(tokens.generar(u.getId()), u.getNombre());
    }

    public TokenResponse login(LoginRequest req) {
        Usuario u = usuarios.findByCorreo(req.correo().trim().toLowerCase())
                .filter(x -> encoder.matches(req.password(), x.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));
        if (!u.isActivo()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cuenta suspendida por reportes falsos");
        }
        return new TokenResponse(tokens.generar(u.getId()), u.getNombre());
    }

    @Value("${app.google.client-id:}")
    private String googleClientId;

    private volatile JwtDecoder googleDecoder;

    private JwtDecoder googleDecoder() {
        if (googleDecoder == null) {
            NimbusJwtDecoder d = NimbusJwtDecoder
                    .withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs").build();
            OAuth2TokenValidator<Jwt> emisor = jwt -> {
                String iss = jwt.getClaimAsString("iss");
                boolean ok = "https://accounts.google.com".equals(iss) || "accounts.google.com".equals(iss);
                return ok ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Emisor inválido", null));
            };
            OAuth2TokenValidator<Jwt> audiencia = jwt ->
                    jwt.getAudience() != null && jwt.getAudience().contains(googleClientId)
                            ? OAuth2TokenValidatorResult.success()
                            : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Audiencia inválida", null));
            d.setJwtValidator(new DelegatingOAuth2TokenValidator<>(new JwtTimestampValidator(), emisor, audiencia));
            googleDecoder = d;
        }
        return googleDecoder;
    }

    public TokenResponse loginGoogle(String credential) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Inicio con Google no configurado");
        }
        Jwt jwt;
        try {
            jwt = googleDecoder().decode(credential);
        } catch (JwtException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Token de Google inválido");
        }
        String email = jwt.getClaimAsString("email");
        if (email == null || !Boolean.TRUE.equals(jwt.getClaim("email_verified"))) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Tu correo de Google no está verificado");
        }
        final String correo = email.trim().toLowerCase();
        final String nombre = jwt.getClaimAsString("name") != null ? jwt.getClaimAsString("name") : correo;

        Usuario u = usuarios.findByCorreo(correo).orElseGet(() -> {
            Usuario nuevo = new Usuario();
            nuevo.setNombre(nombre);
            nuevo.setCorreo(correo);
            nuevo.setPasswordHash(encoder.encode(UUID.randomUUID().toString())); // columna NOT NULL; nadie conoce esta clave
            return usuarios.save(nuevo);
        });
        if (!u.isActivo()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cuenta suspendida por reportes falsos");
        }
        return new TokenResponse(tokens.generar(u.getId()), u.getNombre());
    }
}