import { useState, useEffect, useRef } from "react";

// ─── Persistência ─────────────────────────────────────────────────────────────
const LS = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const PRODUTOS_INICIAIS = [
  { id: 1, nome: "Coca-Cola 600ml", preco: 6.0, emoji: "🥤", foto: "", disponivel: true, estoque: 20 },
  { id: 2, nome: "Água mineral 500ml", preco: 2.5, emoji: "💧", foto: "", disponivel: true, estoque: 30 },
  { id: 3, nome: "Suco de caixinha", preco: 4.0, emoji: "🧃", foto: "", disponivel: true, estoque: 15 },
  { id: 4, nome: "Pão de queijo", preco: 3.5, emoji: "🧀", foto: "", disponivel: true, estoque: 25 },
];

const SENHA_DONO = "dono123";
const DADOS_PIX = { banco: "756", cooperativa: "3288", conta: "58.736-2" };

const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const uid = () => Date.now() + Math.random().toString(36).slice(2);
const now = () => new Date().toLocaleString("pt-BR");

// ─── Cores ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0a0f1e",
  card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  gold: "#e8b84b",
  goldLight: "#f5d07a",
  green: "#2dd4a0",
  red: "#f16b6b",
  orange: "#f5923e",
  blue: "#4e9af1",
  text: "#eef2ff",
  muted: "rgba(238,242,255,0.4)",
  sicoob: "#007a4d",
};

const inp = {
  width: "100%", padding: "11px 14px", boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
  borderRadius: "10px", color: C.text, fontSize: "14px", outline: "none",
  fontFamily: "inherit",
};

const btnStyle = (color = C.gold, ghost = false, full = false) => ({
  padding: "10px 20px", borderRadius: "10px",
  border: ghost ? `1px solid ${color}` : "none",
  background: ghost ? "transparent" : color,
  color: ghost ? color : color === C.gold ? "#1a1200" : "#fff",
  fontWeight: "700", cursor: "pointer", fontSize: "14px",
  width: full ? "100%" : "auto", fontFamily: "inherit",
  letterSpacing: "0.3px",
});

// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [produtos, setProdutos] = useState(() => LS.get("mkd2_produtos", PRODUTOS_INICIAIS));
  const [vendas, setVendas] = useState(() => LS.get("mkd2_vendas", []));
  const [clientes, setClientes] = useState(() => LS.get("mkd2_clientes", []));
  const [tela, setTela] = useState("inicio");
  const [clienteLogado, setClienteLogado] = useState(null);

  useEffect(() => { LS.set("mkd2_produtos", produtos); }, [produtos]);
  useEffect(() => { LS.set("mkd2_vendas", vendas); }, [vendas]);
  useEffect(() => { LS.set("mkd2_clientes", clientes); }, [clientes]);

  const adicionarVenda = (v) => setVendas(vs => [v, ...vs]);

  if (tela === "dono") return <PainelDono produtos={produtos} setProdutos={setProdutos} vendas={vendas} setVendas={setVendas} clientes={clientes} voltar={() => setTela("inicio")} />;
  if (tela === "cliente") return <TelaCliente produtos={produtos} vendas={vendas} adicionarVenda={adicionarVenda} clientes={clientes} setClientes={setClientes} clienteLogado={clienteLogado} setClienteLogado={setClienteLogado} voltar={() => { setClienteLogado(null); setTela("inicio"); }} />;
  return <Inicio setTela={setTela} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELA INICIAL
// ═══════════════════════════════════════════════════════════════════════════════
function Inicio({ setTela }) {
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, #0a0f1e 0%, #0d1a2e 50%, #0a1a12 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Georgia', serif", position: "relative", overflow: "hidden" }}>
      {/* Decoração de fundo */}
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, background: `radial-gradient(circle, ${C.sicoob}22, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, left: -100, width: 350, height: 350, background: `radial-gradient(circle, ${C.gold}11, transparent 70%)`, pointerEvents: "none" }} />

      {/* Logo Sicoob */}
      <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ background: C.sicoob, borderRadius: "10px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>🏦</span>
          <div>
            <div style={{ color: "#fff", fontWeight: "bold", fontSize: "13px", letterSpacing: "1px" }}>SICOOB</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "9px", letterSpacing: "2px" }}>TRANSCREDI</div>
          </div>
        </div>
      </div>

      {/* Logo principal */}
      <div style={{ marginBottom: "4px" }}>
        <div style={{ width: 90, height: 90, background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px", boxShadow: `0 20px 60px ${C.gold}40`, margin: "0 auto 12px" }}>
          🧊
        </div>
      </div>
      <h1 style={{ color: C.gold, fontSize: "26px", margin: "0 0 4px", textAlign: "center", letterSpacing: "1px" }}>Mercadinho</h1>
      <p style={{ color: C.muted, margin: "0 0 10px", fontSize: "13px", textAlign: "center", letterSpacing: "2px" }}>TRANSCREDI</p>
      <div style={{ width: 40, height: 2, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, marginBottom: "36px" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "300px" }}>
        <BotaoEntrada icon="👑" titulo="Painel do Dono" sub="Gerenciar produtos e vendas" cor={C.gold} onClick={() => setTela("dono")} />
        <BotaoEntrada icon="🛒" titulo="Fazer Pedido" sub="Entrar e comprar produtos" cor={C.green} onClick={() => setTela("cliente")} />
      </div>

      <p style={{ color: C.muted, fontSize: "11px", marginTop: "40px", textAlign: "center" }}>
        Sicoob Transcredi · Banco 756 · Cooperativa 3288
      </p>
    </div>
  );
}

function BotaoEntrada({ icon, titulo, sub, cor, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", background: `${cor}0d`, border: `1px solid ${cor}33`, borderRadius: "16px", cursor: "pointer", textAlign: "left", width: "100%", fontFamily: "inherit", transition: "all 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.background = `${cor}1a`; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${cor}0d`; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ width: 44, height: 44, background: `${cor}22`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ color: cor, fontWeight: "bold", fontSize: "15px" }}>{titulo}</div>
        <div style={{ color: C.muted, fontSize: "12px", marginTop: "2px" }}>{sub}</div>
      </div>
      <div style={{ marginLeft: "auto", color: cor, opacity: 0.5 }}>›</div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAINEL DO DONO
// ═══════════════════════════════════════════════════════════════════════════════
function PainelDono({ produtos, setProdutos, vendas, setVendas, clientes, voltar }) {
  const [auth, setAuth] = useState(false);
  const [senha, setSenha] = useState("");
  const [errSenha, setErrSenha] = useState(false);
  const [aba, setAba] = useState("produtos");

  if (!auth) return (
    <Tela>
      <div style={{ maxWidth: "340px", margin: "auto", padding: "80px 16px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>👑</div>
          <h2 style={{ color: C.gold, margin: "0 0 4px" }}>Painel do Dono</h2>
          <p style={{ color: C.muted, margin: 0, fontSize: "13px" }}>Digite a senha para acessar</p>
        </div>
        <input type="password" placeholder="Senha" value={senha} onChange={e => { setSenha(e.target.value); setErrSenha(false); }} style={{ ...inp, textAlign: "center", fontSize: "20px", letterSpacing: "6px", marginBottom: "12px" }} onKeyDown={e => e.key === "Enter" && (senha === SENHA_DONO ? setAuth(true) : setErrSenha(true))} />
        {errSenha && <p style={{ color: C.red, textAlign: "center", fontSize: "13px", margin: "0 0 10px" }}>Senha incorreta</p>}
        <button style={{ ...btnStyle(C.gold, false, true), padding: "13px", marginBottom: "10px" }} onClick={() => senha === SENHA_DONO ? setAuth(true) : setErrSenha(true)}>Entrar</button>
        <button style={{ ...btnStyle(C.muted, true, true) }} onClick={voltar}>← Voltar</button>
      </div>
    </Tela>
  );

  const totalPendente = vendas.filter(v => v.pagamento === "fim_do_mes" && !v.pago).reduce((a, v) => a + v.total, 0);
  const totalRecebido = vendas.filter(v => v.pagamento === "na_hora" || v.pago).reduce((a, v) => a + v.total, 0);

  return (
    <Tela>
      <Header titulo="👑 Painel do Dono" onVoltar={() => { setAuth(false); voltar(); }}>
        <Chip label="Recebido" value={fmt(totalRecebido)} cor={C.green} />
        <Chip label="A receber" value={fmt(totalPendente)} cor={C.orange} />
      </Header>
      <Tabs abas={[["produtos","📦 Produtos"],["vendas","📋 Vendas"],["clientes","👥 Clientes"]]} atual={aba} onChange={setAba} cor={C.gold} />
      <div style={{ padding: "0 16px 40px" }}>
        {aba === "produtos" && <GerenciarProdutos produtos={produtos} setProdutos={setProdutos} />}
        {aba === "vendas" && <GerenciarVendas vendas={vendas} setVendas={setVendas} />}
        {aba === "clientes" && <VerClientes clientes={clientes} vendas={vendas} />}
      </div>
    </Tela>
  );
}

// ── Gerenciar Produtos ────────────────────────────────────────────────────────
function GerenciarProdutos({ produtos, setProdutos }) {
  const [form, setForm] = useState({ nome: "", preco: "", emoji: "🛍️", foto: "", estoque: "" });
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState("");
  const fotoRef = useRef();

  const emojis = ["🥤","💧","🧃","🥛","🧀","🌾","🍪","🍫","⚡","🥪","🍕","🍔","🌭","🍩","🧁","☕","🍵","🥜","🍭","🍬","🧊","🍺","🥗","🍱"];

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, foto: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const salvar = () => {
    if (!form.nome.trim()) { setErro("Digite o nome"); return; }
    if (!form.preco || isNaN(Number(form.preco)) || Number(form.preco) <= 0) { setErro("Preço inválido"); return; }
    setErro("");
    const item = { ...form, preco: Number(form.preco), estoque: Number(form.estoque) || 0 };
    if (editando !== null) {
      setProdutos(ps => ps.map(p => p.id === editando ? { ...p, ...item } : p));
      setEditando(null);
    } else {
      setProdutos(ps => [...ps, { id: uid(), ...item, disponivel: true }]);
    }
    setForm({ nome: "", preco: "", emoji: "🛍️", foto: "", estoque: "" });
  };

  const iniciarEdit = (p) => { setEditando(p.id); setForm({ nome: p.nome, preco: String(p.preco), emoji: p.emoji, foto: p.foto || "", estoque: String(p.estoque || 0) }); };
  const remover = (id) => { if (window.confirm("Remover produto?")) setProdutos(ps => ps.filter(p => p.id !== id)); };
  const toggleDisp = (id) => setProdutos(ps => ps.map(p => p.id === id ? { ...p, disponivel: !p.disponivel } : p));

  return (
    <div>
      <Card style={{ marginBottom: "16px" }}>
        <h3 style={{ color: C.gold, margin: "0 0 16px", fontSize: "15px" }}>{editando ? "✏️ Editar Produto" : "➕ Novo Produto"}</h3>

        <Campo label="Emoji">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "6px" }}>
            {emojis.map(e => <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))} style={{ width: 34, height: 34, borderRadius: "8px", border: form.emoji === e ? `2px solid ${C.gold}` : `1px solid ${C.border}`, background: form.emoji === e ? `${C.gold}22` : "transparent", cursor: "pointer", fontSize: "17px" }}>{e}</button>)}
          </div>
          <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="Ou cole emoji" style={{ ...inp }} />
        </Campo>

        <Campo label="Foto do produto (opcional)">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {form.foto && <img src={form.foto} alt="" style={{ width: 60, height: 60, borderRadius: "10px", objectFit: "cover", border: `1px solid ${C.border}` }} />}
            <button onClick={() => fotoRef.current.click()} style={{ ...btnStyle(C.blue, true), fontSize: "13px" }}>📷 {form.foto ? "Trocar foto" : "Adicionar foto"}</button>
            {form.foto && <button onClick={() => setForm(f => ({ ...f, foto: "" }))} style={{ ...btnStyle(C.red, true), fontSize: "13px" }}>🗑️</button>}
          </div>
          <input ref={fotoRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: "none" }} />
        </Campo>

        <Campo label="Nome do produto"><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Coca-Cola 600ml" style={inp} /></Campo>
        <Campo label="Preço (R$)"><input type="number" min="0" step="0.5" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} placeholder="Ex: 6.00" style={inp} /></Campo>
        <Campo label="Quantidade em estoque"><input type="number" min="0" value={form.estoque} onChange={e => setForm(f => ({ ...f, estoque: e.target.value }))} placeholder="Ex: 20" style={inp} /></Campo>

        {erro && <p style={{ color: C.red, fontSize: "13px", margin: "0 0 10px" }}>{erro}</p>}
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={{ ...btnStyle(C.gold), flex: 1 }} onClick={salvar}>{editando ? "Salvar alterações" : "Adicionar produto"}</button>
          {editando && <button style={{ ...btnStyle(C.muted, true) }} onClick={() => { setEditando(null); setForm({ nome: "", preco: "", emoji: "🛍️", foto: "", estoque: "" }); }}>Cancelar</button>}
        </div>
      </Card>

      {produtos.map(p => (
        <Card key={p.id} style={{ marginBottom: "10px", opacity: p.disponivel ? 1 : 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {p.foto ? <img src={p.foto} alt={p.nome} style={{ width: 52, height: 52, borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 52, height: 52, borderRadius: "10px", background: `${C.gold}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }}>{p.emoji}</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.text, fontWeight: "bold", fontSize: "14px" }}>{p.nome}</div>
              <div style={{ color: C.gold, fontSize: "13px" }}>{fmt(p.preco)}</div>
              <div style={{ color: (p.estoque || 0) <= 3 ? C.red : C.muted, fontSize: "11px" }}>Estoque: {p.estoque || 0} un.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", flexShrink: 0 }}>
              <button onClick={() => toggleDisp(p.id)} style={{ ...btnStyle(p.disponivel ? C.green : C.muted, true), padding: "5px 8px", fontSize: "11px" }}>{p.disponivel ? "✓ Ativo" : "✗ Oculto"}</button>
              <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => iniciarEdit(p)} style={{ ...btnStyle(C.gold, true), padding: "5px 8px", fontSize: "11px" }}>✏️</button>
                <button onClick={() => remover(p.id)} style={{ ...btnStyle(C.red, true), padding: "5px 8px", fontSize: "11px" }}>🗑️</button>
              </div>
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
  const marcarPago = (id) => setVendas(vs => vs.map(v => v.id === id ? { ...v, pago: true, dataPagamento: now() } : v));
  const remover = (id) => { if (window.confirm("Excluir venda?")) setVendas(vs => vs.filter(v => v.id !== id)); };
  const lista = filtro === "todos" ? vendas : filtro === "pendente" ? vendas.filter(v => v.pagamento === "fim_do_mes" && !v.pago) : vendas.filter(v => v.pagamento === "na_hora" || v.pago);

  return (
    <div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
        {[["todos","Todos"],["pendente","📅 Pendentes"],["pago","✅ Pagos"]].map(([v,l]) => (
          <button key={v} onClick={() => setFiltro(v)} style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${filtro===v?C.gold:C.border}`, background: filtro===v?`${C.gold}18`:"transparent", color: filtro===v?C.gold:C.muted, cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>{l}</button>
        ))}
      </div>
      {lista.length === 0 && <Empty texto="Nenhuma venda aqui" />}
      {lista.map(v => (
        <Card key={v.id} style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: C.text, fontWeight: "bold", fontSize: "14px" }}>{v.clienteNome}</div>
              <div style={{ color: C.muted, fontSize: "11px" }}>{v.clienteTel && `📱 ${v.clienteTel} · `}{v.data}</div>
              <div style={{ color: C.muted, fontSize: "12px", marginTop: "3px" }}>{v.itens.map(i => `${i.emoji}${i.nome} ×${i.qty}`).join(", ")}</div>
              {v.pago && v.dataPagamento && <div style={{ color: C.green, fontSize: "11px", marginTop: "2px" }}>✅ Pago em {v.dataPagamento}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: C.gold, fontWeight: "bold", fontSize: "16px" }}>{fmt(v.total)}</div>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", border: `1px solid ${v.pago||v.pagamento==="na_hora"?C.green:C.orange}`, color: v.pago||v.pagamento==="na_hora"?C.green:C.orange }}>
                {v.pago?"✅ Pago":v.pagamento==="na_hora"?"⚡ Pago na hora":"📅 Fim do mês"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
            {v.pagamento==="fim_do_mes"&&!v.pago&&<button onClick={()=>marcarPago(v.id)} style={{ ...btnStyle(C.green), padding:"7px 14px",fontSize:"12px" }}>Marcar como pago</button>}
            <button onClick={()=>remover(v.id)} style={{ ...btnStyle(C.red,true), padding:"7px 12px",fontSize:"12px" }}>🗑️</button>
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
      {clientes.length===0&&<Empty texto="Nenhum cliente ainda" />}
      {clientes.map(c => {
        const cv = vendas.filter(v=>v.clienteId===c.id);
        const pendente = cv.filter(v=>v.pagamento==="fim_do_mes"&&!v.pago).reduce((a,v)=>a+v.total,0);
        const total = cv.reduce((a,v)=>a+v.total,0);
        return (
          <Card key={c.id} style={{ marginBottom:"10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ color:C.text, fontWeight:"bold", fontSize:"15px" }}>{c.nome}</div>
                {c.email&&<div style={{ color:C.muted, fontSize:"12px" }}>✉️ {c.email}</div>}
                {c.telefone&&<div style={{ color:C.muted, fontSize:"12px" }}>📱 {c.telefone}</div>}
                <div style={{ color:C.muted, fontSize:"11px", marginTop:"3px" }}>{cv.length} compra(s) · Total gasto: {fmt(total)}</div>
              </div>
              {pendente>0&&<div style={{ color:C.orange, fontWeight:"bold", fontSize:"15px", textAlign:"right" }}>{fmt(pendente)}<br/><span style={{fontSize:"10px",fontWeight:"normal"}}>a pagar</span></div>}
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
  const [pedidoFeito, setPedidoFeito] = useState(false);

  if (!clienteLogado) return <LoginCliente clientes={clientes} setClientes={setClientes} onLogin={setClienteLogado} voltar={voltar} />;

  const minhasVendas = vendas.filter(v=>v.clienteId===clienteLogado.id);
  const pendente = minhasVendas.filter(v=>v.pagamento==="fim_do_mes"&&!v.pago).reduce((a,v)=>a+v.total,0);
  const totalCarrinho = carrinho.reduce((a,i)=>a+i.preco*i.qty,0);
  const qtdCarrinho = carrinho.reduce((a,i)=>a+i.qty,0);

  const addCarrinho = (p) => {
    if ((p.estoque || 0) <= 0) return;
    setCarrinho(c => {
      const ex = c.find(i=>i.id===p.id);
      const noCarrinho = ex ? ex.qty : 0;
      if (noCarrinho >= (p.estoque||0)) return c;
      return ex ? c.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i) : [...c,{...p,qty:1}];
    });
  };
  const removeCarrinho = (id) => setCarrinho(c=>c.map(i=>i.id===id?{...i,qty:i.qty-1}:i).filter(i=>i.qty>0));

  const finalizarPedido = () => {
    if (!pagamento) return;
    const venda = {
      id: uid(), clienteId: clienteLogado.id, clienteNome: clienteLogado.nome,
      clienteTel: clienteLogado.telefone, clienteEmail: clienteLogado.email,
      itens: carrinho.map(i=>({id:i.id,nome:i.nome,emoji:i.emoji,preco:i.preco,qty:i.qty})),
      total: totalCarrinho, pagamento, pago: false, data: now(),
    };
    adicionarVenda(venda);
    setCarrinho([]); setPagamento(""); setPedidoFeito(true);
    setTimeout(()=>{ setPedidoFeito(false); setAba("historico"); }, 2500);
  };

  return (
    <Tela>
      <Header titulo={`🛒 Olá, ${clienteLogado.nome.split(" ")[0]}!`} onVoltar={()=>{ setClienteLogado(null); voltar(); }}>
        {pendente>0&&<Chip label="A pagar" value={fmt(pendente)} cor={C.orange} />}
        {qtdCarrinho>0&&<Chip label="Carrinho" value={`${qtdCarrinho} itens`} cor={C.green} />}
      </Header>
      <Tabs abas={[["loja","🏪 Loja"],["carrinho",`🛒${qtdCarrinho>0?` (${qtdCarrinho})`:""}`],["historico","📋 Pedidos"]]} atual={aba} onChange={setAba} cor={C.green} />
      <div style={{ padding:"0 16px 40px" }}>
        {pedidoFeito&&<div style={{ background:`${C.green}18`,border:`1px solid ${C.green}`,borderRadius:"12px",padding:"14px",textAlign:"center",color:C.green,fontWeight:"bold",marginBottom:"14px" }}>✅ Pedido realizado! Obrigado!</div>}

        {aba==="loja"&&(
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {produtos.filter(p=>p.disponivel).map(p=>{
              const noCarrinho = carrinho.find(i=>i.id===p.id);
              const semEstoque = (p.estoque||0)<=0;
              return (
                <Card key={p.id} style={{ textAlign:"center", opacity: semEstoque?0.5:1 }}>
                  {p.foto ? <img src={p.foto} alt={p.nome} style={{ width:"100%", height:90, objectFit:"cover", borderRadius:"8px", marginBottom:"8px" }} /> : <div style={{ fontSize:"38px", marginBottom:"6px", lineHeight:1 }}>{p.emoji}</div>}
                  <div style={{ color:C.text, fontSize:"13px", fontWeight:"bold", marginBottom:"3px", lineHeight:"1.3" }}>{p.nome}</div>
                  <div style={{ color:C.gold, fontWeight:"bold", marginBottom:"3px" }}>{fmt(p.preco)}</div>
                  <div style={{ color:(p.estoque||0)<=3?C.red:C.muted, fontSize:"10px", marginBottom:"8px" }}>{semEstoque?"Sem estoque":`${p.estoque} un.`}</div>
                  {semEstoque ? <div style={{ color:C.muted, fontSize:"12px" }}>Indisponível</div> : noCarrinho ? (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                      <button onClick={()=>removeCarrinho(p.id)} style={{ ...btnStyle(C.red,true), padding:"4px 10px" }}>−</button>
                      <span style={{ color:C.text, fontWeight:"bold" }}>{noCarrinho.qty}</span>
                      <button onClick={()=>addCarrinho(p)} style={{ ...btnStyle(C.green,true), padding:"4px 10px" }}>+</button>
                    </div>
                  ) : <button onClick={()=>addCarrinho(p)} style={{ ...btnStyle(C.green,false,true), padding:"8px" }}>Adicionar</button>}
                </Card>
              );
            })}
            {produtos.filter(p=>p.disponivel).length===0&&<div style={{ gridColumn:"1/-1" }}><Empty texto="Nenhum produto disponível" /></div>}
          </div>
        )}

        {aba==="carrinho"&&(
          <div>
            {carrinho.length===0&&<Empty texto="Seu carrinho está vazio" />}
            {carrinho.map(i=>(
              <Card key={i.id} style={{ marginBottom:"10px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  {i.foto?<img src={i.foto} alt={i.nome} style={{ width:48,height:48,borderRadius:"8px",objectFit:"cover",flexShrink:0 }}/>:<span style={{ fontSize:"26px" }}>{i.emoji}</span>}
                  <div style={{ flex:1 }}>
                    <div style={{ color:C.text, fontWeight:"bold", fontSize:"13px" }}>{i.nome}</div>
                    <div style={{ color:C.gold, fontSize:"12px" }}>{fmt(i.preco)} cada</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    <button onClick={()=>removeCarrinho(i.id)} style={{ ...btnStyle(C.red,true), padding:"4px 9px" }}>−</button>
                    <span style={{ color:C.text, fontWeight:"bold", minWidth:"18px", textAlign:"center" }}>{i.qty}</span>
                    <button onClick={()=>addCarrinho(i)} style={{ ...btnStyle(C.green,true), padding:"4px 9px" }}>+</button>
                  </div>
                </div>
                <div style={{ color:C.gold, textAlign:"right", fontWeight:"bold", marginTop:"5px" }}>{fmt(i.preco*i.qty)}</div>
              </Card>
            ))}

            {carrinho.length>0&&(
              <Card style={{ marginTop:"8px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"16px" }}>
                  <span style={{ color:C.muted }}>Total do pedido</span>
                  <span style={{ color:C.gold, fontWeight:"bold", fontSize:"20px" }}>{fmt(totalCarrinho)}</span>
                </div>

                <p style={{ color:C.muted, fontSize:"13px", margin:"0 0 8px" }}>💳 Como vai pagar?</p>
                <div style={{ display:"flex", gap:"8px", marginBottom: pagamento?"14px":"14px" }}>
                  {[["na_hora","⚡","Na hora"],["fim_do_mes","📅","Fim do mês"]].map(([v,ic,l])=>(
                    <button key={v} onClick={()=>setPagamento(v)} style={{ flex:1, padding:"12px 6px", borderRadius:"10px", cursor:"pointer", fontSize:"13px", fontWeight:"bold", fontFamily:"inherit", border:`2px solid ${pagamento===v?C.gold:C.border}`, background:pagamento===v?`${C.gold}18`:"transparent", color:pagamento===v?C.gold:C.muted }}>{ic} {l}</button>
                  ))}
                </div>

                {/* Dados de pagamento Sicoob */}
                {pagamento&&(
                  <div style={{ background:`${C.sicoob}15`, border:`1px solid ${C.sicoob}44`, borderRadius:"12px", padding:"14px", marginBottom:"14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
                      <div style={{ background:C.sicoob, borderRadius:"6px", padding:"4px 8px" }}>
                        <span style={{ color:"#fff", fontSize:"11px", fontWeight:"bold" }}>🏦 SICOOB TRANSCREDI</span>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                      {[["Banco",DADOS_PIX.banco],["Cooperativa",DADOS_PIX.cooperativa],["Conta",DADOS_PIX.conta],["Valor",fmt(totalCarrinho)]].map(([label,val])=>(
                        <div key={label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:"8px", padding:"8px 10px" }}>
                          <div style={{ color:C.muted, fontSize:"10px", marginBottom:"2px" }}>{label}</div>
                          <div style={{ color: label==="Valor"?C.gold:C.text, fontWeight:"bold", fontSize:"14px" }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    {pagamento==="fim_do_mes"&&<p style={{ color:C.orange, fontSize:"12px", margin:"10px 0 0", textAlign:"center" }}>⏰ Pagamento registrado para o fim do mês</p>}
                    {pagamento==="na_hora"&&<p style={{ color:C.green, fontSize:"12px", margin:"10px 0 0", textAlign:"center" }}>✅ Realize o pagamento agora via Sicoob</p>}
                  </div>
                )}

                <button disabled={!pagamento} onClick={finalizarPedido} style={{ ...btnStyle(C.gold,false,true), padding:"14px", opacity:pagamento?1:0.4, cursor:pagamento?"pointer":"not-allowed" }}>
                  Confirmar Pedido
                </button>
              </Card>
            )}
          </div>
        )}

        {aba==="historico"&&(
          <div>
            {minhasVendas.length===0&&<Empty texto="Você ainda não fez pedidos" />}
            {minhasVendas.map(v=>(
              <Card key={v.id} style={{ marginBottom:"10px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ color:C.muted, fontSize:"11px", marginBottom:"3px" }}>{v.data}</div>
                    <div style={{ color:C.text, fontSize:"13px" }}>{v.itens.map(i=>`${i.emoji} ${i.nome} ×${i.qty}`).join(" · ")}</div>
                    {v.pago&&v.dataPagamento&&<div style={{ color:C.green, fontSize:"11px", marginTop:"3px" }}>✅ Pago em {v.dataPagamento}</div>}
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, marginLeft:"10px" }}>
                    <div style={{ color:C.gold, fontWeight:"bold" }}>{fmt(v.total)}</div>
                    <span style={{ fontSize:"11px", color:v.pago||v.pagamento==="na_hora"?C.green:C.orange }}>
                      {v.pago?"✅ Pago":v.pagamento==="na_hora"?"⚡ Pago":"📅 Fim do mês"}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
            {pendente>0&&(
              <Card style={{ borderColor:`${C.orange}44`, background:`${C.orange}0a`, marginTop:"8px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ color:C.orange, fontWeight:"bold" }}>📅 Total a pagar no fim do mês</div>
                    <div style={{ color:C.muted, fontSize:"12px", marginTop:"4px" }}>Sicoob Transcredi · Conta {DADOS_PIX.conta}</div>
                  </div>
                  <div style={{ color:C.orange, fontWeight:"bold", fontSize:"20px" }}>{fmt(pendente)}</div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Tela>
  );
}

// ── Login Cliente ─────────────────────────────────────────────────────────────
function LoginCliente({ clientes, setClientes, onLogin, voltar }) {
  const [modo, setModo] = useState("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");

  const entrar = () => {
    const c = clientes.find(c=>c.email.toLowerCase()===email.trim().toLowerCase());
    if (!c) { setErro("E-mail não encontrado. Crie uma conta."); return; }
    onLogin(c);
  };

  const cadastrar = () => {
    if (!nome.trim()) { setErro("Digite seu nome"); return; }
    if (!email.trim()||!email.includes("@")) { setErro("E-mail inválido"); return; }
    if (!telefone.trim()) { setErro("Digite seu telefone"); return; }
    if (clientes.find(c=>c.email.toLowerCase()===email.trim().toLowerCase())) { setErro("E-mail já cadastrado. Faça login."); return; }
    const novo = { id:uid(), nome:nome.trim(), email:email.trim().toLowerCase(), telefone:telefone.trim() };
    setClientes(cs=>[...cs,novo]);
    onLogin(novo);
  };

  return (
    <Tela>
      <div style={{ maxWidth:"340px", margin:"auto", padding:"60px 16px 0" }}>
        <div style={{ textAlign:"center", marginBottom:"28px" }}>
          <div style={{ fontSize:"48px", marginBottom:"8px" }}>🛒</div>
          <h2 style={{ color:C.green, margin:"0 0 4px" }}>{modo==="login"?"Entrar na conta":"Criar conta"}</h2>
          <p style={{ color:C.muted, margin:0, fontSize:"13px" }}>Mercadinho Transcredi</p>
        </div>

        {modo==="cadastro"&&<>
          <Campo label="Seu nome completo"><input value={nome} onChange={e=>{setNome(e.target.value);setErro("");}} placeholder="Ex: João Silva" style={inp} /></Campo>
          <Campo label="Telefone / WhatsApp"><input value={telefone} onChange={e=>{setTelefone(e.target.value);setErro("");}} placeholder="Ex: (48) 99999-9999" style={inp} /></Campo>
        </>}

        <Campo label="E-mail"><input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErro("");}} placeholder="seu@email.com" style={inp} onKeyDown={e=>e.key==="Enter"&&(modo==="login"?entrar():cadastrar())} /></Campo>

        {erro&&<p style={{ color:C.red, fontSize:"13px", margin:"0 0 10px" }}>{erro}</p>}

        <button style={{ ...btnStyle(C.green,false,true), padding:"13px", marginBottom:"10px" }} onClick={modo==="login"?entrar:cadastrar}>
          {modo==="login"?"Entrar":"Criar conta e entrar"}
        </button>
        <button style={{ ...btnStyle(C.muted,true,true), marginBottom:"10px" }} onClick={()=>{setModo(m=>m==="login"?"cadastro":"login");setErro("");}}>
          {modo==="login"?"Não tenho conta → Criar":"Já tenho conta → Login"}
        </button>
        <button style={{ ...btnStyle(C.muted,true,true) }} onClick={voltar}>← Voltar</button>
      </div>
    </Tela>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════════
function Tela({ children }) {
  return <div style={{ minHeight:"100vh", background:`linear-gradient(160deg, #0a0f1e 0%, #0d1a2e 60%, #0a1a12 100%)`, fontFamily:"'Georgia', serif", color:C.text }}>{children}</div>;
}
function Header({ titulo, onVoltar, children }) {
  return (
    <div style={{ background:"rgba(10,15,30,0.95)", backdropFilter:"blur(12px)", borderBottom:`1px solid ${C.border}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap", position:"sticky", top:0, zIndex:10 }}>
      <button onClick={onVoltar} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:"8px", color:C.muted, cursor:"pointer", padding:"6px 10px", fontSize:"13px", fontFamily:"inherit", flexShrink:0 }}>← Sair</button>
      <span style={{ color:C.gold, fontWeight:"bold", fontSize:"15px", flex:1 }}>{titulo}</span>
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>{children}</div>
    </div>
  );
}
function Tabs({ abas, atual, onChange, cor }) {
  return (
    <div style={{ display:"flex", padding:"14px 16px 0", gap:0, overflowX:"auto" }}>
      {abas.map(([key,label],i)=>(
        <button key={key} onClick={()=>onChange(key)} style={{ padding:"8px 14px", border:"none", cursor:"pointer", fontSize:"13px", whiteSpace:"nowrap", fontFamily:"inherit", borderRadius:i===0?"10px 0 0 0":i===abas.length-1?"0 10px 0 0":"0", background:atual===key?`${cor}12`:"rgba(255,255,255,0.03)", color:atual===key?cor:C.muted, fontWeight:atual===key?"bold":"normal", borderBottom:atual===key?`2px solid ${cor}`:`2px solid transparent` }}>{label}</button>
      ))}
    </div>
  );
}
function Card({ children, style={} }) {
  return <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"12px", padding:"14px 16px", ...style }}>{children}</div>;
}
function Chip({ label, value, cor }) {
  return (
    <div style={{ background:`${cor}12`, border:`1px solid ${cor}33`, borderRadius:"8px", padding:"4px 10px", textAlign:"center", flexShrink:0 }}>
      <div style={{ color:"rgba(255,255,255,0.35)", fontSize:"9px", letterSpacing:"0.5px" }}>{label}</div>
      <div style={{ color:cor, fontWeight:"bold", fontSize:"13px" }}>{value}</div>
    </div>
  );
}
function Campo({ label, children }) {
  return (
    <div style={{ marginBottom:"12px" }}>
      <label style={{ display:"block", color:C.muted, fontSize:"12px", marginBottom:"5px", letterSpacing:"0.3px" }}>{label}</label>
      {children}
    </div>
  );
}
function Empty({ texto }) {
  return <div style={{ textAlign:"center", color:C.muted, padding:"40px 0", fontSize:"14px" }}>💨 {texto}</div>;
}
