import { useMemo, useState } from "react";
import Icone from "./Icone.jsx";
import { CopiarPix, Miniatura, PassoQtd } from "./Pecas.jsx";
import { fmt, nomeCurto, primeiroNome } from "../lib/formato.js";
import { FAVORECIDO, DADOS_CONTA } from "../lib/pix.js";
import { sugestaoDoMomento } from "../lib/sugestoes.js";
import qrPix from "../assets/pix-qr.svg";

const TITULOS = { itens: "Seu carrinho", pagamento: "Pagamento", pix: "Pagar com PIX", mes: "Fim do mês", ok: "Tudo certo" };
const ANTERIOR = { pagamento: "itens", pix: "pagamento", mes: "pagamento" };

export default function Carrinho({
  aberto, passo, setPasso, onFechar, itens, total, produtos, stats, cliente, emAberto,
  onMais, onMenos, onAdd, pedirLogin, finalizar, onVerPedidos,
}) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(false);
  const [feito, setFeito] = useState(null);

  const idsNoCarrinho = useMemo(() => new Set(itens.map(i => i.id)), [itens]);
  const sugestao = useMemo(
    () => (produtos?.length ? sugestaoDoMomento({ produtos, idsNoCarrinho, stats }) : null),
    [produtos, idsNoCarrinho, stats],
  );

  const irPara = (p) => { setErro(false); setPasso(p); };
  const continuar = () => (cliente ? irPara("pagamento") : pedirLogin(() => irPara("pagamento")));

  const confirmar = async (pagamento) => {
    if (salvando) return;
    setSalvando(true);
    setErro(false);
    try {
      const pedido = await finalizar(pagamento);
      setFeito(pedido);
      setPasso("ok");
    } catch {
      setErro(true);
    } finally {
      setSalvando(false);
    }
  };

  const botaoConfirmar = (pagamento, texto) => (
    <button type="button" className="btn-principal" disabled={salvando || !itens.length} onClick={() => confirmar(pagamento)}>
      {salvando ? <><span className="girando" />Registrando pedido…</> : texto}
    </button>
  );

  let corpo, rodape;

  if (passo === "itens") {
    if (!itens.length) {
      corpo = <div className="vazio"><p>Seu carrinho está vazio.</p></div>;
      rodape = <button type="button" className="btn-secundario" onClick={onFechar}>Ver produtos</button>;
    } else {
      corpo = (
        <>
          {itens.map(i => (
            <div className="item" key={i.id}>
              <Miniatura p={i} />
              <div>
                <div className="item__nome">{i.nome}</div>
                <div className="item__preco"><b>{fmt(i.preco * i.qty)}</b>{i.qty > 1 && ` (${fmt(i.preco)} cada)`}</div>
              </div>
              <PassoQtd mini qtd={i.qty} nome={i.nome} noLimite={i.qty >= (i.estoque || 0)} onMais={() => onMais(i)} onMenos={() => onMenos(i.id)} />
            </div>
          ))}
          {sugestao && (
            <div className="sugestao">
              <p className="sugestao__texto">{sugestao.texto}</p>
              <div className="sugestao__linha">
                <Miniatura p={sugestao.produto} />
                <div className="sugestao__nome">{nomeCurto(sugestao.produto.nome)}<small>{fmt(sugestao.produto.preco)}</small></div>
                <button type="button" className="sugestao__btn" onClick={() => onAdd(sugestao.produto)}>
                  <Icone nome="mais" tamanho={16} espessura={2.6} />Levar
                </button>
              </div>
            </div>
          )}
        </>
      );
      rodape = (
        <>
          <div className="total"><span>Total</span><strong>{fmt(total)}</strong></div>
          <button type="button" className="btn-principal" onClick={continuar}>
            {cliente ? "Escolher pagamento" : "Entrar pra finalizar"}<Icone nome="seta" tamanho={20} espessura={2.4} />
          </button>
        </>
      );
    }
  }

  if (passo === "pagamento") {
    corpo = (
      <>
        <p className="passo__intro">Como você quer pagar, {primeiroNome(cliente?.nome)}?</p>
        <button type="button" className="opcao opcao--pix" onClick={() => irPara("pix")}>
          <span className="opcao__icone"><Icone nome="pix" tamanho={26} /></span>
          <span>
            <span className="opcao__titulo">PIX agora</span>
            <span className="opcao__desc">Você paga agora pelo app do seu banco.</span>
          </span>
          <Icone nome="seta" tamanho={20} />
        </button>
        <button type="button" className="opcao opcao--mes" onClick={() => irPara("mes")}>
          <span className="opcao__icone"><Icone nome="calendario" tamanho={26} /></span>
          <span>
            <span className="opcao__titulo">No fim do mês</span>
            <span className="opcao__desc">Fica anotado e você acerta tudo junto no fim do mês, pelo PIX.</span>
            {emAberto > 0 && <span className="opcao__extra">Você já tem {fmt(emAberto)} anotado.</span>}
          </span>
          <Icone nome="seta" tamanho={20} />
        </button>
      </>
    );
    rodape = <div className="total total--so"><span>Total do pedido</span><strong>{fmt(total)}</strong></div>;
  }

  if (passo === "pix") {
    corpo = (
      <div className="pix">
        <p className="pix__rotulo">Valor a pagar</p>
        <p className="pix__valor">{fmt(total)}</p>
        <div className="pix__qr"><img src={qrPix} alt="QR Code PIX do Mercadinho" width="206" height="206" /></div>
        <CopiarPix />
        <ol className="pix__passos">
          <li>No app do seu banco, escolha <b>PIX Copia e Cola</b> ou leia o QR Code.</li>
          <li>Digite o valor de <b>{fmt(total)}</b>.</li>
          <li>Confira o nome <b>{FAVORECIDO}</b> e pague.</li>
        </ol>
        <details className="pix__conta">
          <summary>Prefere transferir pra conta?</summary>
          <dl>
            <dt>Banco</dt><dd>{DADOS_CONTA.banco} (Sicoob)</dd>
            <dt>Cooperativa</dt><dd>{DADOS_CONTA.cooperativa}</dd>
            <dt>Conta</dt><dd>{DADOS_CONTA.conta}</dd>
          </dl>
        </details>
        {erro && <ErroSalvar />}
      </div>
    );
    rodape = botaoConfirmar("na_hora", "Já paguei, confirmar pedido");
  }

  if (passo === "mes") {
    corpo = (
      <div className="mes">
        <div className="mes__icone"><Icone nome="calendario" tamanho={30} /></div>
        <p className="mes__titulo">Anotar pro fim do mês</p>
        <p className="mes__texto">Esse pedido entra na sua conta e você acerta tudo junto no fim do mês, pelo PIX.</p>
        <div className="resumo">
          <div><span>Este pedido</span><strong>{fmt(total)}</strong></div>
          {emAberto > 0 && <div><span>Já anotado</span><strong>{fmt(emAberto)}</strong></div>}
          <div className="destaque"><span>Total em aberto</span><strong>{fmt(emAberto + total)}</strong></div>
        </div>
        {erro && <ErroSalvar />}
      </div>
    );
    rodape = botaoConfirmar("fim_do_mes", "Confirmar pedido");
  }

  if (passo === "ok" && feito) {
    corpo = (
      <div className="sucesso">
        <div className="sucesso__check"><Icone nome="check" tamanho={44} espessura={2.8} /></div>
        <p className="sucesso__titulo">Pedido registrado!</p>
        <p className="sucesso__texto">
          Valeu, {primeiroNome(feito.clienteNome)}! {feito.pagamento === "na_hora" ? "Pago no PIX." : "Ficou anotado pro fim do mês."}
        </p>
        <div className="resumo">
          {feito.itens.map(i => (
            <div key={i.id}><span>{i.qty}× {nomeCurto(i.nome)}</span><strong>{fmt(i.preco * i.qty)}</strong></div>
          ))}
          <div className={feito.pagamento === "na_hora" ? "forte" : "destaque"}><span>Total</span><strong>{fmt(feito.total)}</strong></div>
        </div>
      </div>
    );
    rodape = (
      <>
        <button type="button" className="btn-principal" onClick={onFechar}>Voltar pra loja</button>
        <button type="button" className="btn-texto" onClick={onVerPedidos}>Ver meus pedidos</button>
      </>
    );
  }

  return (
    <div className={`gaveta${aberto ? " aberta" : ""}`} aria-hidden={!aberto}>
      <div className="veu" onClick={onFechar} />
      <aside className="gaveta__painel" role="dialog" aria-modal="true" aria-label={TITULOS[passo]}>
        <div className="gaveta__topo">
          {ANTERIOR[passo] && (
            <button type="button" className="icone-btn" onClick={() => irPara(ANTERIOR[passo])} aria-label="Voltar"><Icone nome="voltar" /></button>
          )}
          <h2 className="gaveta__titulo">{TITULOS[passo]}</h2>
          <button type="button" className="icone-btn" onClick={onFechar} aria-label="Fechar carrinho"><Icone nome="fechar" /></button>
        </div>
        <div className="gaveta__corpo">{corpo}</div>
        {rodape && <div className="gaveta__rodape">{rodape}</div>}
      </aside>
    </div>
  );
}

function ErroSalvar() {
  return (
    <div className="erro-caixa" role="alert">
      Não deu pra registrar o pedido. Confira sua internet e tente de novo. Se continuar, anote o pedido e avise o responsável pelo mercadinho.
    </div>
  );
}
