/* Transformações independentes da interface, compartilhadas pelos testes. */
const DashboardData = (() => {
  function normalizeRows(payload) {
    if (!Array.isArray(payload)) throw new Error("Formato de resposta inválido.");
    const rows = [];
    for (const row of payload) {
      if (!row || typeof row !== "object") continue;
      const timestamp = typeof row.dataHora === "string" ? Date.parse(row.dataHora) : NaN;
      const deviceId = ["string", "number"].includes(typeof row.deviceId) ? String(row.deviceId).trim() : "";
      if (!Number.isFinite(timestamp) || !deviceId) continue;
      rows.push({ ...row, deviceId, timestamp });
    }
    rows.sort((a, b) => a.timestamp - b.timestamp);
    return { rows, discarded: payload.length - rows.length };
  }

  function numericValue(value) {
    if (typeof value !== "number" && typeof value !== "string") return null;
    if (typeof value === "string" && value.trim() === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function parsePeriod(start, end) {
    const from = start ? new Date(start).getTime() : NaN;
    const to = end ? new Date(end).getTime() : NaN;
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      throw new Error("Preencha a data e a hora inicial e final.");
    }
    if (from > to) throw new Error("A data inicial deve ser anterior ou igual à data final.");
    // O controle tem precisão de minutos: inclui os segundos do minuto final,
    // sem estender o filtro até o restante do dia.
    return { from, to: to + 59999 };
  }

  function meterSelection({ meterIds, meterId = "all" }) {
    if (Array.isArray(meterIds)) return new Set(meterIds.map(String));
    return meterId === "all" ? null : new Set([String(meterId)]);
  }

  function filterRows(rows, filters) {
    const { from, to } = filters;
    const selected = meterSelection(filters);
    return rows.filter(row => row.timestamp >= from && row.timestamp <= to &&
      (selected === null || selected.has(row.deviceId)));
  }

  function summarize(rows, variable) {
    const valid = rows.filter(row => numericValue(row[variable]) !== null);
    let mean = 0;
    let peak = null;
    valid.forEach((row, index) => {
      const value = numericValue(row[variable]);
      mean += (value - mean) / (index + 1);
      if (!peak || value > numericValue(peak[variable])) peak = row;
    });
    return { count: valid.length, average: valid.length ? mean : null,
      latest: valid.length ? valid[valid.length - 1] : null, peak };
  }

  function groupByMeter(rows) {
    const groups = new Map();
    for (const row of rows) {
      if (!groups.has(row.deviceId)) groups.set(row.deviceId, []);
      groups.get(row.deviceId).push(row);
    }
    return groups;
  }

  function buildSeries(rows, meters, variable) {
    const groups = groupByMeter(rows);
    return meters.filter(meter => groups.has(meter.deviceId)).map(meter => ({
      label: meter.label,
      color: meter.color,
      deviceId: meter.deviceId,
      points: groups.get(meter.deviceId).map(row => ({ x: row.timestamp, y: numericValue(row[variable]) }))
    }));
  }

  function csvCell(value) {
    let text = String(value ?? "");
    // IDs e nomes são texto externo; não permitir fórmulas em planilhas.
    if (typeof value === "string" && /^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function workHours(rows, meters, period, defaults, now = Date.now()) {
    const groups = groupByMeter(rows);
    const selected = meterSelection(period);
    // O filtro inclui o último milissegundo. Durações usam [início, fim).
    const end = Math.min(period.to + 1, now);
    const duration = Math.max(0, end - period.from);
    return meters.filter(meter => meter.deviceId !== null &&
      (selected === null || selected.has(meter.deviceId))).map(meter => {
      const maxGapMinutes = numericValue(meter.workHours?.maxGapMinutes ?? defaults.maxGapMinutes);
      if (maxGapMinutes === null || maxGapMinutes <= 0) {
        throw new Error("O intervalo máximo entre leituras deve ser maior que zero.");
      }
      const ordered = (groups.get(meter.deviceId) || []).filter(row => row.timestamp <= now)
        .slice().sort((a, b) => a.timestamp - b.timestamp);
      // Uma leitura por instante: a última recebida prevalece, sem contar tempo duas vezes.
      const samples = [...new Map(ordered.map(row => [row.timestamp, row])).values()];
      // Se houver fases no histórico, exija todas elas ao usar a soma. Uma fase
      // ausente não pode reduzir artificialmente a potência de um trifásico.
      const phases = ["pa", "pb", "pc"].filter(key => samples.some(row => numericValue(row[key]) !== null));
      const totals = { active: 0, off: 0, unknown: duration };
      for (let index = 0; index < samples.length - 1; index++) {
        const row = samples[index];
        const next = samples[index + 1];
        const elapsed = Math.min(next.timestamp, end) - Math.max(row.timestamp, period.from);
        if (elapsed <= 0 || next.timestamp - row.timestamp > maxGapMinutes * 60000) continue;
        let power = numericValue(row.pt);
        if (power === null && phases.length) {
          const values = phases.map(key => numericValue(row[key]));
          if (values.every(value => value !== null && value >= 0)) power = values.reduce((sum, value) => sum + value, 0);
        }
        // Potência negativa indica fluxo reverso ou instalação a verificar.
        // Não é evidência de equipamento desligado.
        if (power === null || power < 0) continue;
        if (!Number.isFinite(power)) continue;
        const status = power === 0 ? "off" : "active";
        totals[status] += elapsed;
        totals.unknown -= elapsed;
      }
      return { ...meter, durationHours: duration / 3600000,
        hours: Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / 3600000])) };
    });
  }

  function toCsv(rows, meters, variable) {
    const names = new Map(meters.map(meter => [meter.deviceId, meter.label]));
    const lines = [["Medidor", "Device ID", "Data e hora (ISO 8601)", "Variável", "Valor", "Unidade"]];
    for (const row of rows) lines.push([
      names.get(row.deviceId) || row.deviceId, row.deviceId, row.dataHora,
      variable.key, numericValue(row[variable.key]), variable.unit
    ]);
    return "\uFEFF" + lines.map(line => line.map(csvCell).join(";")).join("\r\n");
  }

  function workHoursToCsv(results, period, now) {
    const lines = [["Medidor", "Device ID", "Início do período (ISO 8601)", "Fim do período (ISO 8601)",
      "Calculado até (ISO 8601)", "Em operação (h)", "Parado (h)", "Sem dados (h)"]];
    const start = new Date(period.from).toISOString();
    const end = new Date(period.to).toISOString();
    const calculatedUntil = new Date(Math.min(period.to + 1, now)).toISOString();
    const hours = value => Number(value.toFixed(6)).toString().replace(".", ",");
    for (const meter of results) {
      const knownHours = meter.hours.active + meter.hours.off;
      lines.push([meter.label, meter.deviceId, start, end, calculatedUntil,
        knownHours ? hours(meter.hours.active) : "", knownHours ? hours(meter.hours.off) : "",
        hours(meter.hours.unknown)]);
    }
    return "\uFEFF" + lines.map(line => line.map(csvCell).join(";")).join("\r\n");
  }

  return { normalizeRows, numericValue, parsePeriod, filterRows, summarize, groupByMeter, buildSeries,
    workHours, toCsv, workHoursToCsv };
})();

if (typeof module !== "undefined" && module.exports) module.exports = DashboardData;
