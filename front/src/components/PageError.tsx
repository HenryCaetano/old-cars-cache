import { IconeAlerta, IconeAtualizar } from "./Icones";

export function PageError({
  titulo = "Não foi possível carregar",
  mensagem,
  detalhe,
  aoTentar,
}: {
  titulo?: string;
  mensagem: string;
  detalhe?: string;
  aoTentar?: () => void;
}) {
  return (
    <section className="estado-erro" role="alert">
      <span className="estado-erro__icone" aria-hidden="true">
        <IconeAlerta size={22} />
      </span>
      <div className="estado-erro__texto">
        <h2>{titulo}</h2>
        <p>{mensagem}</p>
        {detalhe && <p className="estado-erro__detalhe">{detalhe}</p>}
        <p className="estado-erro__comando">
          <span>API:</span> <code>cd back &amp;&amp; ./mvnw spring-boot:run</code>
        </p>
        {aoTentar && (
          <button type="button" className="botao botao--linha" onClick={aoTentar}>
            <IconeAtualizar size={14} /> Tentar novamente
          </button>
        )}
      </div>
    </section>
  );
}
