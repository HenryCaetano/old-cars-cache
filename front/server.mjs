import http from "node:http";
import { createReadStream, existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolverImagem, obterImagem } from "./server/imagens.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(AQUI, "dist");
const PORTA = Number(process.env.PORT ?? 4173);
const HOST = process.env.HOST ?? "127.0.0.1";
const API = (process.env.API_ORIGIN ?? "http://localhost:8080").replace(/\/+$/, "");

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
};

function enviarJson(res, status, corpo) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(corpo));
}

async function corpoDaRequisicao(req) {
  const partes = [];
  for await (const parte of req) partes.push(parte);
  return Buffer.concat(partes);
}

const CABECALHOS_REQUISICAO_IGNORADOS = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authorization",
  "proxy-connection",
  "accept-encoding",
  "origin",
  "referer",
]);

async function proxyApi(req, res, url) {
  const destino = API + url.pathname.replace(/^\/api/, "") + url.search;
  const cabecalhos = {};
  for (const [chave, valor] of Object.entries(req.headers)) {
    if (!CABECALHOS_REQUISICAO_IGNORADOS.has(chave) && typeof valor === "string") {
      cabecalhos[chave] = valor;
    }
  }

  const temCorpo = !["GET", "HEAD", "DELETE"].includes(req.method ?? "GET");
  const corpo = temCorpo ? await corpoDaRequisicao(req) : undefined;

  try {
    const resposta = await fetch(destino, {
      method: req.method,
      headers: cabecalhos,
      body: corpo,
      redirect: "manual",
    });

    const saida = {};
    for (const chave of [
      "content-type",
      "location",
      "x-cache",
      "cache-control",
      "etag",
      "last-modified",
    ]) {
      const valor = resposta.headers.get(chave);
      if (valor) saida[chave] = valor;
    }
    res.writeHead(resposta.status, saida);
    if (resposta.status === 204 || resposta.status === 304) {
      res.end();
      return;
    }
    res.end(Buffer.from(await resposta.arrayBuffer()));
  } catch (erro) {
    enviarJson(res, 502, {
      erro: "API indisponível",
      mensagem:
        "Não foi possível falar com a API em " +
        API +
        ". Suba o back-end com ./mvnw spring-boot:run.",
      detalhe: erro?.message ?? null,
    });
  }
}

async function servirFotos(req, res, url) {
  if (url.pathname === "/fotos") {
    try {
      enviarJson(res, 200, await resolverImagem(url.searchParams.get("q")));
    } catch (erro) {
      enviarJson(res, 400, { erro: erro?.message ?? "Falha ao resolver a imagem." });
    }
    return;
  }

  try {
    const { buffer, tipo } = await obterImagem(url.searchParams.get("u"));
    res.writeHead(200, {
      "Content-Type": tipo,
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  } catch (erro) {
    enviarJson(res, 502, { erro: erro?.message ?? "Falha ao carregar a imagem." });
  }
}

async function servirEstatico(req, res, url) {
  const relativo = decodeURIComponent(url.pathname);
  let arquivo = path.join(DIST, relativo === "/" ? "index.html" : relativo);
  if (!arquivo.startsWith(DIST)) {
    res.statusCode = 403;
    res.end("Proibido");
    return;
  }

  try {
    const info = await fs.stat(arquivo);
    if (info.isDirectory()) arquivo = path.join(arquivo, "index.html");
  } catch {
    arquivo = path.join(DIST, "index.html");
  }

  if (!existsSync(arquivo)) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      "<h1>Build ausente</h1><p>Rode <code>npm run build</code> antes de <code>npm start</code>.</p>",
    );
    return;
  }

  const extensao = path.extname(arquivo).toLowerCase();
  res.setHeader("Content-Type", TIPOS[extensao] ?? "application/octet-stream");
  res.setHeader(
    "Cache-Control",
    extensao === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  );
  createReadStream(arquivo).pipe(res);
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await proxyApi(req, res, url);
      return;
    }
    if (url.pathname === "/fotos" || url.pathname === "/fotos/arquivo") {
      await servirFotos(req, res, url);
      return;
    }
    await servirEstatico(req, res, url);
  } catch (erro) {
    enviarJson(res, 500, { erro: erro?.message ?? "Erro interno." });
  }
});

servidor.listen(PORTA, HOST, () => {
  console.log(`Arquivo de Carros Clássicos em http://${HOST}:${PORTA}`);
  console.log(`API encaminhada para ${API}`);
});
