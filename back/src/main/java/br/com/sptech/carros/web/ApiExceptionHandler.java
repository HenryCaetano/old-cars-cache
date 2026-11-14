package br.com.sptech.carros.web;

import br.com.sptech.carros.service.CarroNaoEncontradoException;
import br.com.sptech.carros.web.dto.ErroResponse;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(CarroNaoEncontradoException.class)
	public ResponseEntity<ErroResponse> tratarNaoEncontrado(CarroNaoEncontradoException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(new ErroResponse(
						Instant.now(),
						HttpStatus.NOT_FOUND.value(),
						"Não encontrado",
						ex.getMessage(),
						Map.of()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErroResponse> tratarValidacao(MethodArgumentNotValidException ex) {
		Map<String, String> campos = new LinkedHashMap<>();
		ex.getFieldErrors().forEach(erro -> campos.put(erro.getField(), erro.getDefaultMessage()));

		return ResponseEntity.badRequest()
				.body(new ErroResponse(
						Instant.now(),
						HttpStatus.BAD_REQUEST.value(),
						"Requisição inválida",
						"Um ou mais campos estão inválidos.",
						campos));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ErroResponse> tratarJsonInvalido(HttpMessageNotReadableException ex) {
		return ResponseEntity.badRequest()
				.body(new ErroResponse(
						Instant.now(),
						HttpStatus.BAD_REQUEST.value(),
						"Requisição inválida",
						"O corpo da requisição não pôde ser lido. Verifique o JSON enviado.",
						Map.of()));
	}

}
