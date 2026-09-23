/* global DASHBOARD_CONFIG, DashboardData, Chart, apiRequest */
(() => {
  "use strict";

  const state = {
    rows: [], filtered: [], workResults: [], meters: DASHBOARD_CONFIG.meters.map(meter => ({
      ...meter,
      deviceId: meter.deviceId == null ? null : String(meter.deviceId).trim()
    })),
    filters: null, chart: null, workChart: null, loading: false, loaded: false, loadedAt: null
  };
  const $ = id => document.getElementById(id);
  const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });
  const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const text = (id, value) => { $(id).textContent = value; };
  const variable = () => DASHBOARD_CONFIG.variables.find(item => item.key === state.filters.variable);
  const meterName = id => state.meters.find(meter => meter.deviceId === id)?.label || id;
  const formatValue = value => value === null ? "—" : numberFormat.format(value);
  const withUnit = value => value === null ? "—" : `${formatValue(value)}${variable().unit ? " " + variable().unit : ""}`;
  const workStates = [
    { key: "active", label: "Em operação", color: "#06402b" },
    { key: "off", label: "Parado", color: "#FF0000" },
    { key: "unknown", label: "Sem dados", color: "#e2e5ea" }
  ];

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("icon");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#i-${name}`);
    svg.append(use);
    return svg;
  }

  function showNotice(message = "") {
    text("mensagem", message);
    $("mensagem").hidden = !message;
  }

  function setStatus(label, type = "") {
    const status = $("statusConexao");
    status.className = `status-pill ${type}`;
    status.replaceChildren(element("span", "status-dot"), document.createTextNode(label));
  }

  function setChartState(title, description) {
    $("estadoGrafico").hidden = !title;
    $("grafico").hidden = Boolean(title);
    text("estadoTitulo", title || "");
    text("estadoDescricao", description || "");
  }

  function localInput(date) {
    const pad = value => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function selectPeriod(days) {
    const end = new Date();
    end.setHours(23, 59, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
    $("dataInicio").value = localInput(start);
    $("dataFim").value = localInput(end);
    document.querySelectorAll("[data-period]").forEach(button => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.period) === days));
    });
    applyFilters();
  }

  function applyFilters() {
    try {
      const period = DashboardData.parsePeriod($("dataInicio").value, $("dataFim").value);
      state.filters = { ...period, meterId: $("medidor").value, variable: $("variavel").value };
      $("erroFiltro").hidden = true;
      $("dataInicio").removeAttribute("aria-invalid");
      $("dataFim").removeAttribute("aria-invalid");
      if (state.loaded) render();
    } catch (error) {
      text("erroFiltro", error.message);
      $("erroFiltro").hidden = false;
      $("dataInicio").setAttribute("aria-invalid", "true");
      $("dataFim").setAttribute("aria-invalid", "true");
    }
  }

  function discoverMeters() {
    const ids = [...new Set(state.rows.map(row => row.deviceId))].sort();
    for (const id of ids) {
      if (state.meters.some(meter => meter.deviceId === id)) continue;
      const available = state.meters.find(meter => meter.deviceId === null);
      if (available) available.deviceId = id;
      else state.meters.push({ deviceId: id, label: `Medidor ${String(state.meters.length + 1).padStart(2, "0")}`, color: "#8770ad" });
    }
    const selected = $("medidor").value;
    $("medidor").replaceChildren(new Option("Todos os medidores", "all"));
    state.meters.forEach((meter, index) => {
      const option = new Option(meter.label + (meter.deviceId === null ? " · aguardando" : ""), meter.deviceId ?? `pending-${index}`);
      option.disabled = meter.deviceId === null;
      $("medidor").append(option);
    });
    $("medidor").value = [...$("medidor").options].some(option => option.value === selected) ? selected : "all";
  }

  function setWorkChartState(title = "", description = "") {
    $("estadoHoras").hidden = !title;
    $("graficoHoras").hidden = Boolean(title);
    text("tituloEstadoHoras", title);
    text("descricaoEstadoHoras", description);
  }

  function renderWorkHours() {
    state.workResults = [];
    $("btnExportarHoras").disabled = true;
    if (state.workChart) { state.workChart.destroy(); state.workChart = null; }
    const tbody = $("tabelaHoras");
    tbody.replaceChildren();
    text("periodoHoras", `${dateFormat.format(state.filters.from)} — ${dateFormat.format(state.filters.to)} · ${state.filters.meterId === "all" ? "Todos os medidores" : meterName(state.filters.meterId)}`);
    let result;
    try {
      result = DashboardData.workHours(state.rows, state.meters, state.filters, DASHBOARD_CONFIG.workHours, state.loadedAt);
      result.sort((a, b) => b.hours.active - a.hours.active || a.label.localeCompare(b.label, "pt-BR"));
    } catch (error) {
      setWorkChartState("Revise o intervalo de envio configurado", error.message);
      return;
    }
    $("legendaHoras").replaceChildren();
    for (const status of workStates) {
      const label = element("span", "legend-item");
      label.style.setProperty("--meter-color", status.color);
      label.append(element("span", "legend-line"), document.createTextNode(status.label));
      $("legendaHoras").append(label);
    }
    for (const meter of result) {
      const row = element("tr");
      const name = element("td", "", meter.label);
      const knownHours = meter.hours.active + meter.hours.off;
      row.append(name);
      for (const status of workStates) row.append(element("td", "numeric",
        status.key !== "unknown" && !knownHours ? "—" : formatValue(meter.hours[status.key])));
      tbody.append(row);
    }
    if (!result.length || !result.some(meter => meter.durationHours > 0)) {
      setWorkChartState("Sem intervalo para calcular", "Selecione um medidor e um período anterior ao horário da consulta.");
      return;
    }
    state.workResults = result;
    $("btnExportarHoras").disabled = false;
    if (typeof Chart === "undefined") {
      setWorkChartState("Não foi possível carregar o gráfico", "As durações calculadas estão disponíveis na tabela abaixo.");
      return;
    }
    setWorkChartState();
    $("areaHoras").style.height = `${Math.max(240, result.length * 60 + 80)}px`;
    state.workChart = new Chart($("graficoHoras"), {
      type: "bar",
      data: {
        labels: result.map(meter => meter.label),
        datasets: workStates.map(status => ({ label: status.label, backgroundColor: status.color,
          data: result.map(meter => meter.hours[status.key]), maxBarThickness: 38 }))
      },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: {
          label: item => `${item.dataset.label}: ${formatValue(item.parsed.x)} h`
        } } },
        scales: {
          x: { stacked: true, beginAtZero: true, title: { display: true, text: "Horas" },
            ticks: { callback: value => formatValue(value) }, grid: { color: "#f0f1f5" } },
          y: { stacked: true, grid: { display: false } }
        }
      }
    });
  }

  function renderMeters() {
    const groups = DashboardData.groupByMeter(state.rows);
    text("contagemMedidores", `${groups.size} com leituras`);
    text("menuContagem", groups.size);
    $("listaMedidores").replaceChildren();
    $("listaMedidores").classList.toggle("many-meters", state.meters.length > 6);
    state.meters.forEach(meter => {
      const rows = groups.get(meter.deviceId) || [];
      const hasData = rows.length > 0;
      const selected = hasData && (state.filters?.meterId === "all" || state.filters?.meterId === meter.deviceId);
      const card = element("button", `meter-card${selected ? " selected" : ""}`);
      card.type = "button";
      card.disabled = !hasData;
      card.style.setProperty("--meter-color", meter.color);
      card.setAttribute("aria-pressed", String(selected));
      const meterIcon = element("span", "meter-icon");
      meterIcon.append(icon("meter"));
      const info = element("span", "meter-info");
      const title = element("span", "meter-title");
      const badge = element("span", `meter-badge${hasData ? "" : " waiting"}`, hasData ? "Com leituras" : state.loaded ? "Aguardando dados" : "Aguardando consulta");
      title.append(element("strong", "", meter.label), badge);
      info.append(title, element("span", "meter-device", meter.deviceId ? `ID · ${meter.deviceId}` : "Nenhuma leitura recebida"));
      info.append(element("span", "meter-date", hasData ? `Último registro · ${dateFormat.format(rows[rows.length - 1].timestamp)}` : "As medições aparecerão aqui quando disponíveis."));
      card.append(meterIcon, info);
      if (hasData) card.append(icon("arrow"));
      card.addEventListener("click", () => {
        $("medidor").value = state.filters.meterId === meter.deviceId ? "all" : meter.deviceId;
        applyFilters();
      });
      $("listaMedidores").append(card);
    });
  }

  function renderStats(summary) {
    const key = variable().key;
    text("valorUltimo", withUnit(summary.latest ? DashboardData.numericValue(summary.latest[key]) : null));
    text("valorMedia", withUnit(summary.average));
    text("valorMaximo", withUnit(summary.peak ? DashboardData.numericValue(summary.peak[key]) : null));
    text("valorContagem", numberFormat.format(summary.count));
    text("detalheUltimo", summary.latest ? `${meterName(summary.latest.deviceId)} · ${timeFormat.format(summary.latest.timestamp)}` : "Sem leitura válida no período");
    text("detalheMedia", `${variable().label} · média por amostra`);
    text("detalheMaximo", summary.peak ? `${meterName(summary.peak.deviceId)} · ${timeFormat.format(summary.peak.timestamp)}` : "Sem leitura válida no período");
    text("detalheContagem", `${numberFormat.format(state.filtered.length)} registros no período`);
  }

  function renderTable() {
    const rows = state.filtered.slice(-8).reverse();
    const tbody = $("tabelaLeituras");
    tbody.replaceChildren();
    text("contagemTabela", `${rows.length} de ${numberFormat.format(state.filtered.length)} registros`);
    if (!rows.length) {
      const cell = element("td", "table-empty", "Nenhuma leitura encontrada para os filtros selecionados.");
      cell.colSpan = 4;
      const row = element("tr");
      row.append(cell);
      tbody.append(row);
      return;
    }
    for (const row of rows) {
      const meter = state.meters.find(item => item.deviceId === row.deviceId);
      const tr = element("tr");
      const name = element("td");
      name.style.setProperty("--meter-color", meter.color);
      name.append(element("span", "small-dot"), document.createTextNode(meter.label));
      tr.append(name, element("td", "", dateFormat.format(row.timestamp)),
        element("td", "", variable().label), element("td", "numeric", withUnit(DashboardData.numericValue(row[variable().key]))));
      tbody.append(tr);
    }
  }

  function renderChart(summary) {
    const series = DashboardData.buildSeries(state.filtered, state.meters, variable().key);
    $("legendaGrafico").replaceChildren();
    for (const item of series) {
      const label = element("span", "legend-item");
      label.style.setProperty("--meter-color", item.color);
      label.append(element("span", "legend-line"), document.createTextNode(item.label));
      $("legendaGrafico").append(label);
    }
    if (state.chart) {
      state.chart.destroy();
      state.chart = null;
    }
    if (!summary.count) {
      setChartState(state.filtered.length ? "Sem valores para esta variável" : "Nenhuma leitura neste período",
        state.filtered.length ? "Selecione outra variável para visualizar as medições disponíveis." : "Experimente outro período ou selecione todos os medidores.");
      return;
    }
    if (typeof Chart === "undefined") {
      setChartState("Não foi possível carregar o gráfico", "Recarregue a página para tentar novamente. Os indicadores, a tabela e a exportação continuam disponíveis.");
      return;
    }
    setChartState();
    const showDate = state.filters.to - state.filters.from > 86400000;
    state.chart = new Chart($("grafico"), {
      type: "line",
      data: { datasets: series.map(item => ({
        label: item.label,
        data: item.points,
        borderColor: item.color,
        backgroundColor: item.color + "0b",
        pointBackgroundColor: item.color,
        borderWidth: 2,
        pointRadius: item.points.length > 120 ? 0 : 2,
        pointHoverRadius: 5,
        pointHitRadius: 12,
        tension: 0,
        spanGaps: false,
        fill: series.length === 1
      })) },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        parsing: false,
        interaction: { mode: "nearest", axis: "xy", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#252d3b", padding: 12, cornerRadius: 6,
            callbacks: {
              title: items => items.length ? dateFormat.format(items[0].parsed.x) : "",
              label: item => `${item.dataset.label}: ${withUnit(item.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            type: "linear", min: state.filters.from, max: state.filters.to,
            grid: { display: false }, border: { display: false },
            ticks: { maxTicksLimit: 7, maxRotation: 0, color: "#9299a5", font: { size: 10 }, padding: 12,
              callback: value => new Date(value).toLocaleString("pt-BR", showDate
                ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
                : { hour: "2-digit", minute: "2-digit" }) }
          },
          y: {
            grid: { color: "#f0f1f5", drawTicks: false }, border: { display: false },
            ticks: { maxTicksLimit: 6, padding: 12, color: "#9299a5", font: { size: 10 }, callback: value => formatValue(value) },
            title: { display: Boolean(variable().unit), text: variable().unit }
          }
        }
      }
    });
  }

  function render() {
    state.filtered = DashboardData.filterRows(state.rows, state.filters);
    const summary = DashboardData.summarize(state.filtered, variable().key);
    text("nomeVariavel", `${variable().label}${variable().unit ? ` (${variable().unit})` : ""}`);
    text("resumoPeriodo", `${dateFormat.format(state.filters.from)} — ${dateFormat.format(state.filters.to)}`);
    text("resumoGrafico", `${numberFormat.format(summary.count)} leituras válidas · ${state.filters.meterId === "all" ? "Todos os medidores" : meterName(state.filters.meterId)}`);
    $("btnExportar").disabled = !state.filtered.length;
    renderMeters();
    renderStats(summary);
    renderTable();
    renderChart(summary);
    renderWorkHours();
  }

  async function loadData() {
    if (state.loading) return;
    state.loading = true;
    $("btnAtualizar").disabled = true;
    $("areaGrafico").setAttribute("aria-busy", "true");
    $("areaHoras").setAttribute("aria-busy", "true");
    $("listaMedidores").setAttribute("aria-busy", "true");
    setStatus("Atualizando");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await apiRequest(DASHBOARD_CONFIG.endpoint, { signal: controller.signal });
      if (!response || !response.ok) throw new Error(`Falha na consulta (${response?.status || "sem resposta"}).`);
      const result = DashboardData.normalizeRows(await response.json());
      state.rows = result.rows;
      state.loadedAt = Date.now();
      state.loaded = true;
      discoverMeters();
      render();
      setStatus("Consulta concluída", "success");
      text("ultimaAtualizacao", `Atualizado em ${dateFormat.format(new Date())}`);
      showNotice(result.discarded ? `${result.discarded} registro(s) sem identificação de medidor ou data válida foram desconsiderados.` : "");
    } catch (error) {
      if (!localStorage.getItem("token")) return;
      setStatus("Falha na consulta", "error");
      showNotice(`Não foi possível atualizar as medições. ${state.loaded ? "Os dados da última consulta foram mantidos. " : ""}Tente novamente em “Atualizar dados”.`);
      if (!state.loaded) {
        text("ultimaAtualizacao", "Consulta não realizada");
        setChartState("Não foi possível buscar as medições", "Verifique sua conexão e tente atualizar os dados novamente.");
        setWorkChartState("Não foi possível buscar as medições", "Atualize os dados para calcular as horas em operação.");
        $("tabelaHoras").replaceChildren();
        const cell = element("td", "table-empty", "As leituras aparecerão após uma consulta bem-sucedida.");
        cell.colSpan = 4;
        const row = element("tr");
        row.append(cell);
        $("tabelaLeituras").replaceChildren(row);
      }
      console.error("Erro ao carregar medições:", error);
    } finally {
      clearTimeout(timeout);
      state.loading = false;
      $("btnAtualizar").disabled = false;
      $("areaGrafico").setAttribute("aria-busy", "false");
      $("areaHoras").setAttribute("aria-busy", "false");
      $("listaMedidores").setAttribute("aria-busy", "false");
    }
  }

  function exportCsv() {
    if (!state.filtered.length) return;
    const csv = DashboardData.toCsv(state.filtered, state.meters, variable());
    downloadCsv(csv, `medicoes-${variable().key}-${localInput(new Date(state.filters.from)).slice(0, 10)}.csv`);
  }

  function exportWorkHoursCsv() {
    if (!state.workResults.length) return;
    const csv = DashboardData.workHoursToCsv(state.workResults, state.filters, state.loadedAt);
    downloadCsv(csv, `horas-em-operacao-${localInput(new Date(state.filters.from)).slice(0, 10)}.csv`);
  }

  function downloadCsv(csv, filename) {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = element("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function initializeMenu() {
    const trigger = $("btnMenu");
    const menu = $("menuPrincipal");
    const navigation = $("navegacao");
    const close = () => {
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    };
    trigger.addEventListener("click", () => {
      const open = trigger.getAttribute("aria-expanded") !== "true";
      menu.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", event => {
      if (!navigation.contains(event.target)) close();
    });
    document.addEventListener("focusin", event => {
      if (!navigation.contains(event.target)) close();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !menu.hidden) {
        close();
        trigger.focus();
      }
    });
    menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      menu.querySelectorAll("a").forEach(item => {
        item.classList.toggle("active", item === link);
        item.removeAttribute("aria-current");
      });
      link.setAttribute("aria-current", "location");
      close();
      const target = document.querySelector(link.getAttribute("href"));
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }));
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("token")) {
      window.location.replace("/login");
      return;
    }
    initializeMenu();
    for (const item of DASHBOARD_CONFIG.variables) $("variavel").append(new Option(item.label, item.key));
    selectPeriod(1);
    renderMeters();
    $("formFiltros").addEventListener("submit", event => { event.preventDefault(); applyFilters(); });
    $("variavel").addEventListener("change", applyFilters);
    $("medidor").addEventListener("change", applyFilters);
    $("btnAtualizar").addEventListener("click", loadData);
    $("btnExportar").addEventListener("click", exportCsv);
    $("btnExportarHoras").addEventListener("click", exportWorkHoursCsv);
    $("btnSair").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.replace("/login");
    });
    document.querySelectorAll("[data-period]").forEach(button => button.addEventListener("click", () => selectPeriod(Number(button.dataset.period))));
    for (const id of ["dataInicio", "dataFim"]) $(id).addEventListener("input", () => {
      document.querySelectorAll("[data-period]").forEach(button => button.setAttribute("aria-pressed", "false"));
    });
    loadData();
  });
})();
