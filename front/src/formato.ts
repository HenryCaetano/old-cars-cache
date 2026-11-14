export function formatarId(id: number | string): string {
  const numero = Number(id);
  if (!Number.isFinite(numero)) return String(id);
  return String(numero).padStart(3, "0");
}

export function horaCurta(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(data);
}

export function dataLonga(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

export function numero(valor: number): string {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

export function percentual(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(valor);
}

export function consultaImagem(marca: string, modelo: string, ano: number): string {
  return `${marca} ${modelo} ${ano}`;
}
