package com.viaseca.backend.service;

import com.viaseca.backend.web.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class FotoService {

    private final Path carpeta;

    public FotoService(@Value("${app.fotos.carpeta}") String carpeta) throws IOException {
        this.carpeta = Path.of(carpeta).toAbsolutePath().normalize();
        Files.createDirectories(this.carpeta);
    }

    public String guardar(MultipartFile archivo) {
        if (archivo.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El archivo está vacío");
        }
        byte[] cabecera;
        try (InputStream in = archivo.getInputStream()) {
            cabecera = in.readNBytes(8);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo leer el archivo");
        }
        String extension = extension(cabecera);
        if (extension == null) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Solo se aceptan imágenes JPG o PNG");
        }
        String nombre = UUID.randomUUID() + "." + extension;
        try (InputStream in = archivo.getInputStream()) {
            Files.copy(in, carpeta.resolve(nombre));
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar la imagen");
        }
        return "/uploads/" + nombre;
    }

    private static String extension(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "png";
        }
        return null;
    }
}