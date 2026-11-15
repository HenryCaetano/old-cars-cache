package br.com.sptech.carros;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.sptech.carros.domain.Carro;
import br.com.sptech.carros.service.CarroOrdenacaoService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;

@SpringBootTest(properties = {
		"app.fonte.atraso-ms=0",
		"app.cache.limpeza-intervalo-ms=60000"
})
class CarroOrdenacaoServiceTests {

	@Autowired
	private CarroOrdenacaoService service;

	@Test
	void deveOrdenarTodoOAcervoAntesDePaginar() {
		Page<Carro> primeira = service.listarOrdenado("", "potencia-desc", 0);
		List<Carro> todos = new ArrayList<>(primeira.getContent());

		for (int pagina = 1; pagina < primeira.getTotalPages(); pagina++) {
			todos.addAll(service.listarOrdenado("", "potencia-desc", pagina).getContent());
		}

		assertThat(todos).hasSize((int) primeira.getTotalElements());
		assertThat(todos).isSortedAccordingTo(
				Comparator.comparing(Carro::getPotenciaCv).reversed().thenComparing(Carro::getId));
	}

	@Test
	void deveAplicarFiltroAntesDeOrdenar() {
		Page<Carro> pagina = service.listarOrdenado("lamborghini", "ano-desc", 0);

		assertThat(pagina.getTotalElements()).isLessThan(100);
		assertThat(pagina.getContent()).isNotEmpty();
		assertThat(pagina.getContent()).isSortedAccordingTo(
				Comparator.comparing(Carro::getAnoFabricacao).reversed().thenComparing(Carro::getId));
	}

}
