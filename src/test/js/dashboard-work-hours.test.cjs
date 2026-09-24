const test = require("node:test");
const assert = require("node:assert/strict");
const data = require("../../main/resources/static/js/dashboard-data.js");

const start = Date.parse("2026-09-18T23:00:00Z");
const at = minute => start + minute * 60000;
const sample = (minute, power, deviceId = "A", extra = {}) => ({
  deviceId, dataHora: new Date(at(minute)).toISOString(), pa: power, ...extra
});
const defaults = { maxGapMinutes: 30 };
function calculate(rows, options = {}) {
  return data.workHours(data.normalizeRows(rows).rows, options.meters || [{ deviceId: "A" }],
    { from: at(0), to: at(60) - 1, meterId: "all", ...options.period },
    { ...defaults, ...options.defaults }, options.now ?? at(180));
}
function expectHours(actual, expected) {
  for (const key of ["active", "off", "unknown"]) assert.ok(
    Math.abs(actual[key] - (expected[key] || 0)) < 1e-9, `${key}: ${actual[key]} != ${expected[key] || 0}`);
}

test("integra intervalos reais: PA abaixo de 20 W é parado e a partir de 20 W é operação", () => {
  const [result] = calculate([sample(0, "20"), sample(10, "19.99"), sample(30, 0), sample(60, 0)]);
  expectHours(result.hours, { active: 1 / 6, off: 5 / 6 });
  assert.equal(Object.values(result.hours).reduce((a, b) => a + b), 1);
});

test("não transforma uma longa falha de envio ou o trecho após a última leitura em trabalho", () => {
  const [result] = calculate([sample(0, 100), sample(5, 100), sample(50, 100), sample(55, 100)],
    { defaults: { maxGapMinutes: 5 } });
  expectHours(result.hours, { active: 1 / 6, unknown: 5 / 6 });
});

test("inclui a leitura anterior ao início e recorta ambas as bordas, atravessando meia-noite", () => {
  const [result] = calculate([sample(45, 100), sample(60, 0), sample(75, 0)],
    { period: { from: at(50), to: at(70) - 1 } });
  expectHours(result.hours, { active: 1 / 6, off: 1 / 6 });
});

test("zero é desligado; nulo, valor inválido e potência negativa deixam tempo desconhecido", () => {
  const [result] = calculate([sample(0, null), sample(10, "inválido"), sample(20, -50),
    sample(30, false), sample(40, 0), sample(50, 0), sample(60, 0)]);
  expectHours(result.hours, { off: 1 / 3, unknown: 2 / 3 });
});

test("usa somente PA, independentemente do total, das outras fases ou do relé", () => {
  const [total] = calculate([sample(0, 0, "A", { pt: 100 }), sample(30, 30, "A", { pt: 0 }), sample(60, 30)]);
  expectHours(total.hours, { off: 0.5, active: 0.5 });
  const [phases] = calculate([0, 30, 60].map(minute => sample(minute, "7", "A", { pb: 7, pc: 7 })));
  expectHours(phases.hours, { off: 1 });
  const [socket] = calculate([0, 30, 60].map(minute => sample(minute, "25", "A", { rele: 0 })));
  expectHours(socket.hours, { active: 1 });
});

test("PA ausente ou inválida fica sem dados mesmo com total e outras fases disponíveis", () => {
  for (const pa of [undefined, null, "", "inválido", -1]) {
    const [result] = calculate([sample(0, pa, "A", { pt: 100, pb: 50, pc: 50 }),
      sample(30, 20, "A", { pb: null, pc: null }), sample(60, 20)]);
    expectHours(result.hours, { active: 0.5, unknown: 0.5 });
  }
});

test("calcula potências diferentes com a mesma regra e respeita a seleção de medidor", () => {
  const rows = [0, 30, 60].flatMap(minute => [sample(minute, 5000, "A"), sample(minute, 0.01, "B")]);
  const meters = [{ deviceId: "A" }, { deviceId: "B" }, { deviceId: null }];
  const result = calculate(rows, { meters });
  assert.equal(result.length, 2);
  expectHours(result[0].hours, { active: 1 });
  expectHours(result[1].hours, { off: 1 });
  assert.deepEqual(calculate(rows, { meters, period: { meterId: "B" } }).map(item => item.deviceId), ["B"]);
});

test("ordena leituras e resolve timestamps duplicados sem somar tempo duas vezes", () => {
  const [result] = calculate([sample(60, 0), sample(0, 0), sample(30, 0), sample(0, 100)]);
  expectHours(result.hours, { active: 0.5, off: 0.5 });
});

test("sem leituras ou com amostra isolada todo o período fica sem dados", () => {
  for (const rows of [[], [sample(20, 100)]]) expectHours(calculate(rows)[0].hours, { unknown: 1 });
});

test("não conta horas futuras nem usa leituras futuras para inferir uso", () => {
  const [result] = calculate([sample(0, 100), sample(30, 100), sample(60, 100)], { now: at(40) });
  expectHours(result.hours, { active: 0.5, unknown: 1 / 6 });
  assert.equal(result.durationHours, 2 / 3);
  expectHours(calculate([], { now: at(-1) })[0].hours, {});
});

test("rejeita intervalo máximo de envio inválido", () => {
  for (const maxGapMinutes of [-1, 0, "", null, Infinity]) {
    assert.throws(() => calculate([], { defaults: { maxGapMinutes } }));
  }
});

test("ignora os antigos ajustes individuais e classifica PA abaixo de 20 W como parado", () => {
  const [result] = calculate([sample(0, 0), sample(10, 0.01), sample(30, 3), sample(60, 0)],
    { meters: [{ deviceId: "A", workHours: { activeWatts: 20, offWatts: 3, powerDivisor: 100 } }] });
  expectHours(result.hours, { off: 1 });
});

test("calcula 60 equipamentos juntos sem configuração individual", () => {
  const meters = Array.from({ length: 60 }, (_, index) => ({ deviceId: String(index) }));
  const rows = meters.flatMap((meter, index) => [sample(0, index + 20, meter.deviceId),
    sample(30, 0, meter.deviceId), sample(60, 0, meter.deviceId)]);
  const result = calculate(rows, { meters });
  assert.equal(result.length, 60);
  result.forEach(meter => expectHours(meter.hours, { active: 0.5, off: 0.5 }));
});

test("a precisão do filtro de minutos é preservada no cálculo de duração", () => {
  const period = data.parsePeriod("2026-09-18T23:00Z", "2026-09-18T23:00Z");
  expectHours(calculate([sample(0, 100), sample(1, 100)], { period })[0].hours, { active: 1 / 60 });
});

test("CSV de horas exporta somente os medidores filtrados, durações e período calculado", () => {
  const period = { from: at(0), to: at(60) - 1, meterId: "B" };
  const result = calculate([sample(0, 100, "A"), sample(0, 100, "B"), sample(30, 0, "B")],
    { meters: [{ deviceId: "A", label: "Esteira" }, { deviceId: "B", label: 'Compressor "B"; teste' }], period, now: at(45) });
  const csv = data.workHoursToCsv(result, period, at(45));
  assert.ok(csv.startsWith("\uFEFF"));
  const lines = csv.split("\r\n");
  assert.equal(lines.length, 2);
  assert.ok(lines[1].startsWith('"Compressor ""B""; teste";"B";'));
  assert.ok(lines[1].includes('"2026-09-18T23:45:00.000Z"'));
  assert.ok(lines[1].endsWith('"0,5";"0";"0,25"'));
});

test("CSV de horas mantém estados sem dados em branco e protege identificadores de fórmulas", () => {
  const period = { from: at(0), to: at(60) - 1 };
  const result = calculate([], { meters: [{ deviceId: "=ID", label: "+Equipamento" }] });
  const csv = data.workHoursToCsv(result, period, at(180));
  assert.ok(csv.includes('"\'+Equipamento";"\'=ID"'));
  assert.ok(csv.includes('"2026-09-19T00:00:00.000Z"'));
  assert.ok(csv.endsWith('"";"";"1"'));
});

test("horas e CSV com seleção de dois ou três medidores preservam as bordas do período", () => {
  const meters = ["A", "B", "C", "D"].map(deviceId => ({ deviceId, label: deviceId }));
  const rows = meters.flatMap(meter => [sample(-10, 100, meter.deviceId), sample(10, 0, meter.deviceId), sample(30, 0, meter.deviceId)]);
  for (const meterIds of [["A", "C"], ["A", "B", "D"]]) {
    const period = { from: at(0), to: at(20) - 1, meterIds };
    const result = calculate(rows, { meters, period });
    assert.deepEqual(result.map(meter => meter.deviceId), meterIds);
    result.forEach(meter => expectHours(meter.hours, { active: 1 / 6, off: 1 / 6 }));
    const csv = data.workHoursToCsv(result, period, at(180));
    assert.equal(csv.split("\r\n").length, meterIds.length + 1);
    meters.filter(meter => !meterIds.includes(meter.deviceId)).forEach(meter =>
      assert.ok(!csv.includes(`"${meter.deviceId}"`)));
  }
  assert.deepEqual(calculate(rows, { meters, period: { meterIds: [] } }), []);
  assert.equal(calculate(rows, { meters, period: { meterIds: null } }).length, 4);
});
