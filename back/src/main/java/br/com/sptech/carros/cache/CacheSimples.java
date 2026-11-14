package br.com.sptech.carros.cache;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Cache genérico, em memória, baseado em {@link ConcurrentHashMap}.
 *
 * <p>
 * Não usa Spring Cache, Caffeine, Redis nem qualquer biblioteca de cache. A
 * implementação controla limite de itens, TTL, política de remoção e
 * estatísticas manualmente.
 * </p>
 *
 * @param <K> tipo da chave
 * @param <V> tipo do valor armazenado
 */
public class CacheSimples<K, V> {

	private final ConcurrentHashMap<K, EntradaCache<V>> itens = new ConcurrentHashMap<>();
	private final int limite;
	private final Duration ttl;
	private final PoliticaRemocao politica;
	private final Clock clock;

	private final AtomicLong hits = new AtomicLong();
	private final AtomicLong misses = new AtomicLong();
	private final AtomicLong evictions = new AtomicLong();
	private final AtomicLong expiracoes = new AtomicLong();

	public CacheSimples(int limite, Duration ttl, PoliticaRemocao politica) {
		this(limite, ttl, politica, Clock.systemUTC());
	}

	/**
	 * Construtor que permite injetar um relógio, facilitando os testes de TTL.
	 */
	public CacheSimples(int limite, Duration ttl, PoliticaRemocao politica, Clock clock) {
		if (limite < 1) {
			throw new IllegalArgumentException("O limite do cache deve ser maior que zero.");
		}
		if (ttl == null || ttl.isZero() || ttl.isNegative()) {
			throw new IllegalArgumentException("O TTL do cache deve ser maior que zero.");
		}
		this.limite = limite;
		this.ttl = ttl;
		this.politica = Objects.requireNonNull(politica, "política");
		this.clock = Objects.requireNonNull(clock, "clock");
	}

	/**
	 * Consulta um item. Entradas expiradas são removidas e contabilizadas como
	 * MISS.
	 */
	public Optional<V> obter(K chave) {
		EntradaCache<V> entrada = itens.get(chave);
		if (entrada == null) {
			misses.incrementAndGet();
			return Optional.empty();
		}

		Instant agora = Instant.now(clock);
		if (entrada.estaExpirada(agora, ttl)) {
			if (itens.remove(chave, entrada)) {
				expiracoes.incrementAndGet();
			}
			misses.incrementAndGet();
			return Optional.empty();
		}

		entrada.registrarAcesso(agora);
		hits.incrementAndGet();
		return Optional.of(entrada.getValor());
	}

	/**
	 * Insere ou substitui um item. Se o cache estiver cheio, uma vítima é
	 * escolhida conforme a política configurada antes da inserção.
	 */
	public synchronized void adicionar(K chave, V valor) {
		Objects.requireNonNull(chave, "chave");
		Objects.requireNonNull(valor, "valor");

		Instant agora = Instant.now(clock);
		if (itens.containsKey(chave)) {
			itens.put(chave, new EntradaCache<>(valor, agora));
			return;
		}

		if (itens.size() >= limite) {
			removerVitima();
		}
		itens.put(chave, new EntradaCache<>(valor, agora));
	}

	private void removerVitima() {
		Comparator<Map.Entry<K, EntradaCache<V>>> comparador = politica == PoliticaRemocao.FIFO
				? Comparator.comparing(entrada -> entrada.getValue().getArmazenadoEm())
				: Comparator.comparing(entrada -> entrada.getValue().getUltimoAcesso());

		itens.entrySet()
				.stream()
				.min(comparador.thenComparing(entrada -> entrada.getValue().getArmazenadoEm()))
				.ifPresent(entrada -> {
					if (itens.remove(entrada.getKey(), entrada.getValue())) {
						evictions.incrementAndGet();
					}
				});
	}

	public synchronized void invalidar(K chave) {
		itens.remove(chave);
	}

	/**
	 * Remove todas as entradas. As estatísticas acumuladas são mantidas para que
	 * o endpoint continue mostrando o histórico de uso do cache.
	 */
	public synchronized void limpar() {
		itens.clear();
	}

	/**
	 * Remove preventivamente as entradas expiradas. Usado pela rotina agendada.
	 *
	 * @return quantidade de entradas removidas
	 */
	public int removerExpirados() {
		Instant agora = Instant.now(clock);
		int removidos = 0;
		for (Map.Entry<K, EntradaCache<V>> entrada : itens.entrySet()) {
			if (entrada.getValue().estaExpirada(agora, ttl)
					&& itens.remove(entrada.getKey(), entrada.getValue())) {
				expiracoes.incrementAndGet();
				removidos++;
			}
		}
		return removidos;
	}

	public int tamanho() {
		return itens.size();
	}

	public EstatisticasCache estatisticas() {
		long totalHits = hits.get();
		long totalMisses = misses.get();
		long totalConsultas = totalHits + totalMisses;
		double hitRatio = totalConsultas == 0
				? 0.0
				: Math.round((totalHits * 10_000.0) / totalConsultas) / 10_000.0;

		return new EstatisticasCache(
				itens.size(),
				limite,
				totalHits,
				totalMisses,
				evictions.get(),
				expiracoes.get(),
				hitRatio,
				politica.name(),
				ttl.toSeconds());
	}

}
