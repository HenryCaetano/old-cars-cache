package br.com.sptech.carros.cache;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.sptech.carros.config.CacheProperties;
import br.com.sptech.carros.domain.Carro;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CarroCacheTest {

	private CarroCache cache;
	private AtomicInteger consultasNaFonte;
	private Function<Long, Carro> fonte;

	@BeforeEach
	void setUp() {
		CacheProperties properties = new CacheProperties();
		properties.setMaxItens(2);
		properties.setTtlSegundos(60);
		properties.setPolitica(PoliticaRemocao.LRU);

		cache = new CarroCache(properties);
		consultasNaFonte = new AtomicInteger();
		fonte = id -> {
			consultasNaFonte.incrementAndGet();
			Carro carro = new Carro();
			carro.setId(id);
			carro.setModelo("Modelo " + id);
			return carro;
		};
	}

	@Test
	void deveRetornarMissNaPrimeiraBuscaEHitNaSegunda() {
		ResultadoCache<Carro> primeira = cache.buscar(1L, fonte);
		ResultadoCache<Carro> segunda = cache.buscar(1L, fonte);

		assertThat(primeira.hit()).isFalse();
		assertThat(primeira.valor().getId()).isEqualTo(1L);
		assertThat(segunda.hit()).isTrue();
		assertThat(consultasNaFonte).hasValue(1);
		assertThat(cache.estatisticas().hits()).isEqualTo(1);
		assertThat(cache.estatisticas().misses()).isEqualTo(1);
		assertThat(cache.estatisticas().tamanhoAtual()).isEqualTo(1);
	}

	@Test
	void deveInvalidarEntradaAoAtualizarOuExcluir() {
		cache.buscar(2L, fonte);
		assertThat(cache.buscar(2L, fonte).hit()).isTrue();

		cache.invalidar(2L);

		assertThat(cache.buscar(2L, fonte).hit()).isFalse();
		assertThat(consultasNaFonte).hasValue(2);
	}

	@Test
	void deveLimparTodoOCache() {
		cache.buscar(1L, fonte);
		cache.buscar(2L, fonte);
		assertThat(cache.tamanho()).isEqualTo(2);

		cache.limpar();

		assertThat(cache.tamanho()).isZero();
	}

}
