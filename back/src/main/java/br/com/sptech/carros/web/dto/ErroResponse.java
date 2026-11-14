package br.com.sptech.carros.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.Map;

@Schema(name = "ErroResponse", description = "Formato padrão de erro retornado pela API.")
public record ErroResponse(
		@Schema(description = "Data e hora do erro", example = "2026-11-13T21:45:00Z",
				accessMode = Schema.AccessMode.READ_ONLY)
		Instant timestamp,

		@Schema(description = "Código HTTP do erro", example = "404")
		int status,

		@Schema(description = "Resumo do erro", example = "Não encontrado")
		String erro,

		@Schema(description = "Mensagem detalhada do erro", example = "Carro com id 999 não encontrado.")
		String mensagem,

		@Schema(description = "Erros de validação por campo (vazio quando não há validação de campos)",
				example = "{\"modelo\":\"modelo é obrigatório\"}")
		Map<String, String> campos) {
}
