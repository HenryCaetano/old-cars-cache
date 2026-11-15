package br.com.sptech.carros.web;

import br.com.sptech.carros.config.OpenApiConfig;
import br.com.sptech.carros.service.CarroBuscaService;
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
 * Endpoint dedicado ao filtro da grade. Ele consulta o acervo inteiro, em vez
 * de apenas os 10 itens da página atual, e devolve o resultado já paginado.
 */
@Tag(name = OpenApiConfig.TAG_CARROS, description = "Consulta, cadastro, atualização e exclusão de carros clássicos.")
@RestController
@RequestMapping("/carros")
public class CarroBuscaController {

	private final CarroBuscaService service;
	private final CarroMapper mapper;

	public CarroBuscaController(CarroBuscaService service, CarroMapper mapper) {
		this.service = service;
		this.mapper = mapper;
	}

	@Operation(summary = "Filtra carros em todo o acervo",
			description = """
					Busca o termo em todas as páginas do acervo, comparando marca, modelo, país de origem, \
					motor, cor, curador, ano e identificador. A comparação ignora acentos e maiúsculas/minúsculas. \
					O resultado é devolvido em páginas fixas de 10 itens.""")
	@ApiResponse(responseCode = "200", description = "Resultado do filtro retornado com sucesso")
	@GetMapping("/busca")
	public PaginaResponse<CarroResponse> buscar(
			@Parameter(description = "Termo pesquisado em todo o acervo", example = "lamborghini")
			@RequestParam(name = "termo", defaultValue = "") String termo,
			@Parameter(description = "Número da página do resultado, iniciando em 0. Valores negativos são tratados como 0.",
					example = "0")
			@RequestParam(name = "pagina", defaultValue = "0") int pagina) {
		return mapper.toPagina(service.buscar(termo, pagina));
	}

}
