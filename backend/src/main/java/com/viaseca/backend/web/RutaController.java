package com.viaseca.backend.web;

import com.viaseca.backend.service.RutaService;
import com.viaseca.backend.web.Dtos.RutaResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class RutaController {

    private final RutaService service;

    @GetMapping("/rutas")
    public RutaResponse ruta(@RequestParam double origenLat,
                             @RequestParam double origenLng,
                             @RequestParam double destinoLat,
                             @RequestParam double destinoLng,
                             @RequestParam(defaultValue = "driving-car") String modo) {
        return service.calcular(origenLat, origenLng, destinoLat, destinoLng, modo);
    }
}