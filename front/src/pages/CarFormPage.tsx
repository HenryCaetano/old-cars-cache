import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, atualizarCarro, criarCarro, lerCarro } from "../api";
import type { CarroRequest } from "../types";
import { useApp } from "../context/AppContext";
import { PageError } from "../components/PageError";
import { IconeCheck, IconeVoltar } from "../components/Icones";
import { formatarId } from "../formato";
import { useTitulo } from "../useTitulo";

type Campos = {
  modelo: string;
  marca: string;
  anoFabricacao: string;
  paisOrigem: string;
  motor: string;
  potenciaCv: string;
  cor: string;
  descricao: string;
  curador: string;
};

const VAZIO: Campos = {
  modelo: "",
  marca: "",
  anoFabricacao: "",
  paisOrigem: "",
  motor: "",
  potenciaCv: "",
  cor: "",
  descricao: "",
  curador: "",
};

const ROTULOS: Record<keyof Campos, string> = {
  modelo: "Modelo",
  marca: "Marca",
  anoFabricacao: "Ano de fabricação",
  paisOrigem: "País de origem",
  motor: "Motor",
  potenciaCv: "Potência (cv)",
  cor: "Cor",
  descricao: "Descrição",
  curador: "Curador",
};

const PAISES = ["Alemanha", "Itália", "Reino Unido", "França", "EUA"];

function validar(campos: Campos): Record<string, string> {
  const erros: Record<string, string> = {};
  const obrigatorios: Array<keyof Campos> = [
    "modelo",
    "marca",
    "anoFabricacao",
    "paisOrigem",
    "motor",
    "potenciaCv",
    "cor",
    "descricao",
    "curador",
  ];

  for (const campo of obrigatorios) {
    if (!campos[campo].trim()) erros[campo] = `${ROTULOS[campo]} é obrigatório.`;
  }

  const ano = Number(campos.anoFabricacao);
  if (campos.anoFabricacao && (!Number.isInteger(ano) || ano < 1886 || ano > 2100)) {
    erros.anoFabricacao = "Informe um ano entre 1886 e 2100.";
  }

  const potencia = Number(campos.potenciaCv);
  if (campos.potenciaCv && (!Number.isInteger(potencia) || potencia < 1)) {
    erros.potenciaCv = "A potência deve ser um número maior que zero.";
  }

  if (campos.modelo.length > 80) erros.modelo = "Máximo de 80 caracteres.";
  if (campos.marca.length > 60) erros.marca = "Máximo de 60 caracteres.";
  if (campos.paisOrigem.length > 60) erros.paisOrigem = "Máximo de 60 caracteres.";
  if (campos.motor.length > 80) erros.motor = "Máximo de 80 caracteres.";
  if (campos.cor.length > 40) erros.cor = "Máximo de 40 caracteres.";
  if (campos.descricao.length > 2000) erros.descricao = "Máximo de 2.000 caracteres.";
  if (campos.curador.length > 80) erros.curador = "Máximo de 80 caracteres.";

  return erros;
}

function camposDoCarro(carro: {
  modelo: string;
  marca: string;
  anoFabricacao: number;
  paisOrigem: string;
  motor: string;
  potenciaCv: number;
  cor: string;
  descricao: string;
  curador: string;
}): Campos {
  return {
    modelo: carro.modelo,
    marca: carro.marca,
    anoFabricacao: String(carro.anoFabricacao),
    paisOrigem: carro.paisOrigem,
    motor: carro.motor,
    potenciaCv: String(carro.potenciaCv),
    cor: carro.cor,
    descricao: carro.descricao,
    curador: carro.curador,
  };
}

export function CarFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navegar = useNavigate();
  const { notificar, atualizarEstatisticas, registrarLeitura } = useApp();
  const [campos, setCampos] = useState<Campos>(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<{ titulo: string; mensagem: string } | null>(null);
  const [carregandoFicha, setCarregandoFicha] = useState(editando);
  const [erroCarga, setErroCarga] = useState<ApiError | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const chaveCarregada = useRef<string | null>(null);

  useTitulo(editando ? `Editar entrada ${formatarId(id ?? "")}` : "Nova entrada");

  useEffect(() => {
    if (!editando || !id) return;
    if (chaveCarregada.current === id) return;
    chaveCarregada.current = id;

    const controller = new AbortController();
    let mounted = true;

    setCarregandoFicha(true);
    setErroCarga(null);
    lerCarro(id, { signal: controller.signal })
      .then(({ carro, hit, ms }) => {
        if (!mounted) return;
        setCampos(camposDoCarro(carro));
        registrarLeitura({ id: carro.id, modelo: carro.modelo, marca: carro.marca, hit, ms });
        void atualizarEstatisticas(true);
      })
      .catch((falha: unknown) => {
        if (!mounted) return;
        if (falha instanceof DOMException && falha.name === "AbortError") return;
        setErroCarga(
          falha instanceof ApiError ? falha : new ApiError(0, "Falha", "Não foi possível carregar a ficha."),
        );
      })
      .finally(() => {
        if (mounted) setCarregandoFicha(false);
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [editando, id, registrarLeitura, atualizarEstatisticas, tentativa]);

  function atualizarCampo(campo: keyof Campos, valor: string) {
    setCampos((atuais) => ({ ...atuais, [campo]: valor }));
    setErros((atuais) => {
      if (!atuais[campo]) return atuais;
      const proximos = { ...atuais };
      delete proximos[campo];
      return proximos;
    });
  }

  function focarPrimeiroErro(lista: Record<string, string>) {
    const primeiro = Object.keys(lista)[0];
    if (!primeiro) return;
    document.getElementById(`campo-${primeiro}`)?.focus();
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroGeral(null);

    const validacao = validar(campos);
    if (Object.keys(validacao).length) {
      setErros(validacao);
      focarPrimeiroErro(validacao);
      return;
    }

    const dados: CarroRequest = {
      modelo: campos.modelo.trim(),
      marca: campos.marca.trim(),
      anoFabricacao: Number(campos.anoFabricacao),
      paisOrigem: campos.paisOrigem.trim(),
      motor: campos.motor.trim(),
      potenciaCv: Number(campos.potenciaCv),
      cor: campos.cor.trim(),
      descricao: campos.descricao.trim(),
      curador: campos.curador.trim(),
    };

    setEnviando(true);
    setErros({});
    try {
      const salvo = editando && id ? await atualizarCarro(id, dados) : await criarCarro(dados);
      void atualizarEstatisticas(true);
      if (editando) {
        notificar(
          `Entrada Nº ${formatarId(salvo.id)} atualizada. O cache invalidou a chave; a próxima leitura será MISS.`,
          "ok",
        );
      } else {
        notificar(
          `Entrada Nº ${formatarId(salvo.id)} criada. A primeira leitura será um MISS de aproximadamente 2 s.`,
          "ok",
        );
      }
      navegar(`/carros/${salvo.id}`);
    } catch (falha) {
      const apiErro = falha instanceof ApiError ? falha : new ApiError(0, "Falha", "Não foi possível salvar.");
      setErroGeral({ titulo: apiErro.titulo, mensagem: apiErro.message });
      if (Object.keys(apiErro.campos).length) {
        setErros(apiErro.campos);
        focarPrimeiroErro(apiErro.campos);
      }
      setEnviando(false);
    }
  }

  const titulo = editando ? "Editar entrada" : "Nova entrada";
  const endpoint = editando ? `PUT /carros/${id}` : "POST /carros";

  if (editando && carregandoFicha && !erroCarga) {
    return (
      <div className="pagina pagina--form">
        <div className="ficha-carregando" aria-busy="true">
          <span className="ficha-carregando__barra" aria-hidden="true" />
          <p>Lendo a ficha Nº {formatarId(id ?? "")} para edição. A primeira leitura pode levar ~2 s.</p>
        </div>
      </div>
    );
  }

  if (editando && erroCarga) {
    return (
      <div className="pagina pagina--form">
        <PageError
          titulo={erroCarga.status === 404 ? "Entrada não encontrada" : "Não foi possível abrir a edição"}
          mensagem={erroCarga.message}
          detalhe={erroCarga.titulo}
          aoTentar={() => {
            chaveCarregada.current = null;
            setTentativa((valor) => valor + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="pagina pagina--form">
      <Link to={editando ? `/carros/${id}` : "/"} className="voltar">
        <IconeVoltar size={14} /> {editando ? "Voltar à ficha" : "Voltar à grade"}
      </Link>

      <header className="form-cabecalho">
        <div>
          <h1>{titulo}</h1>
          <p>
            {editando
              ? "Substitui todos os dados do exemplar. O PUT invalida a entrada correspondente no cache."
              : "Cadastra um exemplar na coleção. O POST devolve 201 e a nova entrada nasce fora do cache."}
          </p>
        </div>
        <p className="form-cabecalho__endpoint">
          <span>requisição</span>
          <code>{endpoint}</code>
        </p>
      </header>

      {erroGeral && (
        <div className="form-erro" role="alert">
          <strong>{erroGeral.titulo}</strong>
          <p>{erroGeral.mensagem}</p>
        </div>
      )}

      <form className="ficha-form" onSubmit={(evento) => void enviar(evento)} noValidate>
        <div className="form-grade">
          <div className={`campo ${erros.marca ? "tem-erro" : ""}`}>
            <label htmlFor="campo-marca">
              Marca <span aria-hidden="true">*</span>
            </label>
            <input
              id="campo-marca"
              value={campos.marca}
              onChange={(evento) => atualizarCampo("marca", evento.target.value)}
              maxLength={60}
              placeholder="Mercedes-Benz"
              autoComplete="off"
              aria-invalid={Boolean(erros.marca)}
              aria-describedby={erros.marca ? "erro-marca" : undefined}
              required
            />
            {erros.marca && (
              <p className="campo__erro" id="erro-marca">
                {erros.marca}
              </p>
            )}
          </div>

          <div className={`campo ${erros.modelo ? "tem-erro" : ""}`}>
            <label htmlFor="campo-modelo">
              Modelo <span aria-hidden="true">*</span>
            </label>
            <input
              id="campo-modelo"
              value={campos.modelo}
              onChange={(evento) => atualizarCampo("modelo", evento.target.value)}
              maxLength={80}
              placeholder="300 SL Gullwing"
              autoComplete="off"
              aria-invalid={Boolean(erros.modelo)}
              aria-describedby={erros.modelo ? "erro-modelo" : undefined}
              required
            />
            {erros.modelo && (
              <p className="campo__erro" id="erro-modelo">
                {erros.modelo}
              </p>
            )}
          </div>

          <div className={`campo ${erros.anoFabricacao ? "tem-erro" : ""}`}>
            <label htmlFor="campo-anoFabricacao">
              Ano de fabricação <span aria-hidden="true">*</span>
            </label>
            <input
              id="campo-anoFabricacao"
              type="number"
              inputMode="numeric"
              value={campos.anoFabricacao}
              onChange={(evento) => atualizarCampo("anoFabricacao", evento.target.value)}
              min={1886}
              max={2100}
              placeholder="1954"
              aria-invalid={Boolean(erros.anoFabricacao)}
              aria-describedby={erros.anoFabricacao ? "erro-anoFabricacao" : undefined}
              required
            />
            {erros.anoFabricacao && (
              <p className="campo__erro" id="erro-anoFabricacao">
                {erros.anoFabricacao}
              </p>
            )}
          </div>

          <div className={`campo ${erros.paisOrigem ? "tem-erro" : ""}`}>
            <label htmlFor="campo-paisOrigem">
              País de origem <span aria-hidden="true">*</span>
            </label>
            <input
              id="campo-paisOrigem"
              value={campos.paisOrigem}
              onChange={(evento) => atualizarCampo("paisOrigem", evento.target.value)}
              maxLength={60}
              placeholder="Alemanha"
              list="paises-origem"
              autoComplete="off"
              aria-invalid={Boolean(erros.paisOrigem)}
              aria-describedby={erros.paisOrigem ? "erro-paisOrigem" : undefined}
              required
            />
            <datalist id="paises-origem">
              {PAISES.map((pais) => (
                <option value={pais} key={pais} />
              ))}
            </datalist>
            {erros.paisOrigem && (
              <p className="campo__erro" id="erro-paisOrigem">
                {erros.paisOrigem}
              </p>
            )}
          </div>

          <div className={`campo ${erros.motor ? "tem-erro" : ""}`}>
            <label htmlFor="campo-motor">
              Motor <span aria-hidden="true">*</span>
            </label>
            <input
              id="campo-motor"
              value={campos.motor}
              onChange={(evento) => atualizarCampo("motor", evento.target.value)}
              maxLength={80}
              placeholder="6 cil. 3.0 L"
              autoComplete="off"
              aria-invalid={Boolean(erros.motor)}
              aria-describedby={erros.motor ? "erro-motor" : undefined}
              required
            />
            {erros.motor && (
              <p className="campo__erro" id="erro-motor">
                {erros.motor}
              </p>
            )}
          </div>

          <div className={`campo ${erros.potenciaCv ? "tem-erro" : ""}`}>
            <label htmlFor="campo-potenciaCv">
              Potência (cv) <span aria-hidden="true">*</span>
            </label>
            <input
              id="campo-potenciaCv"
              type="number"
              inputMode="numeric"
              value={campos.potenciaCv}
              onChange={(evento) => atualizarCampo("potenciaCv", evento.target.value)}
              min={1}
              placeholder="215"
              aria-invalid={Boolean(erros.potenciaCv)}
              aria-describedby={erros.potenciaCv ? "erro-potenciaCv" : undefined}
              required
            />
            {erros.potenciaCv && (
              <p className="campo__erro" id="erro-potenciaCv">
                {erros.potenciaCv}
              </p>
            )}
          </div>

          <div className={`campo ${erros.cor ? "tem-erro" : ""}`}>
            <label htmlFor="campo-cor">
              Cor <span aria-hidden="true">*</span>
            </label>
            <input
              id="campo-cor"
              value={campos.cor}
              onChange={(evento) => atualizarCampo("cor", evento.target.value)}
              maxLength={40}
              placeholder="Prata"
              autoComplete="off"
              aria-invalid={Boolean(erros.cor)}
              aria-describedby={erros.cor ? "erro-cor" : undefined}
              required
            />
            {erros.cor && (
              <p className="campo__erro" id="erro-cor">
                {erros.cor}
              </p>
            )}
          </div>

          <div className={`campo ${erros.curador ? "tem-erro" : ""}`}>
            <label htmlFor="campo-curador">
              Curador <span aria-hidden="true">*</span>
            </label>
            <input
              id="campo-curador"
              value={campos.curador}
              onChange={(evento) => atualizarCampo("curador", evento.target.value)}
              maxLength={80}
              placeholder="Curadoria SPTech"
              autoComplete="off"
              aria-invalid={Boolean(erros.curador)}
              aria-describedby={erros.curador ? "erro-curador" : undefined}
              required
            />
            {erros.curador && (
              <p className="campo__erro" id="erro-curador">
                {erros.curador}
              </p>
            )}
          </div>

          <div className={`campo campo--largo ${erros.descricao ? "tem-erro" : ""}`}>
            <label htmlFor="campo-descricao">
              Descrição <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="campo-descricao"
              value={campos.descricao}
              onChange={(evento) => atualizarCampo("descricao", evento.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="História, procedência e particularidades do exemplar."
              aria-invalid={Boolean(erros.descricao)}
              aria-describedby={erros.descricao ? "erro-descricao" : "contador-descricao"}
              required
            />
            <div className="campo__rodape">
              {erros.descricao ? (
                <p className="campo__erro" id="erro-descricao">
                  {erros.descricao}
                </p>
              ) : (
                <span className="campo__dica">Texto livre da ficha, até 2.000 caracteres.</span>
              )}
              <span className="campo__contador" id="contador-descricao">
                {campos.descricao.length.toLocaleString("pt-BR")} / 2.000
              </span>
            </div>
          </div>
        </div>

        <div className="form-acoes">
          <Link to={editando ? `/carros/${id}` : "/"} className="botao botao--fantasma">
            Cancelar
          </Link>
          <button type="submit" className="botao botao--primario" disabled={enviando}>
            <IconeCheck size={15} /> {enviando ? "Salvando…" : editando ? "Salvar alterações" : "Cadastrar entrada"}
          </button>
        </div>
      </form>
    </div>
  );
}
