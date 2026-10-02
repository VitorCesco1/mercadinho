import { useEffect, useRef, useState } from "react";
import Icone from "../componentes/Icone.jsx";
import { Miniatura } from "../componentes/Pecas.jsx";
import { fmt, semAcento } from "../lib/formato.js";
import { categoriaDe } from "../lib/sugestoes.js";

// Reduz foto para max 400px e qualidade 70% — protege limite 1MB do Firestore.
// Fundo branco por baixo: PNG transparente virava fundo preto no JPEG.
const comprimirFoto = (base64, maxPx = 400) => new Promise(resolve => {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL("image/jpeg", 0.7));
  };
  img.src = base64;
});

const EMOJIS = ["🥤","💧","🧃","🥛","🧀","🌾","🍪","🍫","⚡","🥪","🍕","🍔","🌭","🍩","🧁","☕","🍵","🥜","🍭","🍬","🧊","🍺","🥗","🍱","🛍️"];
const CATEGORIAS_FORM = [["", "Automática"], ["bebida", "Bebida"], ["doce", "Doce"], ["lanche", "Lanche"]];
const NOME_CAT = { bebida: "Bebida", doce: "Doce", lanche: "Lanche" };
const FORM_VAZIO = { nome: "", preco: "", emoji: "🛍️", foto: "", estoque: "", categoria: "" };

export default function Produtos({ produtos, ops }) {
  const [form, setForm] = useState(FORM_VAZIO);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const fotoRef = useRef();
  const formRef = useRef();
  const campo = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFoto = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const comprimida = await comprimirFoto(ev.target.result);
      setForm(f => ({ ...f, foto: comprimida }));
    };
    reader.readAsDataURL(file);
  };

  const salvar = async () => {
    if (!form.nome.trim()) { setErro("Digite o nome"); return; }
    if (!form.preco || isNaN(Number(form.preco)) || Number(form.preco) <= 0) { setErro("Preço inválido"); return; }
    setSalvando(true); setErro("");
    const item = { ...form, preco: Number(form.preco), estoque: Number(form.estoque) || 0 };
    if (editando) { await ops.atualizarProduto(editando, item); setEditando(null); }
    else { await ops.adicionarProduto({ ...item, disponivel: true }); }
    setForm(FORM_VAZIO);
    setSalvando(false);
  };

  const editar = (p) => {
    setEditando(p.id);
    setErro("");
    setForm({ nome: p.nome, preco: String(p.preco), emoji: p.emoji, foto: p.foto || "", estoque: String(p.estoque || 0), categoria: p.categoria || "" });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const cancelar = () => { setEditando(null); setForm(FORM_VAZIO); setErro(""); };

  const autoCat = categoriaDe({ nome: form.nome });
  const termo = semAcento(busca.trim());
  const lista = [...produtos]
    .filter(p => !termo || semAcento(p.nome).includes(termo))
    .sort((a, b) => (b.disponivel - a.disponivel) || a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <section className="prod">
      <form ref={formRef} className="cartao prod-form" onSubmit={e => { e.preventDefault(); salvar(); }}>
        <h2>{editando ? "Editar produto" : "Novo produto"}</h2>
        <label className="campo"><span>Nome</span><input value={form.nome} onChange={campo("nome")} placeholder="Ex: Coca-Cola 600ml" /></label>
        <div className="prod-form__dupla">
          <label className="campo"><span>Preço (R$)</span><input type="number" inputMode="decimal" min="0" step="0.5" value={form.preco} onChange={campo("preco")} placeholder="6.00" /></label>
          <label className="campo"><span>Estoque (un.)</span><input type="number" inputMode="numeric" min="0" value={form.estoque} onChange={campo("estoque")} placeholder="20" /></label>
        </div>
        <div className="campo">
          <span>Categoria na loja{form.categoria ? "" : ` (automática: ${NOME_CAT[autoCat]})`}</span>
          <div className="chips-form">
            {CATEGORIAS_FORM.map(([v, l]) => (
              <button type="button" key={v || "auto"} className={`chip${form.categoria === v ? " ativo" : ""}`} onClick={() => setForm(f => ({ ...f, categoria: v }))}>{l}</button>
            ))}
          </div>
        </div>
        <div className="campo">
          <span>Foto (opcional, diminuída automaticamente)</span>
          <div className="prod-form__foto">
            {form.foto ? <span className="miniatura miniatura--grande"><img src={form.foto} alt="" /></span> : <span className="miniatura miniatura--grande">{form.emoji}</span>}
            <button type="button" className="btn-leve" onClick={() => fotoRef.current.click()}>{form.foto ? "Trocar foto" : "Adicionar foto"}</button>
            {form.foto && <button type="button" className="btn-leve" onClick={() => setForm(f => ({ ...f, foto: "" }))}>Tirar</button>}
          </div>
          <input ref={fotoRef} type="file" accept="image/*" onChange={handleFoto} hidden />
        </div>
        <details className="prod-form__emojis">
          <summary>Emoji (aparece quando não tem foto): {form.emoji}</summary>
          <div className="emojis">
            {EMOJIS.map(e => <button type="button" key={e} className={form.emoji === e ? "ativo" : ""} onClick={() => setForm(f => ({ ...f, emoji: e }))}>{e}</button>)}
          </div>
        </details>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <div className="prod-form__acoes">
          <button type="submit" className="btn-principal" disabled={salvando}>{salvando ? "Salvando…" : editando ? "Salvar alterações" : "Adicionar produto"}</button>
          {editando && <button type="button" className="btn-texto" onClick={cancelar}>Cancelar</button>}
        </div>
      </form>

      <div className="busca busca--painel">
        <Icone nome="busca" tamanho={20} />
        <input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto" aria-label="Buscar produto" />
      </div>
      <p className="vendas__total">{produtos.length} produtos, {produtos.filter(p => p.disponivel).length} ativos na loja</p>

      {lista.map(p => <ItemProduto key={p.id} p={p} ops={ops} onEditar={() => editar(p)} />)}
    </section>
  );
}

function ItemProduto({ p, ops, onEditar }) {
  const [confirma, setConfirma] = useState(false);
  useEffect(() => {
    if (!confirma) return;
    const t = setTimeout(() => setConfirma(false), 4000);
    return () => clearTimeout(t);
  }, [confirma]);
  const estoque = p.estoque || 0;
  return (
    <article className={`prod-item${p.disponivel ? "" : " oculto"}`}>
      <Miniatura p={p} />
      <div className="prod-item__dados">
        <strong>{p.nome}</strong>
        <span>{fmt(p.preco)} <em className={estoque <= 3 ? "baixo" : ""}>{estoque} em estoque</em></span>
        <small>{NOME_CAT[categoriaDe(p)]}{p.categoria ? "" : " (automática)"}</small>
      </div>
      <div className="prod-item__acoes">
        <button type="button" className={`interruptor${p.disponivel ? " ligado" : ""}`} role="switch" aria-checked={!!p.disponivel}
          onClick={() => ops.atualizarProduto(p.id, { disponivel: !p.disponivel })} aria-label={p.disponivel ? "Esconder da loja" : "Mostrar na loja"}>
          <i />
        </button>
        <div className="prod-item__botoes">
          <button type="button" className="icone-btn" onClick={onEditar} aria-label={`Editar ${p.nome}`}><Icone nome="lapis" tamanho={18} /></button>
          <button type="button" className={`icone-btn${confirma ? " perigo" : ""}`} onClick={() => (confirma ? ops.removerProduto(p.id) : setConfirma(true))}
            aria-label={confirma ? `Confirmar remoção de ${p.nome}` : `Remover ${p.nome}`}>
            <Icone nome={confirma ? "check" : "lixo"} tamanho={18} />
          </button>
        </div>
      </div>
      {confirma && <p className="prod-item__confirma">Toque no ✓ pra remover {p.nome.trim()}.</p>}
    </article>
  );
}
