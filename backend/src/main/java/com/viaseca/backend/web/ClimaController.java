package com.viaseca.backend.web;

import com.viaseca.backend.service.ClimaService;
import com.viaseca.backend.web.Dtos.Pronostico;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ClimaController {

    private final ClimaService clima;

    @GetMapping("/clima/pronostico")
    public Pronostico pronostico(@RequestParam double lat, @RequestParam double lng) {
        return clima.pronostico(lat, lng)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_GATEWAY, "No se pudo obtener el pronóstico del clima"));
    }
}