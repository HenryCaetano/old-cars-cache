package br.com.sptech.carros.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * Resposta de listagem paginada. O tamanho da página é fixo em 10.
 */
@Schema(name = "PaginaResponse", description = "Resposta de listagem paginada. O tamanho da página é fixo em 10.")
public record PaginaResponse<T>(
		@Schema(description = "Itens da página atual")
		List<T> conteudo,

		@Schema(description = "Número da página atual, iniciando em 0", example = "0")
		int pagina,

		@Schema(description = "Quantidade de itens por página", example = "10")
		int tamanho,

		@Schema(description = "Total de elementos disponíveis", example = "100")
		long totalElementos,

		@Schema(description = "Total de páginas", example = "10")
		int totalPaginas) {
}
