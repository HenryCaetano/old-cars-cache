package br.com.sptech.carros.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "EstatisticasResponse", description = "Estatísticas acumuladas do cache em memória.")
public record EstatisticasResponse(
		@Schema(description = "Quantidade de entradas atualmente no cache", example = "5")
		int tamanhoAtual,

		@Schema(description = "Limite máximo de entradas configurado", example = "5")
		int limite,

		@Schema(description = "Quantidade de acessos atendidos pelo cache", example = "5")
		long hits,

		@Schema(description = "Quantidade de acessos que precisaram consultar a fonte", example = "8")
		long misses,

		@Schema(description = "Quantidade de entradas removidas por limite (LRU/FIFO)", example = "2")
		long evictions,

		@Schema(description = "Quantidade de entradas removidas por expiração de TTL", example = "0")
		long expiracoes,

		@Schema(description = "Proporção de hits: hits / (hits + misses), arredondada em 4 casas", example = "0.3846")
		double hitRatio,

		@Schema(description = "Política de remoção configurada", example = "LRU", allowableValues = { "LRU", "FIFO" })
		String politica,

		@Schema(description = "Tempo de vida das entradas em segundos", example = "60")
		long ttlSegundos) {
}
