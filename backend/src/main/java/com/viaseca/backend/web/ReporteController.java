package com.viaseca.backend.web;

import com.viaseca.backend.service.ReporteService;
import com.viaseca.backend.web.Dtos.ReporteRequest;
import com.viaseca.backend.web.Dtos.ReporteResponse;
import com.viaseca.backend.web.Dtos.VotoRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReporteResponse crear(@AuthenticationPrincipal Jwt jwt,
                                 @Valid @RequestBody ReporteRequest req) {
        return service.crear(Long.valueOf(jwt.getSubject()), req);
    }

    @GetMapping
    public List<ReporteResponse> cercanos(@RequestParam double lat,
                                          @RequestParam double lng,
                                          @RequestParam(defaultValue = "1500") double radio,
                                          @RequestParam(defaultValue = "TODOS") String tipo) {
        return service.cercanos(lat, lng, radio, tipo);
    }

    @PostMapping("/{id}/votos")
    public ReporteResponse votar(@AuthenticationPrincipal Jwt jwt,
                                 @PathVariable Long id,
                                 @Valid @RequestBody VotoRequest req) {
        return service.votar(Long.valueOf(jwt.getSubject()), id, req);
    }
}