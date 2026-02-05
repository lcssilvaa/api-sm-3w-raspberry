package com.aut.api.service;

import com.aut.api.DTO.MedicaoDTO;
import com.aut.api.entity.MedicaoEntity;
import com.aut.api.repository.MedicaoRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class MedicaoService {

    private final MedicaoRepository repository;

    public MedicaoService(MedicaoRepository repository) {
        this.repository = repository;
    }

    public List<MedicaoEntity> listarTodos() {
        return repository.findAll();
    }

    public MedicaoEntity salvar(MedicaoDTO dto) {
        MedicaoEntity entity = new MedicaoEntity();

        entity.setDeviceId(dto.getId());
        entity.setPa(dto.getPa());
        entity.setPb(dto.getPb());
        entity.setPc(dto.getPc());
        entity.setPt(dto.getPt());
        entity.setQa(dto.getQa());
        entity.setQb(dto.getQb());
        entity.setQc(dto.getQc());
        entity.setQt(dto.getQt());
        entity.setSa(dto.getSa());
        entity.setSb(dto.getSb());
        entity.setSc(dto.getSc());
        entity.setSt(dto.getSt());
        entity.setUarms(dto.getUarms());
        entity.setUbrms(dto.getUbrms());
        entity.setUcrms(dto.getUcrms());
        entity.setIarms(dto.getIarms());
        entity.setIbrms(dto.getIbrms());
        entity.setIcrms(dto.getIcrms());
        entity.setItrms(dto.getItrms());
        entity.setPfa(dto.getPfa());
        entity.setPfb(dto.getPfb());
        entity.setPfc(dto.getPfc());
        entity.setPft(dto.getPft());
        entity.setPga(dto.getPga());
        entity.setPgb(dto.getPgb());
        entity.setPgc(dto.getPgc());
        entity.setFreq(dto.getFreq());
        entity.setEpaC(dto.getEpa_c());
        entity.setEpbC(dto.getEpb_c());
        entity.setEpcC(dto.getEpc_c());
        entity.setEptC(dto.getEpt_c());
        entity.setEpaG(dto.getEpa_g());
        entity.setEpbG(dto.getEpb_g());
        entity.setEpcG(dto.getEpc_g());
        entity.setEptG(dto.getEpt_g());
        entity.setYuaub(dto.getYuaub());
        entity.setYuauc(dto.getYuauc());
        entity.setYubuc(dto.getYubuc());
        entity.setTpsd(dto.getTpsd());
        entity.setRssiWifi(dto.getRssi_wifi());

        entity.setDataHora(OffsetDateTime.now());

        return repository.save(entity);
    }
}

