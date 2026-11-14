package br.com.sptech.carros.web;

import br.com.sptech.carros.cache.CarroCache;
import br.com.sptech.carros.config.OpenApiConfig;
import br.com.sptech.carros.web.dto.EstatisticasResponse;
import br.com.sptech.carros.web.mapper.CacheMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = OpenApiConfig.TAG_CACHE, description = "Estatísticas e limpeza do cache em memória.")
@RestController
@RequestMapping("/cache")
public class CacheController {

	private final CarroCache cache;
	private final CacheMapper mapper;

	public CacheController(CarroCache cache, CacheMapper mapper) {
		this.cache = cache;
		this.mapper = mapper;
	}

	@Operation(summary = "Consulta as estatísticas do cache",
			description = """
					Retorna o tamanho atual, o limite configurado, hits, misses, evictions, \
					expirações por TTL, hit ratio, política de remoção e TTL em segundos. \
					As estatísticas acumuladas são preservadas quando o cache é limpo.""")
	@ApiResponse(responseCode = "200", description = "Estatísticas retornadas com sucesso")
	@GetMapping("/estatisticas")
	public EstatisticasResponse estatisticas() {
		return mapper.toResponse(cache.estatisticas());
	}

	@Operation(summary = "Limpa todas as entradas do cache",
			description = "Remove todas as entradas armazenadas. As estatísticas acumuladas são preservadas.")
	@ApiResponse(responseCode = "204", description = "Cache limpo, sem conteúdo")
	@DeleteMapping
	public ResponseEntity<Void> limpar() {
		cache.limpar();
		return ResponseEntity.noContent().build();
	}

}
