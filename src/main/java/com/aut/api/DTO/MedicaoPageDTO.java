package com.aut.api.DTO;

import com.aut.api.entity.MedicaoEntity;

import java.util.List;

public record MedicaoPageDTO(
        List<MedicaoEntity> content,
        int totalPages
) {
}
