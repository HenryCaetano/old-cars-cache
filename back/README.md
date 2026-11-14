# API de Carros Clássicos com cache próprio

API REST em **Spring Boot 4.1.2**, **Java 21+** (compilada com `--release 21`), **JPA/Hibernate** e **H2 em memória**, que serve uma coleção de 100 carros clássicos usando um **cache em memória construído à mão com `ConcurrentHashMap`**.

Não são usados `@Cacheable`, Spring Cache, Caffeine, Redis, Ehcache ou qualquer biblioteca de cache. A implementação é a versão "light": limite de itens, TTL, LRU/FIFO, invalidação, estatísticas e rotina agendada são controlados pelo próprio código.

A documentação interativa da API é gerada com **springdoc-openapi 3.2.0** (Swagger UI), cobrindo todos os endpoints.

> Adaptação do enunciado: a entidade `Conteudo` virou `Carro`, o endpoint `/conteudos` virou `/carros` e o componente `ConteudoCache` virou `CarroCache`. O restante dos requisitos foi mantido.

---

## 1. Como executar

Pré-requisitos: JDK 21 ou superior e Maven (o projeto já inclui o Maven Wrapper).

```bash
./mvnw spring-boot:run
```

A API sobe em `http://localhost:8080`.

A documentação interativa fica disponível em:

- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`
- **OpenAPI YAML:** `http://localhost:8080/v3/api-docs.yaml`

Para a demonstração de TTL sem esperar 60 segundos, existe o profile `demo`:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

O profile `demo` usa `ttl-segundos=8` e limpeza agendada a cada 5 segundos. A configuração padrão continua com `ttl-segundos=60`.

Build e testes:

```bash
./mvnw test
./mvnw package
java -jar target/carros-classicos-0.0.1-SNAPSHOT.jar
```

Console do H2: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:carrosdb`
- Usuário: `sa`
- Senha: vazia

---

## 2. Estrutura

```
src/main/java/br/com/sptech/carros
├── CarrosClassicosApplication.java
├── cache
│   ├── CacheSimples.java          # cache genérico <K,V> com ConcurrentHashMap
│   ├── EntradaCache.java          # valor + armazenadoEm + ultimoAcesso
│   ├── EstatisticasCache.java     # snapshot imutável das estatísticas
│   ├── PoliticaRemocao.java       # LRU / FIFO
│   ├── ResultadoCache.java        # valor + hit
│   ├── CarroCache.java            # @Component que usa o cache para Carro
│   └── LimpezaCacheAgendada.java  # @Scheduled
├── config
│   ├── CacheProperties.java       # @ConfigurationProperties("app.cache")
│   ├── OpenApiConfig.java         # metadados do Swagger/OpenAPI
│   └── CargaInicialCarros.java    # popula o H2 com 100 registros
├── domain/Carro.java
├── repository/CarroRepository.java
├── service/CarroService.java      # usa o cache e a fonte lenta
└── web
    ├── CarroController.java
    ├── CacheController.java
    ├── ApiExceptionHandler.java
    ├── dto/...
    └── mapper/...
```

O padrão da disciplina foi seguido:

- a **controller** recebe `CarroRequest`, chama o **mapper** e devolve `CarroResponse`/`PaginaResponse`;
- o **service** recebe e devolve entidades (`Carro`), sem conhecer DTOs;
- o **cache** é usado pelo service;
- o header `X-Cache` vem de um `ResultadoBuscaCarro` que carrega a entidade e o indicador HIT/MISS.

---

## 3. Banco H2 e paginação

- 100 carros clássicos são inseridos na primeira inicialização por `CargaInicialCarros`.
- `GET /carros?pagina=0` devolve **sempre 10 registros por página** (`CarroService.TAMANHO_PAGINA = 10`), com 10 páginas no total.
- A carga inicial só ocorre se a tabela estiver vazia.

Exemplo de resposta da última página:

```json
{
  "conteudo": [ ... 10 carros ... ],
  "pagina": 9,
  "tamanho": 10,
  "totalElementos": 100,
  "totalPaginas": 10
}
```

---

## 4. Como o cache funciona

### `CacheSimples<K,V>`

Armazena `ConcurrentHashMap<K, EntradaCache<V>>` e oferece:

| Operação | Comportamento |
|---|---|
| `obter(K)` | Se existir e estiver dentro do TTL, atualiza `ultimoAcesso`, conta HIT e devolve o valor. Se não existir, conta MISS. Se estiver expirado, remove, conta MISS e expiração. |
| `adicionar(K,V)` | Insere ou substitui. Se o limite foi atingido, remove uma vítima antes de inserir. |
| `invalidar(K)` | Remove uma entrada específica. |
| `limpar()` | Remove todas as entradas. |
| `removerExpirados()` | Remove preventivamente as entradas vencidas; usado pelo `@Scheduled`. |
| `estatisticas()` | Devolve tamanho, limite, hits, misses, evictions, expirações, hit ratio, política e TTL. |

O `adicionar` é `synchronized` para que o limite não seja ultrapassado sob concorrência. O `obter` usa os recursos do `ConcurrentHashMap`; o `ultimoAcesso` é `volatile`.

### `CarroCache` (`@Component`)

- Cria o `CacheSimples<Long, Carro>` a partir de `CacheProperties`.
- No `buscar(id, fonte)`, mede o tempo total com `System.nanoTime()`.
- Se o cache responde: `Cache HIT` no log.
- Se não responde: chama a fonte lenta, insere no cache e loga `Cache MISS` com o tempo total (incluindo o `Thread.sleep`).
- `invalidar`, `limpar` e `estatisticas` delegam ao cache genérico.

Exemplo real de log:

```text
INFO  b.c.s.carros.cache.CarroCache : Cache MISS - id=1 - 2006 ms
INFO  b.c.s.carros.cache.CarroCache : Cache HIT  - id=1 - 0 ms
```

### Fonte lenta

`CarroService.buscarNaFonte` executa `Thread.sleep(app.fonte.atraso-ms)` antes de consultar o repositório. O valor padrão é `2000` ms.

### Limite e remoção

Com `app.cache.max-itens=5`, ao inserir o sexto item o cache escolhe a vítima:

- **LRU** (padrão): menor `ultimoAcesso`;
- **FIFO**: menor `armazenadoEm`, ignorando acessos.

A política é configurável em `app.cache.politica`.

### TTL

Cada `EntradaCache` guarda `armazenadoEm`. A entrada é considerada expirada quando `agora >= armazenadoEm + ttl`. Uma consulta a item expirado é MISS, removendo a entrada e indo novamente à fonte.

### Invalidação

`PUT /carros/{id}` e `DELETE /carros/{id}` chamam `CarroCache.invalidar(id)` depois de alterar o banco. A próxima leitura é obrigatoriamente MISS.

### Estatísticas

`GET /cache/estatisticas` devolve:

```json
{
  "tamanhoAtual": 5,
  "limite": 5,
  "hits": 5,
  "misses": 8,
  "evictions": 2,
  "expiracoes": 0,
  "hitRatio": 0.3846,
  "politica": "LRU",
  "ttlSegundos": 60
}
```

`hitRatio = hits / (hits + misses)`, arredondado em 4 casas.

### Limpeza agendada

`LimpezaCacheAgendada` usa:

```java
@Scheduled(
    initialDelayString = "${app.cache.limpeza-intervalo-ms:30000}",
    fixedDelayString = "${app.cache.limpeza-intervalo-ms:30000}")
```

Ela chama `removerExpirados()` e loga quantas entradas foram removidas.

---

## 5. Configuração

Arquivo `src/main/resources/application.properties`:

```properties
app.cache.max-itens=5
app.cache.ttl-segundos=60
app.cache.politica=LRU
app.cache.limpeza-intervalo-ms=30000
app.fonte.atraso-ms=2000

# Swagger / OpenAPI
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.paths-to-match=/carros/**,/cache/**
```

Os valores são lidos por `@ConfigurationProperties(prefix = "app.cache")` com validação (`@Min`). Também é possível sobrescrever por linha de comando:

```bash
java -jar target/carros-classicos-0.0.1-SNAPSHOT.jar \
  --app.cache.max-itens=3 \
  --app.cache.ttl-segundos=10 \
  --app.cache.politica=FIFO
```

---

## 6. Endpoints

| Método | Rota | Comportamento |
|---|---|---|
| `GET` | `/carros?pagina=0` | Lista paginada, sempre 10 itens por página. |
| `GET` | `/carros/{id}` | Busca no cache; em MISS/TTL expirado consulta a fonte (lenta) e armazena. Devolve `X-Cache: HIT` ou `X-Cache: MISS`. |
| `POST` | `/carros` | Cadastra um carro. Retorna `201` e `Location`. |
| `PUT` | `/carros/{id}` | Atualiza o carro e invalida a entrada do cache. |
| `DELETE` | `/carros/{id}` | Exclui o carro e invalida a entrada do cache. |
| `GET` | `/cache/estatisticas` | Tamanho atual, limite, hits, misses, evictions, expirações, hit ratio, política e TTL. |
| `DELETE` | `/cache` | Limpa todas as entradas do cache. As estatísticas acumuladas são preservadas. |

### 6.1 Swagger / OpenAPI

Todos os sete endpoints estão documentados no Swagger UI, com:

- resumo, descrição e tags `Carros` e `Cache`;
- schemas de requisição e resposta (`CarroRequest`, `CarroResponse`, `PaginaResponse`, `ErroResponse` e `EstatisticasResponse`);
- parâmetros (`pagina` e `id`) com descrição e exemplo;
- respostas de erro `400` e `404` padronizadas em `ErroResponse`;
- header `X-Cache` (`HIT`/`MISS`) documentado na busca por ID;
- exemplos de payload no `CarroRequest` e nos demais schemas.

Acesse `http://localhost:8080/swagger-ui.html` e use **Try it out** para executar as chamadas direto do navegador. O documento também pode ser consumido em `http://localhost:8080/v3/api-docs` (JSON) ou `http://localhost:8080/v3/api-docs.yaml` (YAML).

```bash
# Conferir as operações publicadas
curl -s http://localhost:8080/v3/api-docs | python3 -m json.tool
```

Exemplo de POST:

```bash
curl -X POST http://localhost:8080/carros \
  -H 'Content-Type: application/json' \
  -d '{
    "modelo": "Spyder 550",
    "marca": "Porsche",
    "anoFabricacao": 1955,
    "paisOrigem": "Alemanha",
    "motor": "4 cil. 1.5 L",
    "potenciaCv": 110,
    "cor": "Prata",
    "descricao": "Exemplar inserido pela API para validar o POST.",
    "curador": "Curadoria SPTech"
  }'
```

Resposta: `201 Created`, `Location: http://localhost:8080/carros/101`.

Exemplo de PUT: envie o mesmo JSON completo. A atualização troca os dados, atualiza `atualizadoEm` e invalida o cache.

---

## 7. Demonstração executada

Os resultados abaixo são de execuções reais da aplicação. Os tempos de `curl` incluem a rede local; os tempos do log são medidos dentro do `CarroCache`.

### 7.1 Primeira busca (MISS, lenta) e segunda (HIT, rápida)

```text
DELETE /cache -> 204
GET /carros/1 -> X-Cache: MISS | 2.012127 s
GET /carros/1 -> X-Cache: HIT  | 0.002803 s
```

Log da aplicação:

```text
INFO  b.c.s.carros.cache.CarroCache : Cache LIMPO - todas as entradas foram removidas
INFO  b.c.s.carros.cache.CarroCache : Cache MISS - id=1 - 2006 ms
INFO  b.c.s.carros.cache.CarroCache : Cache HIT  - id=1 - 0 ms
```

### 7.2 Cache cheio e remoção do menos usado recentemente

Sequência: `1` (MISS), depois `2`, `3`, `4`, `5` (MISS) enchem o limite de 5; `1` é acessado de novo (HIT) e vira o mais recente; por fim `6` entra (MISS) e deve expulsar o `2`, que era o menos recentemente usado.

```text
GET /carros/1 -> X-Cache: HIT  | 0.001992 s
GET /carros/6 -> X-Cache: MISS | 2.003456 s
```

Estatísticas logo após a eviction:

```json
{
  "tamanhoAtual": 5,
  "limite": 5,
  "hits": 2,
  "misses": 6,
  "evictions": 1,
  "expiracoes": 0,
  "hitRatio": 0.25,
  "politica": "LRU",
  "ttlSegundos": 60
}
```

Confirmando que o `2` saiu e o `1` permaneceu:

```text
GET /carros/2 -> X-Cache: MISS | 2.003125 s
GET /carros/1 -> X-Cache: HIT  | 0.001607 s
```

### 7.3 Invalidação após PUT

```text
GET /carros/4 (antes)          -> X-Cache: HIT  | 0.002320 s
PUT /carros/4                  -> 200
GET /carros/4 (depois do PUT)  -> X-Cache: MISS | 2.003248 s
```

O corpo atualizado foi retornado com `"cor": "Verde British"`, comprovando que a próxima leitura veio da fonte e não do cache antigo.

### 7.4 Expiração por TTL

Para esta demonstração a aplicação foi iniciada com `--app.cache.ttl-segundos=5` (o padrão do projeto é 60):

```text
GET /carros/1 (primeira)       -> X-Cache: MISS | 2.033881 s
GET /carros/1 (segunda)        -> X-Cache: HIT  | 0.002180 s
# aguardo de 6 segundos
GET /carros/1 (após o TTL)     -> X-Cache: MISS | 2.003367 s
```

Estatísticas:

```json
{
  "tamanhoAtual": 1,
  "limite": 5,
  "hits": 1,
  "misses": 2,
  "evictions": 0,
  "expiracoes": 1,
  "hitRatio": 0.3333,
  "politica": "LRU",
  "ttlSegundos": 5
}
```

### 7.5 Limpeza agendada (`@Scheduled`)

Aplicação iniciada com `--app.cache.ttl-segundos=2 --app.cache.limpeza-intervalo-ms=1000`:

```text
INFO  b.c.s.carros.cache.CarroCache : Cache MISS - id=7 - 208 ms
INFO  b.c.s.carros.cache.CarroCache : Cache HIT  - id=7 - 0 ms
INFO  b.c.s.carros.cache.CarroCache : Limpeza agendada removeu 1 entrada(s) expirada(s)
```

Estatísticas depois da limpeza: `tamanhoAtual=0`, `expiracoes=1`.

### 7.6 Política FIFO configurada

Com `--app.cache.politica=FIFO --app.cache.max-itens=2 --app.fonte.atraso-ms=100`:

```text
GET /carros/1 -> MISS
GET /carros/2 -> MISS
GET /carros/1 -> HIT
GET /carros/3 -> MISS   # remove o 1, que foi o primeiro armazenado
GET /carros/1 -> MISS   # apesar do acesso recente, ele saiu
```

No LRU, o item removido teria sido o `2`, pois o `1` tinha acabado de ser acessado.

### 7.7 Estatísticas finais do roteiro principal

```json
{
  "tamanhoAtual": 5,
  "limite": 5,
  "hits": 5,
  "misses": 8,
  "evictions": 2,
  "expiracoes": 0,
  "hitRatio": 0.3846,
  "politica": "LRU",
  "ttlSegundos": 60
}
```

### 7.8 POST e DELETE

```text
POST /carros          -> 201, Location: http://localhost:8080/carros/101
GET /carros/101       -> X-Cache: MISS | 2.003466 s
DELETE /carros/101    -> 204
GET /carros/101       -> 404 (Carro não encontrado)
GET /carros?pagina=0  -> totalElementos=100, totalPaginas=10
```

---

## 8. Testes

```bash
./mvnw test
```

Cobertura dos testes de cache (`CacheSimplesTest`):

- HIT/MISS e hit ratio;
- limite de 3 itens com remoção LRU;
- limite com política FIFO;
- expiração por TTL e contagem de `expiracoes`;
- remoção de expirados pela rotina de limpeza;
- invalidação por chave e limpeza total;
- concorrência: 2.000 operações paralelas sem ultrapassar o limite;
- validação de limite/TTL inválidos.

`CarroCacheTest` cobre o fluxo MISS → HIT, invalidação e limpeza. `CarrosClassicosApplicationTests` valida a carga de 100 registros, páginas de 10, uso do cache e invalidação após atualização.

---

## 9. Desafios extras implementados

- [x] Cache genérico `CacheSimples<K, V>`.
- [x] Política de remoção configurável: `LRU` ou `FIFO`.
- [x] Rotina `@Scheduled` para remover itens expirados.
- [x] Testes unitários cobrindo limite, TTL, LRU, FIFO, invalidação, limpeza e concorrência.

---

## 10. Scripts de demonstração

Com a aplicação rodando (TTL padrão de 60s):

```bash
./scripts/demo.sh
```

Para demonstrar o TTL, suba a aplicação com um TTL curto e rode:

```bash
java -jar target/carros-classicos-0.0.1-SNAPSHOT.jar \
  --app.cache.ttl-segundos=5 --app.cache.limpeza-intervalo-ms=60000

TTL=5 ./scripts/demo-ttl.sh
```

Os scripts usam `curl` e `python3` apenas para formatar a saída; a API não depende deles.
