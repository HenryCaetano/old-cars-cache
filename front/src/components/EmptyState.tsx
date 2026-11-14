import type { ReactNode } from "react";

export function EmptyState({
  titulo,
  children,
  acao,
  compacto = false,
}: {
  titulo: string;
  children?: ReactNode;
  acao?: ReactNode;
  compacto?: boolean;
}) {
  return (
    <div className={`estado-vazio ${compacto ? "estado-vazio--compacto" : ""}`}>
      <span className="estado-vazio__traco" aria-hidden="true" />
      <div>
        <p className="estado-vazio__titulo">{titulo}</p>
        {children && <div className="estado-vazio__texto">{children}</div>}
        {acao && <div className="estado-vazio__acao">{acao}</div>}
      </div>
    </div>
  );
}
