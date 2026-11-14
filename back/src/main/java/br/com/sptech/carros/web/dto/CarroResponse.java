package br.com.sptech.carros.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(name = "CarroResponse", description = "Dados de um carro clássico retornados pela API.")
public record CarroResponse(
		@Schema(description = "Identificador único do carro", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
		Long id,

		@Schema(description = "Modelo do carro", example = "Spyder 550")
		String modelo,

		@Schema(description = "Marca do carro", example = "Porsche")
		String marca,

		@Schema(description = "Ano de fabricação", example = "1955")
		Integer anoFabricacao,

		@Schema(description = "País de origem", example = "Alemanha")
		String paisOrigem,

		@Schema(description = "Descrição do motor", example = "4 cil. 1.5 L")
		String motor,

		@Schema(description = "Potência em cavalos (cv)", example = "110")
		Integer potenciaCv,

		@Schema(description = "Cor do carro", example = "Prata")
		String cor,

		@Schema(description = "Descrição livre do carro",
				example = "Exemplar inserido pela API para validar o POST.")
		String descricao,

		@Schema(description = "Curador responsável pelo registro", example = "Curadoria SPTech")
		String curador,

		@Schema(description = "Data e hora da última atualização do registro",
				example = "2026-11-13T21:45:00Z", accessMode = Schema.AccessMode.READ_ONLY)
		Instant atualizadoEm) {
}
