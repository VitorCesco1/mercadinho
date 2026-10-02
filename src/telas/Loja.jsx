import { useEffect, useMemo, useState } from "react";
import CartaoProduto from "../componentes/CartaoProduto.jsx";
import Icone from "../componentes/Icone.jsx";
import { CATEGORIAS, categoriaDe, maisPedidos } from "../lib/sugestoes.js";
import { fmt, primeiroNome, semAcento } from "../lib/formato.js";

export default function Loja({ produtos, erroProdutos, avisos, stats, cliente, emAberto, qtdPorId, onAdd, onMenos, onPedidos, onCoroa }) {
  const [busca, setBusca] = useState("");
  const [ativa, setAtiva] = useState("");

  const visiveis = useMemo(() => (produtos || []).filter(p => p.disponivel), [produtos]);
  const top = useMemo(() => maisPedidos(visiveis, stats, 8), [visiveis, stats]);
  const top3 = useMemo(() => new Set(top.slice(0, 3).map(p => p.id)), [top]);

  const secoes = useMemo(() => {
    const vendidos = stats?.vendidos || {};
    const ordem = (a, b) =>
      ((b.estoque || 0) > 0) - ((a.estoque || 0) > 0) ||
      (vendidos[b.id] || 0) - (vendidos[a.id] || 0) ||
      a.nome.localeCompare(b.nome, "pt-BR");
    const lista = CATEGORIAS
      .map(c => ({ ...c, produtos: visiveis.filter(p => categoriaDe(p) === c.id).sort(ordem) }))
      .filter(c => c.produtos.length);
    return top.length ? [{ id: "mais", nome: "Os mais pedidos", carrossel: true, produtos: top }, ...lista] : lista;
  }, [visiveis, top, stats]);

  const termo = semAcento(busca.trim());
  const buscando = termo.length > 0;
  const resultados = buscando ? visiveis.filter(p => semAcento(p.nome).includes(termo)) : null;

  // Destaca o chip da seção que está na tela
  useEffect(() => {
    if (buscando) return;
    const els = secoes.map(s => document.getElementById(`sec-${s.id}`)).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entradas) => entradas.forEach(e => e.isIntersecting && setAtiva(e.target.id.slice(4))),
      { rootMargin: "-130px 0px -60% 0px" },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [secoes, buscando]);

  const irPara = (id) => {
    setAtiva(id);
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cartao = (p, selo) => (
    <CartaoProduto key={p.id} p={p} qtd={qtdPorId.get(p.id) || 0} selo={selo} onAdd={onAdd} onMenos={onMenos} />
  );

  return (
    <main className="loja">
      <section className="ola">
        <p className="ola__marca">Mercadinho Transcredi</p>
        {cliente ? (
          <>
            <h1 className="ola__titulo">Olá, {primeiroNome(cliente.nome)}! O que vai ser hoje?</h1>
            {emAberto > 0 && (
              <button type="button" className="em-aberto" onClick={onPedidos}>
                <Icone nome="calendario" />
                <span>Você tem <strong>{fmt(emAberto)}</strong> em aberto no fim do mês</span>
                <span>Pagar</span>
              </button>
            )}
          </>
        ) : (
          <>
            <h1 className="ola__titulo">O que vai ser hoje?</h1>
            <p className="ola__sub">Lanches, doces e bebidas do mercadinho da Transcredi. Pague no PIX na hora ou deixe pro fim do mês.</p>
            <ol className="passos">
              <li><b>1</b>Escolha o que vai levar</li>
              <li><b>2</b>Pague no PIX ou no fim do mês</li>
              <li><b>3</b>Pronto, fica tudo no seu histórico</li>
            </ol>
          </>
        )}
        {avisos.map(a => (
          <div key={a.id} className="aviso" style={{ "--cor": a.cor || "#c9d200" }}>
            <span className="aviso__icone">{a.icone || "📢"}</span>
            <div>
              <div className="aviso__titulo">{a.titulo}</div>
              {a.texto && <div className="aviso__texto">{a.texto}</div>}
            </div>
          </div>
        ))}
      </section>

      <div className="busca">
        <Icone nome="busca" tamanho={20} />
        <input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto" aria-label="Buscar produto" enterKeyHint="search" />
        {busca && <button type="button" className="busca__limpar" onClick={() => setBusca("")} aria-label="Limpar busca"><Icone nome="fechar" tamanho={18} /></button>}
      </div>

      {!resultados && secoes.length > 1 && (
        <nav className="chips" aria-label="Categorias">
          {secoes.map(s => (
            <button type="button" key={s.id} className={`chip${ativa === s.id ? " ativo" : ""}`} onClick={() => irPara(s.id)}>
              {s.id === "mais" ? "Mais pedidos" : s.nome}
            </button>
          ))}
        </nav>
      )}

      {erroProdutos && !produtos && (
        <div className="vazio">Não deu pra carregar os produtos. Confira sua internet e abra o app de novo.</div>
      )}

      {!produtos && !erroProdutos && (
        <div className="secao">
          <div className="grade carregando-grade" aria-label="Carregando produtos">
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="produto esqueleto" />)}
          </div>
        </div>
      )}

      {resultados && (
        <section className="secao">
          <h2 className="secao__titulo">Resultado<small>{resultados.length} {resultados.length === 1 ? "produto" : "produtos"}</small></h2>
          {resultados.length
            ? <div className="grade">{resultados.map(p => cartao(p, top3.has(p.id) ? "Mais pedido" : null))}</div>
            : <div className="vazio">Nada com “{busca.trim()}”. Tente outro nome.</div>}
        </section>
      )}

      {!resultados && secoes.map(s => (
        <section key={s.id} id={`sec-${s.id}`} className="secao">
          <h2 className="secao__titulo">{s.nome}{!s.carrossel && <small>{s.produtos.length}</small>}</h2>
          {s.carrossel
            ? <div className="carrossel">{s.produtos.map((p, i) => cartao(p, `${i + 1}º`))}</div>
            : <div className="grade">{s.produtos.map(p => cartao(p, top3.has(p.id) ? "Mais pedido" : null))}</div>}
        </section>
      ))}

      {produtos && !visiveis.length && <div className="vazio">Nenhum produto disponível agora.</div>}

      <footer className="rodape">
        <p>Mercadinho dos colaboradores do Sicoob Transcredi</p>
        <p>Concórdia, SC</p>
        <button type="button" className="coroa" onClick={onCoroa} aria-label="Área do responsável">👑</button>
      </footer>
    </main>
  );
}
