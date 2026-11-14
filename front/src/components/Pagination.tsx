import { IconeSeta } from "./Icones";

function construirPaginas(atual: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, indice) => indice);
  const paginas: Array<number | "…"> = [0];
  const inicio = Math.max(1, atual - 1);
  const fim = Math.min(total - 2, atual + 1);

  if (inicio > 1) paginas.push("…");
  for (let indice = inicio; indice <= fim; indice += 1) paginas.push(indice);
  if (fim < total - 2) paginas.push("…");
  paginas.push(total - 1);
  return paginas;
}

export function Pagination({
  pagina,
  totalPaginas,
  totalElementos,
  aoIr,
  desabilitado = false,
}: {
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
  aoIr: (pagina: number) => void;
  desabilitado?: boolean;
}) {
  if (totalPaginas <= 0) return null;
  const paginas = construirPaginas(pagina, totalPaginas);

  return (
    <nav className="paginacao" aria-label="Paginação da grade">
      <p className="paginacao__resumo">
        <strong>{totalElementos}</strong> exemplares em <strong>{totalPaginas}</strong> páginas de 10
      </p>
      <div className="paginacao__controles">
        <button
          type="button"
          className="pagina-seta"
          onClick={() => aoIr(pagina - 1)}
          disabled={desabilitado || pagina <= 0}
          aria-label="Página anterior"
        >
          <IconeSeta size={14} style={{ transform: "rotate(180deg)" }} />
        </button>
        {paginas.map((valor, indice) =>
          valor === "…" ? (
            <span key={`reticencias-${indice}`} className="paginacao__reticencias" aria-hidden="true">
              ·
            </span>
          ) : (
            <button
              key={valor}
              type="button"
              className={`pagina-numero ${valor === pagina ? "is-atual" : ""}`}
              onClick={() => aoIr(valor)}
              disabled={desabilitado}
              aria-label={`Página ${valor + 1}`}
              aria-current={valor === pagina ? "page" : undefined}
            >
              {String(valor + 1).padStart(2, "0")}
            </button>
          ),
        )}
        <button
          type="button"
          className="pagina-seta"
          onClick={() => aoIr(pagina + 1)}
          disabled={desabilitado || pagina >= totalPaginas - 1}
          aria-label="Próxima página"
        >
          <IconeSeta size={14} />
        </button>
      </div>
    </nav>
  );
}
