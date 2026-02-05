package com.aut.api.controller;

import com.aut.api.DTO.MedicaoDTO;
import com.aut.api.entity.MedicaoEntity;
import com.aut.api.service.MedicaoService;
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

    @GetMapping("/teste")
    public String teste() {
        return "API online";
    }

}

