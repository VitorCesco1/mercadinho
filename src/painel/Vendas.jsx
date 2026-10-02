import { useEffect, useMemo, useState } from "react";
import Icone from "../componentes/Icone.jsx";
import { agoraTexto, fmt, nomeCurto, semAcento } from "../lib/formato.js";
import { chaveMes, dataCurta, msDaVenda } from "../lib/datas.js";
import { rotuloMes } from "../lib/cobranca.js";
import { doPeriodo, estaPago, mesesComVendas } from "../lib/relatorios.js";

const POR_PAGINA = 60;

export default function Vendas({ vendas, api }) {
  const [agora] = useState(() => new Date());
  const atual = chaveMes(agora.getTime());
  const meses = useMemo(() => mesesComVendas(vendas), [vendas]);
  const [escolhido, setEscolhido] = useState(null);
  const periodo = escolhido ?? (meses.includes(atual) ? atual : meses[0] ?? atual);
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [limite, setLimite] = useState(POR_PAGINA);

  const termo = semAcento(busca.trim());
  const lista = useMemo(() => doPeriodo(vendas, periodo)
    .filter(v => filtro === "todos" || (filtro === "aberto" ? !estaPago(v) : estaPago(v)))
    .filter(v => !termo || semAcento(`${v.clienteNome} ${(v.itens || []).map(i => i.nome).join(" ")}`).includes(termo)),
  [vendas, periodo, filtro, termo]);
  const total = lista.reduce((a, v) => a + (v.total || 0), 0);
  const opcoes = [...meses.map(k => ({ chave: k, rotulo: rotuloMes(k) })), { chave: "tudo", rotulo: "Tudo" }];
  const mudar = (fn) => (x) => { fn(x); setLimite(POR_PAGINA); };

  return (
    <section className="vendas">
      <div className="cob-meses" aria-label="Período">
        {opcoes.map(o => (
          <button type="button" key={o.chave} className={`cob-mes cob-mes--simples${o.chave === periodo ? " ativo" : ""}`} onClick={() => mudar(setEscolhido)(o.chave)} aria-pressed={o.chave === periodo}>
            <b>{o.rotulo}</b>
          </button>
        ))}
      </div>
      <div className="cob-filtro cob-filtro--3" role="tablist">
        {[["todos", "Todos"], ["aberto", "Em aberto"], ["pago", "Pagos"]].map(([k, l]) => (
          <button type="button" key={k} role="tab" aria-selected={filtro === k} className={filtro === k ? "ativo" : ""} onClick={() => mudar(setFiltro)(k)}>{l}</button>
        ))}
      </div>
      <div className="busca busca--painel">
        <Icone nome="busca" tamanho={20} />
        <input type="search" value={busca} onChange={e => mudar(setBusca)(e.target.value)} placeholder="Buscar cliente ou produto" aria-label="Buscar cliente ou produto" />
      </div>
      <p className="vendas__total">{lista.length} {lista.length === 1 ? "pedido" : "pedidos"}, {fmt(total)}</p>

      {!lista.length && <div className="vazio">Nenhum pedido aqui.</div>}
      {lista.slice(0, limite).map(v => <Venda key={v.id} v={v} api={api} />)}
      {lista.length > limite && (
        <button type="button" className="btn-leve vendas__mais" onClick={() => setLimite(l => l + POR_PAGINA)}>Mostrar mais {Math.min(POR_PAGINA, lista.length - limite)}</button>
      )}
    </section>
  );
}

function Venda({ v, api }) {
  const [confirmaExcluir, setConfirmaExcluir] = useState(false);
  useEffect(() => {
    if (!confirmaExcluir) return;
    const t = setTimeout(() => setConfirmaExcluir(false), 4000);
    return () => clearTimeout(t);
  }, [confirmaExcluir]);
  const pago = estaPago(v);
  const status = v.pagamento === "na_hora" ? "Pago na hora" : v.pago ? "Pago" : "Fim do mês";

  return (
    <article className="venda">
      <div className="venda__topo">
        <strong>{v.clienteNome}</strong>
        <b>{fmt(v.total)}</b>
      </div>
      <div className="venda__info">
        <span>{dataCurta(msDaVenda(v))}</span>
        <span className={`status ${pago ? "status--pago" : "status--aberto"}`}>{status}</span>
      </div>
      <p className="venda__itens">{(v.itens || []).map(i => `${i.qty}× ${nomeCurto(i.nome)}`).join(", ")}</p>
      {v.pago && v.dataPagamento && <p className="venda__pago">Acertado em {v.dataPagamento.split(",")[0]}</p>}
      <div className="venda__acoes">
        {v.pagamento === "fim_do_mes" && !v.pago && (
          <button type="button" className="btn-mini btn-mini--ok" onClick={() => api.atualizarVenda(v.id, { pago: true, dataPagamento: agoraTexto() })}>
            <Icone nome="check" tamanho={16} espessura={2.6} />Marcar como pago
          </button>
        )}
        <button type="button" className={`btn-mini btn-mini--perigo${confirmaExcluir ? " confirmar" : ""}`}
          onClick={() => (confirmaExcluir ? api.removerVenda(v.id) : setConfirmaExcluir(true))}>
          <Icone nome="lixo" tamanho={16} />{confirmaExcluir ? "Toque de novo pra excluir" : "Excluir"}
        </button>
      </div>
    </article>
  );
}
