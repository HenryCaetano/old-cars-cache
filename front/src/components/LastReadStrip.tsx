import { useApp } from "../context/AppContext";
import { formatarId, horaCurta } from "../formato";

export function LastReadStrip() {
  const { leituras, estatisticas, apiOnline } = useApp();
  const ultima = leituras[0];

  return (
    <div className="readline" aria-live="polite">
      <div className="readline__main">
        <span className="readline__label">Última leitura</span>
        {ultima ? (
          <>
            <span className={`stamp ${ultima.hit ? "stamp--hit" : "stamp--miss"}`}>
              {ultima.hit ? "HIT" : "MISS"}
            </span>
            <span className="readline__ms">{ultima.ms.toLocaleString("pt-BR")} ms</span>
            <span className="readline__car">
              Nº {formatarId(ultima.id)} · {ultima.marca} {ultima.modelo}
            </span>
            <time className="readline__hora" dateTime={ultima.em}>
              {horaCurta(ultima.em)}
            </time>
          </>
        ) : (
          <span className="readline__vazio">Sem leituras nesta sessão</span>
        )}
      </div>
      <div className="readline__stats">
        <span className={apiOnline === false ? "readline__off" : ""}>
          API {apiOnline === false ? "off" : apiOnline ? "on" : "—"}
        </span>
        <span className="readline__sep" aria-hidden="true">
          /
        </span>
        <span>
          cache {estatisticas ? `${estatisticas.tamanhoAtual}/${estatisticas.limite}` : "—"}
        </span>
      </div>
    </div>
  );
}
