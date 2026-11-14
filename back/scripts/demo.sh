#!/usr/bin/env bash
#
# Demonstra MISS/HIT, limite do cache (LRU), invalidação no PUT e estatísticas.
# Requer a aplicação rodando e o TTL padrão (60s) para que os itens não expirem
# durante a demonstração.
#
set -euo pipefail

BASE="${BASE:-http://localhost:8080}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

get_carro() {
	local id="$1"
	local body="$TMP_DIR/carro-$id.json"
	local headers="$TMP_DIR/headers-$id.txt"
	local tempo cache

	tempo="$(curl -sS -o "$body" -D "$headers" -w '%{time_total}' "$BASE/carros/$id")"
	cache="$(grep -i '^X-Cache:' "$headers" | tr -d '\r' | awk '{print $2}')"
	printf 'GET /carros/%-3s -> X-Cache: %-4s | %s s\n' "$id" "$cache" "$tempo"
}

mostrar_carro() {
	local id="$1"
	python3 - "$TMP_DIR/carro-$id.json" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
print("   ", {k: d[k] for k in ("id", "modelo", "marca", "anoFabricacao", "cor")})
PY
}

echo "=== 1. HIT x MISS ==="
curl -sS -o /dev/null -w 'DELETE /cache -> %{http_code}\n' -X DELETE "$BASE/cache"
get_carro 1
mostrar_carro 1
get_carro 1
mostrar_carro 1

echo
echo "=== 2. Enchendo o cache (limite = 5) ==="
for id in 2 3 4 5; do
	get_carro "$id"
done

echo
echo "=== 3. Reacessando o 1 para torná-lo o mais recente ==="
get_carro 1

echo
echo "=== 4. Inserindo o 6: o menos usado recentemente (2) deve sair ==="
get_carro 6
echo "--- estatísticas logo após a eviction ---"
curl -sS "$BASE/cache/estatisticas" | python3 -m json.tool

echo
echo "=== 5. Confirmando a remoção do 2 e a permanência do 1 ==="
get_carro 2
get_carro 1

echo
echo "=== 6. PUT no 4 e invalidação ==="
get_carro 4
python3 - "$TMP_DIR/carro-4.json" "$TMP_DIR/put-4.json" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
d["cor"] = "Verde British"
d["descricao"] = d["descricao"] + " Restaurado e documentado pelo curador."
json.dump(d, open(sys.argv[2], "w"))
PY
curl -sS -X PUT "$BASE/carros/4" -H 'Content-Type: application/json' \
	--data-binary "@$TMP_DIR/put-4.json" -o "$TMP_DIR/put-response.json" \
	-w 'PUT /carros/4 -> %{http_code}\n'
get_carro 4
mostrar_carro 4

echo
echo "=== 7. Estatísticas finais ==="
curl -sS "$BASE/cache/estatisticas" | python3 -m json.tool
