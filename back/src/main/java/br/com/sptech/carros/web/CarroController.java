package br.com.sptech.carros.web;

import br.com.sptech.carros.config.OpenApiConfig;
import br.com.sptech.carros.domain.Carro;
import br.com.sptech.carros.service.CarroService;
import br.com.sptech.carros.service.ResultadoBuscaCarro;
import br.com.sptech.carros.web.dto.CarroRequest;
import br.com.sptech.carros.web.dto.CarroResponse;
import br.com.sptech.carros.web.dto.ErroResponse;
import br.com.sptech.carros.web.dto.PaginaResponse;
import br.com.sptech.carros.web.mapper.CarroMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Tag(name = OpenApiConfig.TAG_CARROS, description = "Consulta, cadastro, atualização e exclusão de carros clássicos.")
@RestController
@RequestMapping("/carros")
public class CarroController {

	private final CarroService service;
	private final CarroMapper mapper;

	public CarroController(CarroService service, CarroMapper mapper) {
		this.service = service;
		this.mapper = mapper;
	}

	/**
	 * Lista paginada. Cada página tem sempre 10 registros.
	 */
	@Operation(summary = "Lista carros clássicos",
			description = "Retorna uma página fixa de 10 carros, ordenados por ID crescente.")
	@ApiResponse(responseCode = "200", description = "Página retornada com sucesso")
	@GetMapping
	public PaginaResponse<CarroResponse> listar(
			@Parameter(description = "Número da página, iniciando em 0. Valores negativos são tratados como 0.",
					example = "0")
			@RequestParam(name = "pagina", defaultValue = "0") int pagina) {
		return mapper.toPagina(service.listar(pagina));
	}

	@Operation(summary = "Busca um carro por ID",
			description = """
					Consulta primeiro o cache em memória. Em caso de HIT, responde rapidamente; \
					em caso de MISS ou TTL expirado, consulta a fonte lenta (banco) e atualiza o cache. \
					O header X-Cache indica se a resposta veio do cache.""")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Carro encontrado",
					headers = @Header(name = "X-Cache",
							description = "Indica se a resposta veio do cache: HIT ou MISS.",
							schema = @Schema(type = "string", allowableValues = { "HIT", "MISS" }, example = "HIT"))),
			@ApiResponse(responseCode = "404", description = "Carro não encontrado",
					content = @Content(schema = @Schema(implementation = ErroResponse.class))) })
	@GetMapping("/{id}")
	public ResponseEntity<CarroResponse> buscarPorId(
			@Parameter(description = "Identificador do carro", example = "1", required = true)
			@PathVariable Long id) {
		ResultadoBuscaCarro resultado = service.buscarPorId(id);

		return ResponseEntity.ok()
				.header("X-Cache", resultado.hit() ? "HIT" : "MISS")
				.body(mapper.toResponse(resultado.carro()));
	}

	@Operation(summary = "Cadastra um carro clássico",
			description = "Cria um novo carro, retorna 201 e o header Location com a URI do recurso criado.")
	@ApiResponses({
			@ApiResponse(responseCode = "201", description = "Carro criado com sucesso",
					headers = @Header(name = "Location", description = "URI do carro criado",
							schema = @Schema(type = "string", example = "http://localhost:8080/carros/101"))),
			@ApiResponse(responseCode = "400", description = "Dados inválidos no corpo da requisição",
					content = @Content(schema = @Schema(implementation = ErroResponse.class))) })
	@PostMapping
	public ResponseEntity<CarroResponse> criar(
			@io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Dados do carro a ser cadastrado",
					required = true)
			@Valid @RequestBody CarroRequest request) {
		Carro criado = service.criar(mapper.toEntity(request));
		URI location = ServletUriComponentsBuilder.fromCurrentRequest()
				.path("/{id}")
				.buildAndExpand(criado.getId())
				.toUri();

		return ResponseEntity.created(location).body(mapper.toResponse(criado));
	}

	@Operation(summary = "Atualiza um carro clássico",
			description = "Substitui os dados do carro e invalida a entrada correspondente no cache. "
					+ "A próxima busca pelo ID será um MISS.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Carro atualizado com sucesso"),
			@ApiResponse(responseCode = "400", description = "Dados inválidos no corpo da requisição",
					content = @Content(schema = @Schema(implementation = ErroResponse.class))),
			@ApiResponse(responseCode = "404", description = "Carro não encontrado",
					content = @Content(schema = @Schema(implementation = ErroResponse.class))) })
	@PutMapping("/{id}")
	public CarroResponse atualizar(
			@Parameter(description = "Identificador do carro", example = "1", required = true)
			@PathVariable Long id,
			@io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Novos dados do carro",
					required = true)
			@Valid @RequestBody CarroRequest request) {
		Carro atualizado = service.atualizar(id, mapper.toEntity(request));
		return mapper.toResponse(atualizado);
	}

	@Operation(summary = "Exclui um carro clássico",
			description = "Remove o carro e invalida a entrada correspondente no cache.")
	@ApiResponses({
			@ApiResponse(responseCode = "204", description = "Carro excluído, sem conteúdo"),
			@ApiResponse(responseCode = "404", description = "Carro não encontrado",
					content = @Content(schema = @Schema(implementation = ErroResponse.class))) })
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> excluir(
			@Parameter(description = "Identificador do carro", example = "1", required = true)
			@PathVariable Long id) {
		service.excluir(id);
		return ResponseEntity.noContent().build();
	}

}
