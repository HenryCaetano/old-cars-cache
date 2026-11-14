package br.com.sptech.carros.cache;

import br.com.sptech.carros.config.CacheProperties;
import br.com.sptech.carros.domain.Carro;
import java.time.Duration;
import java.util.Optional;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Fachada do cache de carros.
 *
 * <p>
 * A lógica genérica fica em {@link CacheSimples}. Esta classe conhece o domínio
 * Carro, faz o log de HIT/MISS com o tempo total da operação e coordena a busca
 * na fonte quando necessário.
 * </p>
 */
@Component
public class CarroCache {

	private static final Logger log = LoggerFactory.getLogger(CarroCache.class);

	private final CacheSimples<Long, Carro> cache;

	public CarroCache(CacheProperties properties) {
		this.cache = new CacheSimples<>(
				properties.getMaxItens(),
				Duration.ofSeconds(properties.getTtlSegundos()),
				properties.getPolitica());
		log.info("Cache de carros iniciado: limite={} itens, ttl={}s, politica={}",
				properties.getMaxItens(),
				properties.getTtlSegundos(),
				properties.getPolitica());
	}

	/**
	 * Busca no cache e, em caso de MISS, executa o carregador (fonte lenta). O
	 * tempo logado inclui a ida ao banco, por isso o MISS fica visivelmente mais
	 * lento que o HIT.
	 */
	public ResultadoCache<Carro> buscar(Long id, Function<Long, Carro> fonte) {
		long inicio = System.nanoTime();

		Optional<Carro> encontrado = cache.obter(id);
		if (encontrado.isPresent()) {
			log.info("Cache HIT  - id={} - {} ms", id, decorridoMs(inicio));
			return new ResultadoCache<>(encontrado.get(), true);
		}

		try {
			Carro carro = fonte.apply(id);
			if (carro != null) {
				cache.adicionar(id, carro);
			}
			return new ResultadoCache<>(carro, false);
		} finally {
			log.info("Cache MISS - id={} - {} ms", id, decorridoMs(inicio));
		}
	}

	public void invalidar(Long id) {
		cache.invalidar(id);
		log.info("Cache INVALIDADO - id={} - entrada removida", id);
	}

	public void limpar() {
		cache.limpar();
		log.info("Cache LIMPO - todas as entradas foram removidas");
	}

	public EstatisticasCache estatisticas() {
		return cache.estatisticas();
	}

	public int removerExpirados() {
		int removidos = cache.removerExpirados();
		if (removidos > 0) {
			log.info("Limpeza agendada removeu {} entrada(s) expirada(s)", removidos);
		}
		return removidos;
	}

	public int tamanho() {
		return cache.tamanho();
	}

	private long decorridoMs(long inicioNanos) {
		return (System.nanoTime() - inicioNanos) / 1_000_000;
	}

}
