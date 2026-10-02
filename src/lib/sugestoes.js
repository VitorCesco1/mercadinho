// Categorias, combos dos mais vendidos e mensagens por horário.
import { semAcento, nomeCurto } from "./formato.js";

export const CATEGORIAS = [
  { id: "bebida", nome: "Bebidas" },
  { id: "doce",   nome: "Doces" },
  { id: "lanche", nome: "Lanches" },
];

// Ordem importa: "Bolacha recheada" é doce antes de virar lanche; "Bebida láctea" é bebida.
const DOCE = /(chocolate|trento|\bbis\b|kit ?kat|sonho de valsa|ouro branco|batom|baton|charge|tortuguita|brigadeiro|\bbala|fini|trident|chiclete|pirulito|pacoca|bombom|snickers|twix|recheada|wafer|alfajor|\bdoce|prestigio|diamante negro|laka|talento|suflair|negresco|oreo)/;
const BEBIDA = /(coca|refri|guarana|\bagua|suco|\bcha\b|\bmate\b|monster|energetico|red ?bull|sprite|fanta|pepsi|schweppes|tonica|soda|\bcafe|cappuccino|bebida|lactea|toddynho|achocolatado|yo ?pro|powerade|gatorade|isotonico|h2oh|kombucha)/;

export function categoriaDe(p) {
  if (["bebida", "doce", "lanche"].includes(p.categoria)) return p.categoria;
  const n = semAcento(p.nome);
  if (DOCE.test(n)) return "doce";
  if (BEBIDA.test(n)) return "bebida";
  return "lanche";
}

const COMPLEMENTO = { bebida: "doce", doce: "bebida", lanche: "bebida" };

// Calculado no painel do dono a partir de todas as vendas e gravado em estatisticas/loja.
// Só ids de produto e contagens, nenhum dado de cliente.
// pares: { idProduto: [{ id, n }] } (o Firestore não aceita lista dentro de lista)
export function calcularEstatisticas(vendas) {
  const vendidos = {}, pares = {};
  for (const v of vendas) {
    const ids = [...new Set((v.itens || []).map(i => i.id).filter(Boolean))];
    for (const i of v.itens || []) if (i.id) vendidos[i.id] = (vendidos[i.id] || 0) + (i.qty || 0);
    for (const a of ids) for (const b of ids) if (a !== b) {
      pares[a] ??= {};
      pares[a][b] = (pares[a][b] || 0) + 1;
    }
  }
  const paresTop = {};
  for (const [a, m] of Object.entries(pares).sort(([x], [y]) => x.localeCompare(y))) {
    paresTop[a] = Object.entries(m).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, 4).map(([id, n]) => ({ id, n }));
  }
  return { vendidos, pares: paresTop };
}

const disponivel = (p) => p.disponivel && (p.estoque || 0) > 0;
const vendidosDe = (stats, p) => stats?.vendidos?.[p.id] || 0;
const maisVendido = (lista, stats) => [...lista].sort((a, b) => vendidosDe(stats, b) - vendidosDe(stats, a))[0] || null;

export function maisPedidos(produtos, stats, n = 8) {
  if (!stats?.vendidos) return [];
  return produtos
    .filter(p => p.disponivel && vendidosDe(stats, p) > 0)
    .sort((a, b) => vendidosDe(stats, b) - vendidosDe(stats, a))
    .slice(0, n);
}

// Ao adicionar um produto: sugere o complemento (bebida <-> doce) que mais sai junto com ele,
// ou, sem par conhecido, o mais vendido da categoria complementar.
export function sugestaoAoAdicionar(produto, { produtos, idsNoCarrinho, stats }) {
  const alvo = COMPLEMENTO[categoriaDe(produto)];
  const candidatos = produtos.filter(p => p.id !== produto.id && disponivel(p) && !idsNoCarrinho.has(p.id) && categoriaDe(p) === alvo);
  if (!candidatos.length) return null;
  const pares = stats?.pares?.[produto.id] || [];
  for (const { id, n } of pares) {
    const q = candidatos.find(c => c.id === id);
    if (q && n >= 2) return { produto: q, texto: `Quem leva ${nomeCurto(produto.nome)} costuma levar ${nomeCurto(q.nome)} junto 😉` };
  }
  const q = maisVendido(candidatos, stats);
  if (!q) return null;
  return { produto: q, texto: alvo === "doce" ? `Combina com ${nomeCurto(q.nome)}? 🍫` : `Pra acompanhar, que tal ${nomeCurto(q.nome)}? 🥤` };
}

// Mensagem do carrinho que muda com o dia e o horário do celular.
const REGRAS = [
  { quando: (d, h) => d === 5 && h >= 11, busca: /chocolate|trento|kit ?kat|batom|\bbis\b|sonho de valsa|ouro branco|charge|brigadeiro/,
    texto: () => "Sexta-feira! Que tal levar um chocolate pra tua namorada ou namorado? 🍫" },
  { quando: (d, h) => h < 11, busca: /monster|red ?bull|energetico|\bcafe|cappuccino/,
    texto: (p) => `Bora começar bem o dia com um ${nomeCurto(p.nome).replace(/^energ[eé]tico /i, "")}? ⚡` },
  { quando: (d, h) => h >= 11 && h < 14, categoria: "doce",
    texto: () => "Depois do almoço, um docinho cai bem 🍫" },
  { quando: (d, h) => h >= 14 && h < 17, categoria: "lanche",
    texto: () => "Bateu a fome da tarde? Um lanchinho resolve 😋" },
  { quando: (d, h) => h >= 17, categoria: "bebida",
    texto: () => "Saideira antes de ir pra casa? 🥤" },
];

export function sugestaoDoMomento({ produtos, idsNoCarrinho, stats, agora = new Date() }) {
  const d = agora.getDay(), h = agora.getHours();
  for (const r of REGRAS) {
    if (!r.quando(d, h)) continue;
    const cand = produtos.filter(p => disponivel(p) && !idsNoCarrinho.has(p.id) &&
      (r.busca ? r.busca.test(semAcento(p.nome)) : categoriaDe(p) === r.categoria));
    const p = maisVendido(cand, stats);
    if (p) return { produto: p, texto: r.texto(p) };
  }
  return null;
}
