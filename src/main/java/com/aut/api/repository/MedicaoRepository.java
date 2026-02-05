package com.aut.api.repository;

import com.aut.api.entity.MedicaoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicaoRepository extends JpaRepository<MedicaoEntity, Long> {

}