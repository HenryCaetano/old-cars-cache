import { useApp } from "../context/AppContext";

export function CacheMeter() {
  const { estatisticas, apiOnline } = useApp();
  const limite = estatisticas?.limite ?? 5;
  const ocupados = estatisticas?.tamanhoAtual ?? 0;
  const slots = Array.from({ length: Math.min(Math.max(limite, 1), 8) }, (_, indice) => indice < ocupados);

  return (
    <div className="meter">
      <div className="meter__top">
        <span className="meter__label">Cache</span>
        <span className="meter__count">
          <strong>{estatisticas ? ocupados : "—"}</strong>
          <span>/ {limite}</span>
        </span>
      </div>
      <div
        className="meter__slots"
        role="img"
        aria-label={
          estatisticas
            ? `Cache com ${ocupados} de ${limite} posições ocupadas`
            : "Cache ainda sem resposta da API"
        }
      >
        {slots.map((cheio, indice) => (
          <span key={indice} className={`meter__slot ${cheio ? "is-full" : ""}`} />
        ))}
      </div>
      <div className="meter__foot">
        <span className={`dot ${apiOnline === false ? "dot--off" : apiOnline ? "dot--on" : ""}`} />
        <span>{apiOnline === false ? "API fora do ar" : apiOnline ? "API local no ar" : "Consultando API"}</span>
      </div>
    </div>
  );
}
