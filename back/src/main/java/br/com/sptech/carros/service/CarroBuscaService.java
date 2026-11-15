package br.com.sptech.carros.service;

import br.com.sptech.carros.domain.Carro;
import br.com.sptech.carros.repository.CarroRepository;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Busca por termo em todo o acervo, independente da página exibida.
 *
 * <p>
 * A fonte de dados continua sendo o repositório JPA. O filtro acontece na
 * camada de serviço para manter a mesma semântica do filtro da grade:
 * comparação sem acentos, sem diferença de maiúsculas/minúsculas e em todos os
 * campos visíveis do carro.
 * </p>
 */
@Service
public class CarroBuscaService {

	private final CarroRepository repository;

	public CarroBuscaService(CarroRepository repository) {
		this.repository = repository;
	}

	@Transactional(readOnly = true)
	public Page<Carro> buscar(String termo, int pagina) {
		String alvo = normalizar(termo);

		List<Carro> encontrados = repository.findAll(Sort.by(Sort.Direction.ASC, "id"))
				.stream()
				.filter(carro -> combina(carro, alvo))
				.toList();

		PageRequest pageRequest = PageRequest.of(
				Math.max(pagina, 0),
				CarroService.TAMANHO_PAGINA,
				Sort.by(Sort.Direction.ASC, "id"));

		int inicio = (int) Math.min(pageRequest.getOffset(), encontrados.size());
		int fim = Math.min(inicio + CarroService.TAMANHO_PAGINA, encontrados.size());

		return new PageImpl<>(encontrados.subList(inicio, fim), pageRequest, encontrados.size());
	}

	private static boolean combina(Carro carro, String alvo) {
		if (alvo.isEmpty()) {
			return true;
		}

		return camposPesquisaveis(carro).stream()
				.map(CarroBuscaService::normalizar)
				.anyMatch(campo -> campo.contains(alvo));
	}

	private static List<String> camposPesquisaveis(Carro carro) {
		String idFormatado = String.format("%03d", carro.getId());

		return List.of(
				carro.getMarca(),
				carro.getModelo(),
				carro.getPaisOrigem(),
				carro.getMotor(),
				carro.getCor(),
				carro.getCurador(),
				String.valueOf(carro.getAnoFabricacao()),
				String.valueOf(carro.getId()),
				idFormatado,
				"nº " + idFormatado);
	}

	private static String normalizar(String texto) {
		if (texto == null) {
			return "";
		}

		return Normalizer.normalize(texto, Normalizer.Form.NFD)
				.replaceAll("\\p{M}+", "")
				.toLowerCase(Locale.ROOT)
				.trim();
	}

}
