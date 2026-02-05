let dadosGlobais = [];
let dadosOriginais = [];
let graficoAtual = null;

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/login";
}

async function carregarDados() {
  try {
    const response = await fetch("/api/medicoes/listar", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    dadosGlobais = await response.json();
    dadosOriginais = [...dadosGlobais];
    filtrarDados();
  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
  }
}

function inicializarFiltroHoje() {
  const hoje = new Date();

  const inicioDia = new Date(hoje);
  inicioDia.setHours(0, 0, 0, 0);

  const fimDia = new Date(hoje);
  fimDia.setHours(23, 59, 59, 999);

  const formatar = (data) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`; };

  document.getElementById("dataInicio").value = formatar(inicioDia);
  document.getElementById("dataFim").value = formatar(fimDia);
}


function atualizarGrafico(dados = dadosGlobais) {
  const variavel = document.getElementById("variavel").value;

  const labels = dados.map(d =>
    new Date(d.dataHora).toLocaleString("pt-BR")
  );

  const valores = dados.map(d => d[variavel]);

  montarGrafico(labels, valores, variavel.toUpperCase());
}

function filtrarDados() {
  const inicioInput = document.getElementById("dataInicio").value;
  const fimInput = document.getElementById("dataFim").value;

  if (!inicioInput || !fimInput) {
    alert("Selecione data inicial e final");
    return;
  }

  const inicio = new Date(inicioInput);
  const fim = new Date(fimInput);
  fim.setHours(23, 59, 59, 999);

  const dadosFiltrados = dadosOriginais.filter(d => {
    const dataRegistro = new Date(d.dataHora);
    return dataRegistro >= inicio && dataRegistro <= fim;
  });

  if (dadosFiltrados.length === 0) {
    alert("Nenhum dado encontrado nesse período");
    return;
  }

  atualizarGrafico(dadosFiltrados);
}

function montarGrafico(labels, valores, titulo) {
  const ctx = document.getElementById("grafico");

  if (graficoAtual) {
    graficoAtual.destroy();
  }

  graficoAtual = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: titulo,
        data: valores,
        borderWidth: 1,
        tension: 0.1,
        borderColor: '#ff5e00',
        backgroundColor: '#ff5e00',
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: { maxTicksLimit: 6 }
        }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarFiltroHoje();
  carregarDados();
});
