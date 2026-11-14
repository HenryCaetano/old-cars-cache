package br.com.sptech.carros.web.mapper;

import br.com.sptech.carros.cache.EstatisticasCache;
import br.com.sptech.carros.web.dto.EstatisticasResponse;
import org.springframework.stereotype.Component;

@Component
public class CacheMapper {

	public EstatisticasResponse toResponse(EstatisticasCache estatisticas) {
		return new EstatisticasResponse(
				estatisticas.tamanhoAtual(),
				estatisticas.limite(),
				estatisticas.hits(),
				estatisticas.misses(),
				estatisticas.evictions(),
				estatisticas.expiracoes(),
				estatisticas.hitRatio(),
				estatisticas.politica(),
				estatisticas.ttlSegundos());
	}

}
