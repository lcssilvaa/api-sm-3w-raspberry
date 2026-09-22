# Tomada inteligente

A tomada envia suas leituras ao mesmo `POST /api/medicoes` dos medidores.
Os valores numéricos podem chegar como texto, conforme o exemplo:

```json
{
  "id": "3",
  "pa": "5.67",
  "qa": "77.68",
  "sa": "77.89",
  "uarms": "126.23",
  "iarms": "0.61",
  "pft": "0.07",
  "pga": "0.00",
  "freq": "60.00",
  "epa_c": "0.00",
  "rele": "0",
  "rssi_wifi": "-56.00"
}
```

`rele` é um inteiro opcional e aceita `"0"`, `"1"`, `0` ou `1`.
As variáveis não enviadas ficam como `null`. Valores zero enviados pelo
equipamento são preservados. Medidores que não enviam `rele` continuam aceitos.

Na resposta de `GET /api/medicoes/listar`, o identificador do equipamento
aparece como `deviceId`, a energia como `epaC` e o sinal como `rssiWifi`,
seguindo o contrato existente. O novo campo aparece como `rele` (número ou
`null`). O `id` dessa resposta identifica o registro da medição.

## Atualização do banco

Antes de iniciar a nova versão da API, execute
[`scripts/sql/adicionar-rele.sql`](../scripts/sql/adicionar-rele.sql) no banco
PostgreSQL da aplicação:

```sql
ALTER TABLE medicoes ADD COLUMN IF NOT EXISTS rele INTEGER;
```

A aplicação usa `spring.jpa.hibernate.ddl-auto=validate`: ela não executa
esse script automaticamente e precisa da coluna para iniciar. A coluna
permite `NULL`, inclusive para as medições já existentes.

Depois, gere e execute o novo JAR ou reconstrua o serviço Docker `api`.

## Verificação local

O teste de recebimento e listagem usa o controlador e o serviço reais,
com o repositório simulado, sem depender de PostgreSQL:

```powershell
.\mvnw.cmd "-Dtest=MedicaoControllerTest" test
```
