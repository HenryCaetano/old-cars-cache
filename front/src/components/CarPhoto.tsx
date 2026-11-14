import { useEffect, useState } from "react";
import type { Carro, Foto } from "../types";
import { consultaImagem } from "../formato";

type EstadoFoto =
  | { status: "carregando" }
  | { status: "pronta"; foto: Foto }
  | { status: "falhou" };

const estados = new Map<string, EstadoFoto>();
const emVoo = new Map<string, Promise<Foto>>();

function buscarFoto(termo: string): Promise<Foto> {
  const existente = emVoo.get(termo);
  if (existente) return existente;

  const promessa = fetch(`/fotos?q=${encodeURIComponent(termo)}`, {
    headers: { Accept: "application/json" },
  })
    .then(async (resposta) => {
      if (!resposta.ok) throw new Error(`Busca respondeu ${resposta.status}`);
      return (await resposta.json()) as Foto;
    })
    .then((foto) => {
      estados.set(termo, foto.imagem ? { status: "pronta", foto } : { status: "falhou" });
      return foto;
    })
    .catch((erro) => {
      estados.set(termo, { status: "falhou" });
      throw erro;
    })
    .finally(() => {
      emVoo.delete(termo);
    });

  emVoo.set(termo, promessa);
  return promessa;
}

export function useFotoCarro(carro: Pick<Carro, "marca" | "modelo" | "anoFabricacao">) {
  const termo = consultaImagem(carro.marca, carro.modelo, carro.anoFabricacao);
  const [estado, setEstado] = useState<EstadoFoto>(() => estados.get(termo) ?? { status: "carregando" });

  useEffect(() => {
    let ativo = true;
    const salvo = estados.get(termo);
    if (salvo && salvo.status !== "carregando") {
      setEstado(salvo);
      return;
    }

    setEstado({ status: "carregando" });
    buscarFoto(termo)
      .then((foto) => {
        if (ativo) setEstado(foto.imagem ? { status: "pronta", foto } : { status: "falhou" });
      })
      .catch(() => {
        if (ativo) setEstado({ status: "falhou" });
      });

    return () => {
      ativo = false;
    };
  }, [termo]);

  return { estado, termo };
}

export function enderecoFoto(foto: Foto, variacao: "thumb" | "full"): string {
  const url = variacao === "thumb" ? (foto.thumb ?? foto.imagem) : (foto.imagem ?? foto.thumb);
  return `/fotos/arquivo?u=${encodeURIComponent(url ?? "")}`;
}

function iniciais(carro: Carro): string {
  const marca = carro.marca.trim().replace(/[^\p{L}]/gu, "");
  return (marca.slice(0, 2) || "AA").toUpperCase();
}

export function CarPhoto({
  carro,
  variacao = "thumb",
  prioridade = false,
  className = "",
}: {
  carro: Carro;
  variacao?: "thumb" | "full";
  prioridade?: boolean;
  className?: string;
}) {
  const { estado } = useFotoCarro(carro);

  return (
    <div className={`foto foto--${variacao} ${className}`}>
      {estado.status === "pronta" ? (
        <img
          className="foto__img"
          src={enderecoFoto(estado.foto, variacao)}
          alt={`${carro.marca} ${carro.modelo} ${carro.anoFabricacao}`}
          loading={prioridade ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={prioridade ? "high" : "auto"}
        />
      ) : estado.status === "carregando" ? (
        <span className="foto__plate" aria-hidden="true">
          <span className="foto__hatch" />
          <span className="foto__busca">{variacao === "thumb" ? "BUSCANDO" : "BUSCANDO IMAGEM"}</span>
        </span>
      ) : (
        <span className="foto__plate foto__plate--vazia" aria-hidden="true">
          <span className="foto__ini">{iniciais(carro)}</span>
          {variacao === "full" && <span className="foto__busca">IMAGEM INDISPONÍVEL</span>}
        </span>
      )}
    </div>
  );
}
