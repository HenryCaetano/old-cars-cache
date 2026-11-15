package br.com.sptech.carros.web;

import br.com.sptech.carros.config.OpenApiConfig;
import br.com.sptech.carros.service.CarroOrdenacaoService;
import br.com.sptech.carros.web.dto.CarroResponse;
import br.com.sptech.carros.web.dto.PaginaResponse;
import br.com.sptech.carros.web.mapper.CarroMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint dedicado à ordenação da grade. Ele ordena o acervo inteiro antes de
 * paginar, em vez de ordenar apenas os 10 itens da página atual.
 */
@Tag(name = OpenApiConfig.TAG_CARROS, description = "Consulta, cadastro, atualização e exclusão de carros clássicos.")
@RestController
@RequestMapping("/carros")
public class CarroOrdenacaoController {

	private final CarroOrdenacaoService service;
	private final CarroMapper mapper;

	public CarroOrdenacaoController(CarroOrdenacaoService service, CarroMapper mapper) {
		this.service = service;
		this.mapper = mapper;
	}

	@Operation(summary = "Lista carros ordenados em todo o acervo",
			description = """
					Ordena todos os carros do acervo antes de aplicar a paginação fixa de 10 itens. \
					O parâmetro opcional `termo` restringe a ordenação aos carros que combinam com o \
					filtro, usando a mesma comparação sem acentos e sem diferença de maiúsculas/minúsculas. \
					Ordens aceitas: entrada-asc, entrada-desc, ano-asc, ano-desc, potencia-desc e marca-asc.""")
	@ApiResponse(responseCode = "200", description = "Página ordenada retornada com sucesso")
	@GetMapping("/ordenados")
	public PaginaResponse<CarroResponse> listarOrdenado(
			@Parameter(description = "Número da página, iniciando em 0. Valores negativos são tratados como 0.",
					example = "0")
			@RequestParam(name = "pagina", defaultValue = "0") int pagina,
			@Parameter(description = "Critério de ordenação do acervo", example = "ano-desc")
			@RequestParam(name = "ordem", defaultValue = "entrada-asc") String ordem,
			@Parameter(description = "Termo opcional para filtrar antes de ordenar", example = "lamborghini")
			@RequestParam(name = "termo", defaultValue = "") String termo) {
		return mapper.toPagina(service.listarOrdenado(termo, ordem, pagina));
	}

}
