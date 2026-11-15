import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, buscarCarros, listarCarros, ordenarCarros } from "../api";
import type { Carro, Ordem, Pagina } from "../types";
import { CarPhoto } from "../components/CarPhoto";
import { Roundel } from "../components/Roundel";
import { Pagination } from "../components/Pagination";
import { PageError } from "../components/PageError";
import { EmptyState } from "../components/EmptyState";
import { IconeBusca, IconeFechar, IconeMais, IconeSeta, IconeSetaBaixo } from "../components/Icones";
import { formatarId, numero } from "../formato";
import { useTitulo } from "../useTitulo";

function LinhaTabela({ carro }: { carro: Carro }) {
  const navigate = useNavigate();
  const destino = `/carros/${carro.id}`;

  return (
    <tr className="entrada" onClick={() => navigate(destino)}>
      <td>
        <span className="entrada__num">{formatarId(carro.id)}</span>
      </td>
      <td className="entrada__foto-celula">
        <CarPhoto carro={carro} variacao="thumb" />
      </td>
      <td>
        <span className="origem">
          <Roundel pais={carro.paisOrigem} />
          <span>{carro.paisOrigem}</span>
        </span>
      </td>
      <td>
        <Link
          to={destino}
          className="entrada__ficha"
          onClick={(evento) => evento.stopPropagation()}
        >
          <span className="entrada__marca">{carro.marca}</span>
          <span className="entrada__modelo">{carro.modelo}</span>
        </Link>
      </td>
      <td className="celula-num">{carro.anoFabricacao}</td>
      <td className="entrada__motor">{carro.motor}</td>
      <td className="celula-num entrada__potencia">
        <strong>{carro.potenciaCv}</strong>
        <span> cv</span>
      </td>
      <td className="entrada__seta" aria-hidden="true">
        <IconeSeta size={15} />
      </td>
    </tr>
  );
}

function EntradaMovel({ carro }: { carro: Carro }) {
  return (
    <Link to={`/carros/${carro.id}`} className="entrada-movel">
      <span className="entrada-movel__num">{formatarId(carro.id)}</span>
      <CarPhoto carro={carro} variacao="thumb" className="entrada-movel__foto" />
      <span className="entrada-movel__corpo">
        <span className="entrada-movel__marca">{carro.marca}</span>
        <span className="entrada-movel__modelo">{carro.modelo}</span>
        <span className="entrada-movel__meta">
          <Roundel pais={carro.paisOrigem} tamanho={14} />
          {carro.anoFabricacao} · {carro.motor} · {carro.potenciaCv} cv
        </span>
      </span>
      <span className="entrada-movel__seta" aria-hidden="true">
        <IconeSeta size={14} />
      </span>
    </Link>
  );
}

export function GradePage() {
  useTitulo("Grade de entrada");
  const [parametros, definirParametros] = useSearchParams();
  const pagina = Math.max(0, Number(parametros.get("pagina") ?? 0) || 0);
  const [estado, setEstado] = useState<{ carregando: boolean; dados: Pagina | null; erro: ApiError | null }>({
    carregando: true,
    dados: null,
    erro: null,
  });
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("entrada-asc");
  const [tentativa, setTentativa] = useState(0);
  const [pularPagina, setPularPagina] = useState(0);
  const termoBusca = busca.trim();

  useEffect(() => {
    let ativo = true;
    const espera = termoBusca ? 250 : 0;
    setEstado((atual) => ({ ...atual, carregando: true, erro: null }));

    const temporizador = window.setTimeout(() => {
      const requisicao =
        ordem !== "entrada-asc"
          ? ordenarCarros(termoBusca, ordem, pagina)
          : termoBusca
            ? buscarCarros(termoBusca, pagina)
            : listarCarros(pagina);
      requisicao
        .then((dados) => {
          if (ativo) setEstado({ carregando: false, dados, erro: null });
        })
        .catch((erro: unknown) => {
          if (ativo) {
            setEstado({
              carregando: false,
              dados: null,
              erro:
                erro instanceof ApiError
                  ? erro
                  : new ApiError(0, "Falha", "Não foi possível carregar a grade."),
            });
          }
        });
    }, espera);

    return () => {
      ativo = false;
      window.clearTimeout(temporizador);
    };
  }, [pagina, termoBusca, ordem, tentativa]);

  useEffect(() => {
    const dados = estado.dados;
    if (dados && dados.totalPaginas > 0 && pagina > dados.totalPaginas - 1) {
      const proximos = new URLSearchParams(parametros);
      proximos.set("pagina", String(dados.totalPaginas - 1));
      definirParametros(proximos, { replace: true });
    }
  }, [estado.dados, pagina, parametros, definirParametros]);

  const visiveis = estado.dados?.conteudo ?? [];
  const filtroAtivo = termoBusca.length > 0;

  function alterarBusca(valor: string) {
    setBusca(valor);
    if (pagina !== 0) {
      const proximos = new URLSearchParams(parametros);
      proximos.delete("pagina");
      definirParametros(proximos, { replace: true });
    }
  }

  function alterarOrdem(valor: Ordem) {
    setOrdem(valor);
    if (pagina !== 0) {
      const proximos = new URLSearchParams(parametros);
      proximos.delete("pagina");
      definirParametros(proximos, { replace: true });
    }
  }

  function irParaPagina(destino: number) {
    const proximos = new URLSearchParams(parametros);
    if (destino <= 0) proximos.delete("pagina");
    else proximos.set("pagina", String(destino));
    definirParametros(proximos);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function pularParaPagina() {
    const paginaDestino = Math.max(0, Math.min(pularPagina - 1, totalPaginas - 1));
    irParaPagina(paginaDestino);
    setPularPagina(0);
  }

  const dados = estado.dados;
  const totalPaginas = dados?.totalPaginas ?? 0;
  const paginaAtual = dados?.pagina ?? pagina;
  const rotuloTotal = filtroAtivo
    ? (dados?.totalElementos ?? 0) === 1
      ? "resultado"
      : "resultados"
    : (dados?.totalElementos ?? 0) === 1
      ? "exemplar"
      : "exemplares";

  return (
    <div className="pagina pagina--grade">
      <header className="grade-cabecalho">
        <div className="grade-cabecalho__titulo">
          <h1>Grade de entrada</h1>
          <p className="grade-cabecalho__resumo">
            {dados ? (
              <>
                <strong>
                  {numero(dados.totalElementos)} {rotuloTotal}
                </strong>{" "}
                · página {paginaAtual + 1} de {totalPaginas} · 10 por página
              </>
            ) : (
              "Carregando a coleção…"
            )}
          </p>
          </div>
        <p className="grade-cabecalho__endpoint">
          <span>fonte</span>
          <code>
            {ordem !== "entrada-asc"
              ? `GET /carros/ordenados?ordem=${ordem}&pagina=${pagina}`
              : filtroAtivo
                ? `GET /carros/busca?pagina=${pagina}`
                : `GET /carros?pagina=${pagina}`}
          </code>
        </p>
      </header>

      <div className="filtros" role="search">
        <label className="campo-busca">
          <span className="sr-only">Filtrar os exemplares de todas as páginas</span>
          <IconeBusca size={16} className="campo-busca__icone" />
          <input
            type="search"
            value={busca}
            onChange={(evento) => alterarBusca(evento.target.value)}
            placeholder="Filtrar por: marca, modelo, país…"
            autoComplete="off"
          />
          {busca && (
            <button
              type="button"
              className="campo-busca__limpar"
              onClick={() => alterarBusca("")}
              aria-label="Limpar filtro"
            >
              <IconeFechar size={13} />
            </button>
          )}
        </label>

        <label className="campo-ordem">
          <span className="campo-ordem__rotulo">Ordenar</span>
          <span className="campo-ordem__select">
            <select value={ordem} onChange={(evento) => alterarOrdem(evento.target.value as Ordem)}>
              <option value="entrada-asc">Entrada ↑</option>
              <option value="entrada-desc">Entrada ↓</option>
              <option value="ano-desc">Ano ↓</option>
              <option value="ano-asc">Ano ↑</option>
              <option value="potencia-desc">Potência ↓</option>
              <option value="marca-asc">Marca A–Z</option>
            </select>
            <IconeSetaBaixo size={14} className="campo-ordem__seta" />
          </span>
        </label>

        <span className="filtros__contagem" aria-live="polite">
          {filtroAtivo ? `${numero(dados?.totalElementos ?? 0)} no acervo` : ""}
        </span>

        <Link to="/carros/novo" className="botao botao--primario filtros__novo">
          <IconeMais size={15} /> Nova entrada
        </Link>
      </div>

      {estado.erro ? (
        <PageError
          titulo="A grade não carregou"
          mensagem={estado.erro.message}
          detalhe={estado.erro.titulo}
          aoTentar={() => setTentativa((valor) => valor + 1)}
        />
      ) : estado.carregando && !dados ? (
        <div className="grade-carregando" aria-busy="true" aria-label="Carregando a grade de entrada">
          {Array.from({ length: 10 }, (_, indice) => (
            <div className="esqueleto-linha" key={indice}>
              <span className="esqueleto esqueleto--num" />
              <span className="esqueleto esqueleto--foto" />
              <span className="esqueleto esqueleto--pais" />
              <span className="esqueleto esqueleto--modelo" />
              <span className="esqueleto esqueleto--ano" />
              <span className="esqueleto esqueleto--motor" />
              <span className="esqueleto esqueleto--cv" />
            </div>
          ))}
        </div>
      ) : visiveis.length === 0 ? (
        <EmptyState
          titulo={filtroAtivo ? "Nenhum exemplar bate com o filtro" : "Esta página está vazia"}
          acao={
            filtroAtivo ? (
              <button type="button" className="botao botao--linha" onClick={() => alterarBusca("")}>
                Limpar filtro
              </button>
            ) : (
              <button
                type="button"
                className="botao botao--linha"
                onClick={() => irParaPagina(Math.max(0, paginaAtual - 1))}
                disabled={paginaAtual <= 0}
              >
                Ir para a página anterior
              </button>
            )
          }
        >
          {filtroAtivo ? (
            <p>
              O filtro percorre todas as páginas do acervo. Tente outro termo ou limpe o filtro para ver
              a coleção completa.
            </p>
          ) : (
            <p>Todos os exemplares desta página foram excluídos. A coleção continua nas outras páginas.</p>
          )}
        </EmptyState>
      ) : (
        <>
          <div className={`grade-tabela ${estado.carregando ? "is-atualizando" : ""}`}>
            <table className="board">
              <caption className="sr-only">
                Grade de entrada da coleção, página {paginaAtual + 1} de {totalPaginas}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nº</th>
                  <th scope="col">Foto</th>
                  <th scope="col">Origem</th>
                  <th scope="col">Exemplar</th>
                  <th scope="col" className="celula-num">
                    Ano
                  </th>
                  <th scope="col">Motor</th>
                  <th scope="col" className="celula-num">
                    Potência
                  </th>
                  <th scope="col">
                    <span className="sr-only">Abrir ficha</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((carro) => (
                  <LinhaTabela key={carro.id} carro={carro} />
                ))}
              </tbody>
            </table>

            <div className="grade-movel">
              {visiveis.map((carro) => (
                <EntradaMovel key={carro.id} carro={carro} />
              ))}
            </div>
          </div>

          <Pagination
            pagina={paginaAtual}
            totalPaginas={totalPaginas}
            totalElementos={dados?.totalElementos ?? 0}
            aoIr={irParaPagina}
            desabilitado={estado.carregando}
          />
          <div className="pular__controles">
            <label className="campo-busca pular__label">
              <span className="sr-only">Pular para página</span>
              <input
                type="number"
                value={pularPagina}
                onChange={(e) => setPularPagina(Number(e.target.value) || 0)}
                min="1"
                max={totalPaginas || 1}
                aria-label="Número da página"
                className="campo-busca__input"
              />
              <button
                type="button"
                className="botao botao--linha pular__btn"
                onClick={pularParaPagina}
                disabled={totalPaginas === 0 || pularPagina < 1 || pularPagina > totalPaginas}
                aria-label="Ir para página"
              >
                Ir para página
              </button>
            </label>
          </div>
        </>
      )}
    </div>
  );
}
