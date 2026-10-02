import { useMemo } from "react";
import Icone from "../componentes/Icone.jsx";
import { CopiarPix } from "../componentes/Pecas.jsx";
import { fmt, nomeCurto } from "../lib/formato.js";
import { chaveMes, dataCurta, msDaVenda, nomeMes } from "../lib/datas.js";

export default function MeusPedidos({ cliente, vendas, emAberto, onVoltar, onSair }) {
  const meses = useMemo(() => {
    const grupos = new Map();
    for (const v of vendas) {
      const k = chaveMes(msDaVenda(v));
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(v);
    }
    return [...grupos.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [vendas]);

  return (
    <main className="pagina">
      <div className="pagina__topo">
        <button type="button" className="icone-btn" onClick={onVoltar} aria-label="Voltar pra loja"><Icone nome="voltar" /></button>
        <h1 className="pagina__titulo">Meus pedidos</h1>
      </div>

      {emAberto > 0 && (
        <section className="cartao saldo">
          <div className="saldo__linha"><span>Em aberto pro fim do mês</span><strong>{fmt(emAberto)}</strong></div>
          <p>Pra acertar, faça um PIX de {fmt(emAberto)} com o código do mercadinho.</p>
          <CopiarPix />
        </section>
      )}

      {!vendas.length && <div className="vazio">Você ainda não fez nenhum pedido.</div>}

      {meses.map(([k, lista]) => (
        <section key={k} className="mes-grupo">
          <h2><span>{nomeMes(k)}</span><span>{fmt(lista.reduce((a, v) => a + (v.total || 0), 0))}</span></h2>
          {lista.map(v => {
            const pago = v.pagamento === "na_hora" || v.pago;
            const status = v.pagamento === "na_hora" ? "Pago na hora" : v.pago ? "Pago" : "Fim do mês";
            return (
              <article key={v.id} className="pedido">
                <div className="pedido__topo">
                  <span className="pedido__data">{dataCurta(msDaVenda(v))}</span>
                  <span className={`status ${pago ? "status--pago" : "status--aberto"}`}>{status}</span>
                </div>
                <p className="pedido__itens">{(v.itens || []).map(i => `${i.qty}× ${nomeCurto(i.nome)}`).join(", ")}</p>
                <div className="pedido__rodape">
                  <small>{v.pago && v.dataPagamento ? `Acertado em ${v.dataPagamento.split(",")[0]}` : ""}</small>
                  <strong>{fmt(v.total)}</strong>
                </div>
              </article>
            );
          })}
        </section>
      ))}

      <section className="conta">
        <span className="conta__avatar"><Icone nome="usuario" /></span>
        <div className="conta__dados">
          <strong>{cliente.nome}</strong>
          <span>{cliente.email}</span>
        </div>
        <button type="button" className="btn-sair" onClick={onSair}><Icone nome="sair" tamanho={18} />Sair</button>
      </section>
    </main>
  );
}
