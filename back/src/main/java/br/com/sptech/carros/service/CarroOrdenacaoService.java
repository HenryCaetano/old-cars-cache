package br.com.sptech.carros.service;

import br.com.sptech.carros.domain.Carro;
import br.com.sptech.carros.repository.CarroRepository;
import java.text.Collator;
import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ordenação do acervo inteiro, independente da página exibida.
 *
 * <p>
 * A listagem padrão continua sendo feita pelos endpoints existentes. Este
 * serviço existe para que a grade possa ordenar todos os carros antes de
 * paginar, mantendo o filtro por termo opcional.
 * </p>
 */
@Service
public class CarroOrdenacaoService {

	private final CarroRepository repository;

	public CarroOrdenacaoService(CarroRepository repository) {
		this.repository = repository;
	}

	@Transactional(readOnly = true)
	public Page<Carro> listarOrdenado(String termo, String ordem, int pagina) {
		String alvo = normalizar(termo);

		List<Carro> encontrados = repository.findAll()
				.stream()
				.filter(carro -> combina(carro, alvo))
				.sorted(comparador(ordem))
				.toList();

		PageRequest pageRequest = PageRequest.of(Math.max(pagina, 0), CarroService.TAMANHO_PAGINA);

		int inicio = (int) Math.min(pageRequest.getOffset(), encontrados.size());
		int fim = Math.min(inicio + CarroService.TAMANHO_PAGINA, encontrados.size());

		return new PageImpl<>(encontrados.subList(inicio, fim), pageRequest, encontrados.size());
	}

	private static Comparator<Carro> comparador(String ordem) {
		Comparator<Carro> porId = Comparator.comparing(Carro::getId);
		String chave = ordem == null ? "" : ordem.trim().toLowerCase(Locale.ROOT);

		return switch (chave) {
			case "entrada-desc" -> porId.reversed();
			case "ano-desc" -> Comparator.comparing(Carro::getAnoFabricacao).reversed().thenComparing(porId);
			case "ano-asc" -> Comparator.comparing(Carro::getAnoFabricacao).thenComparing(porId);
			case "potencia-desc" -> Comparator.comparing(Carro::getPotenciaCv).reversed().thenComparing(porId);
			case "marca-asc" -> {
				Collator collator = Collator.getInstance(Locale.forLanguageTag("pt-BR"));
				yield Comparator.comparing(Carro::getMarca, collator)
						.thenComparing(Carro::getModelo, collator)
						.thenComparing(porId);
			}
			default -> porId;
		};
	}

	private static boolean combina(Carro carro, String alvo) {
		if (alvo.isEmpty()) {
			return true;
		}

		return camposPesquisaveis(carro).stream()
				.map(CarroOrdenacaoService::normalizar)
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
