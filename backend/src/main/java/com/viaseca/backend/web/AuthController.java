package com.viaseca.backend.web;

import com.viaseca.backend.service.AuthService;
import com.viaseca.backend.web.Dtos.LoginRequest;
import com.viaseca.backend.web.Dtos.RegistroRequest;
import com.viaseca.backend.web.Dtos.TokenResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.viaseca.backend.web.Dtos.GoogleRequest;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService auth;

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public TokenResponse registro(@Valid @RequestBody RegistroRequest req) {
        return auth.registrar(req);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @PostMapping("/google")
    public TokenResponse google(@Valid @RequestBody GoogleRequest req) {
        return auth.loginGoogle(req.credential());
    }
}