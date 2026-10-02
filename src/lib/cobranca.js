// Cobrança do fim do mês: agrupa os pedidos "Fim do mês" por mês e por cliente.
// Pedidos "Na hora" já foram pagos na hora e nunca entram aqui.
import { chaveMes, msDaVenda, msDoTexto } from "./datas.js";
import { fmt, primeiroNome } from "./formato.js";
import { CHAVE_PIX } from "./pix.js";

export const ASSINATURA = "Vitor";
// WhatsApp do mercadinho, pra onde o cliente avisa que pagou. Vazio: o WhatsApp abre e a pessoa escolhe o contato.
export const WHATSAPP_MERCADINHO = "";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const rotuloMes = (chave) => { const [a, m] = chave.split("-"); return `${MESES[+m - 1]}/${a}`; };

const fiado = (v) => v.pagamento === "fim_do_mes";
const soma = (lista) => Math.round(lista.reduce((a, v) => a + (v.total || 0), 0) * 100) / 100;

// Meses que têm pedido "Fim do mês", do mais recente pro mais antigo
export function mesesDeCobranca(vendas) {
  const m = new Map();
  for (const v of vendas) {
    if (!fiado(v)) continue;
    const k = chaveMes(msDaVenda(v));
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(v);
  }
  return [...m.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([chave, lista]) => ({
      chave,
      pedidos: lista.length,
      aberto: soma(lista.filter(v => !v.pago)),
      pago: soma(lista.filter(v => v.pago)),
    }));
}

// Mês que abre por padrão: o mês fechado mais recente que ainda tem valor em aberto
// (no começo de outubro, cobra setembro). Sem nada em aberto, o mês mais recente.
export function mesPadrao(meses, agora = new Date()) {
  const atual = chaveMes(agora.getTime());
  return meses.find(m => m.chave < atual && m.aberto > 0)?.chave
    || meses.find(m => m.aberto > 0)?.chave
    || meses[0]?.chave
    || atual;
}

export function cobrancaDoMes(vendas, chave, clientes = []) {
  const cadastro = new Map(clientes.map(c => [c.id, c]));
  const grupos = new Map();
  for (const v of vendas) {
    if (!fiado(v) || chaveMes(msDaVenda(v)) !== chave) continue;
    if (!grupos.has(v.clienteId)) grupos.set(v.clienteId, []);
    grupos.get(v.clienteId).push(v);
  }
  return [...grupos.entries()].map(([clienteId, pedidos]) => {
    const c = cadastro.get(clienteId);
    const abertos = pedidos.filter(v => !v.pago), pagos = pedidos.filter(v => v.pago);
    // data do acerto mais recente ("dd/mm/aaaa, hh:mm:ss" não ordena como texto)
    const pagoEm = pagos.map(v => v.dataPagamento).filter(Boolean)
      .sort((a, b) => (msDoTexto(a) ?? 0) - (msDoTexto(b) ?? 0)).pop() || "";
    // "Marcar o mês todo" grava a mesma dataPagamento em todos: assim "Reabrir" desfaz só esse acerto
    const ultimoAcerto = pagoEm ? pagos.filter(v => v.dataPagamento === pagoEm) : pagos;
    return {
      clienteId,
      nome: c?.nome || pedidos[0].clienteNome || "Cliente",
      telefone: c?.telefone || pedidos[0].clienteTel || "",
      pedidos: [...pedidos].sort((a, b) => msDaVenda(a) - msDaVenda(b)),
      aberto: soma(abertos),
      pago: soma(pagos),
      idsAbertos: abertos.map(v => v.id),
      idsUltimoAcerto: ultimoAcerto.map(v => v.id),
      pagoEm,
    };
  }).sort((a, b) => b.aberto - a.aberto || a.nome.localeCompare(b.nome, "pt-BR"));
}

// Modelo de mensagem combinado com o Vitor
export function mensagemCobranca(nome, chave, valor) {
  return `Oi, ${primeiroNome(nome)}! 😊 Aqui é o ${ASSINATURA}, do Mercadinho da Transcredi 🛒 ` +
    `Ficou em aberto referente às compras de ${rotuloMes(chave).toLowerCase()}: *${fmt(valor)}*. ` +
    `Pra acertar é só o PIX abaixo 🙏\n\n${CHAVE_PIX}`;
}

// (49) 99999-9999 -> 5549999999999. Número que não dá pra usar -> null
export function numeroWhatsApp(telefone) {
  let d = String(telefone || "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  return /^55\d{10,11}$/.test(d) ? d : null;
}

export function linkWhatsApp(telefone, texto) {
  const n = numeroWhatsApp(telefone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(texto)}` : null;
}

// ── cliente avisando que pagou ──
const listaDeMeses = (chaves) => {
  const nomes = [...chaves].sort().map(k => rotuloMes(k).toLowerCase());
  return nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}` : nomes[0];
};

export function mensagemAvisoPagamento(nome, chaves, valor) {
  return `Oi, ${ASSINATURA}! ${nome.trim()} aqui 😊 Acabei de fazer o PIX de *${fmt(valor)}* do Mercadinho, ` +
    `referente a ${listaDeMeses(chaves)}. Segue o comprovante 👇`;
}

export function linkWhatsAppMercadinho(texto) {
  const n = numeroWhatsApp(WHATSAPP_MERCADINHO);
  return `https://wa.me/${n || ""}?text=${encodeURIComponent(texto)}`;
}

// Avisos de pagamento que ainda têm pedido em aberto nos meses avisados (o mais recente de cada cliente).
// Some sozinho quando o dono quita, sem precisar gravar nada no aviso.
export function avisosPendentes(avisos, vendas) {
  const ultimo = new Map();
  for (const a of avisos) {
    const atual = ultimo.get(a.clienteId);
    if (!atual || (a.dataLocal || 0) > (atual.dataLocal || 0)) ultimo.set(a.clienteId, a);
  }
  const abertos = new Set(vendas.filter(v => fiado(v) && !v.pago).map(v => `${v.clienteId}|${chaveMes(msDaVenda(v))}`));
  return [...ultimo.values()].filter(a => (a.meses || []).some(k => abertos.has(`${a.clienteId}|${k}`)));
}
