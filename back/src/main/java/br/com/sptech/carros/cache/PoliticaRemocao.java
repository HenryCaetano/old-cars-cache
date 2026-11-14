package br.com.sptech.carros.cache;

/**
 * Política usada quando o cache está cheio e um novo item precisa entrar.
 */
public enum PoliticaRemocao {
	/**
	 * Remove o item acessado há mais tempo.
	 */
	LRU,
	/**
	 * Remove o item armazenado há mais tempo, independentemente de acessos.
	 */
	FIFO
}
