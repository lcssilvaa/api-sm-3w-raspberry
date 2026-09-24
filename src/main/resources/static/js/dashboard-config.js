const DASHBOARD_CONFIG = {
  endpoint: "/api/medicoes/listar",
  // Intervalos maiores que este limite ficam sem dados; ajuste à cadência de envio.
  workHours: { maxGapMinutes: 5 },
  meters: [
    { deviceId: 1, label: "Compressor CON", color: "#d90935" },
    { deviceId: 2, label: "Medidor RIO", color: "#378baf" },
    { deviceId: 3, label: "Tomada RIO", color: "#898989" }
  ],

  variables: [
    { key: "pa", label: "Potência Ativa Fase A", unit: "W" },
    { key: "pb", label: "Potência Ativa Fase B", unit: "W" },
    { key: "pc", label: "Potência Ativa Fase C", unit: "W" },
    { key: "pt", label: "Potência Ativa Total", unit: "W" },

    { key: "qa", label: "Potência Reativa Fase A", unit: "W" },
    { key: "qb", label: "Potência Reativa Fase B", unit: "W" },
    { key: "qc", label: "Potência Reativa Fase C", unit: "W" },
    { key: "qt", label: "Potência Reativa Total", unit: "W" },

    { key: "epaC", label: "Consumo Fase A", unit: "kWh" },
    { key: "epbC", label: "Consumo Fase B", unit: "kWh" },
    { key: "epcC", label: "Consumo Fase C", unit: "kWh" },
    { key: "eptC", label: "Consumo Total", unit: "kWh" },

    { key: "epaG", label: "Geração Fase A", unit: "kWh" },
    { key: "epbG", label: "Geração Fase B", unit: "kWh" },
    { key: "epcG", label: "Geração Fase C", unit: "kWh" },
    { key: "eptG", label: "Geração Total", unit: "kWh" },

    { key: "iarms", label: "Corrente RMS Fase A", unit: "A" },
    { key: "ibrms", label: "Corrente RMS Fase B", unit: "A" },
    { key: "icrms", label: "Corrente RMS Fase C", unit: "A" },

    { key: "uarms", label: "Tensão Fase A", unit: "V" },
    { key: "ubrms", label: "Tensão Fase B", unit: "V" },
    { key: "ucrms", label: "Tensão Fase C", unit: "V" },

    { key: "pfa", label: "Fator de Potência Fase A", unit: "" },
    { key: "pfb", label: "Fator de Potência Fase B", unit: "" },
    { key: "pfc", label: "Fator de Potência Fase C", unit: "" },
    { key: "pft", label: "Fator de Potência Total", unit: "" },

    { key: "sa", label: "Potência aparente na fase A", unit: "VA" },
    { key: "sb", label: "Potência aparente na fase B", unit: "VA" },
    { key: "sc", label: "Potência aparente na fase C", unit: "VA" },
    { key: "st", label: "Potência aparente total das fases", unit: "VA" },

    { key: "itrms", label: "Corrente total informada pelo medidor", unit: "A" },
    { key: "pga", label: "Defasagem entre tensão e corrente na fase A", unit: "°" },
    { key: "pgb", label: "Defasagem entre tensão e corrente na fase B", unit: "°" },
    { key: "pgc", label: "Defasagem entre tensão e corrente na fase C", unit: "°" },

    { key: "freq", label: "Frequência da rede elétrica", unit: "Hz" },
    { key: "yuaub", label: "Defasagem entre as tensões A e B", unit: "°" },
    { key: "yuauc", label: "Defasagem entre as tensões A e C", unit: "°" },
    { key: "yubuc", label: "Defasagem entre as tensões B e C", unit: "°" },

    { key: "tpsd", label: "Temperatura do equipamento", unit: "°C" },
    { key: "rssiWifi", label: "Intensidade do sinal Wi-Fi", unit: "dBm" },
    { key: "rele", label: "Estado do relé", unit: "" },
  ]
};
