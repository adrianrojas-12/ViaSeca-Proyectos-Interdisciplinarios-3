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
}