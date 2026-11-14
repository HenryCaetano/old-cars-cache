import type { Carro, CarroRequest, Estatisticas, Pagina, ResultadoLeitura } from "./types";
import type { ErroApi } from "./types";

const BASE = import.meta.env.VITE_API_BASE ?? "/api";
const INSTRUCAO_API =
  "A API não respondeu em http://localhost:8080. Suba o back-end com " +
  "“cd back && ./mvnw spring-boot:run” e recarregue.";

export class ApiError extends Error {
  status: number;
  campos: Record<string, string>;
  titulo: string;

  constructor(status: number, titulo: string, mensagem: string, campos: Record<string, string> = {}) {
    super(mensagem);
    this.name = "ApiError";
    this.status = status;
    this.titulo = titulo;
    this.campos = campos;
  }
}

async function lerErro(resposta: Response): Promise<ApiError> {
  try {
    const corpo = (await resposta.json()) as ErroApi;
    return new ApiError(
      resposta.status,
      corpo.erro ?? "Falha na requisição",
      corpo.mensagem ?? `A API respondeu ${resposta.status}.`,
      corpo.campos ?? {},
    );
  } catch {
    return new ApiError(resposta.status, "Falha na requisição", `A API respondeu ${resposta.status}.`);
  }
}

async function requisitar<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "API indisponível", INSTRUCAO_API);
  }

  if (!resposta.ok) throw await lerErro(resposta);
  if (resposta.status === 204) return undefined as T;
  return (await resposta.json()) as T;
}

export function listarCarros(pagina: number): Promise<Pagina> {
  return requisitar<Pagina>(`/carros?pagina=${pagina}`);
}

export async function lerCarro(id: number | string): Promise<ResultadoLeitura> {
  const inicio = performance.now();
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}/carros/${id}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "API indisponível", INSTRUCAO_API);
  }

  const ms = Math.max(1, Math.round(performance.now() - inicio));
  if (!resposta.ok) throw await lerErro(resposta);

  const carro = (await resposta.json()) as Carro;
  const cache = (resposta.headers.get("X-Cache") ?? "MISS").toUpperCase();
  return { carro, hit: cache === "HIT", ms };
}

export function criarCarro(dados: CarroRequest): Promise<Carro> {
  return requisitar<Carro>("/carros", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function atualizarCarro(id: number | string, dados: CarroRequest): Promise<Carro> {
  return requisitar<Carro>(`/carros/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

export function excluirCarro(id: number | string): Promise<void> {
  return requisitar<void>(`/carros/${id}`, { method: "DELETE" });
}

export function buscarEstatisticas(): Promise<Estatisticas> {
  return requisitar<Estatisticas>("/cache/estatisticas");
}

export function limparCache(): Promise<void> {
  return requisitar<void>("/cache", { method: "DELETE" });
}

export const URL_API_PUBLICA = "http://localhost:8080";
export const INSTRUCAO_INICIAR_API = INSTRUCAO_API;
