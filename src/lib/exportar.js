// Exportação das vendas. CSV (mesmos 7 campos de sempre) e Excel .xlsx com abas.
import { msDaVenda, msDoTexto } from "./datas.js";
import { rotuloMes } from "./cobranca.js";
import { estaPago, resumir, serieMensal, mesesComVendas } from "./relatorios.js";

const CAMPOS = ["Data", "Cliente", "Telefone", "Itens", "Total", "Pagamento", "Pago"];
const itensTexto = (v) => (v.itens || []).map(i => `${i.qty}x ${(i.nome || "").trim()}`).join("; ");
const pagamentoTexto = (v) => (v.pagamento === "na_hora" ? "Na hora" : "Fim do mês");
const cronologico = (lista) => [...lista].sort((a, b) => msDaVenda(a) - msDaVenda(b));
// "01/09/2026 11:41" (sem vírgula, assim o Excel reconhece como data e hora)
const dataTexto = (ms) => new Date(ms).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");

function baixar(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const nomeArquivo = (periodo, ext) =>
  `mercadinho-vendas-${periodo === "tudo" ? "historico-completo" : rotuloMes(periodo).toLowerCase().replace("/", "-")}.${ext}`;

// CSV no padrão do Excel em português: separador ";", vírgula decimal, BOM pra acentuação
export function baixarCSV(vendas, periodo) {
  const cel = (x) => { const s = String(x ?? ""); return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const linhas = [CAMPOS, ...cronologico(vendas).map(v => [
    dataTexto(msDaVenda(v)), v.clienteNome || "", v.clienteTel || "", itensTexto(v),
    (v.total || 0).toFixed(2).replace(".", ","), pagamentoTexto(v), estaPago(v) ? "Sim" : "Não",
  ])];
  const csv = linhas.map(l => l.map(cel).join(";")).join("\r\n");
  baixar(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), nomeArquivo(periodo, "csv"));
}

// Excel guarda data/hora sem fuso: monta a data em UTC com os números do horário local
const paraExcel = (ms) => { const d = new Date(ms); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds())); };
const REAL = "[$R$-416] #,##0.00";
const cab = (value) => ({ value, fontWeight: "bold", textColor: "#FFFFFF", backgroundColor: "#003641", alignVertical: "center", height: 22 });
const titulo = (value) => ({ value, fontWeight: "bold", fontSize: 13 });
const dinheiro = (value) => ({ value, type: Number, format: REAL });

export async function baixarExcel(vendasPeriodo, periodo, todasVendas) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const blob = await writeExcelFile(montarPlanilhas(vendasPeriodo, periodo, todasVendas), { fontFamily: "Calibri", fontSize: 11 }).toBlob();
  baixar(blob, nomeArquivo(periodo, "xlsx"));
}

// As abas do Excel (separado do download pra poder testar fora do navegador)
export function montarPlanilhas(vendasPeriodo, periodo, todasVendas) {
  const r = resumir(vendasPeriodo);
  const nomePeriodo = periodo === "tudo" ? "Histórico completo" : rotuloMes(periodo);

  // 1. Vendas: os 7 campos de sempre, na ordem de sempre, + "Pago em" no fim (ajuda a bater com o extrato)
  const vendas = [
    [...CAMPOS, "Pago em"].map(cab),
    ...cronologico(vendasPeriodo).map(v => {
      const pagoEm = v.pago && v.dataPagamento ? msDoTexto(v.dataPagamento) : null;
      return [
        { value: paraExcel(msDaVenda(v)), type: Date, format: "dd/mm/yyyy hh:mm" },
        { value: v.clienteNome || "" },
        { value: v.clienteTel || "", format: "@" },
        { value: itensTexto(v), wrap: true },
        dinheiro(v.total || 0),
        { value: pagamentoTexto(v) },
        { value: estaPago(v) ? "Sim" : "Não", align: "center" },
        pagoEm ? { value: paraExcel(pagoEm), type: Date, format: "dd/mm/yyyy" } : null,
      ];
    }),
  ];

  // 2. Resumo do período + comparativo mês a mês
  const ultimoMes = periodo === "tudo" ? (mesesComVendas(todasVendas)[0]) : periodo;
  const meses = ultimoMes ? serieMensal(todasVendas, ultimoMes, 12).filter(m => m.pedidos) : [];
  const resumo = [
    [titulo(`Mercadinho Transcredi — ${nomePeriodo}`)],
    [],
    [{ value: "Faturamento", fontWeight: "bold" }, dinheiro(r.faturamento)],
    [{ value: "Pedidos" }, { value: r.pedidos }],
    [{ value: "Ticket médio" }, dinheiro(r.ticket)],
    [{ value: "Itens vendidos" }, { value: r.itens }],
    [{ value: "Clientes que compraram" }, { value: r.clientes.length }],
    [],
    [{ value: "Recebido", fontWeight: "bold" }, dinheiro(r.recebido)],
    [{ value: "A receber (fim do mês em aberto)", fontWeight: "bold" }, dinheiro(r.aReceber)],
    [{ value: "Pago na hora" }, dinheiro(r.naHora)],
    [{ value: "Anotado pro fim do mês" }, dinheiro(r.fimMes)],
    [],
    [titulo("Mês a mês")],
    ["Mês", "Pedidos", "Faturamento", "Recebido", "A receber"].map(cab),
    ...meses.map(m => [{ value: rotuloMes(m.chave) }, { value: m.pedidos }, dinheiro(m.total), dinheiro(m.recebido), dinheiro(m.aReceber)]),
  ];

  // 3. Por cliente  4. Produtos  5. Por dia
  const porCliente = [
    ["Cliente", "Telefone", "Pedidos", "Total", "Pago", "Em aberto"].map(cab),
    ...r.clientes.map(c => [{ value: c.nome }, { value: c.telefone, format: "@" }, { value: c.pedidos }, dinheiro(c.total), dinheiro(Math.round((c.total - c.aberto) * 100) / 100), dinheiro(c.aberto)]),
  ];
  const produtos = [
    ["Produto", "Quantidade", "Faturamento", "Pedidos"].map(cab),
    ...r.produtos.map(p => [{ value: p.nome }, { value: p.qtd }, dinheiro(p.total), { value: p.pedidos }]),
  ];
  const dias = new Map();
  for (const v of vendasPeriodo) {
    const d = new Date(msDaVenda(v)), k = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const x = dias.get(k) || { pedidos: 0, total: 0 }; x.pedidos++; x.total += v.total || 0; dias.set(k, x);
  }
  const porDia = [
    ["Data", "Pedidos", "Faturamento"].map(cab),
    ...[...dias.entries()].sort((a, b) => a[0] - b[0]).map(([k, x]) => [{ value: paraExcel(k), type: Date, format: "dd/mm/yyyy" }, { value: x.pedidos }, dinheiro(Math.round(x.total * 100) / 100)]),
  ];

  return [
    { data: vendas, sheet: "Vendas", stickyRowsCount: 1, columns: [{ width: 17 }, { width: 26 }, { width: 17 }, { width: 46 }, { width: 13 }, { width: 13 }, { width: 8 }, { width: 12 }] },
    { data: resumo, sheet: "Resumo", columns: [{ width: 34 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }] },
    { data: porCliente, sheet: "Por cliente", stickyRowsCount: 1, columns: [{ width: 28 }, { width: 17 }, { width: 10 }, { width: 13 }, { width: 13 }, { width: 13 }] },
    { data: produtos, sheet: "Produtos", stickyRowsCount: 1, columns: [{ width: 40 }, { width: 12 }, { width: 14 }, { width: 10 }] },
    { data: porDia, sheet: "Por dia", stickyRowsCount: 1, columns: [{ width: 13 }, { width: 10 }, { width: 14 }] },
  ];
}
