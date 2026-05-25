import { useState, useEffect, useRef } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, onSnapshot, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxN2rnc2igfFiJ0a87YmIdJaKUCLr0bcE",
  authDomain: "mercadinho-transcredi.firebaseapp.com",
  projectId: "mercadinho-transcredi",
  storageBucket: "mercadinho-transcredi.firebasestorage.app",
  messagingSenderId: "788980813205",
  appId: "1:788980813205:web:f01b875454f005edaa3a9c",
  measurementId: "G-WB4L7LKXLB"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const PRODUTOS_INICIAIS = [
  { id: "p1", nome: "Coca-Cola 600ml", preco: 6.0, emoji: "🥤", foto: "", disponivel: true, estoque: 20 },
  { id: "p2", nome: "Água mineral 500ml", preco: 2.5, emoji: "💧", foto: "", disponivel: true, estoque: 30 },
  { id: "p3", nome: "Suco de caixinha", preco: 4.0, emoji: "🧃", foto: "", disponivel: true, estoque: 15 },
  { id: "p4", nome: "Pão de queijo", preco: 3.5, emoji: "🧀", foto: "", disponivel: true, estoque: 25 },
];

const SENHA_DONO = "dono123";
const DADOS_PIX = { banco: "756", cooperativa: "3288", conta: "58.736-2" };

const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const now = () => new Date().toLocaleString("pt-BR");

const C = {
  bg: "#0a0f1e", card: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)",
  gold: "#e8b84b", goldLight: "#f5d07a", green: "#2dd4a0", red: "#f16b6b",
  orange: "#f5923e", blue: "#4e9af1", text: "#eef2ff", muted: "rgba(238,242,255,0.4)",
  sicoob: "#007a4d",
};

const inp = {
  width: "100%", padding: "11px 14px", boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
  borderRadius: "10px", color: C.text, fontSize: "14px", outline: "none", fontFamily: "inherit",
};

const btnS = (color = C.gold, ghost = false, full = false) => ({
  padding: "10px 20px", borderRadius: "10px",
  border: ghost ? `1px solid ${color}` : "none",
  background: ghost ? "transparent" : color,
  color: ghost ? color : color === C.gold ? "#1a1200" : "#fff",
  fontWeight: "700", cursor: "pointer", fontSize: "14px",
  width: full ? "100%" : "auto", fontFamily: "inherit",
});

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tela, setTela] = useState("inicio");
  const [clienteLogado, setClienteLogado] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const initProdutos = async () => {
      const snap = await getDocs(collection(db, "produtos"));
      if (snap.empty) {
        for (const p of PRODUTOS_INICIAIS) {
          await setDoc(doc(db, "produtos", p.id), p);
        }
      }
    };
    initProdutos();

    const unsubProdutos = onSnapshot(collection(db, "produtos"), (snap) => {
      setProdutos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubVendas = onSnapshot(query(collection(db, "vendas"), orderBy("dataCriacao", "desc")), (snap) => {
      setVendas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCarregando(false);
    });
    const unsubClientes = onSnapshot(collection(db, "clientes"), (snap) => {
      setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubProdutos(); unsubVendas(); unsubClientes(); };
  }, []);

  const adicionarVenda = async (venda) => {
    await addDoc(collection(db, "vendas"), { ...venda, dataCriacao: Date.now() });
  };

  const atualizarProduto = async (id, dados) => {
    await updateDoc(doc(db, "produtos", id), dados);
  };

  const adicionarProduto = async (dados) => {
    await addDoc(collection(db, "produtos"), dados);
  };

  const removerProduto = async (id) => {
    await deleteDoc(doc(db, "produtos", id));
  };

  const atualizarVenda = async (id, dados) => {
    await updateDoc(doc(db, "vendas", id), dados);
  };

  const removerVenda = async (id) => {
    await deleteDoc(doc(db, "vendas", id));
  };

  const cadastrarCliente = async (dados) => {
    const ref = await addDoc(collection(db, "clientes"), dados);
    return { id: ref.id, ...dados };
  };

  const buscarClientePorEmail = (email) => {
    return clientes.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
  };

  if (carregando) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", fontFamily: "Georgia, serif" }}>
      <div style={{ fontSize: "48px" }}>🧊</div>
      <div style={{ color: C.gold, fontSize: "16px" }}>Carregando Mercadinho...</div>
      <div style={{ color: C.muted, fontSize: "13px" }}>Conectando ao banco de dados</div>
    </div>
  );

  if (tela === "dono") return <PainelDono produtos={produtos} vendas={vendas} clientes={clientes} atualizarProduto={atualizarProduto} adicionarProduto={adicionarProduto} removerProduto={removerProduto} atualizarVenda={atualizarVenda} removerVenda={removerVenda} voltar={() => setTela("inicio")} />;
  if (tela === "cliente") return <TelaCliente produtos={produtos} vendas={vendas} adicionarVenda={adicionarVenda} buscarClientePorEmail={buscarClientePorEmail} cadastrarCliente={cadastrarCliente} clienteLogado={clienteLogado} setClienteLogado={setClienteLogado} voltar={() => { setClienteLogado(null); setTela("inicio"); }} />;
  return <Inicio setTela={setTela} />;
}

function Inicio({ setTela }) {
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, #0a0f1e 0%, #0d1a2e 50%, #0a1a12 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "Georgia, serif" }}>
      <div style={{ marginBottom: "10px", background: C.sicoob, borderRadius: "10px", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#fff", fontWeight: "bold", fontSize: "13px", letterSpacing: "1px" }}>🏦 SICOOB</span>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "9px", letterSpacing: "2px" }}>TRANSCREDI</span>
      </div>
      <div style={{ width: 80, height: 80, background: `linear-gradient(135deg, ${C.sicoob}, #00b36b)`, borderRadius: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "44px", margin: "14px auto 10px", boxShadow: `0 16px 48px ${C.sicoob}50` }}>🧊</div>
      <h1 style={{ color: C.gold, fontSize: "26px", margin: "0 0 2px", textAlign: "center" }}>Mercadinho</h1>
      <p style={{ color: C.sicoob, margin: "0 0 36px", fontSize: "12px", letterSpacing: "3px", fontWeight: "bold" }}>TRANSCREDI</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "300px" }}>
        <BotaoEntrada icon="👑" titulo="Painel do Dono" sub="Gerenciar produtos e vendas" cor={C.gold} onClick={() => setTela("dono")} />
        <BotaoEntrada icon="🛒" titulo="Fazer Pedido" sub="Entrar e comprar produtos" cor={C.green} onClick={() => setTela("cliente")} />
      </div>
      <p style={{ color: C.muted, fontSize: "11px", marginTop: "36px", textAlign: "center" }}>Banco 756 · Cooperativa 3288 · Conta 58.736-2</p>
    </div>
  );
}

function BotaoEntrada({ icon, titulo, sub, cor, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", background: `${cor}0d`, border: `1px solid ${cor}33`, borderRadius: "16px", cursor: "pointer", textAlign: "left", width: "100%", fontFamily: "inherit" }}>
      <div style={{ width: 44, height: 44, background: `${cor}22`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ color: cor, fontWeight: "bold", fontSize: "15px" }}>{titulo}</div>
        <div style={{ color: C.muted, fontSize: "12px", marginTop: "2px" }}>{sub}</div>
      </div>
      <div style={{ marginLeft: "auto", color: cor, opacity: 0.5, fontSize: "20px" }}>›</div>
    </button>
  );
}

function PainelDono({ produtos, vendas, clientes, atualizarProduto, adicionarProduto, removerProduto, atualizarVenda, removerVenda, voltar }) {
  const [auth, setAuth] = useState(false);
  const [senha, setSenha] = useState("");
  const [errSenha, setErrSenha] = useState(false);
  const [aba, setAba] = useState("produtos");

  if (!auth) return (
    <Tela>
      <div style={{ maxWidth: "340px", margin: "auto", padding: "80px 16px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "48px" }}>👑</div>
          <h2 style={{ color: C.gold, margin: "8px 0 4px" }}>Painel do Dono</h2>
          <p style={{ color: C.muted, margin: 0, fontSize: "13px" }}>Digite a senha para acessar</p>
        </div>
        <input type="password" placeholder="Senha" value={senha} onChange={e => { setSenha(e.target.value); setErrSenha(false); }} style={{ ...inp, textAlign: "center", fontSize: "20px", letterSpacing: "6px", marginBottom: "12px" }} onKeyDown={e => e.key === "Enter" && (senha === SENHA_DONO ? setAuth(true) : setErrSenha(true))} />
        {errSenha && <p style={{ color: C.red, textAlign: "center", fontSize: "13px", margin: "0 0 10px" }}>Senha incorreta</p>}
        <button style={{ ...btnS(C.gold, false, true), padding: "13px", marginBottom: "10px" }} onClick={() => senha === SENHA_DONO ? setAuth(true) : setErrSenha(true)}>Entrar</button>
        <button style={{ ...btnS(C.muted, true, true) }} onClick={voltar}>← Voltar</button>
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
        {aba === "produtos" && <GerenciarProdutos produtos={produtos} atualizarProduto={atualizarProduto} adicionarProduto={adicionarProduto} removerProduto={removerProduto} />}
        {aba === "vendas" && <GerenciarVendas vendas={vendas} atualizarVenda={atualizarVenda} removerVenda={removerVenda} />}
        {aba === "clientes" && <VerClientes clientes={clientes} vendas={vendas} />}
      </div>
    </Tela>
  );
}

function GerenciarProdutos({ produtos, atualizarProduto, adicionarProduto, removerProduto }) {
  const [form, setForm] = useState({ nome: "", preco: "", emoji: "🛍️", foto: "", estoque: "" });
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const fotoRef = useRef();
  const emojis = ["🥤","💧","🧃","🥛","🧀","🌾","🍪","🍫","⚡","🥪","🍕","🍔","🌭","🍩","🧁","☕","🍵","🥜","🍭","🍬","🧊","🍺","🥗","🍱"];

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, foto: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const salvar = async () => {
    if (!form.nome.trim()) { setErro("Digite o nome"); return; }
    if (!form.preco || isNaN(Number(form.preco)) || Number(form.preco) <= 0) { setErro("Preço inválido"); return; }
    setSalvando(true); setErro("");
    const item = { ...form, preco: Number(form.preco), estoque: Number(form.estoque) || 0 };
    if (editando) {
      await atualizarProduto(editando, item);
      setEditando(null);
    } else {
      await adicionarProduto({ ...item, disponivel: true });
    }
    setForm({ nome: "", preco: "", emoji: "🛍️", foto: "", estoque: "" });
    setSalvando(false);
  };

  const iniciarEdit = (p) => { setEditando(p.id); setForm({ nome: p.nome, preco: String(p.preco), emoji: p.emoji, foto: p.foto || "", estoque: String(p.estoque || 0) }); };
  const remover = async (id) => { if (window.confirm("Remover produto?")) await removerProduto(id); };
  const toggleDisp = async (p) => { await atualizarProduto(p.id, { disponivel: !p.disponivel }); };

  return (
    <div>
      <Card style={{ marginBottom: "16px" }}>
        <h3 style={{ color: C.gold, margin: "0 0 14px", fontSize: "15px" }}>{editando ? "✏️ Editar Produto" : "➕ Novo Produto"}</h3>
        <Campo label="Emoji">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "6px" }}>
            {emojis.map(e => <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))} style={{ width: 32, height: 32, borderRadius: "8px", border: form.emoji === e ? `2px solid ${C.gold}` : `1px solid ${C.border}`, background: form.emoji === e ? `${C.gold}22` : "transparent", cursor: "pointer", fontSize: "16px" }}>{e}</button>)}
          </div>
        </Campo>
        <Campo label="Foto do produto (opcional)">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {form.foto && <img src={form.foto} alt="" style={{ width: 52, height: 52, borderRadius: "8px", objectFit: "cover" }} />}
            <button onClick={() => fotoRef.current.click()} style={{ ...btnS(C.blue, true), fontSize: "13px", padding: "7px 12px" }}>📷 {form.foto ? "Trocar" : "Adicionar foto"}</button>
            {form.foto && <button onClick={() => setForm(f => ({ ...f, foto: "" }))} style={{ ...btnS(C.red, true), fontSize: "13px", padding: "7px 10px" }}>🗑️</button>}
          </div>
          <input ref={fotoRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: "none" }} />
        </Campo>
        <Campo label="Nome do produto"><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Coca-Cola 600ml" style={inp} /></Campo>
        <Campo label="Preço (R$)"><input type="number" min="0" step="0.5" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} placeholder="Ex: 6.00" style={inp} /></Campo>
        <Campo label="Estoque (unidades)"><input type="number" min="0" value={form.estoque} onChange={e => setForm(f => ({ ...f, estoque: e.target.value }))} placeholder="Ex: 20" style={inp} /></Campo>
        {erro && <p style={{ color: C.red, fontSize: "13px", margin: "0 0 10px" }}>{erro}</p>}
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={{ ...btnS(C.gold), flex: 1 }} onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : editando ? "Salvar alterações" : "Adicionar produto"}</button>
          {editando && <button style={{ ...btnS(C.muted, true) }} onClick={() => { setEditando(null); setForm({ nome: "", preco: "", emoji: "🛍️", foto: "", estoque: "" }); }}>Cancelar</button>}
        </div>
      </Card>

      {produtos.map(p => (
        <Card key={p.id} style={{ marginBottom: "10px", opacity: p.disponivel ? 1 : 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {p.foto ? <img src={p.foto} alt={p.nome} style={{ width: 50, height: 50, borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 50, height: 50, borderRadius: "10px", background: `${C.gold}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }}>{p.emoji}</div>}
            <div style={{ flex: 1 }}>
              <div style={{ color: C.text, fontWeight: "bold", fontSize: "14px" }}>{p.nome}</div>
              <div style={{ color: C.gold, fontSize: "13px" }}>{fmt(p.preco)}</div>
              <div style={{ color: (p.estoque || 0) <= 3 ? C.red : C.muted, fontSize: "11px" }}>Estoque: {p.estoque || 0} un.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", flexShrink: 0 }}>
              <button onClick={() => toggleDisp(p)} style={{ ...btnS(p.disponivel ? C.green : C.muted, true), padding: "5px 8px", fontSize: "11px" }}>{p.disponivel ? "✓ Ativo" : "✗ Oculto"}</button>
              <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => iniciarEdit(p)} style={{ ...btnS(C.gold, true), padding: "5px 8px", fontSize: "11px" }}>✏️</button>
                <button onClick={() => remover(p.id)} style={{ ...btnS(C.red, true), padding: "5px 8px", fontSize: "11px" }}>🗑️</button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function GerenciarVendas({ vendas, atualizarVenda, removerVenda }) {
  const [filtro, setFiltro] = useState("todos");
  const marcarPago = async (id) => { await atualizarVenda(id, { pago: true, dataPagamento: now() }); };
  const remover = async (id) => { if (window.confirm("Excluir venda?")) await removerVenda(id); };
  const lista = filtro === "todos" ? vendas : filtro === "pendente" ? vendas.filter(v => v.pagamento === "fim_do_mes" && !v.pago) : vendas.filter(v => v.pagamento === "na_hora" || v.pago);

  return (
    <div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
        {[["todos","Todos"],["pendente","📅 Pendentes"],["pago","✅ Pagos"]].map(([v,l]) => (
          <button key={v} onClick={() => setFiltro(v)} style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${filtro===v?C.gold:C.border}`, background: filtro===v?`${C.gold}18`:"transparent", color: filtro===v?C.gold:C.muted, cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>{l}</button>
        ))}
      </div>
      <div style={{ color: C.muted, fontSize: "12px", marginBottom: "10px" }}>{lista.length} registro(s)</div>
      {lista.length === 0 && <Empty texto="Nenhuma venda aqui" />}
      {lista.map(v => (
        <Card key={v.id} style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: C.text, fontWeight: "bold", fontSize: "14px" }}>{v.clienteNome}</div>
              <div style={{ color: C.muted, fontSize: "11px" }}>{v.clienteTel && `📱 ${v.clienteTel} · `}{v.data}</div>
              <div style={{ color: C.muted, fontSize: "12px", marginTop: "3px" }}>{v.itens?.map(i => `${i.emoji} ${i.nome} ×${i.qty}`).join(", ")}</div>
              {v.pago && v.dataPagamento && <div style={{ color: C.green, fontSize: "11px", marginTop: "3px" }}>✅ Pago em {v.dataPagamento}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: C.gold, fontWeight: "bold", fontSize: "16px" }}>{fmt(v.total)}</div>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", border: `1px solid ${v.pago||v.pagamento==="na_hora"?C.green:C.orange}`, color: v.pago||v.pagamento==="na_hora"?C.green:C.orange }}>
                {v.pago ? "✅ Pago" : v.pagamento === "na_hora" ? "⚡ Pago na hora" : "📅 Fim do mês"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
            {v.pagamento === "fim_do_mes" && !v.pago && <button onClick={() => marcarPago(v.id)} style={{ ...btnS(C.green), padding: "7px 14px", fontSize: "12px" }}>Marcar como pago</button>}
            <button onClick={() => remover(v.id)} style={{ ...btnS(C.red, true), padding: "7px 12px", fontSize: "12px" }}>🗑️</button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function VerClientes({ clientes, vendas }) {
  return (
    <div>
      <div style={{ color: C.muted, fontSize: "12px", marginBottom: "10px" }}>{clientes.length} cliente(s) cadastrado(s)</div>
      {clientes.length === 0 && <Empty texto="Nenhum cliente ainda" />}
      {clientes.map(c => {
        const cv = vendas.filter(v => v.clienteId === c.id);
        const pendente = cv.filter(v => v.pagamento === "fim_do_mes" && !v.pago).reduce((a, v) => a + v.total, 0);
        const totalGasto = cv.reduce((a, v) => a + v.total, 0);
        return (
          <Card key={c.id} style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: C.text, fontWeight: "bold", fontSize: "15px" }}>{c.nome}</div>
                {c.email && <div style={{ color: C.muted, fontSize: "12px" }}>✉️ {c.email}</div>}
                {c.telefone && <div style={{ color: C.muted, fontSize: "12px" }}>📱 {c.telefone}</div>}
                <div style={{ color: C.muted, fontSize: "11px", marginTop: "3px" }}>{cv.length} compra(s) · Total: {fmt(totalGasto)}</div>
              </div>
              {pendente > 0 && <div style={{ color: C.orange, fontWeight: "bold", fontSize: "15px", textAlign: "right" }}>{fmt(pendente)}<br /><span style={{ fontSize: "10px", fontWeight: "normal" }}>a pagar</span></div>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function TelaCliente({ produtos, vendas, adicionarVenda, buscarClientePorEmail, cadastrarCliente, clienteLogado, setClienteLogado, voltar }) {
  const [aba, setAba] = useState("loja");
  const [carrinho, setCarrinho] = useState([]);
  const [pagamento, setPagamento] = useState("");
  const [pedidoFeito, setPedidoFeito] = useState(false);
  const [salvando, setSalvando] = useState(false);

  if (!clienteLogado) return <LoginCliente buscarClientePorEmail={buscarClientePorEmail} cadastrarCliente={cadastrarCliente} onLogin={setClienteLogado} voltar={voltar} />;

  const minhasVendas = vendas.filter(v => v.clienteId === clienteLogado.id);
  const pendente = minhasVendas.filter(v => v.pagamento === "fim_do_mes" && !v.pago).reduce((a, v) => a + v.total, 0);
  const totalCarrinho = carrinho.reduce((a, i) => a + i.preco * i.qty, 0);
  const qtdCarrinho = carrinho.reduce((a, i) => a + i.qty, 0);

  const addCarrinho = (p) => {
    if ((p.estoque || 0) <= 0) return;
    setCarrinho(c => {
      const ex = c.find(i => i.id === p.id);
      if (ex && ex.qty >= (p.estoque || 0)) return c;
      return ex ? c.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...p, qty: 1 }];
    });
  };
  const removeCarrinho = (id) => setCarrinho(c => c.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0));

  const finalizarPedido = async () => {
    if (!pagamento || salvando) return;
    setSalvando(true);
    await adicionarVenda({
      clienteId: clienteLogado.id, clienteNome: clienteLogado.nome,
      clienteTel: clienteLogado.telefone || "", clienteEmail: clienteLogado.email || "",
      itens: carrinho.map(i => ({ id: i.id, nome: i.nome, emoji: i.emoji, preco: i.preco, qty: i.qty })),
      total: totalCarrinho, pagamento, pago: false, data: now(),
    });
    setCarrinho([]); setPagamento(""); setPedidoFeito(true); setSalvando(false);
    setTimeout(() => { setPedidoFeito(false); setAba("historico"); }, 2500);
  };

  return (
    <Tela>
      <Header titulo={`🛒 Olá, ${clienteLogado.nome.split(" ")[0]}!`} onVoltar={() => { setClienteLogado(null); voltar(); }}>
        {pendente > 0 && <Chip label="A pagar" value={fmt(pendente)} cor={C.orange} />}
        {qtdCarrinho > 0 && <Chip label="Carrinho" value={`${qtdCarrinho}`} cor={C.green} />}
      </Header>
      <Tabs abas={[["loja","🏪 Loja"],["carrinho",`🛒${qtdCarrinho > 0 ? ` (${qtdCarrinho})` : ""}`],["historico","📋 Pedidos"]]} atual={aba} onChange={setAba} cor={C.green} />
      <div style={{ padding: "0 16px 40px" }}>
        {pedidoFeito && <div style={{ background: `${C.green}18`, border: `1px solid ${C.green}`, borderRadius: "12px", padding: "14px", textAlign: "center", color: C.green, fontWeight: "bold", marginBottom: "14px" }}>✅ Pedido registrado com sucesso!</div>}

        {aba === "loja" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {produtos.filter(p => p.disponivel).map(p => {
              const noCarrinho = carrinho.find(i => i.id === p.id);
              const semEstoque = (p.estoque || 0) <= 0;
              return (
                <Card key={p.id} style={{ textAlign: "center", opacity: semEstoque ? 0.5 : 1 }}>
                  {p.foto ? <img src={p.foto} alt={p.nome} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: "8px", marginBottom: "8px" }} /> : <div style={{ fontSize: "36px", marginBottom: "6px" }}>{p.emoji}</div>}
                  <div style={{ color: C.text, fontSize: "13px", fontWeight: "bold", marginBottom: "3px", lineHeight: "1.3" }}>{p.nome}</div>
                  <div style={{ color: C.gold, fontWeight: "bold", marginBottom: "3px" }}>{fmt(p.preco)}</div>
                  <div style={{ color: (p.estoque || 0) <= 3 ? C.red : C.muted, fontSize: "10px", marginBottom: "8px" }}>{semEstoque ? "Sem estoque" : `${p.estoque} un.`}</div>
                  {semEstoque ? <div style={{ color: C.muted, fontSize: "12px" }}>Indisponível</div> : noCarrinho ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <button onClick={() => removeCarrinho(p.id)} style={{ ...btnS(C.red, true), padding: "4px 10px" }}>−</button>
                      <span style={{ color: C.text, fontWeight: "bold" }}>{noCarrinho.qty}</span>
                      <button onClick={() => addCarrinho(p)} style={{ ...btnS(C.green, true), padding: "4px 10px" }}>+</button>
                    </div>
                  ) : <button onClick={() => addCarrinho(p)} style={{ ...btnS(C.green, false, true), padding: "8px", fontSize: "13px" }}>Adicionar</button>}
                </Card>
              );
            })}
            {produtos.filter(p => p.disponivel).length === 0 && <div style={{ gridColumn: "1/-1" }}><Empty texto="Nenhum produto disponível" /></div>}
          </div>
        )}

        {aba === "carrinho" && (
          <div>
            {carrinho.length === 0 && <Empty texto="Seu carrinho está vazio" />}
            {carrinho.map(i => (
              <Card key={i.id} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {i.foto ? <img src={i.foto} alt={i.nome} style={{ width: 46, height: 46, borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} /> : <span style={{ fontSize: "24px" }}>{i.emoji}</span>}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontWeight: "bold", fontSize: "13px" }}>{i.nome}</div>
                    <div style={{ color: C.gold, fontSize: "12px" }}>{fmt(i.preco)} cada</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button onClick={() => removeCarrinho(i.id)} style={{ ...btnS(C.red, true), padding: "4px 9px" }}>−</button>
                    <span style={{ color: C.text, fontWeight: "bold", minWidth: "18px", textAlign: "center" }}>{i.qty}</span>
                    <button onClick={() => addCarrinho(i)} style={{ ...btnS(C.green, true), padding: "4px 9px" }}>+</button>
                  </div>
                </div>
                <div style={{ color: C.gold, textAlign: "right", fontWeight: "bold", marginTop: "5px" }}>{fmt(i.preco * i.qty)}</div>
              </Card>
            ))}
            {carrinho.length > 0 && (
              <Card style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ color: C.muted }}>Total do pedido</span>
                  <span style={{ color: C.gold, fontWeight: "bold", fontSize: "20px" }}>{fmt(totalCarrinho)}</span>
                </div>
                <p style={{ color: C.muted, fontSize: "13px", margin: "0 0 8px" }}>💳 Como vai pagar?</p>
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                  {[["na_hora","⚡","Na hora"],["fim_do_mes","📅","Fim do mês"]].map(([v,ic,l]) => (
                    <button key={v} onClick={() => setPagamento(v)} style={{ flex: 1, padding: "12px 6px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "bold", fontFamily: "inherit", border: `2px solid ${pagamento===v?C.gold:C.border}`, background: pagamento===v?`${C.gold}18`:"transparent", color: pagamento===v?C.gold:C.muted }}>{ic} {l}</button>
                  ))}
                </div>
                {pagamento && (
                  <div style={{ background: `${C.sicoob}15`, border: `1px solid ${C.sicoob}44`, borderRadius: "12px", padding: "14px", marginBottom: "14px" }}>
                    <div style={{ background: C.sicoob, borderRadius: "6px", padding: "4px 10px", display: "inline-block", marginBottom: "10px" }}>
                      <span style={{ color: "#fff", fontSize: "11px", fontWeight: "bold" }}>🏦 SICOOB TRANSCREDI</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {[["Banco",DADOS_PIX.banco],["Cooperativa",DADOS_PIX.cooperativa],["Conta",DADOS_PIX.conta],["Valor",fmt(totalCarrinho)]].map(([label,val]) => (
                        <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "8px 10px" }}>
                          <div style={{ color: C.muted, fontSize: "10px", marginBottom: "2px" }}>{label}</div>
                          <div style={{ color: label==="Valor"?C.gold:C.text, fontWeight: "bold", fontSize: "14px" }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    <p style={{ color: pagamento==="fim_do_mes"?C.orange:C.green, fontSize: "12px", margin: "10px 0 0", textAlign: "center" }}>
                      {pagamento==="fim_do_mes" ? "⏰ Registrado para pagar no fim do mês" : "✅ Realize o pagamento agora via Sicoob"}
                    </p>
                  </div>
                )}
                <button disabled={!pagamento || salvando} onClick={finalizarPedido} style={{ ...btnS(C.gold, false, true), padding: "14px", opacity: pagamento && !salvando ? 1 : 0.4, cursor: pagamento && !salvando ? "pointer" : "not-allowed" }}>
                  {salvando ? "Registrando..." : "Confirmar Pedido"}
                </button>
              </Card>
            )}
          </div>
        )}

        {aba === "historico" && (
          <div>
            {minhasVendas.length === 0 && <Empty texto="Você ainda não fez pedidos" />}
            {minhasVendas.map(v => (
              <Card key={v.id} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: C.muted, fontSize: "11px", marginBottom: "3px" }}>{v.data}</div>
                    <div style={{ color: C.text, fontSize: "13px" }}>{v.itens?.map(i => `${i.emoji} ${i.nome} ×${i.qty}`).join(" · ")}</div>
                    {v.pago && v.dataPagamento && <div style={{ color: C.green, fontSize: "11px", marginTop: "3px" }}>✅ Pago em {v.dataPagamento}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "10px" }}>
                    <div style={{ color: C.gold, fontWeight: "bold" }}>{fmt(v.total)}</div>
                    <span style={{ fontSize: "11px", color: v.pago||v.pagamento==="na_hora"?C.green:C.orange }}>
                      {v.pago ? "✅ Pago" : v.pagamento==="na_hora" ? "⚡ Pago" : "📅 Fim do mês"}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
            {pendente > 0 && (
              <Card style={{ borderColor: `${C.orange}44`, background: `${C.orange}0a`, marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: C.orange, fontWeight: "bold" }}>📅 Total a pagar no fim do mês</div>
                    <div style={{ color: C.muted, fontSize: "12px", marginTop: "4px" }}>Conta {DADOS_PIX.conta} · Coop. {DADOS_PIX.cooperativa}</div>
                  </div>
                  <div style={{ color: C.orange, fontWeight: "bold", fontSize: "20px" }}>{fmt(pendente)}</div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </Tela>
  );
}

function LoginCliente({ buscarClientePorEmail, cadastrarCliente, onLogin, voltar }) {
  const [modo, setModo] = useState("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const entrar = async () => {
    if (!email.trim()) { setErro("Digite seu e-mail"); return; }
    setCarregando(true);
    const c = buscarClientePorEmail(email);
    if (!c) { setErro("E-mail não encontrado. Crie uma conta."); setCarregando(false); return; }
    onLogin(c);
  };

  const cadastrar = async () => {
    if (!nome.trim()) { setErro("Digite seu nome"); return; }
    if (!email.trim() || !email.includes("@")) { setErro("E-mail inválido"); return; }
    if (!telefone.trim()) { setErro("Digite seu telefone"); return; }
    if (buscarClientePorEmail(email)) { setErro("E-mail já cadastrado. Faça login."); return; }
    setCarregando(true);
    const novo = await cadastrarCliente({ nome: nome.trim(), email: email.trim().toLowerCase(), telefone: telefone.trim() });
    onLogin(novo);
  };

  return (
    <Tela>
      <div style={{ maxWidth: "340px", margin: "auto", padding: "60px 16px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🛒</div>
          <h2 style={{ color: C.green, margin: "0 0 4px" }}>{modo === "login" ? "Entrar na conta" : "Criar conta"}</h2>
          <p style={{ color: C.muted, margin: 0, fontSize: "13px" }}>Mercadinho Transcredi</p>
        </div>
        {modo === "cadastro" && <>
          <Campo label="Seu nome completo"><input value={nome} onChange={e => { setNome(e.target.value); setErro(""); }} placeholder="Ex: João Silva" style={inp} /></Campo>
          <Campo label="Telefone / WhatsApp"><input value={telefone} onChange={e => { setTelefone(e.target.value); setErro(""); }} placeholder="Ex: (49) 99999-9999" style={inp} /></Campo>
        </>}
        <Campo label="E-mail"><input type="email" value={email} onChange={e => { setEmail(e.target.value); setErro(""); }} placeholder="seu@email.com" style={inp} onKeyDown={e => e.key === "Enter" && (modo === "login" ? entrar() : cadastrar())} /></Campo>
        {erro && <p style={{ color: C.red, fontSize: "13px", margin: "0 0 10px" }}>{erro}</p>}
        <button style={{ ...btnS(C.green, false, true), padding: "13px", marginBottom: "10px" }} onClick={modo === "login" ? entrar : cadastrar} disabled={carregando}>
          {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta e entrar"}
        </button>
        <button style={{ ...btnS(C.muted, true, true), marginBottom: "10px" }} onClick={() => { setModo(m => m === "login" ? "cadastro" : "login"); setErro(""); }}>
          {modo === "login" ? "Não tenho conta → Criar" : "Já tenho conta → Login"}
        </button>
        <button style={{ ...btnS(C.muted, true, true) }} onClick={voltar}>← Voltar</button>
      </div>
    </Tela>
  );
}

function Tela({ children }) {
  return <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, #0a0f1e 0%, #0d1a2e 60%, #0a1a12 100%)`, fontFamily: "Georgia, serif", color: C.text }}>{children}</div>;
}
function Header({ titulo, onVoltar, children }) {
  return (
    <div style={{ background: "rgba(10,15,30,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10 }}>
      <button onClick={onVoltar} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.muted, cursor: "pointer", padding: "6px 10px", fontSize: "13px", fontFamily: "inherit", flexShrink: 0 }}>← Sair</button>
      <span style={{ color: C.gold, fontWeight: "bold", fontSize: "15px", flex: 1 }}>{titulo}</span>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}
function Tabs({ abas, atual, onChange, cor }) {
  return (
    <div style={{ display: "flex", padding: "14px 16px 0", gap: 0, overflowX: "auto" }}>
      {abas.map(([key, label], i) => (
        <button key={key} onClick={() => onChange(key)} style={{ padding: "8px 14px", border: "none", cursor: "pointer", fontSize: "13px", whiteSpace: "nowrap", fontFamily: "inherit", borderRadius: i === 0 ? "10px 0 0 0" : i === abas.length - 1 ? "0 10px 0 0" : "0", background: atual === key ? `${cor}12` : "rgba(255,255,255,0.03)", color: atual === key ? cor : C.muted, fontWeight: atual === key ? "bold" : "normal", borderBottom: atual === key ? `2px solid ${cor}` : `2px solid transparent` }}>{label}</button>
      ))}
    </div>
  );
}
function Card({ children, style = {} }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "14px 16px", ...style }}>{children}</div>;
}
function Chip({ label, value, cor }) {
  return (
    <div style={{ background: `${cor}12`, border: `1px solid ${cor}33`, borderRadius: "8px", padding: "4px 10px", textAlign: "center", flexShrink: 0 }}>
      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px" }}>{label}</div>
      <div style={{ color: cor, fontWeight: "bold", fontSize: "13px" }}>{value}</div>
    </div>
  );
}
function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ display: "block", color: C.muted, fontSize: "12px", marginBottom: "5px" }}>{label}</label>
      {children}
    </div>
  );
}
function Empty({ texto }) {
  return <div style={{ textAlign: "center", color: C.muted, padding: "40px 0", fontSize: "14px" }}>💨 {texto}</div>;
}
