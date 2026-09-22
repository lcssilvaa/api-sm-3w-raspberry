package com.aut.api.controller;

import com.aut.api.entity.MedicaoEntity;
import com.aut.api.repository.MedicaoRepository;
import com.aut.api.service.MedicaoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MedicaoControllerTest {

    private MedicaoRepository repository;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        repository = mock(MedicaoRepository.class);
        when(repository.save(any(MedicaoEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        mvc = MockMvcBuilders.standaloneSetup(
                new MedicaoController(new MedicaoService(repository))).build();
    }

    @ParameterizedTest
    @ValueSource(strings = {"\"0\"", "\"1\"", "0", "1"})
    void recebeEListaTomadaComCamposAusentes(String releJson) throws Exception {
        String payload = """
                {
                  "id": "3", "pa": "5.67", "qa": "77.68", "sa": "77.89",
                  "uarms": "126.23", "iarms": "0.61", "pft": "0.07",
                  "pga": "0.00", "freq": "60.00", "epa_c": "0.00",
                  "rele": %s, "rssi_wifi": "-56.00"
                }
                """.formatted(releJson);

        mvc.perform(post("/api/medicoes").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk());

        ArgumentCaptor<MedicaoEntity> captor = ArgumentCaptor.forClass(MedicaoEntity.class);
        verify(repository).save(captor.capture());
        MedicaoEntity saved = captor.getValue();
        int expectedRele = Integer.parseInt(releJson.replace("\"", ""));
        assertThat(saved.getDeviceId()).isEqualTo("3");
        assertThat(saved.getRele()).isEqualTo(expectedRele);
        assertThat(saved.getPa()).isEqualByComparingTo("5.67");
        assertThat(saved.getQa()).isEqualByComparingTo("77.68");
        assertThat(saved.getSa()).isEqualByComparingTo("77.89");
        assertThat(saved.getUarms()).isEqualByComparingTo("126.23");
        assertThat(saved.getIarms()).isEqualByComparingTo("0.61");
        assertThat(saved.getPft()).isEqualByComparingTo("0.07");
        assertThat(saved.getPga()).isEqualByComparingTo("0.00");
        assertThat(saved.getFreq()).isEqualByComparingTo("60.00");
        assertThat(saved.getEpaC()).isEqualByComparingTo("0.00");
        assertThat(saved.getRssiWifi()).isEqualByComparingTo("-56.00");
        assertThat(saved.getPb()).isNull();
        assertThat(saved.getPc()).isNull();
        assertThat(saved.getPt()).isNull();
        assertThat(saved.getUbrms()).isNull();
        assertThat(saved.getPfa()).isNull();
        assertThat(saved.getEptC()).isNull();
        assertThat(saved.getDataHora()).isNotNull();

        when(repository.findAll()).thenReturn(List.of(saved));
        mvc.perform(get("/api/medicoes/listar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].deviceId").value("3"))
                .andExpect(jsonPath("$[0].rele").value(expectedRele))
                .andExpect(jsonPath("$[0].pa").value(5.67))
                .andExpect(jsonPath("$[0].epaC").value(0))
                .andExpect(jsonPath("$[0].rssiWifi").value(-56))
                .andExpect(jsonPath("$[0].pb").value(nullValue()));
    }

    @Test
    void continuaAceitandoMedidorSemRele() throws Exception {
        mvc.perform(post("/api/medicoes").contentType(MediaType.APPLICATION_JSON).content("""
                {"id": "1", "pa": "100.00", "pb": "200.00", "pc": "300.00", "pt": "600.00"}
                """))
                .andExpect(status().isOk());

        ArgumentCaptor<MedicaoEntity> captor = ArgumentCaptor.forClass(MedicaoEntity.class);
        verify(repository).save(captor.capture());
        MedicaoEntity saved = captor.getValue();
        assertThat(saved.getRele()).isNull();
        assertThat(saved.getPb()).isEqualByComparingTo("200.00");
        assertThat(saved.getPc()).isEqualByComparingTo("300.00");
        assertThat(saved.getPt()).isEqualByComparingTo("600.00");

        when(repository.findAll()).thenReturn(List.of(saved));
        mvc.perform(get("/api/medicoes/listar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].rele").value(nullValue()));
    }
}
