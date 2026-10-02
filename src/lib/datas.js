// Os pedidos gravaram a data de jeitos diferentes ao longo do tempo:
// - até 30/07/2026: dataCriacao = número (Date.now()), sem dataLocal
// - desde 31/07/2026: dataCriacao = Timestamp do servidor + dataLocal (número)
// - todos têm "data" em texto pt-BR ("02/10/2026, 14:35:12")
// msDaVenda lê qualquer um deles, sem precisar mexer nos dados gravados.
export function msDoTexto(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})[, ]+(\d{2}):(\d{2})(?::(\d{2}))?/.exec(texto || "");
  return m ? new Date(+m[3], m[2] - 1, +m[1], +m[4], +m[5], +(m[6] || 0)).getTime() : null;
}

export function msDaVenda(v) {
  if (typeof v.dataLocal === "number") return v.dataLocal;
  const c = v.dataCriacao;
  if (typeof c?.toMillis === "function") return c.toMillis();
  if (typeof c === "number") return c;
  return msDoTexto(v.data) ?? 0;
}

export const ordenarVendas = (lista) => lista.sort((a, b) => msDaVenda(b) - msDaVenda(a));

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const chaveMes = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
export const nomeMes = (chave) => { const [a, m] = chave.split("-"); return `${MESES[+m - 1]} de ${a}`; };

export function dataCurta(ms) {
  const d = new Date(ms);
  const hoje = new Date();
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === hoje.toDateString()) return `Hoje, ${hora}`;
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return `Ontem, ${hora}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${hora}`;
}
