import { useState, useEffect } from "react";

// ─── Persistência via localStorage ───────────────────────────────────────────
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const PRODUTOS_INICIAIS = [
  { id: 1, nome: "Coca-Cola 600ml", preco: 6.0, emoji: "🥤", disponivel: true },
  { id: 2, nome: "Água mineral 500ml", preco: 2.5, emoji: "💧", disponivel: true },
  { id: 3, nome: "Suco de caixinha", preco: 4.0, emoji: "🧃", disponivel: true },
  { id: 4, nome: "Pão de queijo", preco: 3.5, emoji: "🧀", disponivel: true },
  { id: 5, nome: "Barra de cereal", preco: 4.5, emoji: "🌾", disponivel: true },
  { id: 6, nome: "Chocolate", preco: 5.5, emoji: "🍫", disponivel: true },
];

const SENHA_DONO = "dono123"; // Troque aqui a senha do painel admin

// ─── Utilitários ─────────────────────────────────────────────────────────────
const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const uid = () => Date.now() + Math.random().toString(36).slice(2);
const now = () => new Date().toLocaleString("pt-BR");

// ─── ESTILOS GLOBAIS ──────────────────────────────────────────────────────────
const G = {
  bg: "#0d1117",
  card: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.1)",
  gold: "#f0b429",
  green: "#3ecf8e",
  red: "#f87171",
  orange: "#fb923c",
  text: "#e6edf3",
  muted: "rgba(230,237,243,0.45)",
};

const inp = {
  width: "100%", padding: "11px 14px", boxSizing: "border-box",
  background: "rgba(255,255,255,0.07)", border: `1px solid ${G.border}`,
  borderRadius: "10px", color: G.text, fontSize: "14px", outline: "none",
};

const btn = (color = G.gold, ghost = false) => ({
  padding: "10px 20px", borderRadius: "10px", border: ghost ? `1px solid ${color}` : "none",
  background: ghost ? "transparent" : color, color: ghost ? color : "#111",
  fontWeight: "bold", cursor: "pointer", fontSize: "14px", transition: "opacity .15s",
});

// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [produtos, setProdutos] = useState(() => LS.get("mkd_produtos", PRODUTOS_INICIAIS));
  const [vendas, setVendas] = useState(() => LS.get("mkd_vendas", []));
  const [clientes, setClientes] = useState(() => LS.get("mkd_clientes", []));
  const [tela, setTela] = useState("inicio"); // inicio | dono | cliente
  const [clienteLogado, setClienteLogado] = useState(null);

  useEffect(() => { LS.set("mkd_produtos", produtos); }, [produtos]);
  useEffect(() => { LS.set("mkd_vendas", vendas); }, [vendas]);
  useEffect(() => { LS.set("mkd_clientes", clientes); }, [clientes]);

  const adicionarVenda = (venda) => setVendas((v) => [venda, ...v]);

  if (tela === "dono") return <PainelDono produtos={produtos} setProdutos={setProdutos} vendas={vendas} setVendas={setVendas} clientes={clientes} voltar={() => setTela("inicio")} />;
  if (tela === "cliente") return <TelaCliente produtos={produtos} vendas={vendas} adicionarVenda={adicionarVenda} clientes={clientes} setClientes={setClientes} clienteLogado={clienteLogado} setClienteLogado={setClienteLogado} voltar={() => { setClienteLogado(null); setTela("inicio"); }} />;

  return <Inicio setTela={setTela} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELA INICIAL
// ═══════════════════════════════════════════════════════════════════════════════
function Inicio({ setTela }) {
  return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Georgia', serif" }}>
      <div style={{ fontSize: "72px", marginBottom: "8px" }}>🧊</div>
      <h1 style={{ color: G.gold, fontSize: "28px", margin: "0 0 6px", textAlign: "center" }}>Mercadinho da Geladeira</h1>
      <p style={{ color: G.muted, margin: "0 0 48px", fontSize: "15px", textAlign: "center" }}>Selecione como deseja entrar</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", maxWidth: "320px" }}>
        <BotaoEntrada icon="👑" titulo="Sou o Dono" sub="Gerenciar produtos e vendas" cor={G.gold} onClick={() => setTela("dono")} />
        <BotaoEntrada icon="🛒" titulo="Sou Cliente" sub="Fazer pedidos e acompanhar conta" cor={G.green} onClick={() => setTela("cliente")} />
      </div>
    </div>
  );
}

function BotaoEntrada({ icon, titulo, sub, cor, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px",
      background: `${cor}11`, border: `1.5px solid ${cor}44`, borderRadius: "16px",
      cursor: "pointer", textAlign: "left", width: "100%", transition: "background .2s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = `${cor}22`}
      onMouseLeave={e => e.currentTarget.style.background = `${cor}11`}
    >
      <span style={{ fontSize: "32px" }}>{icon}</span>
      <div>
        <div style={{ color: cor, fontWeight: "bold", fontSize: "16px" }}>{titulo}</div>
        <div style={{ color: G.muted, fontSize: "13px" }}>{sub}</div>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAINEL DO DONO
// ═══════════════════════════════════════════════════════════════════════════════
function PainelDono({ produtos, setProdutos, vendas, setVendas, clientes, voltar }) {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [errSenha, setErrSenha] = useState(false);
  const [aba, setAba] = useState("produtos");

  if (!autenticado) return (
    <Tela>
      <div style={{ maxWidth: "360px", margin: "auto", paddingTop: "80px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontSize: "48px" }}>👑</span>
          <h2 style={{ color: G.gold, margin: "8px 0 4px" }}>Painel do Dono</h2>
          <p style={{ color: G.muted, margin: 0, fontSize: "13px" }}>Digite a senha para entrar</p>
        </div>
        <input type="password" placeholder="Senha" value={senha} onChange={e => { setSenha(e.target.value); setErrSenha(false); }} style={{ ...inp, marginBottom: "12px", textAlign: "center", fontSize: "18px", letterSpacing: "4px" }} onKeyDown={e => e.key === "Enter" && (senha === SENHA_DONO ? setAutenticado(true) : setErrSenha(true))} />
        {errSenha && <p style={{ color: G.red, textAlign: "center", margin: "0 0 12px", fontSize: "13px" }}>Senha incorreta</p>}
        <button style={{ ...btn(G.gold), width: "100%", padding: "13px" }} onClick={() => senha === SENHA_DONO ? setAutenticado(true) : setErrSenha(true)}>Entrar</button>
        <button style={{ ...btn(G.muted, true), width: "100%", marginTop: "10px" }} onClick={voltar}>← Voltar</button>
      </div>
    </Tela>
  );

  const totalPendente = vendas.filter(v => v.pagamento === "fim_do_mes" && !v.pago).reduce((a, v) => a + v.total, 0);
  const totalRecebido = vendas.filter(v => v.pagamento === "na_hora" || v.pago).reduce((a, v) => a + v.total, 0);

  return (
    <Tela>
      <Header titulo="👑 Painel do Dono" onVoltar={() => { setAutenticado(false); voltar(); }}>
        <Chip label="Recebido" value={fmt(totalRecebido)} cor={G.green} />
        <Chip label="A receber" value={fmt(totalPendente)} cor={G.orange} />
      </Header>

      <Tabs abas={[["produtos", "📦 Produtos"], ["vendas", "📋 Vendas"], ["clientes", "👥 Clientes"]]} atual={aba} onChange={setAba} />

      <div style={{ padding: "0 16px 32px" }}>
        {aba === "produtos" && <GerenciarProdutos produtos={produtos} setProdutos={setProdutos} />}
        {aba === "vendas" && <GerenciarVendas vendas={vendas} setVendas={setVendas} />}
        {aba === "clientes" && <VerClientes clientes={clientes} vendas={vendas} />}
      </div>
    </Tela>
  );
}

// ── Gerenciar Produtos ────────────────────────────────────────────────────────
function GerenciarProdutos({ produtos, setProdutos }) {
  const [form, setForm] = useState({ nome: "", preco: "", emoji: "🛍️" });
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState("");

  const emojis = ["🥤","💧","🧃","🥛","🧀","🌾","🍪","🍫","⚡","🥪","🍕","🍔","🌭","🍩","🧁","☕","🍵","🥜","🍭","🍬"];

  const salvar = () => {
    if (!form.nome.trim()) { setErro("Digite o nome do produto"); return; }
    if (!form.preco || isNaN(Number(form.preco)) || Number(form.preco) <= 0) { setErro("Preço inválido"); return; }
    setErro("");
    if (editando !== null) {
      setProdutos(ps => ps.map(p => p.id === editando ? { ...p, ...form, preco: Number(form.preco) } : p));
      setEditando(null);
    } else {
      setProdutos(ps => [...ps, { id: uid(), ...form, preco: Number(form.preco), disponivel: true }]);
    }
    setForm({ nome: "", preco: "", emoji: "🛍️" });
  };

  const iniciarEdit = (p) => { setEditando(p.id); setForm({ nome: p.nome, preco: String(p.preco), emoji: p.emoji }); };
  const cancelarEdit = () => { setEditando(null); setForm({ nome: "", preco: "", emoji: "🛍️" }); setErro(""); };
  const remover = (id) => { if (confirm("Remover este produto?")) setProdutos(ps => ps.filter(p => p.id !== id)); };
  const toggleDisp = (id) => setProdutos(ps => ps.map(p => p.id === id ? { ...p, disponivel: !p.disponivel } : p));

  return (
    <div>
      {/* Formulário */}
      <Card style={{ marginBottom: "16px" }}>
        <h3 style={{ color: G.gold, margin: "0 0 16px", fontSize: "15px" }}>{editando !== null ? "✏️ Editar Produto" : "➕ Novo Produto"}</h3>

        <div style={{ marginBottom: "10px" }}>
          <label style={{ color: G.muted, fontSize: "12px", display: "block", marginBottom: "5px" }}>Emoji do produto</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "4px" }}>
            {emojis.map(e => (
              <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))} style={{
                width: "36px", height: "36px", borderRadius: "8px", border: form.emoji === e ? `2px solid ${G.gold}` : `1px solid ${G.border}`,
                background: form.emoji === e ? `${G.gold}22` : "transparent", cursor: "pointer", fontSize: "18px",
              }}>{e}</button>
            ))}
          </div>
          <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="Ou cole um emoji" style={{ ...inp, marginTop: "6px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label style={{ color: G.muted, fontSize: "12px", display: "block", marginBottom: "5px" }}>Nome do produto</label>
          <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Coca-Cola 600ml" style={inp} />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ color: G.muted, fontSize: "12px", display: "block", marginBottom: "5px" }}>Preço (R$)</label>
          <input type="number" min="0" step="0.5" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} placeholder="Ex: 6.00" style={inp} />
        </div>

        {erro && <p style={{ color: G.red, fontSize: "13px", margin: "0 0 10px" }}>{erro}</p>}

        <div style={{ display: "flex", gap: "8px" }}>
          <button style={{ ...btn(G.gold), flex: 1 }} onClick={salvar}>{editando !== null ? "Salvar alterações" : "Adicionar produto"}</button>
          {editando !== null && <button style={{ ...btn(G.muted, true) }} onClick={cancelarEdit}>Cancelar</button>}
        </div>
      </Card>

      {/* Lista */}
      {produtos.map(p => (
        <Card key={p.id} style={{ marginBottom: "10px", opacity: p.disponivel ? 1 : 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "28px" }}>{p.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: G.text, fontWeight: "bold", fontSize: "14px" }}>{p.nome}</div>
              <div style={{ color: G.gold, fontSize: "13px" }}>{fmt(p.preco)}</div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button onClick={() => toggleDisp(p.id)} style={{ ...btn(p.disponivel ? G.green : G.muted, true), padding: "6px 10px", fontSize: "12px" }}>
                {p.disponivel ? "✓ Ativo" : "✗ Oculto"}
              </button>
              <button onClick={() => iniciarEdit(p)} style={{ ...btn(G.gold, true), padding: "6px 10px", fontSize: "12px" }}>✏️</button>
              <button onClick={() => remover(p.id)} style={{ ...btn(G.red, true), padding: "6px 10px", fontSize: "12px" }}>🗑️</button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Gerenciar Vendas ──────────────────────────────────────────────────────────
function GerenciarVendas({ vendas, setVendas }) {
  const [filtro, setFiltro] = useState("todos");
  const marcarPago = (id) => setVendas(vs => vs.map(v => v.id === id ? { ...v, pago: true } : v));
  const remover = (id) => { if (confirm("Excluir esta venda?")) setVendas(vs => vs.filter(v => v.id !== id)); };

  const lista = filtro === "todos" ? vendas : filtro === "pendente" ? vendas.filter(v => v.pagamento === "fim_do_mes" && !v.pago) : vendas.filter(v => v.pagamento === "na_hora" || v.pago);

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[["todos", "Todos"], ["pendente", "📅 Pendentes"], ["pago", "✅ Pagos"]].map(([v, l]) => (
          <button key={v} onClick={() => setFiltro(v)} style={{ padding: "7px 14px", borderRadius: "20px", border: `1px solid ${filtro === v ? G.gold : G.border}`, background: filtro === v ? `${G.gold}22` : "transparent", color: filtro === v ? G.gold : G.muted, cursor: "pointer", fontSize: "13px" }}>{l}</button>
        ))}
      </div>
      {lista.length === 0 && <Empty texto="Nenhuma venda aqui" />}
      {lista.map(v => (
        <Card key={v.id} style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: G.text, fontWeight: "bold", fontSize: "14px" }}>{v.clienteNome}</div>
              <div style={{ color: G.muted, fontSize: "12px" }}>{v.itens.map(i => `${i.emoji}${i.nome} ×${i.qty}`).join(", ")}</div>
              <div style={{ color: G.muted, fontSize: "11px", marginTop: "3px" }}>{v.data}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: G.gold, fontWeight: "bold", fontSize: "15px" }}>{fmt(v.total)}</div>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", border: `1px solid ${v.pago || v.pagamento === "na_hora" ? G.green : G.orange}`, color: v.pago || v.pagamento === "na_hora" ? G.green : G.orange }}>
                {v.pago ? "✅ Pago" : v.pagamento === "na_hora" ? "⚡ Na hora" : "📅 Fim do mês"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
            {v.pagamento === "fim_do_mes" && !v.pago && <button onClick={() => marcarPago(v.id)} style={{ ...btn(G.green), padding: "7px 14px", fontSize: "12px" }}>Marcar como pago</button>}
            <button onClick={() => remover(v.id)} style={{ ...btn(G.red, true), padding: "7px 12px", fontSize: "12px" }}>🗑️</button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Ver Clientes ──────────────────────────────────────────────────────────────
function VerClientes({ clientes, vendas }) {
  return (
    <div>
      {clientes.length === 0 && <Empty texto="Nenhum cliente cadastrado ainda" />}
      {clientes.map(c => {
        const minhasVendas = vendas.filter(v => v.clienteId === c.id);
        const pendente = minhasVendas.filter(v => v.pagamento === "fim_do_mes" && !v.pago).reduce((a, v) => a + v.total, 0);
        return (
          <Card key={c.id} style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: G.text, fontWeight: "bold" }}>{c.nome}</div>
                <div style={{ color: G.muted, fontSize: "12px" }}>{c.email} · {minhasVendas.length} compra(s)</div>
              </div>
              {pendente > 0 && <div style={{ color: G.orange, fontWeight: "bold", fontSize: "15px" }}>{fmt(pendente)} a pagar</div>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELA DO CLIENTE
// ═══════════════════════════════════════════════════════════════════════════════
function TelaCliente({ produtos, vendas, adicionarVenda, clientes, setClientes, clienteLogado, setClienteLogado, voltar }) {
  const [aba, setAba] = useState("loja");
  const [carrinho, setCarrinho] = useState([]);
  const [pagamento, setPagamento] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [pedidoFeito, setPedidoFeito] = useState(false);

  if (!clienteLogado) return <LoginCliente clientes={clientes} setClientes={setClientes} onLogin={setClienteLogado} voltar={voltar} />;

  const minhasVendas = vendas.filter(v => v.clienteId === clienteLogado.id);
  const pendente = minhasVendas.filter(v => v.pagamento === "fim_do_mes" && !v.pago).reduce((a, v) => a + v.total, 0);
  const totalCarrinho = carrinho.reduce((a, i) => a + i.preco * i.qty, 0);

  const addCarrinho = (p) => {
    setCarrinho(c => {
      const ex = c.find(i => i.id === p.id);
      return ex ? c.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...p, qty: 1 }];
    });
  };
  const removeCarrinho = (id) => setCarrinho(c => c.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0));

  const finalizarPedido = () => {
    if (!pagamento) return;
    const venda = {
      id: uid(), clienteId: clienteLogado.id, clienteNome: clienteLogado.nome,
      itens: carrinho.map(i => ({ id: i.id, nome: i.nome, emoji: i.emoji, preco: i.preco, qty: i.qty })),
      total: totalCarrinho, pagamento, pago: false, data: now(),
    };
    adicionarVenda(venda);
    setCarrinho([]); setPagamento(""); setCheckout(false); setPedidoFeito(true);
    setTimeout(() => { setPedidoFeito(false); setAba("historico"); }, 2500);
  };

  const prodDisponiveis = produtos.filter(p => p.disponivel);

  return (
    <Tela>
      <Header titulo={`🛒 Olá, ${clienteLogado.nome.split(" ")[0]}!`} onVoltar={() => { setClienteLogado(null); voltar(); }}>
        {pendente > 0 && <Chip label="A pagar" value={fmt(pendente)} cor={G.orange} />}
        {carrinho.length > 0 && <Chip label="Carrinho" value={carrinho.reduce((a, i) => a + i.qty, 0) + " itens"} cor={G.green} />}
      </Header>

      <Tabs abas={[["loja", "🏪 Loja"], ["carrinho", `🛒 Carrinho${carrinho.length > 0 ? ` (${carrinho.reduce((a,i)=>a+i.qty,0)})` : ""}`], ["historico", "📋 Meus Pedidos"]]} atual={aba} onChange={setAba} />

      <div style={{ padding: "0 16px 32px" }}>
        {pedidoFeito && (
          <div style={{ background: `${G.green}22`, border: `1px solid ${G.green}`, borderRadius: "12px", padding: "16px", textAlign: "center", color: G.green, fontWeight: "bold", marginBottom: "16px" }}>
            ✅ Pedido realizado com sucesso! Obrigado!
          </div>
        )}

        {aba === "loja" && (
          <div>
            {prodDisponiveis.length === 0 && <Empty texto="Nenhum produto disponível no momento" />}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {prodDisponiveis.map(p => {
                const noCarrinho = carrinho.find(i => i.id === p.id);
                return (
                  <Card key={p.id} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "36px", marginBottom: "6px" }}>{p.emoji}</div>
                    <div style={{ color: G.text, fontSize: "13px", fontWeight: "bold", marginBottom: "4px", lineHeight: "1.3" }}>{p.nome}</div>
                    <div style={{ color: G.gold, fontWeight: "bold", marginBottom: "10px" }}>{fmt(p.preco)}</div>
                    {noCarrinho ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                        <button onClick={() => removeCarrinho(p.id)} style={{ ...btn(G.red, true), padding: "5px 12px" }}>−</button>
                        <span style={{ color: G.text, fontWeight: "bold" }}>{noCarrinho.qty}</span>
                        <button onClick={() => addCarrinho(p)} style={{ ...btn(G.green, true), padding: "5px 12px" }}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => { addCarrinho(p); }} style={{ ...btn(G.green), width: "100%", padding: "8px" }}>Adicionar</button>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {aba === "carrinho" && (
          <div>
            {carrinho.length === 0 && <Empty texto="Seu carrinho está vazio" />}
            {carrinho.map(i => (
              <Card key={i.id} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "26px" }}>{i.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: G.text, fontSize: "14px", fontWeight: "bold" }}>{i.nome}</div>
                    <div style={{ color: G.gold, fontSize: "13px" }}>{fmt(i.preco)} cada</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={() => removeCarrinho(i.id)} style={{ ...btn(G.red, true), padding: "5px 10px" }}>−</button>
                    <span style={{ color: G.text, fontWeight: "bold", minWidth: "20px", textAlign: "center" }}>{i.qty}</span>
                    <button onClick={() => addCarrinho(i)} style={{ ...btn(G.green, true), padding: "5px 10px" }}>+</button>
                  </div>
                </div>
                <div style={{ color: G.gold, textAlign: "right", fontSize: "14px", fontWeight: "bold", marginTop: "6px" }}>{fmt(i.preco * i.qty)}</div>
              </Card>
            ))}

            {carrinho.length > 0 && (
              <Card style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ color: G.muted }}>Total</span>
                  <span style={{ color: G.gold, fontWeight: "bold", fontSize: "20px" }}>{fmt(totalCarrinho)}</span>
                </div>

                <p style={{ color: G.muted, fontSize: "13px", margin: "0 0 10px" }}>💳 Como vai pagar?</p>
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                  {[["na_hora", "⚡", "Agora na hora"], ["fim_do_mes", "📅", "Fim do mês"]].map(([v, ic, l]) => (
                    <button key={v} onClick={() => setPagamento(v)} style={{
                      flex: 1, padding: "12px 8px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "bold",
                      border: `2px solid ${pagamento === v ? G.gold : G.border}`,
                      background: pagamento === v ? `${G.gold}22` : "transparent",
                      color: pagamento === v ? G.gold : G.muted,
                    }}>{ic} {l}</button>
                  ))}
                </div>

                <button disabled={!pagamento} onClick={finalizarPedido} style={{ ...btn(G.gold), width: "100%", padding: "14px", opacity: pagamento ? 1 : 0.4, cursor: pagamento ? "pointer" : "not-allowed" }}>
                  Finalizar Pedido
                </button>
              </Card>
            )}
          </div>
        )}

        {aba === "historico" && (
          <div>
            {minhasVendas.length === 0 && <Empty texto="Você ainda não fez nenhum pedido" />}
            {minhasVendas.map(v => (
              <Card key={v.id} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: G.muted, fontSize: "12px", marginBottom: "4px" }}>{v.data}</div>
                    <div style={{ color: G.text, fontSize: "13px" }}>{v.itens.map(i => `${i.emoji} ${i.nome} ×${i.qty}`).join(" · ")}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
                    <div style={{ color: G.gold, fontWeight: "bold" }}>{fmt(v.total)}</div>
                    <span style={{ fontSize: "11px", color: v.pago || v.pagamento === "na_hora" ? G.green : G.orange }}>
                      {v.pago ? "✅ Pago" : v.pagamento === "na_hora" ? "⚡ Pago" : "📅 Fim do mês"}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
            {pendente > 0 && (
              <Card style={{ borderColor: `${G.orange}44`, background: `${G.orange}11` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: G.orange, fontSize: "14px" }}>📅 Total a pagar no fim do mês</span>
                  <span style={{ color: G.orange, fontWeight: "bold", fontSize: "18px" }}>{fmt(pendente)}</span>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Tela>
  );
}

// ── Login do Cliente ──────────────────────────────────────────────────────────
function LoginCliente({ clientes, setClientes, onLogin, voltar }) {
  const [modo, setModo] = useState("login"); // login | cadastro
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");

  const entrar = () => {
    const c = clientes.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
    if (!c) { setErro("E-mail não encontrado. Crie uma conta."); return; }
    onLogin(c);
  };

  const cadastrar = () => {
    if (!nome.trim()) { setErro("Digite seu nome"); return; }
    if (!email.trim() || !email.includes("@")) { setErro("E-mail inválido"); return; }
    if (clientes.find(c => c.email.toLowerCase() === email.trim().toLowerCase())) { setErro("E-mail já cadastrado. Faça login."); return; }
    const novo = { id: uid(), nome: nome.trim(), email: email.trim().toLowerCase() };
    setClientes(cs => [...cs, novo]);
    onLogin(novo);
  };

  return (
    <Tela>
      <div style={{ maxWidth: "360px", margin: "auto", paddingTop: "80px", padding: "80px 16px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span style={{ fontSize: "48px" }}>🛒</span>
          <h2 style={{ color: G.green, margin: "8px 0 4px" }}>{modo === "login" ? "Entrar na sua conta" : "Criar conta"}</h2>
        </div>

        {modo === "cadastro" && (
          <div style={{ marginBottom: "12px" }}>
            <label style={{ color: G.muted, fontSize: "12px", display: "block", marginBottom: "5px" }}>Seu nome</label>
            <input value={nome} onChange={e => { setNome(e.target.value); setErro(""); }} placeholder="Ex: Maria Silva" style={inp} />
          </div>
        )}

        <div style={{ marginBottom: "14px" }}>
          <label style={{ color: G.muted, fontSize: "12px", display: "block", marginBottom: "5px" }}>E-mail</label>
          <input type="email" value={email} onChange={e => { setEmail(e.target.value); setErro(""); }} placeholder="seu@email.com" style={inp} onKeyDown={e => e.key === "Enter" && (modo === "login" ? entrar() : cadastrar())} />
        </div>

        {erro && <p style={{ color: G.red, fontSize: "13px", margin: "0 0 10px" }}>{erro}</p>}

        <button style={{ ...btn(G.green), width: "100%", padding: "13px", marginBottom: "10px" }} onClick={modo === "login" ? entrar : cadastrar}>
          {modo === "login" ? "Entrar" : "Criar conta e entrar"}
        </button>

        <button style={{ ...btn(G.muted, true), width: "100%", marginBottom: "10px" }} onClick={() => { setModo(m => m === "login" ? "cadastro" : "login"); setErro(""); }}>
          {modo === "login" ? "Não tenho conta → Criar conta" : "Já tenho conta → Fazer login"}
        </button>

        <button style={{ ...btn(G.muted, true), width: "100%" }} onClick={voltar}>← Voltar</button>
      </div>
    </Tela>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════
function Tela({ children }) {
  return <div style={{ minHeight: "100vh", background: G.bg, fontFamily: "'Georgia', serif", color: G.text }}>{children}</div>;
}

function Header({ titulo, onVoltar, children }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${G.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10 }}>
      <button onClick={onVoltar} style={{ background: "none", border: `1px solid ${G.border}`, borderRadius: "8px", color: G.muted, cursor: "pointer", padding: "6px 10px", fontSize: "13px", flexShrink: 0 }}>← Sair</button>
      <span style={{ color: G.gold, fontWeight: "bold", fontSize: "16px", flex: 1 }}>{titulo}</span>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

function Tabs({ abas, atual, onChange }) {
  return (
    <div style={{ display: "flex", padding: "16px 16px 0", gap: "0", overflowX: "auto" }}>
      {abas.map(([key, label], i) => (
        <button key={key} onClick={() => onChange(key)} style={{
          padding: "9px 16px", border: "none", cursor: "pointer", fontSize: "13px", whiteSpace: "nowrap",
          borderRadius: i === 0 ? "12px 0 0 0" : i === abas.length - 1 ? "0 12px 0 0" : "0",
          background: atual === key ? "rgba(240,180,41,0.1)" : "rgba(255,255,255,0.04)",
          color: atual === key ? G.gold : G.muted, fontWeight: atual === key ? "bold" : "normal",
          borderBottom: atual === key ? `2px solid ${G.gold}` : `2px solid transparent`,
        }}>{label}</button>
      ))}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: "12px", padding: "14px 16px", ...style }}>
      {children}
    </div>
  );
}

function Chip({ label, value, cor }) {
  return (
    <div style={{ background: `${cor}15`, border: `1px solid ${cor}44`, borderRadius: "8px", padding: "5px 10px", textAlign: "center", flexShrink: 0 }}>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>{label}</div>
      <div style={{ color: cor, fontWeight: "bold", fontSize: "13px" }}>{value}</div>
    </div>
  );
}

function Empty({ texto }) {
  return <div style={{ textAlign: "center", color: G.muted, padding: "40px 0", fontSize: "14px" }}>💨 {texto}</div>;
}
