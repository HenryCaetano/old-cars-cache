package br.com.sptech.carros.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuração do Swagger/OpenAPI.
 *
 * <p>
 * A interface fica em {@code /swagger-ui.html} e o documento OpenAPI em
 * {@code /v3/api-docs} (JSON) ou {@code /v3/api-docs.yaml} (YAML).
 * </p>
 */
@Configuration
public class OpenApiConfig {

	public static final String TAG_CARROS = "Carros";

	public static final String TAG_CACHE = "Cache";

	@Bean
	OpenAPI carrosClassicosOpenAPI() {
		return new OpenAPI()
				.info(new Info()
						.title("API de Carros Clássicos")
						.version("1.0.0")
						.description("""
								API REST para consulta e manutenção de carros clássicos, com paginação fixa \
								de 10 itens e cache próprio em memória (ConcurrentHashMap, LRU/FIFO e TTL).

								- A listagem é paginada pelo parâmetro `pagina` (começando em 0).
								- A busca por ID usa o cache e informa `X-Cache: HIT` ou `X-Cache: MISS`.
								- `PUT` e `DELETE` invalidam a entrada correspondente no cache.
								- Os endpoints de cache permitem consultar estatísticas e limpar as entradas.""")
						.license(new License()
								.name("Uso acadêmico - SPTech")
								.url("https://www.sptech.school")))
				.servers(List.of(
						new Server()
								.url("/")
								.description("Servidor atual (mesma origem da aplicação)")))
				.tags(List.of(
						new Tag()
								.name(TAG_CARROS)
								.description("Consulta, cadastro, atualização e exclusão de carros clássicos."),
						new Tag()
								.name(TAG_CACHE)
								.description("Estatísticas e limpeza do cache em memória.")));
	}

}
