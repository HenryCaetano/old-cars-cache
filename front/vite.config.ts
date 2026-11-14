// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolverImagem, obterImagem } from "./server/imagens.mjs";

function enviarJson(res, status, corpo) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(corpo));
}

function pluginFotos() {
  return {
    name: "arquivo-fotos",
    configureServer(servidor) {
      servidor.middlewares.use(async (req, res, proximo) => {
        if (!req.url) return proximo();
        const url = new URL(req.url, "http://localhost:5173");

        if (url.pathname === "/fotos") {
          if (req.method !== "GET") {
            enviarJson(res, 405, { erro: "Método não permitido." });
            return;
          }
          try {
            const resultado = await resolverImagem(url.searchParams.get("q"));
            enviarJson(res, 200, resultado);
          } catch (erro) {
            enviarJson(res, 400, { erro: erro?.message ?? "Falha ao resolver a imagem." });
          }
          return;
        }

        if (url.pathname === "/fotos/arquivo") {
          try {
            const { buffer, tipo } = await obterImagem(url.searchParams.get("u"));
            res.statusCode = 200;
            res.setHeader("Content-Type", tipo);
            res.setHeader("Cache-Control", "public, max-age=86400, immutable");
            res.end(buffer);
          } catch (erro) {
            enviarJson(res, 502, { erro: erro?.message ?? "Falha ao carregar a imagem." });
          }
          return;
        }

        proximo();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), pluginFotos()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.API_ORIGIN ?? "http://localhost:8080",
        changeOrigin: true,
        rewrite: (caminho) => caminho.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
