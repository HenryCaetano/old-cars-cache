package br.com.sptech.carros.service;

import br.com.sptech.carros.domain.Carro;

/**
 * Entidade retornada pelo service acompanhada da origem da busca. A controller
 * usa o booleano apenas para preencher o header X-Cache; a conversão para DTO
 * continua acontecendo na camada web.
 */
public record ResultadoBuscaCarro(Carro carro, boolean hit) {
}
