package br.com.sptech.carros.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CacheSimplesTest {

	private RelogioAjustavel relogio;
	private CacheSimples<Long, String> cache;

	@BeforeEach
	void setUp() {
		relogio = new RelogioAjustavel(Instant.parse("2026-01-01T00:00:00Z"));
		cache = new CacheSimples<>(3, Duration.ofSeconds(10), PoliticaRemocao.LRU, relogio);
	}

	@Test
	void deveComputarHitsEMisses() {
		cache.adicionar(1L, "um");

		assertThat(cache.obter(1L)).contains("um");
		assertThat(cache.obter(2L)).isEmpty();

		EstatisticasCache estatisticas = cache.estatisticas();
		assertThat(estatisticas.hits()).isEqualTo(1);
		assertThat(estatisticas.misses()).isEqualTo(1);
		assertThat(estatisticas.hitRatio()).isEqualTo(0.5);
		assertThat(estatisticas.limite()).isEqualTo(3);
		assertThat(estatisticas.politica()).isEqualTo("LRU");
	}

	@Test
	void deveRemoverOItemMenosUsadoRecentementeAoAtingirOLimite() {
		cache.adicionar(1L, "a");
		relogio.avancar(Duration.ofSeconds(1));
		cache.adicionar(2L, "b");
		relogio.avancar(Duration.ofSeconds(1));
		cache.adicionar(3L, "c");
		relogio.avancar(Duration.ofSeconds(1));

		// O item 1 passa a ser o mais recentemente usado.
		assertThat(cache.obter(1L)).contains("a");
		relogio.avancar(Duration.ofSeconds(1));

		// O cache está cheio: o item 2, usado há mais tempo, deve sair.
		cache.adicionar(4L, "d");

		assertThat(cache.tamanho()).isEqualTo(3);
		assertThat(cache.obter(2L)).isEmpty();
		assertThat(cache.obter(1L)).contains("a");
		assertThat(cache.obter(3L)).contains("c");
		assertThat(cache.obter(4L)).contains("d");
		assertThat(cache.estatisticas().evictions()).isEqualTo(1);
	}

	@Test
	void deveRemoverOPrimeiroArmazenadoQuandoAPoliticaForFifo() {
		CacheSimples<Long, String> fifo = new CacheSimples<>(
				3, Duration.ofSeconds(10), PoliticaRemocao.FIFO, relogio);

		fifo.adicionar(1L, "a");
		relogio.avancar(Duration.ofSeconds(1));
		fifo.adicionar(2L, "b");
		relogio.avancar(Duration.ofSeconds(1));
		fifo.adicionar(3L, "c");
		relogio.avancar(Duration.ofSeconds(1));

		// Em FIFO o acesso não muda a ordem de remoção.
		assertThat(fifo.obter(1L)).contains("a");
		relogio.avancar(Duration.ofSeconds(1));
		fifo.adicionar(4L, "d");

		assertThat(fifo.tamanho()).isEqualTo(3);
		assertThat(fifo.obter(1L)).isEmpty();
		assertThat(fifo.obter(2L)).contains("b");
		assertThat(fifo.estatisticas().evictions()).isEqualTo(1);
	}

	@Test
	void deveTratarItemExpiradoComoTtlComoMiss() {
		cache.adicionar(1L, "a");

		relogio.avancar(Duration.ofSeconds(9));
		assertThat(cache.obter(1L)).contains("a");

		relogio.avancar(Duration.ofSeconds(2));
		assertThat(cache.obter(1L)).isEmpty();

		EstatisticasCache estatisticas = cache.estatisticas();
		assertThat(estatisticas.tamanhoAtual()).isZero();
		assertThat(estatisticas.hits()).isEqualTo(1);
		assertThat(estatisticas.misses()).isEqualTo(1);
		assertThat(estatisticas.expiracoes()).isEqualTo(1);
	}

	@Test
	void deveRemoverExpiradosNaLimpezaProgramada() {
		cache.adicionar(1L, "a");
		relogio.avancar(Duration.ofSeconds(11));
		cache.adicionar(2L, "b");
		cache.adicionar(3L, "c");

		assertThat(cache.removerExpirados()).isEqualTo(1);
		assertThat(cache.tamanho()).isEqualTo(2);
		assertThat(cache.estatisticas().expiracoes()).isEqualTo(1);
	}

	@Test
	void deveInvalidarUmaChaveELimparTodoOCache() {
		cache.adicionar(1L, "a");
		cache.adicionar(2L, "b");

		cache.invalidar(1L);
		assertThat(cache.tamanho()).isEqualTo(1);
		assertThat(cache.obter(1L)).isEmpty();

		cache.limpar();
		assertThat(cache.tamanho()).isZero();
	}

	@Test
	void deveRespeitarOLimiteComAcessosConcorrentes() {
		CacheSimples<Integer, Integer> concorrente = new CacheSimples<>(
				5, Duration.ofMinutes(1), PoliticaRemocao.LRU);

		IntStream.range(0, 2_000).parallel().forEach(valor -> {
			concorrente.adicionar(valor, valor);
			concorrente.obter(valor % 50);
		});

		assertThat(concorrente.tamanho()).isLessThanOrEqualTo(5);
		assertThat(concorrente.estatisticas().limite()).isEqualTo(5);
	}

	@Test
	void deveRejeitarConfiguracaoInvalida() {
		assertThatThrownBy(() -> new CacheSimples<Long, String>(
				0, Duration.ofSeconds(1), PoliticaRemocao.LRU))
				.isInstanceOf(IllegalArgumentException.class);

		assertThatThrownBy(() -> new CacheSimples<Long, String>(
				5, Duration.ZERO, PoliticaRemocao.LRU))
				.isInstanceOf(IllegalArgumentException.class);
	}

	private static final class RelogioAjustavel extends Clock {

		private Instant agora;

		private RelogioAjustavel(Instant agora) {
			this.agora = agora;
		}

		@Override
		public ZoneId getZone() {
			return ZoneOffset.UTC;
		}

		@Override
		public Clock withZone(ZoneId zone) {
			return this;
		}

		@Override
		public Instant instant() {
			return agora;
		}

		private void avancar(Duration duracao) {
			this.agora = this.agora.plus(duracao);
		}

	}

}
