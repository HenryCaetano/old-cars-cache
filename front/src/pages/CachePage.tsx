import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, limparCache } from "../api";
import { useApp } from "../context/AppContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { PageError } from "../components/PageError";
import { IconeAtualizar, IconeExcluir, IconeSeta } from "../components/Icones";
import { formatarId, horaCurta, numero, percentual } from "../formato";
import { useTitulo } from "../useTitulo";

export function CachePage() {
  useTitulo("Quadro do cache");
  const {
    estatisticas,
    apiOnline,
    carregandoEstatisticas,
    atualizarEstatisticas,
    leituras,
    limparLeituras,
    notificar,
  } = useApp();
  const [limpando, setLimpando] = useState(false);
  const [dialogo, setDialogo] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  useEffect(() => {
    if (estatisticas) setAtualizadoEm(new Date());
  }, [estatisticas]);

  useEffect(() => {
    const intervalo = window.setInterval(() => void atualizarEstatisticas(true), 5_000);
    return () => window.clearInterval(intervalo);
  }, [atualizarEstatisticas]);

  const totalLeituras = estatisticas ? estatisticas.hits + estatisticas.misses : 0;
  const proporcaoHits = totalLeituras > 0 ? (estatisticas?.hits ?? 0) / totalLeituras : 0;
  const limite = estatisticas?.limite ?? 5;
  const ocupados = estatisticas?.tamanhoAtual ?? 0;
  const slots = Array.from({ length: Math.min(Math.max(limite, 1), 10) }, (_, indice) => indice < ocupados);

  const maxLeitura = useMemo(
    () => Math.max(2_000, ...leituras.slice(0, 20).map((leitura) => leitura.ms)),
    [leituras],
  );

  async function confirmarLimpeza() {
    setLimpando(true);
    try {
      await limparCache();
      await atualizarEstatisticas(true);
      notificar("Cache limpo. As estatísticas acumuladas foram preservadas.", "ok");
      setDialogo(false);
    } catch (falha) {
      const erro = falha instanceof ApiError ? falha : new ApiError(0, "Falha", "Não foi possível limpar o cache.");
      notificar(erro.message, "erro");
    } finally {
      setLimpando(false);
    }
  }

  return (
    <div className="pagina pagina--cache">
      <header className="cache-cabecalho">
        <div>
          <h1>Quadro do cache</h1>
          <p className="cache-cabecalho__resumo">
            {estatisticas ? (
              <>
                <strong>{estatisticas.politica}</strong> · TTL de {estatisticas.ttlSegundos}s · limite de{" "}
                {estatisticas.limite} entradas
              </>
            ) : (
              "Aguardando a primeira resposta da API…"
            )}
          </p>
        </div>
        <div className="cache-cabecalho__acoes">
          <button
            type="button"
            className="botao botao--linha"
            onClick={() => void atualizarEstatisticas()}
            disabled={carregandoEstatisticas}
          >
            <IconeAtualizar size={14} className={carregandoEstatisticas ? "girando" : ""} /> Atualizar
          </button>
          <button
            type="button"
            className="botao botao--perigo-contorno"
            onClick={() => setDialogo(true)}
            disabled={apiOnline === false}
          >
            <IconeExcluir size={14} /> Limpar cache
          </button>
        </div>
      </header>

      {apiOnline === false && !estatisticas ? (
        <PageError
          titulo="O quadro não carregou"
          mensagem="A API de estatísticas não respondeu em localhost:8080."
          detalhe="O cache vive no processo do back-end; sem ele não há ocupação para mostrar."
          aoTentar={() => void atualizarEstatisticas()}
        />
      ) : !estatisticas ? (
        <div className="cache-carregando" aria-busy="true">
          <span className="ficha-carregando__barra" aria-hidden="true" />
          <p>Consultando GET /cache/estatisticas…</p>
        </div>
      ) : (
        <>
          <div className="cache-primeira-linha">
            <section className="cache-ocupacao" aria-labelledby="titulo-ocupacao">
              <div className="cache-ocupacao__topo">
                <h2 id="titulo-ocupacao">Ocupação</h2>
                <span className="cache-ocupacao__endpoint">
                  <code>GET /cache/estatisticas</code>
                </span>
              </div>
              <p className="cache-ocupacao__numero">
                <strong>{ocupados}</strong>
                <span>/ {estatisticas.limite}</span>
                <em>posições ocupadas</em>
              </p>
              <div
                className="baias"
                role="img"
                aria-label={`${ocupados} de ${estatisticas.limite} posições do cache ocupadas`}
              >
                {slots.map((cheio, indice) => (
                  <span className={`baia ${cheio ? "is-cheia" : ""}`} key={indice}>
                    <span className="baia__indice">{String(indice + 1).padStart(2, "0")}</span>
                    <span className="baia__estado">{cheio ? "OCUPADA" : "LIVRE"}</span>
                  </span>
                ))}
              </div>
              <p className="cache-ocupacao__nota">
                A API informa quantas entradas estão em memória, não quais IDs. A próxima vitória de
                remoção segue a política <strong>{estatisticas.politica}</strong>.
              </p>
            </section>

            <section className="cache-resultado" aria-labelledby="titulo-resultado">
              <div className="cache-resultado__topo">
                <h2 id="titulo-resultado">Resultado das leituras</h2>
                <span className="cache-resultado__total">{numero(totalLeituras)} leituras acumuladas</span>
              </div>
              <p className="cache-resultado__taxa">{percentual(estatisticas.hitRatio)}</p>
              <p className="cache-resultado__rotulo">hit ratio</p>
              <div
                className="barra-hit"
                role="img"
                aria-label={`${percentual(proporcaoHits)} das leituras vieram do cache; ${percentual(1 - proporcaoHits)} foram MISS`}
              >
                <span className="barra-hit__hit" style={{ width: `${proporcaoHits * 100}%` }} />
                <span className="barra-hit__miss" style={{ width: `${(1 - proporcaoHits) * 100}%` }} />
              </div>
              <dl className="cache-resultado__contas">
                <div>
                  <dt>HIT</dt>
                  <dd>{numero(estatisticas.hits)}</dd>
                </div>
                <div>
                  <dt>MISS</dt>
                  <dd>{numero(estatisticas.misses)}</dd>
                </div>
              </dl>
              <p className="cache-resultado__nota">
                HIT responde da memória; MISS consulta a fonte lenta e grava o resultado.
              </p>
            </section>
          </div>

          <section className="cache-trace" aria-labelledby="titulo-trace">
            <div className="cache-trace__topo">
              <h2 id="titulo-trace">Leituras recentes</h2>
              <div className="cache-trace__acoes">
                <span className="cache-trace__legenda">
                  <span className="amostra amostra--hit" /> HIT
                  <span className="amostra amostra--miss" /> MISS
                </span>
                {leituras.length > 0 && (
                  <button type="button" className="botao-texto" onClick={limparLeituras}>
                    Limpar histórico desta sessão
                  </button>
                )}
              </div>
            </div>

            {leituras.length === 0 ? (
              <EmptyState
                titulo="Nenhuma leitura nesta sessão"
                acao={
                  <Link to="/" className="botao botao--linha">
                    Abrir uma ficha <IconeSeta size={13} />
                  </Link>
                }
              >
                <p>
                  Cada abertura de ficha, leitura repetida ou carregamento de edição aparece aqui com o
                  resultado do header <code>X-Cache</code> e o tempo medido no navegador.
                </p>
              </EmptyState>
            ) : (
              <div className="tabela-trace">
                <table>
                  <caption className="sr-only">Leituras de fichas registradas nesta sessão</caption>
                  <thead>
                    <tr>
                      <th scope="col">Hora</th>
                      <th scope="col">Entrada</th>
                      <th scope="col">Resultado</th>
                      <th scope="col" className="celula-num">
                        Tempo
                      </th>
                      <th scope="col">Split</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leituras.slice(0, 20).map((leitura) => (
                      <tr key={leitura.chave}>
                        <td className="trace-hora">{horaCurta(leitura.em)}</td>
                        <td>
                          <Link to={`/carros/${leitura.id}`} className="trace-entrada">
                            <span>Nº {formatarId(leitura.id)}</span>
                            <span>
                              {leitura.marca} {leitura.modelo}
                            </span>
                          </Link>
                        </td>
                        <td>
                          <span className={`stamp stamp--${leitura.hit ? "hit" : "miss"}`}>
                            {leitura.hit ? "HIT" : "MISS"}
                          </span>
                        </td>
                        <td className="celula-num trace-tempo">{leitura.ms.toLocaleString("pt-BR")} ms</td>
                        <td className="trace-split">
                          <span className="trace-trilho">
                            <span
                              className={`trace-barra ${leitura.hit ? "is-hit" : "is-miss"}`}
                              style={{ width: `${Math.max(2, (leitura.ms / maxLeitura) * 100)}%` }}
                            />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="cache-secundario">
            <section className="cache-contadores" aria-labelledby="titulo-contadores">
              <h2 id="titulo-contadores">Contadores do cache</h2>
              <dl>
                <div>
                  <dt>hits</dt>
                  <dd>{numero(estatisticas.hits)}</dd>
                </div>
                <div>
                  <dt>misses</dt>
                  <dd>{numero(estatisticas.misses)}</dd>
                </div>
                <div>
                  <dt>evictions</dt>
                  <dd>{numero(estatisticas.evictions)}</dd>
                </div>
                <div>
                  <dt>expirações</dt>
                  <dd>{numero(estatisticas.expiracoes)}</dd>
                </div>
                <div>
                  <dt>política</dt>
                  <dd>{estatisticas.politica}</dd>
                </div>
                <div>
                  <dt>TTL</dt>
                  <dd>{estatisticas.ttlSegundos}s</dd>
                </div>
              </dl>
            </section>

            <section className="cache-mecanica" aria-labelledby="titulo-mecanica">
              <h2 id="titulo-mecanica">Como o cache responde</h2>
              <ol>
                <li>
                  <span className="mecanica__chave">MISS</span>
                  <p>Consulta a fonte lenta (~2 s), devolve a ficha e grava a entrada.</p>
                </li>
                <li>
                  <span className="mecanica__chave">HIT</span>
                  <p>Responde direto da memória, sem tocar na fonte.</p>
                </li>
                <li>
                  <span className="mecanica__chave">TTL</span>
                  <p>
                    Entrada expira em {estatisticas.ttlSegundos}s; a limpeza agendada também remove vencidos.
                  </p>
                </li>
                <li>
                  <span className="mecanica__chave">LRU</span>
                  <p>
                    Ao atingir {estatisticas.limite} entradas, a menos usada recentemente sai. PUT e DELETE
                    invalidam a chave.
                  </p>
                </li>
              </ol>
            </section>
          </div>

          <div className="cache-rodape">
            <p>
              Estatísticas atualizadas às {atualizadoEm ? horaCurta(atualizadoEm.toISOString()) : "—"} · o
              painel consulta a API a cada 5 segundos
              {apiOnline === false ? " · API fora do ar, exibindo a última resposta" : ""}
            </p>
            <button type="button" className="botao-texto" onClick={() => void atualizarEstatisticas()}>
              consultar agora
            </button>
          </div>

          <ConfirmDialog
            aberto={dialogo}
            titulo={
              estatisticas.tamanhoAtual > 0
                ? `Limpar as ${estatisticas.tamanhoAtual} entradas do cache?`
                : "Limpar o cache vazio?"
            }
            descricao={
              estatisticas.tamanhoAtual > 0
                ? "Todas as entradas em memória serão removidas. As estatísticas acumuladas de hits, misses, evictions e expirações são preservadas. A próxima leitura de cada ID será MISS e voltará a consultar a fonte lenta."
                : "O cache já está vazio, mas a chamada DELETE /cache ainda será enviada para testar o endpoint. As estatísticas acumuladas são preservadas."
            }
            rotuloConfirmar="Limpar cache"
            perigo
            processando={limpando}
            onConfirmar={() => void confirmarLimpeza()}
            onFechar={() => {
              if (!limpando) setDialogo(false);
            }}
          />
        </>
      )}
    </div>
  );
}
