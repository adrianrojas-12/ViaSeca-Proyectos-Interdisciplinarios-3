package com.viaseca.backend.web;

import com.viaseca.backend.service.FotoService;
import com.viaseca.backend.web.Dtos.FotoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class FotoController {

    private final FotoService service;

    @PostMapping(value = "/fotos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public FotoResponse subir(@RequestParam("archivo") MultipartFile archivo) {
        return new FotoResponse(service.guardar(archivo));
    }
}