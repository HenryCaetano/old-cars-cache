package br.com.sptech.carros.cache;

import java.time.Duration;
import java.time.Instant;

/**
 * Uma entrada do cache. Além do valor, guarda quando ele entrou no cache e
 * quando foi acessado pela última vez. O último acesso é usado pela política
 * LRU; o momento de armazenamento é usado pela política FIFO e pelo TTL.
 */
public class EntradaCache<V> {

	private final V valor;
	private final Instant armazenadoEm;
	private volatile Instant ultimoAcesso;

	public EntradaCache(V valor, Instant agora) {
		this.valor = valor;
		this.armazenadoEm = agora;
		this.ultimoAcesso = agora;
	}

	public V getValor() {
		return valor;
	}

	public Instant getArmazenadoEm() {
		return armazenadoEm;
	}

	public Instant getUltimoAcesso() {
		return ultimoAcesso;
	}

	public void registrarAcesso(Instant agora) {
		this.ultimoAcesso = agora;
	}

	public boolean estaExpirada(Instant agora, Duration ttl) {
		return !agora.isBefore(armazenadoEm.plus(ttl));
	}

}
