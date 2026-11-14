const PAISES: Record<string, string> = {
  Alemanha: "de",
  Itália: "it",
  Italia: "it",
  "Reino Unido": "gb",
  França: "fr",
  Franca: "fr",
  EUA: "us",
  "Estados Unidos": "us",
};

export function Roundel({ pais, tamanho = 20 }: { pais: string; tamanho?: number }) {
  const chave = PAISES[pais] ?? "xx";
  return (
    <span
      className={`roundel roundel--${chave}`}
      style={{ width: tamanho, height: tamanho }}
      aria-hidden="true"
    />
  );
}
