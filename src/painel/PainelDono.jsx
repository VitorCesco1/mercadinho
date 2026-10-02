// Painel do dono. Fase 2: topo/abas novos + aba Cobrança. As outras abas ficam pra Fase 3.
import { useState, useEffect, useRef } from "react";
import Icone from "../componentes/Icone.jsx";
import Cobranca from "./Cobranca.jsx";
import { fmt, agoraTexto as nowStr } from "../lib/formato.js";
import { msDaVenda } from "../lib/datas.js";
import { calcularEstatisticas, categoriaDe } from "../lib/sugestoes.js";

const SENHA_DONO = "dono123";

// Reduz foto para max 400px e qualidade 70% — protege limite 1MB do Firestore.
// Fundo branco por baixo: PNG transparente virava fundo preto no JPEG.
const comprimirFoto = (base64, maxPx=400) => new Promise(resolve => {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ratio  = Math.min(maxPx/img.width, maxPx/img.height, 1);
    canvas.width  = img.width  * ratio;
    canvas.height = img.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL("image/jpeg", 0.7));
  };
  img.src = base64;
});

const C = {
  card:"rgba(255,255,255,0.04)", border:"rgba(196,235,229,0.11)",
  gold:"#00ae9d", green:"#2fd0bd", red:"#ff8f86", orange:"#f3bb4f",
  blue:"#6ab0f5", text:"#ecf7f5", muted:"rgba(236,247,245,0.55)", sicoob:"#00ae9d",
};
const inp = {
  width:"100%", padding:"11px 14px", boxSizing:"border-box",
  background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`,
  borderRadius:"10px", color:C.text, fontSize:"16px", outline:"none", fontFamily:"inherit",
};
const btnS = (color=C.gold, ghost=false, full=false) => ({
  padding:"10px 20px", borderRadius:"10px",
  border: ghost ? `1px solid ${color}` : "none",
  background: ghost ? "transparent" : color,
  color: ghost ? color : color===C.gold ? "#00262e" : "#fff",
  fontWeight:"700", cursor:"pointer", fontSize:"14px",
  width: full ? "100%" : "auto", fontFamily:"inherit",
});

export default function PainelDono({ api, voltar }) {
  const [auth,setAuth]   = useState(false);
  const [senha,setSenha] = useState("");
  const [errSenha,setErrSenha] = useState(false);
  const [aba,setAba]     = useState("dashboard");
  const [produtos, setProdutos] = useState([]);
  const [vendas,   setVendas]   = useState([]);
  const [clientes, setClientes] = useState([]);
  const [avisos,   setAvisos]   = useState([]);
  const [erroConexao, setErroConexao] = useState(null);

  useEffect(() => {
    if (!auth || !api) return;
    api.garantirProdutosIniciais();
    const a = api.ouvirProdutos(setProdutos);
    const b = api.ouvirVendas(l => { setVendas(l); setErroConexao(null); }, () => setErroConexao("Erro ao carregar vendas. Verifique a conexão."));
    const c = api.ouvirClientes(setClientes);
    const d = api.ouvirAvisos(setAvisos);
    return () => { a(); b(); c(); d(); };
  }, [auth, api]);

  // Atualiza o resumo "mais vendidos / combos" que a loja usa nas sugestões (só ids e contagens)
  useEffect(() => {
    if (!auth || !api || !vendas.length) return;
    const t = setTimeout(async () => {
      const novo = calcularEstatisticas(vendas);
      const atual = await api.lerEstatisticas();
      const igual = JSON.stringify(atual?.vendidos) === JSON.stringify(novo.vendidos) && JSON.stringify(atual?.pares) === JSON.stringify(novo.pares);
      if (!igual) await api.salvarEstatisticas({ ...novo, atualizadoEm: Date.now() });
    }, 3000);
    return () => clearTimeout(t);
  }, [auth, api, vendas]);

  const ops = api || {};
  const conferir = (e) => { e.preventDefault(); if (senha === SENHA_DONO) setAuth(true); else setErrSenha(true); };

  if (!auth) return (
    <form className="painel-entrar" onSubmit={conferir}>
      <div className="painel-entrar__icone">👑</div>
      <h1>Painel do Dono</h1>
      <p>Acesso restrito</p>
      <label className="campo">
        <span className="sr">Senha</span>
        <input type="password" placeholder="Senha" value={senha} autoComplete="current-password"
          onChange={e => { setSenha(e.target.value); setErrSenha(false); }} />
      </label>
      {errSenha && <p className="erro" role="alert">Senha incorreta</p>}
      <button type="submit" className="btn-principal">Entrar</button>
      <button type="button" className="btn-texto" onClick={voltar}>Voltar pra loja</button>
    </form>
  );

  const totalPendente = vendas.filter(v=>v.pagamento==="fim_do_mes"&&!v.pago).reduce((a,v)=>a+v.total,0);
  const totalRecebido = vendas.filter(v=>v.pagamento==="na_hora"||v.pago).reduce((a,v)=>a+v.total,0);
  const ABAS = [["dashboard","Dashboard"],["cobranca","Cobrança"],["vendas","Vendas"],["produtos","Produtos"],["clientes","Clientes"],["avisos","Avisos"]];

  return (
    <div className="painel">
      <header className="painel-topo">
        <div className="painel-topo__linha">
          <button type="button" className="icone-btn" onClick={() => { setAuth(false); voltar(); }} aria-label="Sair do painel"><Icone nome="voltar" /></button>
          <h1 className="painel-topo__titulo">Painel do Dono</h1>
          <div className="painel-numero painel-numero--ok"><small>Recebido</small><b>{fmt(totalRecebido)}</b></div>
          <div className="painel-numero painel-numero--aberto"><small>A receber</small><b>{fmt(totalPendente)}</b></div>
        </div>
        <nav className="painel-abas" aria-label="Seções do painel">
          {ABAS.map(([k, nome]) => (
            <button type="button" key={k} className={`painel-aba${aba === k ? " ativo" : ""}`} onClick={() => setAba(k)} aria-pressed={aba === k}>{nome}</button>
          ))}
        </nav>
      </header>
      <main className="painel-corpo">
        {erroConexao && <div className="erro-caixa" role="alert">{erroConexao}</div>}
        {aba==="dashboard" && <Dashboard vendas={vendas} clientes={clientes} />}
        {aba==="cobranca"  && <Cobranca vendas={vendas} clientes={clientes} api={api} />}
        {aba==="produtos"  && <GerenciarProdutos produtos={produtos} ops={ops} />}
        {aba==="vendas"    && <GerenciarVendas vendas={vendas} ops={ops} />}
        {aba==="clientes"  && <VerClientes clientes={clientes} vendas={vendas} />}
        {aba==="avisos"    && <GerenciarAvisos avisos={avisos} ops={ops} />}
      </main>
    </div>
  );
}

function SB({label,value,cor,sub}) {
  return (
    <div style={{ background:`${cor}10`,border:`1px solid ${cor}30`,borderRadius:"12px",padding:"14px",flex:1,minWidth:"120px" }}>
      <div style={{ color:C.muted,fontSize:"11px",marginBottom:"4px" }}>{label}</div>
      <div style={{ color:cor,fontWeight:"bold",fontSize:"18px" }}>{value}</div>
      {sub&&<div style={{ color:C.muted,fontSize:"10px",marginTop:"2px" }}>{sub}</div>}
    </div>
  );
}

function Dashboard({ vendas,clientes }) {
  const hoje=new Date(), mes=hoje.getMonth(), ano=hoje.getFullYear();
  const vMes = vendas.filter(v=>{ const d=new Date(msDaVenda(v)); return d.getMonth()===mes&&d.getFullYear()===ano; });
  const totalMes   = vMes.reduce((a,v)=>a+v.total,0);
  const pendMes    = vMes.filter(v=>v.pagamento==="fim_do_mes"&&!v.pago).reduce((a,v)=>a+v.total,0);
  const totalGeral = vendas.reduce((a,v)=>a+v.total,0);
  const cnt={};
  vendas.forEach(v=>v.itens?.forEach(i=>{ cnt[i.nome]=(cnt[i.nome]||0)+i.qty; }));
  const rank=Object.entries(cnt).sort((a,b)=>b[1]-a[1]);
  const top=rank.slice(0,5), bot=rank.slice(-3).reverse();

  const exportarCSV = () => {
    const linhas = [["Data","Cliente","Telefone","Itens","Total","Pagamento","Pago"]];
    vendas.forEach(v=>{
      linhas.push([
        v.data||"",
        v.clienteNome||"",
        v.clienteTel||"",
        v.itens?.map(i=>`${i.nome}x${i.qty}`).join("; ")||"",
        String(v.total||0).replace(".",","),
        v.pagamento==="na_hora"?"Na hora":"Fim do mês",
        v.pago?"Sim":"Não",
      ]);
    });
    const csv = linhas.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const blob = new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`vendas_mercadinho_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",margin:"14px 0 10px" }}>
        <p style={{ color:C.muted,fontSize:"12px",margin:0 }}>📅 Mês atual</p>
        <button onClick={exportarCSV} style={{ ...btnS(C.green,true),padding:"6px 12px",fontSize:"11px" }}>
          📥 Exportar vendas CSV
        </button>
      </div>
      <div style={{ display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"10px" }}>
        <SB label="Faturamento do mês" value={fmt(totalMes)}   cor={C.green}  sub={`${vMes.length} pedido(s)`} />
        <SB label="A receber"          value={fmt(pendMes)}    cor={C.orange} sub="fim do mês" />
      </div>
      <div style={{ display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px" }}>
        <SB label="Total histórico" value={fmt(totalGeral)}  cor={C.gold} sub={`${vendas.length} pedidos`} />
        <SB label="Clientes"        value={clientes.length}  cor={C.blue} sub="cadastrados" />
      </div>

      {top.length>0&&(
        <Card style={{ marginBottom:"14px" }}>
          <h4 style={{ color:C.green,margin:"0 0 12px",fontSize:"13px" }}>🏆 Mais vendidos</h4>
          {top.map(([nome,qty],i)=>{
            const max=top[0][1];
            return (
              <div key={nome} style={{ marginBottom:"10px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"4px" }}>
                  <span style={{ color:C.text,fontSize:"13px" }}>{i+1}. {nome}</span>
                  <span style={{ color:C.green,fontWeight:"bold",fontSize:"13px" }}>{qty} un.</span>
                </div>
                <div style={{ background:"rgba(255,255,255,0.06)",borderRadius:"6px",height:"6px" }}>
                  <div style={{ width:`${(qty/max)*100}%`,height:"100%",background:`linear-gradient(90deg,${C.sicoob},${C.green})`,borderRadius:"6px" }} />
                </div>
              </div>
            );
          })}
        </Card>
      )}
      {bot.length>0&&(
        <Card>
          <h4 style={{ color:C.orange,margin:"0 0 10px",fontSize:"13px" }}>📉 Menos vendidos</h4>
          {bot.map(([nome,qty])=>(
            <div key={nome} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}` }}>
              <span style={{ color:C.muted,fontSize:"13px" }}>{nome}</span>
              <span style={{ color:C.orange,fontWeight:"bold" }}>{qty} un.</span>
            </div>
          ))}
        </Card>
      )}
      {vendas.length===0&&<Empty texto="Nenhuma venda registrada ainda" />}
    </div>
  );
}

function GerenciarAvisos({ avisos,ops }) {
  const [form,setForm]=useState({titulo:"",texto:"",icone:"📢",cor:C.gold,ativo:true});
  const [salvando,setSalvando]=useState(false);
  const icones=["📢","🎉","🔥","⭐","💥","🎁","☕","🍕","💰","⚡","🛍️","🥤","🎊","📣","✨"];
  const cores=[C.gold,C.green,C.orange,C.blue,C.red,"#c9d200"];
  const salvar=async()=>{
    if(!form.titulo.trim())return;
    setSalvando(true);
    await ops.salvarAviso({...form,ativo:true});
    setForm({titulo:"",texto:"",icone:"📢",cor:C.gold,ativo:true});
    setSalvando(false);
  };
  return (
    <div>
      <Card style={{ marginBottom:"16px" }}>
        <h3 style={{ color:C.text,margin:"0 0 14px",fontSize:"15px" }}>📢 Novo aviso / promoção</h3>
        <p style={{ color:C.muted,fontSize:"12px",margin:"0 0 12px" }}>Aparece para todos no topo da loja</p>
        <Campo label="Ícone">
          <div style={{ display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"8px" }}>
            {icones.map(e=><button key={e} onClick={()=>setForm(f=>({...f,icone:e}))} style={{ width:34,height:34,borderRadius:"8px",border:form.icone===e?`2px solid ${C.gold}`:`1px solid ${C.border}`,background:form.icone===e?`${C.gold}22`:"transparent",cursor:"pointer",fontSize:"18px" }}>{e}</button>)}
          </div>
        </Campo>
        <Campo label="Cor">
          <div style={{ display:"flex",gap:"8px" }}>
            {cores.map(cor=><button key={cor} onClick={()=>setForm(f=>({...f,cor}))} style={{ width:28,height:28,borderRadius:"50%",background:cor,border:form.cor===cor?"3px solid #fff":"2px solid transparent",cursor:"pointer" }} />)}
          </div>
        </Campo>
        <Campo label="Título"><input value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Ex: ☕ Café fresquinho hoje!" style={inp} /></Campo>
        <Campo label="Texto adicional (opcional)"><input value={form.texto} onChange={e=>setForm(f=>({...f,texto:e.target.value}))} placeholder="Ex: Disponível até as 15h!" style={inp} /></Campo>
        <button style={{ ...btnS(C.gold,false,true),padding:"12px" }} onClick={salvar} disabled={salvando||!form.titulo.trim()}>
          {salvando?"Publicando...":"📢 Publicar aviso"}
        </button>
      </Card>
      {avisos.map(a=>(
        <Card key={a.id} style={{ marginBottom:"10px",borderColor:`${a.cor||C.gold}33` }}>
          <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
            <span style={{ fontSize:"24px" }}>{a.icone||"📢"}</span>
            <div style={{ flex:1 }}>
              <div style={{ color:a.cor||C.gold,fontWeight:"bold",fontSize:"14px" }}>{a.titulo}</div>
              {a.texto&&<div style={{ color:C.muted,fontSize:"12px" }}>{a.texto}</div>}
            </div>
            <button onClick={()=>ops.removerAviso(a.id)} style={{ ...btnS(C.red,true),padding:"6px 10px",fontSize:"12px" }}>🗑️</button>
          </div>
        </Card>
      ))}
      {avisos.length===0&&<Empty texto="Nenhum aviso publicado" />}
    </div>
  );
}

const CATEGORIAS_FORM = [["","Automática"],["bebida","Bebida"],["doce","Doce"],["lanche","Lanche"]];
const FORM_VAZIO = {nome:"",preco:"",emoji:"🛍️",foto:"",estoque:"",categoria:""};

function GerenciarProdutos({ produtos,ops }) {
  const [form,setForm]=useState(FORM_VAZIO);
  const [editando,setEditando]=useState(null);
  const [erro,setErro]=useState("");
  const [salvando,setSalvando]=useState(false);
  const fotoRef=useRef();
  const emojis=["🥤","💧","🧃","🥛","🧀","🌾","🍪","🍫","⚡","🥪","🍕","🍔","🌭","🍩","🧁","☕","🍵","🥜","🍭","🍬","🧊","🍺","🥗","🍱"];

  const handleFoto=async(e)=>{
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      const comprimida=await comprimirFoto(ev.target.result);
      setForm(f=>({...f,foto:comprimida}));
    };
    reader.readAsDataURL(file);
  };

  const salvar=async()=>{
    if(!form.nome.trim()){setErro("Digite o nome");return;}
    if(!form.preco||isNaN(Number(form.preco))||Number(form.preco)<=0){setErro("Preço inválido");return;}
    setSalvando(true); setErro("");
    const item={...form,preco:Number(form.preco),estoque:Number(form.estoque)||0};
    if(editando){await ops.atualizarProduto(editando,item);setEditando(null);}
    else{await ops.adicionarProduto({...item,disponivel:true});}
    setForm(FORM_VAZIO);
    setSalvando(false);
  };

  const autoCat = categoriaDe({ nome: form.nome });

  return (
    <div>
      <Card style={{ marginBottom:"16px" }}>
        <h3 style={{ color:C.text,margin:"0 0 14px",fontSize:"15px" }}>{editando?"✏️ Editar":"➕ Novo Produto"}</h3>
        <Campo label="Emoji">
          <div style={{ display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"4px" }}>
            {emojis.map(e=><button key={e} onClick={()=>setForm(f=>({...f,emoji:e}))} style={{ width:32,height:32,borderRadius:"8px",border:form.emoji===e?`2px solid ${C.gold}`:`1px solid ${C.border}`,background:form.emoji===e?`${C.gold}22`:"transparent",cursor:"pointer",fontSize:"16px" }}>{e}</button>)}
          </div>
        </Campo>
        <Campo label="Foto (opcional — comprimida automaticamente)">
          <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
            {form.foto&&<img src={form.foto} alt="" style={{ width:50,height:50,borderRadius:"8px",objectFit:"contain",background:"#fff" }} />}
            <button onClick={()=>fotoRef.current.click()} style={{ ...btnS(C.blue,true),fontSize:"13px",padding:"7px 12px" }}>📷 {form.foto?"Trocar":"Adicionar foto"}</button>
            {form.foto&&<button onClick={()=>setForm(f=>({...f,foto:""}))} style={{ ...btnS(C.red,true),fontSize:"13px",padding:"7px 10px" }}>🗑️</button>}
          </div>
          <input ref={fotoRef} type="file" accept="image/*" onChange={handleFoto} style={{ display:"none" }} />
        </Campo>
        <Campo label="Nome"><input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: Coca-Cola 600ml" style={inp} /></Campo>
        <Campo label="Preço (R$)"><input type="number" min="0" step="0.5" value={form.preco} onChange={e=>setForm(f=>({...f,preco:e.target.value}))} placeholder="Ex: 6.00" style={inp} /></Campo>
        <Campo label="Estoque (unidades)"><input type="number" min="0" value={form.estoque} onChange={e=>setForm(f=>({...f,estoque:e.target.value}))} placeholder="Ex: 20" style={inp} /></Campo>
        <Campo label={`Categoria na loja${form.categoria?"":` (automática: ${CATEGORIAS_FORM.find(c=>c[0]===autoCat)[1]})`}`}>
          <div style={{ display:"flex",gap:"6px",flexWrap:"wrap" }}>
            {CATEGORIAS_FORM.map(([v,l])=>(
              <button key={v||"auto"} onClick={()=>setForm(f=>({...f,categoria:v}))} style={{ padding:"7px 12px",borderRadius:"20px",border:`1px solid ${form.categoria===v?C.gold:C.border}`,background:form.categoria===v?`${C.gold}22`:"transparent",color:form.categoria===v?C.gold:C.muted,cursor:"pointer",fontSize:"13px",fontFamily:"inherit" }}>{l}</button>
            ))}
          </div>
        </Campo>
        {erro&&<p style={{ color:C.red,fontSize:"13px",margin:"0 0 10px" }}>{erro}</p>}
        <div style={{ display:"flex",gap:"8px" }}>
          <button style={{ ...btnS(C.gold),flex:1 }} onClick={salvar} disabled={salvando}>{salvando?"Salvando...":editando?"Salvar alterações":"Adicionar produto"}</button>
          {editando&&<button style={{ ...btnS(C.muted,true) }} onClick={()=>{ setEditando(null); setForm(FORM_VAZIO); }}>Cancelar</button>}
        </div>
      </Card>
      <p style={{ color:C.muted,fontSize:"12px",margin:"0 0 10px" }}>{produtos.length} produto(s)</p>
      {produtos.map(p=>(
        <Card key={p.id} style={{ marginBottom:"10px",opacity:p.disponivel?1:0.5 }}>
          <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
            {p.foto?<img src={p.foto} alt={p.nome} style={{ width:50,height:50,borderRadius:"10px",objectFit:"contain",background:"#fff",flexShrink:0 }} />
              :<div style={{ width:50,height:50,borderRadius:"10px",background:`${C.gold}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px",flexShrink:0 }}>{p.emoji}</div>}
            <div style={{ flex:1 }}>
              <div style={{ color:C.text,fontWeight:"bold",fontSize:"14px" }}>{p.nome}</div>
              <div style={{ color:C.green,fontSize:"13px" }}>{fmt(p.preco)}</div>
              <div style={{ color:(p.estoque||0)<=3?C.red:C.muted,fontSize:"11px" }}>Estoque: {p.estoque||0} un.</div>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:"5px",flexShrink:0 }}>
              <button onClick={()=>ops.atualizarProduto(p.id,{disponivel:!p.disponivel})} style={{ ...btnS(p.disponivel?C.green:C.muted,true),padding:"5px 8px",fontSize:"11px" }}>{p.disponivel?"✓ Ativo":"✗ Oculto"}</button>
              <div style={{ display:"flex",gap:"4px" }}>
                <button onClick={()=>{ setEditando(p.id); setForm({nome:p.nome,preco:String(p.preco),emoji:p.emoji,foto:p.foto||"",estoque:String(p.estoque||0),categoria:p.categoria||""}); }} style={{ ...btnS(C.gold,true),padding:"5px 8px",fontSize:"11px" }}>✏️</button>
                <button onClick={()=>window.confirm("Remover produto?")&&ops.removerProduto(p.id)} style={{ ...btnS(C.red,true),padding:"5px 8px",fontSize:"11px" }}>🗑️</button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function GerenciarVendas({ vendas,ops }) {
  const [filtro,setFiltro]=useState("todos");
  const lista=filtro==="todos"?vendas:filtro==="pendente"?vendas.filter(v=>v.pagamento==="fim_do_mes"&&!v.pago):vendas.filter(v=>v.pagamento==="na_hora"||v.pago);
  return (
    <div>
      <div style={{ display:"flex",gap:"6px",marginBottom:"10px",flexWrap:"wrap" }}>
        {[["todos","Todos"],["pendente","📅 Pendentes"],["pago","✅ Pagos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFiltro(v)} style={{ padding:"6px 14px",borderRadius:"20px",border:`1px solid ${filtro===v?C.gold:C.border}`,background:filtro===v?`${C.gold}18`:"transparent",color:filtro===v?C.gold:C.muted,cursor:"pointer",fontSize:"12px",fontFamily:"inherit" }}>{l}</button>
        ))}
      </div>
      <div style={{ color:C.muted,fontSize:"12px",marginBottom:"10px" }}>{lista.length} registro(s) · Total: {fmt(lista.reduce((a,v)=>a+v.total,0))}</div>
      {lista.length===0&&<Empty texto="Nenhuma venda aqui" />}
      {lista.map(v=>(
        <Card key={v.id} style={{ marginBottom:"10px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",gap:"8px",flexWrap:"wrap" }}>
            <div>
              <div style={{ color:C.text,fontWeight:"bold",fontSize:"14px" }}>{v.clienteNome}</div>
              <div style={{ color:C.muted,fontSize:"11px" }}>{v.clienteTel&&`📱 ${v.clienteTel} · `}{v.data}</div>
              <div style={{ color:C.muted,fontSize:"12px",marginTop:"3px" }}>{v.itens?.map(i=>`${i.emoji} ${i.nome} ×${i.qty}`).join(", ")}</div>
              {v.pago&&v.dataPagamento&&<div style={{ color:C.green,fontSize:"11px" }}>✅ Pago em {v.dataPagamento}</div>}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ color:C.text,fontWeight:"bold",fontSize:"16px" }}>{fmt(v.total)}</div>
              <span style={{ fontSize:"11px",padding:"2px 8px",borderRadius:"10px",border:`1px solid ${v.pago||v.pagamento==="na_hora"?C.green:C.orange}`,color:v.pago||v.pagamento==="na_hora"?C.green:C.orange }}>
                {v.pago?"✅ Pago":v.pagamento==="na_hora"?"⚡ Na hora":"📅 Fim do mês"}
              </span>
            </div>
          </div>
          <div style={{ display:"flex",gap:"6px",marginTop:"10px" }}>
            {v.pagamento==="fim_do_mes"&&!v.pago&&(
              <button onClick={()=>ops.atualizarVenda(v.id,{pago:true,dataPagamento:nowStr()})} style={{ ...btnS(C.green),padding:"7px 14px",fontSize:"12px",color:"#00262e" }}>Marcar como pago</button>
            )}
            <button onClick={()=>window.confirm("Excluir venda?")&&ops.removerVenda(v.id)} style={{ ...btnS(C.red,true),padding:"7px 12px",fontSize:"12px" }}>🗑️</button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function VerClientes({ clientes,vendas }) {
  return (
    <div>
      <div style={{ color:C.muted,fontSize:"12px",margin:"14px 0 10px" }}>{clientes.length} cliente(s)</div>
      {clientes.length===0&&<Empty texto="Nenhum cliente ainda" />}
      {clientes.map(c=>{
        const cv=vendas.filter(v=>v.clienteId===c.id);
        const pendente=cv.filter(v=>v.pagamento==="fim_do_mes"&&!v.pago).reduce((a,v)=>a+v.total,0);
        return (
          <Card key={c.id} style={{ marginBottom:"10px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
              <div>
                <div style={{ color:C.text,fontWeight:"bold" }}>{c.nome}</div>
                {c.email&&<div style={{ color:C.muted,fontSize:"12px" }}>✉️ {c.email}</div>}
                {c.telefone&&<div style={{ color:C.muted,fontSize:"12px" }}>📱 {c.telefone}</div>}
                <div style={{ color:C.muted,fontSize:"11px",marginTop:"2px" }}>{cv.length} compra(s) · Total: {fmt(cv.reduce((a,v)=>a+v.total,0))}</div>
              </div>
              {pendente>0&&<div style={{ color:C.orange,fontWeight:"bold",textAlign:"right" }}>{fmt(pendente)}<br/><span style={{ fontSize:"10px",fontWeight:"normal" }}>a pagar</span></div>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Card({ children,style={} }) {
  return <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:"12px",padding:"14px 16px",...style }}>{children}</div>;
}
function Campo({ label,children }) {
  return (
    <div style={{ marginBottom:"12px" }}>
      <label style={{ display:"block",color:C.muted,fontSize:"12px",marginBottom:"5px" }}>{label}</label>
      {children}
    </div>
  );
}
function Empty({ texto }) {
  return <div style={{ textAlign:"center",color:C.muted,padding:"40px 0",fontSize:"14px" }}>💨 {texto}</div>;
}
