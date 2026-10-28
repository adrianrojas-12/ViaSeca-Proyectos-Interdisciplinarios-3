package com.viaseca.backend.web;

import com.viaseca.backend.service.AlertaService;
import com.viaseca.backend.web.Dtos.AlertasResponse;
import com.viaseca.backend.web.Dtos.MapaResumen;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AlertaController {

    private final AlertaService service;

    @GetMapping("/alertas")
    public AlertasResponse alertas(@RequestParam(defaultValue = "TODAS") String origen,
                                   @RequestParam double lat,
                                   @RequestParam double lng,
                                   @RequestParam(defaultValue = "3000") double radio) {
        return service.listar(origen, lat, lng, radio);
    }

    @GetMapping("/mapa/resumen")
    public MapaResumen resumen(@RequestParam double lat, @RequestParam double lng) {
        return service.resumenMapa(lat, lng);
    }
}