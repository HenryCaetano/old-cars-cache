package br.com.sptech.carros.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Conteúdo sobre um carro clássico.
 */
@Entity
@Table(name = "carros")
public class Carro {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 80)
	private String modelo;

	@Column(nullable = false, length = 60)
	private String marca;

	@Column(nullable = false)
	private Integer anoFabricacao;

	@Column(nullable = false, length = 60)
	private String paisOrigem;

	@Column(nullable = false, length = 80)
	private String motor;

	@Column(nullable = false)
	private Integer potenciaCv;

	@Column(nullable = false, length = 40)
	private String cor;

	@Column(nullable = false, length = 2000)
	private String descricao;

	@Column(nullable = false, length = 80)
	private String curador;

	@Column(nullable = false)
	private Instant atualizadoEm;

	public Carro() {
	}

	public Carro(String modelo, String marca, Integer anoFabricacao, String paisOrigem,
			String motor, Integer potenciaCv, String cor, String descricao, String curador) {
		this.modelo = modelo;
		this.marca = marca;
		this.anoFabricacao = anoFabricacao;
		this.paisOrigem = paisOrigem;
		this.motor = motor;
		this.potenciaCv = potenciaCv;
		this.cor = cor;
		this.descricao = descricao;
		this.curador = curador;
		this.atualizadoEm = Instant.now();
	}

	public void atualizarDados(Carro dados) {
		this.modelo = dados.getModelo();
		this.marca = dados.getMarca();
		this.anoFabricacao = dados.getAnoFabricacao();
		this.paisOrigem = dados.getPaisOrigem();
		this.motor = dados.getMotor();
		this.potenciaCv = dados.getPotenciaCv();
		this.cor = dados.getCor();
		this.descricao = dados.getDescricao();
		this.curador = dados.getCurador();
		this.atualizadoEm = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getModelo() {
		return modelo;
	}

	public void setModelo(String modelo) {
		this.modelo = modelo;
	}

	public String getMarca() {
		return marca;
	}

	public void setMarca(String marca) {
		this.marca = marca;
	}

	public Integer getAnoFabricacao() {
		return anoFabricacao;
	}

	public void setAnoFabricacao(Integer anoFabricacao) {
		this.anoFabricacao = anoFabricacao;
	}

	public String getPaisOrigem() {
		return paisOrigem;
	}

	public void setPaisOrigem(String paisOrigem) {
		this.paisOrigem = paisOrigem;
	}

	public String getMotor() {
		return motor;
	}

	public void setMotor(String motor) {
		this.motor = motor;
	}

	public Integer getPotenciaCv() {
		return potenciaCv;
	}

	public void setPotenciaCv(Integer potenciaCv) {
		this.potenciaCv = potenciaCv;
	}

	public String getCor() {
		return cor;
	}

	public void setCor(String cor) {
		this.cor = cor;
	}

	public String getDescricao() {
		return descricao;
	}

	public void setDescricao(String descricao) {
		this.descricao = descricao;
	}

	public String getCurador() {
		return curador;
	}

	public void setCurador(String curador) {
		this.curador = curador;
	}

	public Instant getAtualizadoEm() {
		return atualizadoEm;
	}

	public void setAtualizadoEm(Instant atualizadoEm) {
		this.atualizadoEm = atualizadoEm;
	}

}
