import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError, excluirCarro, lerCarro } from "../api";
import type { Carro, ResultadoLeitura } from "../types";
import { useApp } from "../context/AppContext";
import { CarPhoto, useFotoCarro } from "../components/CarPhoto";
import { Roundel } from "../components/Roundel";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageError } from "../components/PageError";
import {
  IconeAtualizar,
  IconeEditar,
  IconeExcluir,
  IconeExterno,
  IconeVoltar,
} from "../components/Icones";
import { consultaImagem, dataLonga, formatarId } from "../formato";
import { useTitulo } from "../useTitulo";

function LeituraPainel({
  resultado,
  lendo,
  erro,
}: {
  resultado: ResultadoLeitura;
  lendo: boolean;
  erro: string | null;
}) {
  const { hit, ms, carro } = resultado;

  return (
    <section className={`leitura ${hit ? "leitura--hit" : "leitura--miss"}`} aria-live="polite">
      <div className="leitura__topo">
        <span className="leitura__rotulo">Leitura {lendo ? "em curso" : "registrada"}</span>
        <span className={`stamp stamp--${hit ? "hit" : "miss"}`} key={`${resultado.ms}-${hit}`}>
          {hit ? "HIT" : "MISS"}
        </span>
        <span className="leitura__ms" key={resultado.ms}>
          {ms.toLocaleString("pt-BR")} ms
        </span>
        <span className="leitura__header">
          <code>X-Cache</code> {hit ? "HIT" : "MISS"}
        </span>
      </div>
      <div className="leitura__trilho" aria-hidden="true">
        <span
          className={`leitura__barra ${hit ? "is-hit" : "is-miss"}`}
          key={`${carro.id}-${resultado.ms}-${hit}`}
        />
        <span className="leitura__marca">{hit ? "memória" : "fonte lenta"}</span>
      </div>
      {erro ? (
        <p className="leitura__nota leitura__nota--erro">{erro}</p>
      ) : (
        <p className="leitura__nota">
          {hit
            ? "Resposta veio do cache em memória: a fonte não foi consultada."
            : "MISS: a API aguardou a fonte lenta (~2 s), devolveu a ficha e gravou a entrada. Leia de novo para ver o HIT."}
        </p>
      )}
    </section>
  );
}

function FichaConteudo({ carro, resultado, lendo, erroLeitura }: {
  carro: Carro;
  resultado: ResultadoLeitura;
  lendo: boolean;
  erroLeitura: string | null;
}) {
  const { estado: foto } = useFotoCarro(carro);
  const dadosFoto = foto.status === "pronta" ? foto.foto : null;
  const buscaGoogle =
    dadosFoto?.googleUrl ??
    `https://www.google.com/search?q=${encodeURIComponent(consultaImagem(carro.marca, carro.modelo, carro.anoFabricacao))}&tbm=isch`;

  return (
    <>
      <section className="ficha-topo">
        <header className="ficha-cabecalho">
          <div className="ficha-cabecalho__titulo">
            <h1>
              {carro.marca} <span>{carro.modelo}</span>
            </h1>
            <p className="ficha-cabecalho__linha">
              <span className="ficha-numero">Nº {formatarId(carro.id)}</span>
              <Roundel pais={carro.paisOrigem} tamanho={18} />
              <span>{carro.paisOrigem}</span>
              <span className="ficha-cabecalho__sep" aria-hidden="true">
                /
              </span>
              <span>{carro.anoFabricacao}</span>
              <span className="ficha-cabecalho__sep" aria-hidden="true">
                /
              </span>
              <span>{carro.cor}</span>
            </p>
          </div>
          <div className="ficha-acoes">
            <Link to={`/carros/${carro.id}/editar`} className="botao botao--linha">
              <IconeEditar size={14} /> Editar
            </Link>
          </div>
        </header>
      </section>

      <div className="ficha-grade">
        <div className="ficha-foto">
          <div className="ficha-foto__moldura">
            <CarPhoto carro={carro} variacao="full" prioridade />
            <span className="ficha-foto__etiqueta">Nº {formatarId(carro.id)}</span>
            <span className="ficha-foto__origem">
              <Roundel pais={carro.paisOrigem} tamanho={16} />
              {carro.paisOrigem}
            </span>
          </div>
          <div className="ficha-foto__legenda">
            <span>
              {dadosFoto?.fonte ? `1º resultado · ${dadosFoto.fonte}` : foto.status === "carregando" ? "Buscando fotografia…" : "Fotografia indisponível"}
            </span>
            <a href={buscaGoogle} target="_blank" rel="noreferrer">
              Abrir no Google Imagens <IconeExterno size={12} />
            </a>
          </div>
          {dadosFoto?.aviso && <p className="ficha-foto__aviso">{dadosFoto.aviso}</p>}
          {dadosFoto?.imagem && (
            <p className="ficha-foto__credito">
              busca por <em>{dadosFoto.termo}</em>
            </p>
          )}
        </div>

        <div className="ficha-lado">
          <LeituraPainel resultado={resultado} lendo={lendo} erro={erroLeitura} />

          <dl className="ficha-dados">
            <div className="dado">
              <dt>Marca</dt>
              <dd>{carro.marca}</dd>
            </div>
            <div className="dado">
              <dt>Modelo</dt>
              <dd>{carro.modelo}</dd>
            </div>
            <div className="dado">
              <dt>Ano de fabricação</dt>
              <dd>{carro.anoFabricacao}</dd>
            </div>
            <div className="dado">
              <dt>País de origem</dt>
              <dd className="dado--pais">
                <Roundel pais={carro.paisOrigem} tamanho={15} /> {carro.paisOrigem}
              </dd>
            </div>
            <div className="dado">
              <dt>Motor</dt>
              <dd>{carro.motor}</dd>
            </div>
            <div className="dado">
              <dt>Potência</dt>
              <dd>
                {carro.potenciaCv} <span>cv</span>
              </dd>
            </div>
            <div className="dado">
              <dt>Cor</dt>
              <dd>{carro.cor}</dd>
            </div>
            <div className="dado">
              <dt>Curador</dt>
              <dd>{carro.curador}</dd>
            </div>
            <div className="dado">
              <dt>Atualizado em</dt>
              <dd>{dataLonga(carro.atualizadoEm)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="ficha-descricao">
        <h2>Sobre o exemplar</h2>
        <p>{carro.descricao}</p>
      </section>
    </>
  );
}

export function CarPage() {
  const { id = "" } = useParams();
  const navegar = useNavigate();
  const local = useLocation();
  const { notificar, registrarLeitura, atualizarEstatisticas } = useApp();
  const voltarPara = (local.state as { voltarPara?: string } | null)?.voltarPara ?? "/";
  const [resultado, setResultado] = useState<ResultadoLeitura | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState<ApiError | null>(null);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const chaveCarregada = useRef<string | null>(null);
  const montado = useRef(true);

  useTitulo(resultado ? `${resultado.carro.marca} ${resultado.carro.modelo}` : `Entrada ${formatarId(id)}`);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const carregar = useCallback(
    async (primeira: boolean) => {
      setErroLeitura(null);
      if (!primeira) setLendo(true);
      try {
        const dados = await lerCarro(id);
        if (!montado.current) return;
        setResultado(dados);
        setErro(null);
        registrarLeitura({
          id: dados.carro.id,
          modelo: dados.carro.modelo,
          marca: dados.carro.marca,
          hit: dados.hit,
          ms: dados.ms,
        });
        void atualizarEstatisticas(true);
      } catch (falha) {
        if (!montado.current) return;
        const apiErro =
          falha instanceof ApiError ? falha : new ApiError(0, "Falha", "Não foi possível ler a entrada.");
        if (primeira) setErro(apiErro);
        else {
          setErroLeitura(apiErro.message);
          notificar(apiErro.message, "erro");
        }
      } finally {
        if (montado.current) {
          setCarregando(false);
          setLendo(false);
        }
      }
    },
    [id, notificar, registrarLeitura, atualizarEstatisticas],
  );

  useEffect(() => {
    if (chaveCarregada.current === id) return;
    chaveCarregada.current = id;
    setCarregando(true);
    setResultado(null);
    setErro(null);
    void carregar(true);
  }, [id, carregar]);

  async function confirmarExclusao() {
    if (!resultado) return;
    setExcluindo(true);
    try {
      await excluirCarro(resultado.carro.id);
      notificar(
        `Entrada Nº ${formatarId(resultado.carro.id)} excluída. A chave foi invalidada no cache; a próxima leitura será MISS.`,
        "ok",
      );
      void atualizarEstatisticas(true);
      navegar(voltarPara);
    } catch (falha) {
      const apiErro = falha instanceof ApiError ? falha : new ApiError(0, "Falha", "Não foi possível excluir.");
      notificar(apiErro.message, "erro");
      setExcluindo(false);
    }
  }

  return (
    <div className="pagina pagina--ficha">
      <div className="ficha-volta">
        <Link to={voltarPara} className="voltar">
          <IconeVoltar size={14} /> Voltar à grade
        </Link>
        {resultado && (
          <button
            type="button"
            className="botao botao--leitura"
            onClick={() => void carregar(false)}
            disabled={lendo}
          >
            <IconeAtualizar size={14} className={lendo ? "girando" : ""} />
            {lendo ? "Lendo…" : "Ler novamente"}
          </button>
        )}
      </div>

      {carregando && !resultado ? (
        <div className="ficha-carregando" aria-busy="true" aria-live="polite">
          <span className="ficha-carregando__barra" aria-hidden="true" />
          <p>Consultando a fonte lenta… a primeira leitura de cada ID leva cerca de 2 segundos.</p>
        </div>
      ) : erro && !resultado ? (
        erro.status === 404 ? (
          <div className="nao-encontrado">
            <span className="nao-encontrado__numero">404</span>
            <h1>Entrada não encontrada</h1>
            <p>{erro.message}</p>
            <p>O ID {formatarId(id)} não existe na coleção ou acabou de ser excluído.</p>
            <Link to={voltarPara} className="botao botao--primario">
              Voltar à grade
            </Link>
          </div>
        ) : (
          <PageError
            titulo="A ficha não carregou"
            mensagem={erro.message}
            detalhe={erro.titulo}
            aoTentar={() => {
              chaveCarregada.current = null;
              setCarregando(true);
              void carregar(true);
              chaveCarregada.current = id;
            }}
          />
        )
      ) : resultado ? (
        <>
          <FichaConteudo
            carro={resultado.carro}
            resultado={resultado}
            lendo={lendo}
            erroLeitura={erroLeitura}
          />
          <section className="zona-perigo" aria-label="Excluir entrada">
            <div>
              <h2>Excluir esta entrada</h2>
              <p>
                O DELETE remove o registro e invalida a chave no cache. Esta ação não pode ser desfeita.
              </p>
            </div>
            <button type="button" className="botao botao--perigo-contorno" onClick={() => setConfirmandoExclusao(true)}>
              <IconeExcluir size={14} /> Excluir entrada
            </button>
          </section>

          <ConfirmDialog
            aberto={confirmandoExclusao}
            titulo={`Excluir Nº ${formatarId(resultado.carro.id)}?`}
            descricao={`${resultado.carro.marca} ${resultado.carro.modelo} (${resultado.carro.anoFabricacao}) será removido da coleção e do cache. A exclusão não pode ser desfeita.`}
            rotuloConfirmar="Excluir definitivamente"
            perigo
            processando={excluindo}
            onConfirmar={() => void confirmarExclusao()}
            onFechar={() => {
              if (!excluindo) setConfirmandoExclusao(false);
            }}
          />
        </>
      ) : null}
    </div>
  );
}
