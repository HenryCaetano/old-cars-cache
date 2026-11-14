package br.com.sptech.carros.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Dados aceitos para cadastro e atualização de um carro clássico.
 */
@Schema(name = "CarroRequest", description = "Dados aceitos para cadastro e atualização de um carro clássico.")
public record CarroRequest(
		@Schema(description = "Modelo do carro", example = "Spyder 550", maxLength = 80, requiredMode = Schema.RequiredMode.REQUIRED)
		@NotBlank(message = "modelo é obrigatório")
		@Size(max = 80, message = "modelo deve ter no máximo 80 caracteres")
		String modelo,

		@Schema(description = "Marca do carro", example = "Porsche", maxLength = 60, requiredMode = Schema.RequiredMode.REQUIRED)
		@NotBlank(message = "marca é obrigatória")
		@Size(max = 60, message = "marca deve ter no máximo 60 caracteres")
		String marca,

		@Schema(description = "Ano de fabricação", example = "1955", minimum = "1886", maximum = "2100",
				requiredMode = Schema.RequiredMode.REQUIRED)
		@NotNull(message = "anoFabricacao é obrigatório")
		@Min(value = 1886, message = "anoFabricacao deve ser maior ou igual a 1886")
		@Max(value = 2100, message = "anoFabricacao deve ser menor ou igual a 2100")
		Integer anoFabricacao,

		@Schema(description = "País de origem", example = "Alemanha", maxLength = 60,
				requiredMode = Schema.RequiredMode.REQUIRED)
		@NotBlank(message = "paisOrigem é obrigatório")
		@Size(max = 60, message = "paisOrigem deve ter no máximo 60 caracteres")
		String paisOrigem,

		@Schema(description = "Descrição do motor", example = "4 cil. 1.5 L", maxLength = 80,
				requiredMode = Schema.RequiredMode.REQUIRED)
		@NotBlank(message = "motor é obrigatório")
		@Size(max = 80, message = "motor deve ter no máximo 80 caracteres")
		String motor,

		@Schema(description = "Potência em cavalos (cv)", example = "110", minimum = "1",
				requiredMode = Schema.RequiredMode.REQUIRED)
		@NotNull(message = "potenciaCv é obrigatória")
		@Min(value = 1, message = "potenciaCv deve ser maior que zero")
		Integer potenciaCv,

		@Schema(description = "Cor do carro", example = "Prata", maxLength = 40,
				requiredMode = Schema.RequiredMode.REQUIRED)
		@NotBlank(message = "cor é obrigatória")
		@Size(max = 40, message = "cor deve ter no máximo 40 caracteres")
		String cor,

		@Schema(description = "Descrição livre do carro", example = "Exemplar inserido pela API para validar o POST.",
				maxLength = 2000, requiredMode = Schema.RequiredMode.REQUIRED)
		@NotBlank(message = "descricao é obrigatória")
		@Size(max = 2000, message = "descricao deve ter no máximo 2000 caracteres")
		String descricao,

		@Schema(description = "Curador responsável pelo registro", example = "Curadoria SPTech", maxLength = 80,
				requiredMode = Schema.RequiredMode.REQUIRED)
		@NotBlank(message = "curador é obrigatório")
		@Size(max = 80, message = "curador deve ter no máximo 80 caracteres")
		String curador) {
}
