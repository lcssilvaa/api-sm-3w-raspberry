package com.aut.api.controller;

import com.aut.api.DTO.MedicaoDTO;
import com.aut.api.DTO.MedicaoPageDTO;
import com.aut.api.entity.MedicaoEntity;
import com.aut.api.service.MedicaoService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicoes")
public class MedicaoController {

    private final MedicaoService service;

    public MedicaoController(MedicaoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Void> receber(@RequestBody MedicaoDTO dto) {
        service.salvar(dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/listar")
    public ResponseEntity<List<MedicaoEntity>> listarTodos() {
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/listar/pagina")
    public ResponseEntity<MedicaoPageDTO> listarPagina(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2000") int size) {
        Page<MedicaoEntity> resultado = service.listarPagina(page, size);
        return ResponseEntity.ok(new MedicaoPageDTO(resultado.getContent(), resultado.getTotalPages()));
    }

    @GetMapping("/teste")
    public String teste() {
        return "API online";
    }

}

