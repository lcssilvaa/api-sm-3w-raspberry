const test = require("node:test");
const assert = require("node:assert/strict");
const data = require("../../main/resources/static/js/dashboard-data.js");

const reading = (deviceId, dataHora, pa, extra = {}) => ({ deviceId, dataHora, pa, ...extra });
const normalize = rows => data.normalizeRows(rows).rows;

test("normaliza, ordena e separa dois medidores com horários diferentes", () => {
  const rows = normalize([
    reading("B", "2026-09-18T12:02:00-03:00", 20),
    reading("A", "2026-09-18T12:00:00-03:00", 10),
    reading("A", "2026-09-18T12:03:00-03:00", 30)
  ]);
  const series = data.buildSeries(rows, [
    { deviceId: "A", label: "Medidor 01", color: "red" },
    { deviceId: "B", label: "Medidor 02", color: "blue" }
  ], "pa");
  assert.deepEqual(series.map(item => item.points.map(point => point.y)), [[10, 30], [20]]);
  assert.equal(series[1].points[0].x, Date.parse("2026-09-18T12:02:00-03:00"));
  assert.equal(data.summarize(rows, "pa").latest.deviceId, "A");
});

test("um único medidor não cria série artificial para o segundo", () => {
  const rows = normalize([reading("A", "2026-09-18T12:00:00Z", 10)]);
  const series = data.buildSeries(rows, [{ deviceId: "A" }, { deviceId: null }], "pa");
  assert.equal(series.length, 1);
});

test("filtro respeita minuto final e não inclui o restante do dia", () => {
  const rows = normalize([
    reading("A", "2026-09-18T12:29:59.999Z", 1),
    reading("A", "2026-09-18T12:30:00Z", 2),
    reading("B", "2026-09-18T12:30:59.999Z", 3),
    reading("A", "2026-09-18T12:31:00Z", 4),
    reading("A", "2026-09-18T23:00:00Z", 5)
  ]);
  const period = data.parsePeriod("2026-09-18T12:30Z", "2026-09-18T12:30Z");
  assert.deepEqual(data.filterRows(rows, period).map(row => row.pa), [2, 3]);
  assert.deepEqual(data.filterRows(rows, { ...period, meterId: "A" }).map(row => row.pa), [2]);
});

test("rejeita datas ausentes, inválidas e período invertido", () => {
  assert.throws(() => data.parsePeriod("", "2026-09-18T12:00"));
  assert.throws(() => data.parsePeriod("inválida", "2026-09-18T12:00"));
  assert.throws(() => data.parsePeriod("2026-09-19T12:00", "2026-09-18T12:00"));
});

test("nulos, booleanos e valores inválidos não viram zero; zero e negativos são válidos", () => {
  const rows = normalize([null, "", "inválido", false, undefined, 0, -2, "8"].map((pa, index) =>
    reading("A", `2026-09-18T12:0${index}:00Z`, pa)));
  const summary = data.summarize(rows, "pa");
  assert.equal(summary.count, 3);
  assert.equal(summary.average, 2);
  assert.equal(summary.peak.pa, "8");
  assert.deepEqual(data.buildSeries(rows, [{ deviceId: "A" }], "pa")[0].points.map(point => point.y),
    [null, null, null, null, null, 0, -2, 8]);
});

test("período vazio e variável ausente limpam os indicadores", () => {
  assert.deepEqual(data.summarize([], "pa"), { count: 0, average: null, latest: null, peak: null });
  const rows = normalize([reading("A", "2026-09-18T12:00:00Z", 10)]);
  assert.equal(data.summarize(rows, "pb").count, 0);
});

test("descarta registros sem data ou identificação e rejeita resposta inesperada", () => {
  const result = data.normalizeRows([
    null, {}, reading("", "2026-09-18T12:00:00Z", 1), reading("A", "inválida", 1),
    reading(" A ", "2026-09-18T12:00:00Z", 2)
  ]);
  assert.equal(result.discarded, 4);
  assert.equal(result.rows[0].deviceId, "A");
  assert.throws(() => data.normalizeRows({ error: "falha" }));
});

test("troca de variável mantém o período e calcula os dados da variável escolhida", () => {
  const rows = normalize([
    reading("A", "2026-09-18T12:00:00Z", 10, { pb: 100 }),
    reading("A", "2026-09-19T12:00:00Z", 20, { pb: 200 })
  ]);
  const filtered = data.filterRows(rows, data.parsePeriod("2026-09-18T00:00Z", "2026-09-18T23:59Z"));
  assert.equal(data.summarize(filtered, "pa").average, 10);
  assert.equal(data.summarize(filtered, "pb").average, 100);
});

test("CSV preserva os registros filtrados, caracteres e valores ausentes", () => {
  const rows = normalize([reading("=ID", "2026-09-18T12:00:00Z", null)]);
  const csv = data.toCsv(rows, [{ deviceId: "=ID", label: 'Medidor "A"; teste' }], { key: "pa", unit: "" });
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"Medidor ""A""; teste"'));
  assert.ok(csv.includes('"\'=ID"'));
  assert.ok(csv.endsWith('"pa";"";""'));
});
