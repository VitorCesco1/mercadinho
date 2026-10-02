import { useState } from "react";
import Icone from "../componentes/Icone.jsx";

const ICONES = ["📢","🎉","🔥","⭐","💥","🎁","☕","🍕","💰","⚡","🛍️","🥤","🎊","📣","✨"];
const CORES = ["#00ae9d", "#2fd0bd", "#f3bb4f", "#6ab0f5", "#ff8f86", "#c9d200"];
const VAZIO = { titulo: "", texto: "", icone: "📢", cor: CORES[0], ativo: true };

export default function Avisos({ avisos, ops }) {
  const [form, setForm] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const salvar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setSalvando(true);
    await ops.salvarAviso({ ...form, ativo: true });
    setForm(VAZIO);
    setSalvando(false);
  };

  return (
    <section className="avisos-painel">
      <form className="cartao prod-form" onSubmit={salvar}>
        <h2>Novo aviso ou promoção</h2>
        <p className="prod-form__ajuda">Aparece pra todo mundo no topo da loja.</p>
        <label className="campo"><span>Título</span><input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Café fresquinho hoje!" /></label>
        <label className="campo"><span>Texto (opcional)</span><input value={form.texto} onChange={e => setForm(f => ({ ...f, texto: e.target.value }))} placeholder="Ex: Disponível até as 15h" /></label>
        <div className="campo">
          <span>Ícone</span>
          <div className="emojis">
            {ICONES.map(i => <button type="button" key={i} className={form.icone === i ? "ativo" : ""} onClick={() => setForm(f => ({ ...f, icone: i }))}>{i}</button>)}
          </div>
        </div>
        <div className="campo">
          <span>Cor</span>
          <div className="cores">
            {CORES.map(c => <button type="button" key={c} className={form.cor === c ? "ativo" : ""} style={{ background: c }} onClick={() => setForm(f => ({ ...f, cor: c }))} aria-label={`Cor ${c}`} />)}
          </div>
        </div>
        {form.titulo.trim() && (
          <div className="aviso" style={{ "--cor": form.cor }}>
            <span className="aviso__icone">{form.icone}</span>
            <div><div className="aviso__titulo">{form.titulo}</div>{form.texto && <div className="aviso__texto">{form.texto}</div>}</div>
          </div>
        )}
        <button type="submit" className="btn-principal prod-form__enviar" disabled={salvando || !form.titulo.trim()}>{salvando ? "Publicando…" : "Publicar aviso"}</button>
      </form>

      <p className="vendas__total">{avisos.length ? `${avisos.length} ${avisos.length === 1 ? "aviso no ar" : "avisos no ar"}` : "Nenhum aviso no ar"}</p>
      {avisos.map(a => (
        <div key={a.id} className="aviso aviso--painel" style={{ "--cor": a.cor || "#c9d200" }}>
          <span className="aviso__icone">{a.icone || "📢"}</span>
          <div className="aviso__corpo"><div className="aviso__titulo">{a.titulo}</div>{a.texto && <div className="aviso__texto">{a.texto}</div>}</div>
          <button type="button" className="icone-btn" onClick={() => ops.removerAviso(a.id)} aria-label={`Tirar o aviso ${a.titulo}`}><Icone nome="lixo" tamanho={18} /></button>
        </div>
      ))}
    </section>
  );
}
