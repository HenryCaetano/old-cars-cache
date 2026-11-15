export interface Carro {
  id: number;
  modelo: string;
  marca: string;
  anoFabricacao: number;
  paisOrigem: string;
  motor: string;
  potenciaCv: number;
  cor: string;
  descricao: string;
  curador: string;
  atualizadoEm: string;
}

export interface Pagina {
  conteudo: Carro[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
}

export type Ordem =
  | "entrada-asc"
  | "entrada-desc"
  | "ano-desc"
  | "ano-asc"
  | "potencia-desc"
  | "marca-asc";

export interface Estatisticas {
  tamanhoAtual: number;
  limite: number;
  hits: number;
  misses: number;
  evictions: number;
  expiracoes: number;
  hitRatio: number;
  politica: string;
  ttlSegundos: number;
}

export interface CarroRequest {
  modelo: string;
  marca: string;
  anoFabricacao: number;
  paisOrigem: string;
  motor: string;
  potenciaCv: number;
  cor: string;
  descricao: string;
  curador: string;
}

export interface ErroApi {
  timestamp?: string;
  status?: number;
  erro?: string;
  mensagem?: string;
  campos?: Record<string, string>;
}

export interface Leitura {
  chave: string;
  id: number;
  modelo: string;
  marca: string;
  hit: boolean;
  ms: number;
  em: string;
}

export interface Foto {
  termo: string;
  resolvidoEm: number;
  googleUrl: string;
  fonte: string | null;
  fonteUrl: string;
  imagem: string | null;
  thumb: string | null;
  alt: string;
  aviso: string | null;
}

export type ResultadoLeitura = {
  carro: Carro;
  hit: boolean;
  ms: number;
};
