# Dashboard de energia

Acesse `/dashboard` com a sessão autenticada. O painel consulta o endpoint
existente `GET /api/medicoes/listar`, usando o token do login. Não há mudanças
no banco ou no contrato da API.

## Configuração

Edite `src/main/resources/static/js/dashboard-config.js`:

- `endpoint`: endereço da consulta de medições.
- `meters`: nome (`label`), cor hexadecimal de seis dígitos (`color`) e
  identificação (`deviceId`) de cada medidor. Com `null`, o painel descobre
  os IDs presentes na resposta; os IDs são ordenados na primeira consulta e
  suas associações são mantidas durante a sessão da página. Para garantir os
  mesmos nomes entre acessos, configure os IDs exatos dos equipamentos.
  IDs numéricos também são aceitos e normalizados para texto pelo dashboard.
- `variables`: campo retornado pela API (`key`), nome no filtro (`label`) e
  unidade opcional (`unit`). Estão configuradas as 40 variáveis numéricas
  existentes no backend, incluindo potência aparente, defasagens,
  frequência, temperatura e sinal Wi-Fi. Os nomes e unidades podem ser
  ajustados nesse arquivo conforme a documentação do equipamento.
  Os campos de energia usam o camelCase da resposta
  da listagem, como `epaC` e `epaG`, em vez de `epa_c` e `epa_g` do envio.
  `unit` é apenas um rótulo; não converte nem divide valores. A divisão por
  100 mencionada na legenda não foi aplicada: é necessário confirmar a
  escala efetivamente enviada pelo equipamento. O backend salva os valores
  recebidos sem essa conversão.

Exemplo de associação fixa:

```js
meters: [
  { deviceId: "ID_REAL_MEDIDOR_1", label: "Medidor 01", color: "#d90935" },
  { deviceId: "ID_REAL_MEDIDOR_2", label: "Medidor 02", color: "#378baf" }
]
```

## Segundo medidor

O segundo equipamento pode enviar as mesmas variáveis ao `POST /api/medicoes`,
com um `id` próprio. O backend já persiste esse valor como `deviceId` e o
devolve na listagem. Ao clicar em **Atualizar dados**, o dashboard passa a
exibir suas leituras separadamente e permite compará-las no mesmo gráfico.
Até isso acontecer, o segundo card indica que está aguardando dados.
Não são criadas leituras de demonstração.

As séries usam o horário real de cada leitura: os medidores não precisam
enviar dados simultaneamente. Valores ausentes aparecem como lacunas,
sem conversão para zero. Registros sem `deviceId` ou data válida são
desconsiderados e sinalizados no painel.

## Filtros e indicadores

Os filtros usam o fuso local do navegador e incluem todos os segundos do
minuto final escolhido. Hoje, 7 dias e 30 dias são períodos de calendário
que terminam no fim do dia atual. Alterações manuais nas datas exigem
**Aplicar filtros**; trocar a variável ou o medidor também aplica os campos.
**Atualizar dados** refaz a consulta mantendo os filtros já aplicados.

Os indicadores representam a variável e os medidores selecionados: última
leitura válida, média por amostra, maior leitura e quantidade de leituras
válidas. A média de todos os medidores considera todas as amostras, sem
somar os valores dos equipamentos e sem calcular consumo acumulado.

A tabela mostra os oito registros mais recentes. O CSV exporta todos os
registros filtrados, inclusive valores ausentes em branco, com o horário
original em ISO 8601. O painel atualiza ao abrir e ao clicar em Atualizar;
“Com leituras” indica histórico disponível, não conexão em tempo real.

O gráfico usa Chart.js 4.4.8 pelo CDN. Se ele não carregar, os indicadores,
a tabela e a exportação permanecem disponíveis. Falhas na API são exibidas
na página; se já houver uma consulta bem-sucedida, seus dados são mantidos
com um aviso até a próxima atualização.

## Verificação e execução

### Horas em operação

O painel **Horas em operação por equipamento** compara, em barras empilhadas,
o tempo em operação, parado e sem dados de cada medidor.
Usa o período e o medidor dos filtros principais, independentemente da
variável escolhida no gráfico de medições. A tabela abaixo das barras
mostra as mesmas durações em horas decimais. Todos os medidores são calculados
juntos, sem configurar limites ou perfis individuais. O resultado é ordenado
pelas horas em operação, da maior para a menor. Gráfico e tabela têm rolagem
para acomodar os 60 medidores, assim como a lista de cards quando há mais de seis.
O botão **Exportar CSV** deste painel exporta o resumo exibido, na mesma ordem
e com os mesmos filtros: medidor, ID, período, fim efetivo do cálculo e horas
em operação, parado e sem dados. Usa separador `;`, vírgula decimal e UTF-8
com BOM. Estados sem nenhum intervalo válido ficam em branco, como os `—`
da tabela. O CSV do histórico de medições continua disponível separadamente.
Quando não existe nenhum intervalo classificável, os estados mostram `—`;
o período transcorrido aparece como sem dados.

A métrica é a potência ativa em W: prioriza `pt`, inclusive quando zero.
Quando `pt` está ausente, soma as fases presentes no histórico do medidor
(`pa`, `pb`, `pc`); todas essas fases precisam ter valores válidos na leitura.
Assim, uma tomada que envia somente `pa` também funciona. Valores ausentes,
inválidos ou negativos não são interpretados como parado. O cálculo não
depende de tensão ou relé.

A definição operacional adotada é **ligado = em operação**, independentemente
de carga. A classificação segue uma regra única para todos os equipamentos:

- **Em operação**: potência ativa maior que 0 W, inclusive baixa potência.
- **Parado**: potência ativa igual a 0 W.
- **Sem dados**: intervalos sem leituras suficientes ou com potência inválida.

O resultado é uma estimativa do tempo ligado a partir da potência medida.
Não distingue carga, produtividade ou espera: qualquer potência positiva conta
como operação, conforme a definição escolhida. Ciclos entre leituras não são
observados. Nenhum limite de potência precisa ser ajustado pelo usuário.

A configuração técnica `workHours.maxGapMinutes`, em `dashboard-config.js`,
limita o intervalo entre leituras (padrão: 5 minutos). Acima dele, todo o trecho
fica sem dados. Ajuste à frequência de envio, globalmente ou por medidor:

```js
{ deviceId: 1, label: "Esteira", color: "#d90935",
  workHours: { maxGapMinutes: 2 } }
```

Medidores descobertos automaticamente recebem o intervalo global.
Os antigos limites e ajustes do `localStorage` não são mais utilizados.
A conversão de escala da potência é desnecessária para distinguir zero de
valores positivos; as medições originais são preservadas.

O cálculo mantém o estado da leitura inicial até a próxima amostra do mesmo
medidor, respeitando o intervalo máximo e recortando nas bordas do filtro.
Pode usar uma leitura anterior ao início do filtro para cobrir essa borda.
Não projeta o estado da última leitura: o tempo anterior à primeira amostra,
posterior à última e as lacunas ficam sem dados. O fim nunca ultrapassa o
horário da consulta; horas futuras não entram no gráfico. Timestamps
duplicados contam uma única vez, prevalecendo o último registro da resposta.
Nenhuma alteração no banco ou endpoint é necessária.

Referência sobre a métrica: [potência real/ativa no glossário da Fluke](https://www.fluke.com/en-us/learn/blog/electrical/electrical-glossary).

### Prévia e testes

Para visualizar no notebook sem banco, Java ou acesso ao Raspberry, execute
na raiz do repositório (requer apenas Node.js):

```sh
node scripts/preview-dashboard.cjs
```

Abra `http://localhost:4173/dashboard`. O aviso no topo identifica os dados
como simulados e permite alternar entre 1, 2 e 60 medidores. A prévia gera
sete dias de leituras para testar os filtros, o gráfico e a exportação.
Somente `pa`, `pb`, `pc`, `pt` e `uarms` possuem valores simulados; as demais
variáveis exibem o estado sem valores. Os IDs de demonstração são aplicados
somente nessa prévia, preservando os IDs reais no arquivo de configuração.
Alterações nos arquivos do dashboard aparecem ao recarregar a página.
Acesse `http://localhost:4173/dashboard?medidores=60` para testar a frota completa.
A prévia envia amostras a cada cinco minutos, com potência zero, baixa e alta,
além de uma lacuna diária para testar horas sem dados. Baixa e alta potência
contam igualmente como operação.
O gráfico precisa de acesso à internet para carregar o Chart.js pelo CDN.
Encerre com `Ctrl+C` no terminal. O servidor escuta apenas no próprio notebook
e não altera os arquivos de produção nem acessa o Raspberry.

Os testes de transformação não precisam de banco nem de dependências npm:

```sh
node --test src/test/js/dashboard-data.test.cjs src/test/js/dashboard-work-hours.test.cjs
```

Os arquivos estáticos são servidos pela aplicação Spring Boot. Para atualizar
uma instalação empacotada, gere e execute o novo JAR ou reconstrua o serviço
Docker `api`. No desenvolvimento, atualize os recursos em `target/classes`
com `mvn process-resources` e reinicie a aplicação se necessário.

Referências: [comandos de execução e testes](comandos.txt) e
[manual do medidor](Manual%20Medidor.pdf).
