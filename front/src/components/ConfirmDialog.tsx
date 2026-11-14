import { useEffect, useRef, type ReactNode } from "react";

export function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  rotuloConfirmar = "Confirmar",
  rotuloCancelar = "Cancelar",
  onConfirmar,
  onFechar,
  processando = false,
  perigo = false,
  children,
}: {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  rotuloConfirmar?: string;
  rotuloCancelar?: string;
  onConfirmar: () => void;
  onFechar: () => void;
  processando?: boolean;
  perigo?: boolean;
  children?: ReactNode;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloId = useRef(`dialogo-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (aberto && !elemento.open) elemento.showModal();
    if (!aberto && elemento.open) elemento.close();
  }, [aberto]);

  return (
    <dialog
      ref={dialogo}
      className="dialogo"
      aria-labelledby={tituloId.current}
      onClose={onFechar}
      onMouseDown={(evento) => {
        if (evento.target === dialogo.current) onFechar();
      }}
    >
      <div className="dialogo__corpo">
        <div className={`dialogo__marca ${perigo ? "is-perigo" : ""}`} aria-hidden="true" />
        <h2 className="dialogo__titulo" id={tituloId.current}>
          {titulo}
        </h2>
        {descricao && <p className="dialogo__desc">{descricao}</p>}
        {children}
        <div className="dialogo__acoes">
          <button type="button" className="botao botao--fantasma" onClick={onFechar} disabled={processando}>
            {rotuloCancelar}
          </button>
          <button
            type="button"
            className={`botao ${perigo ? "botao--perigo" : "botao--primario"}`}
            onClick={onConfirmar}
            disabled={processando}
          >
            {processando ? "Executando…" : rotuloConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}
