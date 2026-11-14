package br.com.sptech.carros.cache;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Rotina opcional: remove entradas expiradas mesmo que ninguém as consulte.
 */
@Component
public class LimpezaCacheAgendada {

	private final CarroCache cache;

	public LimpezaCacheAgendada(CarroCache cache) {
		this.cache = cache;
	}

	@Scheduled(
			initialDelayString = "${app.cache.limpeza-intervalo-ms:30000}",
			fixedDelayString = "${app.cache.limpeza-intervalo-ms:30000}")
	public void removerExpirados() {
		cache.removerExpirados();
	}

}
