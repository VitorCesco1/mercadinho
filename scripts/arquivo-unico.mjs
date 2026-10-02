// Junta o build de demonstração (dist-demo) num único .html que abre direto no navegador,
// sem servidor: CSS e JS vão embutidos na página. Saída: validacao/mercadinho-demo.html
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const DIST = "dist-demo";
let html = readFileSync(`${DIST}/index.html`, "utf8");

html = html.replace(/<script type="module" crossorigin src="\/([^"]+)"><\/script>/g, (_, arq) => {
  const js = readFileSync(`${DIST}/${arq}`, "utf8").replace(/<\/script/gi, "<\\/script");
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link rel="stylesheet" crossorigin href="\/([^"]+)">/g, (_, arq) => `<style>${readFileSync(`${DIST}/${arq}`, "utf8")}</style>`);
// Arquivo solto não tem /manifest nem /icones: troca o favicon por embutido e tira o resto
const favicon = Buffer.from(readFileSync(`${DIST}/favicon.svg`)).toString("base64");
html = html
  .replace('href="/favicon.svg"', `href="data:image/svg+xml;base64,${favicon}"`)
  .replace(/\s*<link rel="(manifest|apple-touch-icon)"[^>]*>/g, "");

if (/(src|href)="\/(?!\/)/.test(html)) throw new Error("Sobrou caminho local no HTML de validação");
mkdirSync("validacao", { recursive: true });
writeFileSync("validacao/mercadinho-demo.html", html);
console.log(`validacao/mercadinho-demo.html (${Math.round(html.length / 1024)} KB)`);
