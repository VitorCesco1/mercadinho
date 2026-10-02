// Números do dashboard e do Excel. Uma passada só pelos pedidos do período.
import { chaveMes, msDaVenda } from "./datas.js";

const r2 = (n) => Math.round(n * 100) / 100;
export const estaPago = (v) => v.pagamento === "na_hora" || !!v.pago;
export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const DIAS_SEMANA_LONGO = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export function mesesComVendas(vendas) {
  return [...new Set(vendas.map(v => chaveMes(msDaVenda(v))))].sort().reverse();
}

export const doPeriodo = (vendas, periodo) =>
  periodo === "tudo" ? vendas : vendas.filter(v => chaveMes(msDaVenda(v)) === periodo);

export function mesAnterior(chave) {
  const [a, m] = chave.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
}

export function resumir(lista) {
  let faturamento = 0, recebido = 0, aReceber = 0, naHora = 0, fimMes = 0, itens = 0;
  const porHora = Array.from({ length: 24 }, () => ({ pedidos: 0, total: 0 }));
  const porSemana = Array.from({ length: 7 }, () => ({ pedidos: 0, total: 0 }));
  const porDia = new Map(), produtos = new Map(), clientes = new Map();

  for (const v of lista) {
    const ms = msDaVenda(v), d = new Date(ms), total = v.total || 0;
    faturamento += total;
    if (estaPago(v)) recebido += total; else aReceber += total;
    if (v.pagamento === "na_hora") naHora += total; else fimMes += total;

    porHora[d.getHours()].pedidos++; porHora[d.getHours()].total += total;
    porSemana[d.getDay()].pedidos++; porSemana[d.getDay()].total += total;
    const dia = d.getDate();
    const pd = porDia.get(dia) || { pedidos: 0, total: 0 };
    pd.pedidos++; pd.total += total; porDia.set(dia, pd);

    for (const i of v.itens || []) {
      const k = i.id || i.nome;
      const p = produtos.get(k) || { id: k, nome: (i.nome || "").trim(), qtd: 0, total: 0, pedidos: 0 };
      p.qtd += i.qty || 0; p.total += (i.preco || 0) * (i.qty || 0); p.pedidos++;
      p.nome = (i.nome || p.nome).trim(); // nome mais recente
      produtos.set(k, p);
      itens += i.qty || 0;
    }

    const c = clientes.get(v.clienteId) || { id: v.clienteId, nome: v.clienteNome || "Cliente", telefone: v.clienteTel || "", pedidos: 0, total: 0, aberto: 0 };
    c.pedidos++; c.total += total; if (!estaPago(v)) c.aberto += total;
    clientes.set(v.clienteId, c);
  }

  const arred = (o) => ({ ...o, total: r2(o.total) });
  return {
    pedidos: lista.length,
    faturamento: r2(faturamento),
    ticket: lista.length ? r2(faturamento / lista.length) : 0,
    recebido: r2(recebido), aReceber: r2(aReceber), naHora: r2(naHora), fimMes: r2(fimMes),
    itens,
    porHora: porHora.map(arred),
    porSemana: porSemana.map(arred),
    porDia,
    produtos: [...produtos.values()].map(arred).sort((a, b) => b.qtd - a.qtd || b.total - a.total),
    clientes: [...clientes.values()].map(c => ({ ...arred(c), aberto: r2(c.aberto) })).sort((a, b) => b.total - a.total || b.pedidos - a.pedidos),
  };
}

// Um ponto por dia do mês (dias sem venda entram com zero)
export function diasDoMes(chave, porDia) {
  const [a, m] = chave.split("-").map(Number);
  const ultimo = new Date(a, m, 0).getDate();
  return Array.from({ length: ultimo }, (_, i) => {
    const d = porDia.get(i + 1) || { pedidos: 0, total: 0 };
    const sem = new Date(a, m - 1, i + 1).getDay();
    return { dia: i + 1, semana: sem, pedidos: d.pedidos, total: r2(d.total) };
  });
}

// Últimos n meses até "ate" (inclusive), com recebido x a receber
export function serieMensal(vendas, ate, n = 6) {
  const chaves = [ate];
  while (chaves.length < n) chaves.unshift(mesAnterior(chaves[0]));
  const base = Object.fromEntries(chaves.map(k => [k, { chave: k, pedidos: 0, recebido: 0, aReceber: 0 }]));
  for (const v of vendas) {
    const b = base[chaveMes(msDaVenda(v))];
    if (!b) continue;
    b.pedidos++;
    if (estaPago(v)) b.recebido += v.total || 0; else b.aReceber += v.total || 0;
  }
  return chaves.map(k => ({ ...base[k], recebido: r2(base[k].recebido), aReceber: r2(base[k].aReceber), total: r2(base[k].recebido + base[k].aReceber) }));
}

// Faixa de horas que aparece no gráfico: no mínimo 7h–18h, estica se tiver venda fora disso
export function faixaDeHoras(porHora) {
  const comVenda = porHora.map((h, i) => (h.pedidos ? i : -1)).filter(i => i >= 0);
  const ini = Math.min(7, ...comVenda), fim = Math.max(18, ...comVenda);
  return porHora.slice(ini, fim + 1).map((h, k) => ({ hora: ini + k, ...h }));
}
