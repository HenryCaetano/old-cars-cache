package br.com.sptech.carros.repository;

import br.com.sptech.carros.domain.Carro;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarroRepository extends JpaRepository<Carro, Long> {
}
