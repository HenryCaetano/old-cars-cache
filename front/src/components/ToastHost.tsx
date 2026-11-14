import { useApp } from "../context/AppContext";
import { IconeAlerta, IconeCheck, IconeFechar, IconeInfo } from "./Icones";

export function ToastHost() {
  const { avisos, fecharAviso } = useApp();

  if (!avisos.length) return null;

  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {avisos.map((aviso) => (
        <div key={aviso.id} className={`toast toast--${aviso.tipo}`} role={aviso.tipo === "erro" ? "alert" : "status"}>
          <span className="toast__icone" aria-hidden="true">
            {aviso.tipo === "ok" ? <IconeCheck size={15} /> : aviso.tipo === "erro" ? <IconeAlerta size={15} /> : <IconeInfo size={15} />}
          </span>
          <p className="toast__texto">{aviso.texto}</p>
          <button type="button" className="toast__fechar" onClick={() => fecharAviso(aviso.id)} aria-label="Fechar aviso">
            <IconeFechar size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
