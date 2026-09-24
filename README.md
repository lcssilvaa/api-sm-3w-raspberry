# Monitoramento de energia e uso de equipamentos

Sistema que reúne leituras de medidores de energia e tomadas inteligentes em um painel acessível pelo navegador. Ajuda a acompanhar o consumo elétrico e estimar por quanto tempo os equipamentos ficaram em operação.

## Para que serve?

- Comparar o comportamento dos equipamentos ao longo do dia.
- Identificar períodos de uso, repouso e possíveis desperdícios de energia.
- Consultar o histórico de medições e os horários de maior demanda.
- Exportar os dados para planilhas e relatórios.

## Como funciona?

Os medidores e as tomadas enviam suas leituras ao sistema, que guarda o histórico. Após fazer login, o usuário escolhe os equipamentos, o período e a informação que deseja consultar, como potência, consumo, tensão ou corrente, conforme os dados disponíveis em cada dispositivo.

O painel apresenta gráficos, tabelas e um resumo das leituras. O botão **Atualizar dados** busca as medições mais recentes, e **Exportar CSV** permite baixar os resultados para abrir em uma planilha.

## Como são estimadas as horas em operação?

O sistema usa a **PA**, a potência ativa da fase A, medida em watts (W), disponível também nas tomadas inteligentes. A regra atual é:

- **Em operação:** PA igual ou superior a 20 W.
- **Parado/sem uso:** PA entre 0 W e abaixo de 20 W, incluindo o baixo consumo em repouso.
- **Sem dados:** períodos sem leituras suficientes ou com valores de PA inválidos.

O tempo é calculado entre as leituras recebidas. Lacunas maiores que o intervalo permitido ficam como **sem dados**. As horas são uma estimativa de funcionamento; o limite de 20 W deve ser conferido com o comportamento real dos equipamentos.

## Mais informações

Detalhes de configuração e manutenção estão na [documentação do painel](docs/dashboard.md) e na [documentação da tomada inteligente](docs/tomada-inteligente.md).
