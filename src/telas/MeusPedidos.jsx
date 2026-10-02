import { useCallback, useEffect, useMemo, useState } from "react";
import Icone from "../componentes/Icone.jsx";
import PagarSaldo from "../componentes/PagarSaldo.jsx";
import { fmt, nomeCurto } from "../lib/formato.js";
import { chaveMes, dataCurta, msDaVenda, nomeMes, quandoFoi } from "../lib/datas.js";
import { ASSINATURA, mesesDeCobranca, rotuloMes } from "../lib/cobranca.js";
import { gravar, ler } from "../lib/memoria.js";
import useFecharNoVoltar from "../lib/useFecharNoVoltar.js";

export default function MeusPedidos({ cliente, vendas, emAberto, api, onVoltar, onSair }) {
  const [pagando, setPagando] = useState(false);
  const fecharPagar = useCallback(() => setPagando(false), []);
  useFecharNoVoltar(pagando, fecharPagar);
  useEffect(() => {
    document.documentElement.style.overflow = pagando ? "hidden" : "";
  }, [pagando]);

  // Último "já paguei" deste cliente, guardado no próprio celular
  const chaveAviso = `aviso-pagamento.${cliente.id}`;
  const [aviso, setAviso] = useState(() => ler(chaveAviso));
  const registrarAviso = (a) => { setAviso(a); gravar(chaveAviso, a); };

  const mesesAbertos = useMemo(
    () => mesesDeCobranca(vendas).filter(m => m.aberto > 0).sort((a, b) => a.chave.localeCompare(b.chave)),
    [vendas],
  );
  // O aviso some daqui quando o dono quita os meses avisados
  const avisou = aviso?.meses?.some(k => mesesAbertos.some(m => m.chave === k)) ? aviso : null;

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
          <div className="saldo__linha"><span>Seu saldo em aberto</span><strong>{fmt(emAberto)}</strong></div>
          {mesesAbertos.length > 1 && (
            <ul className="saldo__meses">
              {mesesAbertos.map(m => <li key={m.chave}><span>{rotuloMes(m.chave)}</span><b>{fmt(m.aberto)}</b></li>)}
            </ul>
          )}
          {avisou
            ? <p className="saldo__avisou"><Icone nome="check" tamanho={17} espessura={2.6} />Você avisou que pagou {fmt(avisou.valor)} {quandoFoi(avisou.ms)}. Assim que o {ASSINATURA} conferir, sai daqui.</p>
            : <p>Pague no PIX e mande o comprovante pro {ASSINATURA} pelo WhatsApp.</p>}
          <button type="button" className="btn-pagar" onClick={() => setPagando(true)}>
            <Icone nome="pix" tamanho={20} />Pagar agora
          </button>
        </section>
      )}

      {pagando && mesesAbertos.length > 0 && (
        <PagarSaldo cliente={cliente} mesesAbertos={mesesAbertos} api={api} onFechar={fecharPagar} onAvisou={registrarAviso} />
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
