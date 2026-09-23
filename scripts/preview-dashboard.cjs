// Prévia local isolada: não acessa a API, o banco ou o Raspberry.
// Execute: node scripts/preview-dashboard.cjs
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const staticRoot = path.resolve(__dirname, "../src/main/resources/static");
const port = Number(process.env.PREVIEW_PORT || 4173);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpeg": "image/jpeg" };
const previewMeterCount = url => [1, 2, 60].includes(Number(url.searchParams.get("medidores"))) ? Number(url.searchParams.get("medidores")) : 2;

function sampleReadings(meterCount) {
  const rows = [];
  const interval = 5 * 60 * 1000;
  const end = Math.floor(Date.now() / interval) * interval;
  for (let meter = 1; meter <= meterCount; meter++) {
    for (let index = 0; index < 7 * 24 * 12; index++) {
      const timestamp = end - index * interval;
      const wave = Math.sin(timestamp / 3600000 + meter);
      const base = meter === 1 ? 180 : 125;
      const hour = new Date(timestamp).getHours();
      const inUse = hour >= 8 + meter % 3 && hour < 17 + meter % 3;
      const idle = hour >= 7 && hour < 21;
      const pa = inUse ? Number((base + wave * 30).toFixed(2)) : idle ? 4 : 0;
      const pb = inUse ? Number((base * 0.9 + wave * 24).toFixed(2)) : idle ? 3 : 0;
      const pc = inUse ? Number((base * 1.1 + wave * 18).toFixed(2)) : idle ? 3 : 0;
      // Uma lacuna por dia permite verificar que ausência de envio não vira trabalho.
      if (hour === 13 && new Date(timestamp).getMinutes() < 30) continue;
      rows.push({
        deviceId: `DEMO-MEDIDOR-${meter}`,
        dataHora: new Date(timestamp).toISOString(),
        pa, pb, pc, pt: Number((pa + pb + pc).toFixed(2)),
        uarms: Number((220 + wave * 3).toFixed(2))
      });
    }
  }
  return rows;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("A prévia aceita apenas consultas.");
    return;
  }
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname === "/js/preview-session.js") {
      res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
      res.end(req.method === "HEAD" ? undefined : `
        localStorage.setItem("token", "preview-local-simulado");
        const countParam = Number(new URLSearchParams(location.search).get("medidores"));
        const previewCount = [1, 2, 60].includes(countParam) ? countParam : 2;
        DASHBOARD_CONFIG.meters = Array.from({ length: previewCount }, (_, index) => ({
          deviceId: "DEMO-MEDIDOR-" + (index + 1),
          label: (index % 2 ? "Compressor " : "Esteira ") + String(index + 1).padStart(2, "0"),
          color: ["#d90935", "#378baf", "#8770ad"][index % 3]
        }));
        DASHBOARD_CONFIG.endpoint = "/api/medicoes/listar?medidores=" + previewCount;
      `);
      return;
    }
    if (url.pathname === "/api/medicoes/listar") {
      const count = previewMeterCount(url);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(req.method === "HEAD" ? undefined : JSON.stringify(sampleReadings(count)));
      return;
    }

    const dashboard = ["/", "/dashboard", "/dashboard.html", "/login", "/login.html"].includes(url.pathname);
    const requested = dashboard ? "/dashboard.html" : decodeURIComponent(url.pathname);
    const file = path.resolve(staticRoot, "." + requested);
    const relative = path.relative(staticRoot, file);
    if (relative.startsWith("..") || path.isAbsolute(relative) ||
        (!dashboard && !/^\/(css|js|images)\//.test(requested))) {
      res.writeHead(404);
      res.end("Arquivo não encontrado.");
      return;
    }

    let content = await fs.readFile(file);
    if (dashboard) {
      const count = previewMeterCount(url);
      // Injeções existem somente na resposta deste servidor de prévia.
      // Os arquivos HTML/JS utilizados pela aplicação real ficam intactos.
      content = content.toString("utf8")
        .replace('<script defer src="/js/dashboard.js"></script>',
          '<script defer src="/js/preview-session.js"></script>\n    <script defer src="/js/dashboard.js"></script>')
        .replace('<main id="conteudo" class="main-content">',
          `<main id="conteudo" class="main-content"><div class="notice" role="note"><strong>PRÉVIA LOCAL · DADOS SIMULADOS</strong><br>Exibindo ${count} medidor(es). <a href="/dashboard?medidores=1" style="text-decoration:underline">Testar 1 medidor</a> · <a href="/dashboard?medidores=2" style="text-decoration:underline">Testar 2 medidores</a> · <a href="/dashboard?medidores=60" style="text-decoration:underline">Testar 60 medidores</a><br>Esta prévia não se conecta ao Raspberry.</div>`);
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch (error) {
    res.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Não foi possível carregar o arquivo da prévia.");
  }
});

server.on("error", error => {
  console.error(error.code === "EADDRINUSE"
    ? `A porta ${port} já está em uso. Abra http://localhost:${port}/dashboard ou defina PREVIEW_PORT para usar outra porta.`
    : error.message);
  process.exitCode = 1;
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Prévia local: http://localhost:${port}/dashboard`);
  console.log("Dados simulados de 7 dias. Use os links do aviso para alternar entre 1, 2 e 60 medidores.");
  console.log("O Raspberry não é acessado. Para encerrar, pressione Ctrl+C.");
});
