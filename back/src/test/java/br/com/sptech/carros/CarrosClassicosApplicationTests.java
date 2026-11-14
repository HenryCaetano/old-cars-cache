package br.com.sptech.carros;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.sptech.carros.cache.CarroCache;
import br.com.sptech.carros.domain.Carro;
import br.com.sptech.carros.repository.CarroRepository;
import br.com.sptech.carros.service.CarroService;
import br.com.sptech.carros.service.ResultadoBuscaCarro;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;

@SpringBootTest(properties = {
		"app.fonte.atraso-ms=0",
		"app.cache.limpeza-intervalo-ms=60000"
})
class CarrosClassicosApplicationTests {

	@Autowired
	private CarroRepository repository;

	@Autowired
	private CarroService service;

	@Autowired
	private CarroCache cache;

	@Test
	void deveCarregarCemCarrosNoH2() {
		assertThat(repository.count()).isEqualTo(100);
	}

	@Test
	void devePaginarDeDezEmDez() {
		Page<Carro> primeiraPagina = service.listar(0);
		Page<Carro> ultimaPagina = service.listar(9);

		assertThat(primeiraPagina.getSize()).isEqualTo(10);
		assertThat(primeiraPagina.getNumberOfElements()).isEqualTo(10);
		assertThat(primeiraPagina.getTotalElements()).isEqualTo(100);
		assertThat(primeiraPagina.getTotalPages()).isEqualTo(10);
		assertThat(ultimaPagina.getNumber()).isEqualTo(9);
		assertThat(ultimaPagina.getNumberOfElements()).isEqualTo(10);
	}

	@Test
	void deveBuscarNaFonteNoPrimeiroAcessoEUsarCacheNoSegundo() {
		cache.limpar();

		ResultadoBuscaCarro primeira = service.buscarPorId(1L);
		ResultadoBuscaCarro segunda = service.buscarPorId(1L);

		assertThat(primeira.hit()).isFalse();
		assertThat(segunda.hit()).isTrue();
		assertThat(segunda.carro().getId()).isEqualTo(1L);
	}

	@Test
	void deveInvalidarCacheAoAtualizar() {
		cache.limpar();
		Carro original = service.buscarPorId(2L).carro();

		Carro dados = new Carro(
				original.getModelo(),
				original.getMarca(),
				original.getAnoFabricacao(),
				original.getPaisOrigem(),
				original.getMotor(),
				original.getPotenciaCv(),
				"Preto",
				original.getDescricao(),
				original.getCurador());

		service.atualizar(2L, dados);

		assertThat(service.buscarPorId(2L).hit()).isFalse();
	}

}
