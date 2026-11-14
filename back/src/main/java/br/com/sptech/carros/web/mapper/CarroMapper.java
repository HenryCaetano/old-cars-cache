package br.com.sptech.carros.web.mapper;

import br.com.sptech.carros.domain.Carro;
import br.com.sptech.carros.web.dto.CarroRequest;
import br.com.sptech.carros.web.dto.CarroResponse;
import br.com.sptech.carros.web.dto.PaginaResponse;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

/**
 * Conversões entre entidade e DTOs. Fica na camada web, conforme o padrão da
 * disciplina: o service só conhece entidades.
 */
@Component
public class CarroMapper {

	public Carro toEntity(CarroRequest request) {
		return new Carro(
				request.modelo(),
				request.marca(),
				request.anoFabricacao(),
				request.paisOrigem(),
				request.motor(),
				request.potenciaCv(),
				request.cor(),
				request.descricao(),
				request.curador());
	}

	public CarroResponse toResponse(Carro carro) {
		return new CarroResponse(
				carro.getId(),
				carro.getModelo(),
				carro.getMarca(),
				carro.getAnoFabricacao(),
				carro.getPaisOrigem(),
				carro.getMotor(),
				carro.getPotenciaCv(),
				carro.getCor(),
				carro.getDescricao(),
				carro.getCurador(),
				carro.getAtualizadoEm());
	}

	public PaginaResponse<CarroResponse> toPagina(Page<Carro> pagina) {
		return new PaginaResponse<>(
				pagina.getContent().stream().map(this::toResponse).toList(),
				pagina.getNumber(),
				pagina.getSize(),
				pagina.getTotalElements(),
				pagina.getTotalPages());
	}

}
