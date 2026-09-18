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

Para visualizar no notebook sem banco, Java ou acesso ao Raspberry, execute
na raiz do repositório (requer apenas Node.js):

```sh
node scripts/preview-dashboard.cjs
```

Abra `http://localhost:4173/dashboard`. O aviso no topo identifica os dados
como simulados e permite alternar entre um e dois medidores. A prévia gera
sete dias de leituras para testar os filtros, o gráfico e a exportação.
Somente `pa`, `pb`, `pc` e `uarms` possuem valores simulados; as demais
variáveis exibem o estado sem valores. Os IDs de demonstração são aplicados
somente nessa prévia, preservando os IDs reais no arquivo de configuração.
Alterações nos arquivos do dashboard aparecem ao recarregar a página.
O gráfico precisa de acesso à internet para carregar o Chart.js pelo CDN.
Encerre com `Ctrl+C` no terminal. O servidor escuta apenas no próprio notebook
e não altera os arquivos de produção nem acessa o Raspberry.

Os testes de transformação não precisam de banco nem de dependências npm:

```sh
node --test src/test/js/dashboard-data.test.cjs
```

Os arquivos estáticos são servidos pela aplicação Spring Boot. Para atualizar
uma instalação empacotada, gere e execute o novo JAR ou reconstrua o serviço
Docker `api`. No desenvolvimento, atualize os recursos em `target/classes`
com `mvn process-resources` e reinicie a aplicação se necessário.

Referências: [comandos de execução e testes](comandos.txt) e
[manual do medidor](Manual%20Medidor.pdf).
