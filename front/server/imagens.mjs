import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve a fotografia de um carro a partir de uma busca de imagens.
 *
 * O pedido é "o primeiro resultado do Google Imagens". O Google recusa
 * consultas automáticas sem chave; por isso tentamos, em ordem:
 *   1. Google Programmable Search (quando GOOGLE_API_KEY e GOOGLE_CSE_ID existem);
 *   2. Google Imagens via HTML (funciona em algumas redes, falha em outras);
 *   3. Yandex Imagens (primeiro resultado);
 *   4. Wikimedia Commons (fotografia enciclopédica, sem busca comercial).
 * A resposta sempre informa a fonte usada e o link para a busca no Google.
 */

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(AQUI, ".cache-fotos");
const META_TTL_MS = 1000 * 60 * 60 * 72;
const IMAGEM_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const MAX_IMAGEM_BYTES = 16 * 1024 * 1024;
const LIMITE_CONCORRENCIA = 2;

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const memoria = new Map();
const emVoo = new Map();
let googleHtmlRecusado = false;

let ativos = 0;
const fila = [];

function comLimite(tarefa) {
  return new Promise((resolver, rejeitar) => {
    const executar = () => {
      ativos += 1;
      Promise.resolve()
        .then(tarefa)
        .then(resolver, rejeitar)
        .finally(() => {
          ativos -= 1;
          const proxima = fila.shift();
          if (proxima) proxima();
        });
    };
    if (ativos < LIMITE_CONCORRENCIA) executar();
    else fila.push(executar);
  });
}

function hash(valor) {
  return createHash("sha1").update(valor).digest("hex");
}

function limparTermo(termo) {
  return String(termo ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function googleUrl(termo) {
  return `https://www.google.com/search?q=${encodeURIComponent(termo)}&tbm=isch&hl=pt-BR`;
}

async function garantirCache() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function buscarComTimeout(url, opcoes = {}, ms = 12_000) {
  const controlador = new AbortController();
  const timer = setTimeout(() => controlador.abort(), ms);
  try {
    return await fetch(url, {
      ...opcoes,
      signal: controlador.signal,
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.6",
        ...(opcoes.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function decodificarHtml(texto) {
  return texto
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function objetoJsonEm(texto, inicio) {
  let profundidade = 0;
  let emTexto = false;
  let escape = false;
  for (let i = inicio; i < texto.length; i += 1) {
    const c = texto[i];
    if (emTexto) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') emTexto = false;
    } else if (c === '"') {
      emTexto = true;
    } else if (c === "{") {
      profundidade += 1;
    } else if (c === "}") {
      profundidade -= 1;
      if (profundidade === 0) return texto.slice(inicio, i + 1);
    }
  }
  return null;
}

function detectarTipo(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "image/gif";
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.toString("ascii", 4, 12).includes("ftyp")) return "image/avif";
  return null;
}

async function imagemResponde(url) {
  try {
    const resposta = await buscarComTimeout(
      url,
      {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          Referer: new URL(url).origin + "/",
        },
      },
      9_000,
    );
    if (!resposta.ok) return false;
    const tipo = resposta.headers.get("content-type") ?? "";
    const leitor = resposta.body?.getReader();
    if (!leitor) return tipo.startsWith("image/");
    const { value } = await leitor.read();
    await leitor.cancel().catch(() => {});
    if (tipo.startsWith("image/")) return true;
    return Boolean(detectarTipo(value));
  } catch {
    return false;
  }
}

async function candidatosGoogleApi(termo) {
  const chave = process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_CUSTOM_SEARCH_KEY;
  const cx = process.env.GOOGLE_CSE_ID ?? process.env.GOOGLE_CUSTOM_SEARCH_CX;
  if (!chave || !cx) return [];
  try {
    const url =
      "https://www.googleapis.com/customsearch/v1?" +
      new URLSearchParams({
        key: chave,
        cx,
        q: termo,
        searchType: "image",
        num: "3",
        safe: "off",
        hl: "pt-BR",
      });
    const resposta = await buscarComTimeout(url, {}, 10_000);
    if (!resposta.ok) return [];
    const dados = await resposta.json();
    return (dados.items ?? []).map((item) => ({
      url: item.link,
      thumb: item.image?.thumbnailLink ?? item.link,
      alt: item.title ?? termo,
      fonte: "Google Imagens",
      fonteUrl: item.image?.contextLink ?? googleUrl(termo),
    }));
  } catch {
    return [];
  }
}

async function candidatosGoogleHtml(termo) {
  if (googleHtmlRecusado) return [];
  try {
    const resposta = await buscarComTimeout(
      googleUrl(termo),
      { headers: { Accept: "text/html,application/xhtml+xml" } },
      8_000,
    );
    if (!resposta.ok) {
      googleHtmlRecusado = true;
      return [];
    }
    const bruto = await resposta.text();
    const texto = decodificarHtml(bruto);
    if (texto.length < 4_000 || !/AF_initDataCallback|googleusercontent|gstatic/i.test(texto)) {
      googleHtmlRecusado = true;
      return [];
    }
    const urls = new Set();
    const padrao = /"(https?:\\?\/\\?\/[^"\\\s]+?\.(?:jpg|jpeg|png|webp))"/gi;
    let achado;
    while ((achado = padrao.exec(bruto)) && urls.size < 6) {
      urls.add(achado[1].replace(/\\\//g, "/"));
    }
    if (!urls.size) {
      googleHtmlRecusado = true;
      return [];
    }
    return [...urls].map((url) => ({
      url,
      thumb: url,
      alt: termo,
      fonte: "Google Imagens",
      fonteUrl: googleUrl(termo),
    }));
  } catch {
    googleHtmlRecusado = true;
    return [];
  }
}

async function candidatosYandex(termo) {
  try {
    const resposta = await buscarComTimeout(
      `https://yandex.com/images/search?text=${encodeURIComponent(termo)}`,
      { headers: { Accept: "text/html,application/xhtml+xml" } },
      12_000,
    );
    if (!resposta.ok) return [];
    const texto = decodificarHtml(await resposta.text());
    const marcador = '"entities":{';
    const indice = texto.indexOf(marcador);
    if (indice < 0) return [];
    const json = objetoJsonEm(texto, indice + marcador.length - 1);
    if (!json) return [];
    const entidades = JSON.parse(json);
    const itens = Object.values(entidades)
      .filter((item) => item && typeof item === "object")
      .sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));
    return itens
      .map((item) => {
        const url = item.origUrl ?? (item.url?.startsWith("http") ? item.url : null);
        if (!url) return null;
        const thumb = item.image?.startsWith("//") ? `https:${item.image}` : item.image ?? url;
        return {
          url,
          thumb,
          alt: item.alt ?? termo,
          fonte: "Yandex Imagens",
          fonteUrl: `https://yandex.com/images/search?text=${encodeURIComponent(termo)}`,
          bloqueado: item.censored === true,
        };
      })
      .filter(Boolean)
      .filter((item) => !item.bloqueado)
      .slice(0, 6);
  } catch {
    return [];
  }
}

async function candidatosWikimedia(termo) {
  try {
    const url =
      "https://commons.wikimedia.org/w/api.php?" +
      new URLSearchParams({
        action: "query",
        generator: "search",
        gsrsearch: termo,
        gsrnamespace: "6",
        gsrlimit: "6",
        prop: "imageinfo",
        iiprop: "url|mime",
        iiurlwidth: "1600",
        format: "json",
        origin: "*",
      });
    const resposta = await buscarComTimeout(url, { headers: { Accept: "application/json" } }, 10_000);
    if (!resposta.ok) return [];
    const dados = await resposta.json();
    const paginas = Object.values(dados?.query?.pages ?? {})
      .filter((pagina) => pagina.imageinfo?.[0]?.thumburl)
      .filter((pagina) => (pagina.imageinfo[0].mime ?? "").startsWith("image/"))
      .filter((pagina) => !/\.svg$/i.test(pagina.title))
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    return paginas.map((pagina) => {
      const info = pagina.imageinfo[0];
      const thumb = info.thumburl.replace(/\/(\d+)px-/, "/640px-");
      return {
        url: info.thumburl,
        thumb,
        alt: pagina.title.replace(/^File:/, ""),
        fonte: "Wikimedia Commons",
        fonteUrl: info.descriptionurl ?? "https://commons.wikimedia.org/",
      };
    });
  } catch {
    return [];
  }
}

function deduplicar(itens) {
  const vistos = new Set();
  return itens.filter((item) => {
    if (!item?.url || vistos.has(item.url)) return false;
    vistos.add(item.url);
    return true;
  });
}

async function escolherPrimeira(candidatos) {
  for (const candidato of deduplicar(candidatos).slice(0, 5)) {
    if (await imagemResponde(candidato.url)) return candidato;
    if (candidato.thumb && candidato.thumb !== candidato.url && (await imagemResponde(candidato.thumb))) {
      return { ...candidato, url: candidato.thumb };
    }
  }
  return null;
}

async function lerMeta(arquivo) {
  try {
    const bruto = await fs.readFile(arquivo, "utf8");
    const dados = JSON.parse(bruto);
    if (Date.now() - dados.resolvidoEm > META_TTL_MS) return null;
    return dados;
  } catch {
    return null;
  }
}

async function gravarMeta(arquivo, dados) {
  await garantirCache();
  await fs.writeFile(arquivo, JSON.stringify(dados), "utf8");
}

async function resolverSemCache(termo) {
  const usandoApiGoogle = Boolean(
    (process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_CUSTOM_SEARCH_KEY) &&
      (process.env.GOOGLE_CSE_ID ?? process.env.GOOGLE_CUSTOM_SEARCH_CX),
  );

  let candidatos = [];
  let fonteGoogleTentada = usandoApiGoogle;
  if (usandoApiGoogle) candidatos = await candidatosGoogleApi(termo);

  if (!candidatos.length) {
    fonteGoogleTentada = true;
    candidatos = await candidatosGoogleHtml(termo);
  }

  if (!candidatos.length) candidatos = await candidatosYandex(termo);
  if (!candidatos.length) candidatos = await candidatosWikimedia(termo);

  const escolhido = await escolherPrimeira(candidatos);
  const base = {
    termo,
    resolvidoEm: Date.now(),
    googleUrl: googleUrl(termo),
  };

  if (!escolhido) {
    return {
      ...base,
      fonte: null,
      fonteUrl: googleUrl(termo),
      imagem: null,
      thumb: null,
      alt: termo,
      aviso: "Nenhum resultado de imagem respondeu. Use o link para abrir a busca no Google Imagens.",
    };
  }

  const aviso =
    escolhido.fonte === "Google Imagens"
      ? null
      : fonteGoogleTentada
        ? "O Google recusou a consulta automática. Exibindo o primeiro resultado do " +
          escolhido.fonte +
          "."
        : null;

  return {
    ...base,
    fonte: escolhido.fonte,
    fonteUrl: escolhido.fonteUrl,
    imagem: escolhido.url,
    thumb: escolhido.thumb ?? escolhido.url,
    alt: escolhido.alt,
    aviso,
  };
}

export async function resolverImagem(termoBruto) {
  const termo = limparTermo(termoBruto);
  if (!termo) throw new Error("Informe o termo da busca.");

  const emMemoria = memoria.get(termo);
  if (emMemoria && Date.now() - emMemoria.resolvidoEm < META_TTL_MS) return emMemoria;

  if (emVoo.has(termo)) return emVoo.get(termo);

  const arquivo = path.join(CACHE_DIR, `meta-${hash(termo)}.json`);
  const persistido = await lerMeta(arquivo);
  if (persistido) {
    memoria.set(termo, persistido);
    return persistido;
  }

  const promessa = comLimite(async () => {
    let resultado;
    try {
      resultado = await resolverSemCache(termo);
    } catch {
      resultado = {
        termo,
        resolvidoEm: Date.now(),
        googleUrl: googleUrl(termo),
        fonte: null,
        fonteUrl: googleUrl(termo),
        imagem: null,
        thumb: null,
        alt: termo,
        aviso: "A busca de imagens falhou. Use o link para abrir o Google Imagens.",
      };
    }
    memoria.set(termo, resultado);
    await gravarMeta(arquivo, resultado).catch(() => {});
    return resultado;
  }).finally(() => emVoo.delete(termo));

  emVoo.set(termo, promessa);
  return promessa;
}

function urlPermitida(url) {
  try {
    const alvo = new URL(url);
    if (!/^https?:$/.test(alvo.protocol)) return false;
    if (alvo.username || alvo.password) return false;
    const host = alvo.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local")) return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    if (host === "[::1]" || host === "::1") return false;
    return true;
  } catch {
    return false;
  }
}

export async function obterImagem(url) {
  if (!urlPermitida(url)) throw new Error("Endereço de imagem não permitido.");
  await garantirCache();
  const chave = hash(url);
  const arquivo = path.join(CACHE_DIR, `img-${chave}`);
  const lado = path.join(CACHE_DIR, `img-${chave}.json`);

  try {
    const [dados, meta] = await Promise.all([fs.readFile(arquivo), fs.readFile(lado, "utf8")]);
    const info = JSON.parse(meta);
    if (Date.now() - info.baixadoEm < IMAGEM_TTL_MS) {
      return { buffer: dados, tipo: info.tipo };
    }
  } catch {
    /* baixa de novo */
  }

  const resposta = await buscarComTimeout(
    url,
    {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: new URL(url).origin + "/",
      },
    },
    18_000,
  );
  if (!resposta.ok) throw new Error(`A imagem respondeu ${resposta.status}.`);

  const tamanho = Number(resposta.headers.get("content-length") ?? 0);
  if (tamanho > MAX_IMAGEM_BYTES) throw new Error("Imagem grande demais.");

  const buffer = Buffer.from(await resposta.arrayBuffer());
  if (buffer.length > MAX_IMAGEM_BYTES) throw new Error("Imagem grande demais.");
  const tipo = detectarTipo(buffer);
  if (!tipo) throw new Error("O conteúdo recebido não é uma imagem.");

  await Promise.all([
    fs.writeFile(arquivo, buffer),
    fs.writeFile(lado, JSON.stringify({ tipo, baixadoEm: Date.now() }), "utf8"),
  ]).catch(() => {});

  return { buffer, tipo };
}

export async function limparCacheImagens() {
  await fs.rm(CACHE_DIR, { recursive: true, force: true });
  memoria.clear();
}

export const PASTA_CACHE_IMAGENS = CACHE_DIR;
