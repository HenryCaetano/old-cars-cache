package br.com.sptech.carros.service;

public class CarroNaoEncontradoException extends RuntimeException {

	public CarroNaoEncontradoException(Long id) {
		super("Carro com id " + id + " não encontrado.");
	}

}
