package br.com.sptech.carros.service;

import br.com.sptech.carros.cache.CarroCache;
import br.com.sptech.carros.cache.ResultadoCache;
import br.com.sptech.carros.domain.Carro;
import br.com.sptech.carros.repository.CarroRepository;
import java.util.List;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CarroService {

	public static final int TAMANHO_PAGINA = 10;

	private final CarroRepository repository;
	private final CarroCache cache;
	private final long atrasoFonteMs;

	public CarroService(CarroRepository repository, CarroCache cache,
			@Value("${app.fonte.atraso-ms:2000}") long atrasoFonteMs) {
		this.repository = repository;
		this.cache = cache;
		this.atrasoFonteMs = atrasoFonteMs;
	}

	/**
	 * Busca primeiro no cache. Em caso de MISS (ou TTL expirado), consulta a
	 * fonte lenta e atualiza o cache.
	 */
	@Transactional(readOnly = true)
	public ResultadoBuscaCarro buscarPorId(Long id) {
		ResultadoCache<Carro> resultado = cache.buscar(id, this::buscarNaFonte);
		return new ResultadoBuscaCarro(resultado.valor(), resultado.hit());
	}

	private Carro buscarNaFonte(Long id) {
		simularLentidaoDaFonte();
		return repository.findById(id)
				.orElseThrow(() -> new CarroNaoEncontradoException(id));
	}

	@Transactional(readOnly = true)
	public Page<Carro> listar(int pagina) {
		PageRequest pageRequest = PageRequest.of(
				Math.max(pagina, 0),
				TAMANHO_PAGINA,
				Sort.by(Sort.Direction.ASC, "id"));
		return repository.findAll(pageRequest);
	}

	@Transactional
	public Carro criar(Carro carro) {
		carro.setId(null);
		carro.setAtualizadoEm(Instant.now());
		return repository.save(carro);
	}

	@Transactional
	public Carro atualizar(Long id, Carro dados) {
		Carro existente = repository.findById(id)
				.orElseThrow(() -> new CarroNaoEncontradoException(id));

		existente.atualizarDados(dados);
		Carro salvo = repository.save(existente);

		// Invalidação obrigatória: a próxima leitura deve vir da fonte.
		cache.invalidar(id);
		return salvo;
	}

	@Transactional
	public void excluir(Long id) {
		Carro existente = repository.findById(id)
				.orElseThrow(() -> new CarroNaoEncontradoException(id));

		repository.delete(existente);
		cache.invalidar(id);
	}

	private void simularLentidaoDaFonte() {
		if (atrasoFonteMs <= 0) {
			return;
		}
		try {
			Thread.sleep(atrasoFonteMs);
		}
		catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			throw new IllegalStateException("Consulta à fonte foi interrompida.", ex);
		}
	}

}
