#!/usr/bin/env bash
#
# Demonstra a expiração por TTL.
# Execute a aplicação com um TTL curto, por exemplo:
#   java -jar target/carros-classicos-0.0.1-SNAPSHOT.jar \
#     --app.cache.ttl-segundos=5 --app.cache.limpeza-intervalo-ms=60000
# e depois rode este script (TTL=5 scripts/demo-ttl.sh).
#
set -euo pipefail

BASE="${BASE:-http://localhost:8080}"
TTL="${TTL:-5}"

get_carro() {
	local headers
	headers="$(mktemp)"
	local tempo cache
	tempo="$(curl -sS -o /dev/null -D "$headers" -w '%{time_total}' "$BASE/carros/1")"
	cache="$(grep -i '^X-Cache:' "$headers" | tr -d '\r' | awk '{print $2}')"
	rm -f "$headers"
	printf 'GET /carros/1 -> X-Cache: %-4s | %s s\n' "$cache" "$tempo"
}

curl -sS -o /dev/null -X DELETE "$BASE/cache"
echo "=== 1. Primeira busca (MISS) ==="
get_carro

echo "=== 2. Segunda busca (HIT, dentro do TTL) ==="
get_carro

echo "=== 3. Aguardando $((TTL + 1))s para o TTL de ${TTL}s expirar ==="
sleep "$((TTL + 1))"

echo "=== 4. Busca após o TTL (MISS, volta à fonte) ==="
get_carro

echo "=== 5. Estatísticas (expiracoes deve ser 1) ==="
curl -sS "$BASE/cache/estatisticas" | python3 -m json.tool
