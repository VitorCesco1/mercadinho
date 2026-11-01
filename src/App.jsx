import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cabecalho from "./componentes/Cabecalho.jsx";
import Carrinho from "./componentes/Carrinho.jsx";
import Login from "./componentes/Login.jsx";
import Toast from "./componentes/Toast.jsx";
import Icone from "./componentes/Icone.jsx";
import Loja from "./telas/Loja.jsx";
import MeusPedidos from "./telas/MeusPedidos.jsx";
import { fmt, agoraTexto } from "./lib/formato.js";
import { ler, gravar, apagar } from "./lib/memoria.js";
import { sugestaoAoAdicionar } from "./lib/sugestoes.js";
import useFecharNoVoltar, { depoisDoVoltar } from "./lib/useFecharNoVoltar.js";

// O painel só é baixado quando o dono abre (o cliente não carrega esse código)
const PainelDono = lazy(() => import("./painel/PainelDono.jsx"));
const DEMO = import.meta.env.MODE === "demo";

// O carrinho e as janelas usam o histórico (botão voltar do celular fecha a janela).
// Sem isso, o navegador "restaura" a rolagem antiga e a tela pula.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

export default function App() {
  const [api, setApi] = useState(null);
  const [produtos, setProdutos] = useState(null);
  const [erroProdutos, setErroProdutos] = useState(false);
  const [avisos, setAvisos] = useState([]);
  const [stats, setStats] = useState(null);
  const [cliente, setCliente] = useState(() => ler("cliente"));
  const [vendasCliente, setVendasCliente] = useState({ id: null, lista: [] });
  const [carrinho, setCarrinho] = useState(() => ler("carrinho", []));
  const [tela, setTela] = useState("loja");
  const [gaveta, setGaveta] = useState(false);
  const [passo, setPasso] = useState("itens");
  const [login, setLogin] = useState(null);
  const [toast, setToast] = useState(null);
  const [pulso, setPulso] = useState(0);
  const coroas = useRef(0);

  // A tela aparece na hora; o banco carrega em paralelo
  useEffect(() => { import("@fonte").then(m => setApi(m)); }, []);

  useEffect(() => {
    if (!api) return;
    const a = api.ouvirProdutos(setProdutos, () => setErroProdutos(true));
    const b = api.ouvirAvisos(setAvisos);
    api.lerEstatisticas().then(setStats);
    return () => { a(); b(); };
  }, [api]);

  useEffect(() => {
    if (!api || !cliente) return;
    return api.ouvirVendasDoCliente(cliente.id, lista => setVendasCliente({ id: cliente.id, lista }));
  }, [api, cliente]);

  useEffect(() => { gravar("carrinho", carrinho); }, [carrinho]);
  useEffect(() => { window.scrollTo(0, 0); }, [tela]);
  useEffect(() => {
    document.documentElement.style.overflow = gaveta || login ? "hidden" : "";
  }, [gaveta, login]);

  const minhasVendas = vendasCliente.id === cliente?.id ? vendasCliente.lista : [];
  const emAberto = minhasVendas.filter(v => v.pagamento === "fim_do_mes" && !v.pago).reduce((a, v) => a + (v.total || 0), 0);

  // Carrinho guarda só id e quantidade; preço e estoque vêm sempre do produto atual
  const porId = useMemo(() => new Map((produtos || []).map(p => [p.id, p])), [produtos]);
  const itens = useMemo(() => carrinho
    .map(c => {
      const p = porId.get(c.id);
      if (!p || !p.disponivel) return null;
      const qty = Math.min(c.qty, p.estoque || 0);
      return qty > 0 ? { ...p, qty } : null;
    })
    .filter(Boolean), [carrinho, porId]);
  const qtdPorId = useMemo(() => new Map(itens.map(i => [i.id, i.qty])), [itens]);
  const qtd = itens.reduce((a, i) => a + i.qty, 0);
  const total = Math.round(itens.reduce((a, i) => a + i.preco * i.qty, 0) * 100) / 100;

  const adicionar = useCallback((p, origem) => {
    const atual = qtdPorId.get(p.id) || 0;
    if (!p.disponivel || atual >= (p.estoque || 0)) return;
    setCarrinho(c => (c.some(i => i.id === p.id)
      ? c.map(i => (i.id === p.id ? { ...i, qty: Math.min(i.qty, p.estoque || 0) + 1 } : i))
      : [...c, { id: p.id, qty: 1 }]));
    setPulso(n => n + 1);
    try { navigator.vibrate?.(12); } catch { /* sem vibração */ }
    // No carrinho, ou ao aumentar a quantidade, o próprio número já é o retorno: não troca o aviso
    if (origem === "carrinho" || atual > 0) return;
    const ids = new Set([...qtdPorId.keys(), p.id]);
    const sugestao = origem === "loja" ? sugestaoAoAdicionar(p, { produtos: produtos || [], idsNoCarrinho: ids, stats }) : null;
    setToast({ chave: Date.now(), produto: p, sugestao });
  }, [qtdPorId, produtos, stats]);

  const tirar = useCallback((id) => {
    setCarrinho(c => c.map(i => (i.id === id ? { ...i, qty: i.qty - 1 } : i)).filter(i => i.qty > 0));
  }, []);

  const abrirCarrinho = () => { setToast(null); setPasso("itens"); setGaveta(true); };
  const fecharCarrinho = useCallback(() => setGaveta(false), []);
  const fecharLogin = useCallback(() => setLogin(null), []);
  const voltarLoja = useCallback(() => setTela("loja"), []);
  const fecharToast = useCallback(() => setToast(null), []);

  useFecharNoVoltar(gaveta, fecharCarrinho);
  useFecharNoVoltar(!!login, fecharLogin);
  useFecharNoVoltar(tela !== "loja", voltarLoja);

  const pedirLogin = (depois = null) => setLogin({ depois });

  const entrou = (c, lembrar) => {
    setCliente(c);
    if (lembrar) gravar("cliente", c); else apagar("cliente");
    const depois = login?.depois;
    setLogin(null);
    if (depois) depoisDoVoltar(() => depois(c));
  };

  const sair = () => { setCliente(null); apagar("cliente"); setTela("loja"); };

  const verPedidos = () => {
    if (!cliente) { pedirLogin(() => setTela("pedidos")); return; }
    if (gaveta) { setGaveta(false); depoisDoVoltar(() => setTela("pedidos")); }
    else setTela("pedidos");
  };

  // Mesmo formato de pedido que o app sempre gravou
  const finalizar = async (pagamento) => {
    const venda = {
      clienteId: cliente.id, clienteNome: cliente.nome,
      clienteTel: cliente.telefone || "", clienteEmail: cliente.email || "",
      itens: itens.map(i => ({ id: i.id, nome: i.nome, emoji: i.emoji, preco: i.preco, qty: i.qty })),
      total, pagamento, pago: false, data: agoraTexto(),
    };
    await api.adicionarVenda(venda);
    setCarrinho([]);
    return venda;
  };

  const tocarCoroa = () => {
    coroas.current += 1;
    if (coroas.current >= 5) { coroas.current = 0; setTela("dono"); }
  };

  if (tela === "dono") {
    return (
      <Suspense fallback={<div className="carregando-tela"><span className="girando" /></div>}>
        <PainelDono api={api} voltar={voltarLoja} />
      </Suspense>
    );
  }

  return (
    <>
      {DEMO && <div className="faixa-demo">Modo demonstração. Nada aqui vai pro sistema de verdade.</div>}
      <Cabecalho
        cliente={cliente} qtd={qtd} pulso={pulso}
        onCarrinho={abrirCarrinho} onEntrar={() => pedirLogin()} onPedidos={verPedidos}
        onMarca={() => { setTela("loja"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      />

      {tela === "pedidos" && cliente
        ? <MeusPedidos cliente={cliente} vendas={minhasVendas} emAberto={emAberto} api={api} onVoltar={voltarLoja} onSair={sair} />
        : (
          <Loja
            produtos={produtos} erroProdutos={erroProdutos} avisos={avisos} stats={stats}
            cliente={cliente} qtdPorId={qtdPorId}
            onAdd={p => adicionar(p, "loja")} onMenos={tirar} onPedidos={verPedidos} onCoroa={tocarCoroa}
          />
        )}

      {tela === "loja" && (
        <div className={`barra${qtd > 0 && !gaveta ? " visivel" : ""}`}>
          <button type="button" className="barra__btn" onClick={abrirCarrinho} tabIndex={qtd > 0 ? 0 : -1}>
            <span className="barra__qtd">
              <Icone nome="sacola" tamanho={22} />
              <span key={pulso} className="contador pulou">{qtd}</span>
            </span>
            <span className="barra__texto">{qtd === 1 ? "1 item" : `${qtd} itens`}</span>
            <span className="barra__cta">Finalizar • {fmt(total)}<Icone nome="seta" tamanho={18} espessura={2.6} /></span>
          </button>
        </div>
      )}

      {toast && tela === "loja" && !gaveta && (
        <Toast key={toast.chave} dados={toast} onAdd={p => adicionar(p, "sugestao")} onFechar={fecharToast} />
      )}

      <Carrinho
        aberto={gaveta} passo={passo} setPasso={setPasso} onFechar={fecharCarrinho}
        itens={itens} total={total} produtos={produtos} stats={stats}
        cliente={cliente}
        onMais={p => adicionar(p, "carrinho")} onMenos={tirar} onAdd={p => adicionar(p, "carrinho")}
        pedirLogin={pedirLogin} finalizar={finalizar} onVerPedidos={verPedidos}
      />

      {login && <Login api={api} demo={DEMO} onFechar={fecharLogin} onEntrou={entrou} />}
    </>
  );
}
