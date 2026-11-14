package br.com.sptech.carros.cache;

/**
 * Fotografia imutável das estatísticas do cache.
 */
public record EstatisticasCache(
		int tamanhoAtual,
		int limite,
		long hits,
		long misses,
		long evictions,
		long expiracoes,
		double hitRatio,
		String politica,
		long ttlSegundos) {
}
