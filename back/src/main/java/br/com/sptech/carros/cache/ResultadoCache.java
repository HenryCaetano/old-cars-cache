package br.com.sptech.carros.cache;

/**
 * Resultado de uma consulta ao cache, com a informação de HIT/MISS para que a
 * camada web possa devolver o header X-Cache.
 */
public record ResultadoCache<V>(V valor, boolean hit) {
}
