import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { buscarEstatisticas } from "../api";
import type { Estatisticas, Leitura } from "../types";

const CHAVE_LEITURAS = "arquivo-carros:leituras";

export interface Aviso {
  id: number;
  texto: string;
  tipo: "ok" | "erro" | "info";
}

interface Contexto {
  estatisticas: Estatisticas | null;
  apiOnline: boolean | null;
  carregandoEstatisticas: boolean;
  atualizarEstatisticas: (silencioso?: boolean) => Promise<void>;
  leituras: Leitura[];
  registrarLeitura: (leitura: Omit<Leitura, "chave" | "em">) => void;
  limparLeituras: () => void;
  avisos: Aviso[];
  notificar: (texto: string, tipo?: Aviso["tipo"]) => void;
  fecharAviso: (id: number) => void;
}

const AppContexto = createContext<Contexto | null>(null);

function lerLeiturasSalvas(): Leitura[] {
  try {
    const bruto = sessionStorage.getItem(CHAVE_LEITURAS);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? dados.slice(0, 40) : [];
  } catch {
    return [];
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [carregandoEstatisticas, setCarregandoEstatisticas] = useState(true);
  const [leituras, setLeituras] = useState<Leitura[]>(lerLeiturasSalvas);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const emAndamento = useRef(false);
  const contadorAviso = useRef(0);
  const timers = useRef<number[]>([]);

  const atualizarEstatisticas = useCallback(async (silencioso = false) => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    if (!silencioso) setCarregandoEstatisticas(true);
    try {
      const dados = await buscarEstatisticas();
      setEstatisticas(dados);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    } finally {
      emAndamento.current = false;
      setCarregandoEstatisticas(false);
    }
  }, []);

  useEffect(() => {
    void atualizarEstatisticas();
    const intervalo = window.setInterval(() => void atualizarEstatisticas(true), 20_000);
    return () => window.clearInterval(intervalo);
  }, [atualizarEstatisticas]);

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAVE_LEITURAS, JSON.stringify(leituras));
    } catch {
      /* sessão privada sem storage */
    }
  }, [leituras]);

  const notificar = useCallback((texto: string, tipo: Aviso["tipo"] = "ok") => {
    contadorAviso.current += 1;
    const id = contadorAviso.current;
    setAvisos((atuais) => [...atuais.slice(-2), { id, texto, tipo }]);
    const timer = window.setTimeout(() => {
      setAvisos((atuais) => atuais.filter((aviso) => aviso.id !== id));
    }, 5000);
    timers.current.push(timer);
  }, []);

  const fecharAviso = useCallback((id: number) => {
    setAvisos((atuais) => atuais.filter((aviso) => aviso.id !== id));
  }, []);

  const registrarLeitura = useCallback((leitura: Omit<Leitura, "chave" | "em">) => {
    const registro: Leitura = {
      ...leitura,
      chave: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      em: new Date().toISOString(),
    };
    setLeituras((atuais) => [registro, ...atuais].slice(0, 40));
  }, []);

  const limparLeituras = useCallback(() => setLeituras([]), []);

  const valor = useMemo(
    () => ({
      estatisticas,
      apiOnline,
      carregandoEstatisticas,
      atualizarEstatisticas,
      leituras,
      registrarLeitura,
      limparLeituras,
      avisos,
      notificar,
      fecharAviso,
    }),
    [
      estatisticas,
      apiOnline,
      carregandoEstatisticas,
      atualizarEstatisticas,
      leituras,
      registrarLeitura,
      limparLeituras,
      avisos,
      notificar,
      fecharAviso,
    ],
  );

  return <AppContexto.Provider value={valor}>{children}</AppContexto.Provider>;
}

export function useApp() {
  const contexto = useContext(AppContexto);
  if (!contexto) throw new Error("useApp precisa estar dentro de AppProvider.");
  return contexto;
}
