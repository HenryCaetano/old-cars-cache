package br.com.sptech.carros.config;

import br.com.sptech.carros.cache.PoliticaRemocao;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Propriedades do cache lidas de application.properties.
 *
 * <pre>
 * app.cache.max-itens=5
 * app.cache.ttl-segundos=60
 * app.cache.politica=LRU
 * app.cache.limpeza-intervalo-ms=30000
 * </pre>
 */
@Validated
@ConfigurationProperties(prefix = "app.cache")
public class CacheProperties {

	@Min(1)
	private int maxItens = 5;

	@Min(1)
	private long ttlSegundos = 60;

	private PoliticaRemocao politica = PoliticaRemocao.LRU;

	@Min(1000)
	private long limpezaIntervaloMs = 30_000;

	public int getMaxItens() {
		return maxItens;
	}

	public void setMaxItens(int maxItens) {
		this.maxItens = maxItens;
	}

	public long getTtlSegundos() {
		return ttlSegundos;
	}

	public void setTtlSegundos(long ttlSegundos) {
		this.ttlSegundos = ttlSegundos;
	}

	public PoliticaRemocao getPolitica() {
		return politica;
	}

	public void setPolitica(PoliticaRemocao politica) {
		this.politica = politica;
	}

	public long getLimpezaIntervaloMs() {
		return limpezaIntervaloMs;
	}

	public void setLimpezaIntervaloMs(long limpezaIntervaloMs) {
		this.limpezaIntervaloMs = limpezaIntervaloMs;
	}

}
