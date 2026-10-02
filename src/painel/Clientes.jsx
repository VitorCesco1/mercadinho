import { useMemo, useState } from "react";
import Icone from "../componentes/Icone.jsx";
import { fmt, semAcento } from "../lib/formato.js";
import { estaPago } from "../lib/relatorios.js";
import { numeroWhatsApp } from "../lib/cobranca.js";

export default function Clientes({ clientes, vendas }) {
  const [busca, setBusca] = useState("");
  const porCliente = useMemo(() => {
    const m = new Map();
    for (const v of vendas) {
      const x = m.get(v.clienteId) || { pedidos: 0, total: 0, aberto: 0 };
      x.pedidos++; x.total += v.total || 0; if (!estaPago(v)) x.aberto += v.total || 0;
      m.set(v.clienteId, x);
    }
    return m;
  }, [vendas]);
  const termo = semAcento(busca.trim());
  const lista = [...clientes]
    .filter(c => !termo || semAcento(`${c.nome} ${c.email} ${c.telefone}`).includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <section className="clientes">
      <div className="busca busca--painel">
        <Icone nome="busca" tamanho={20} />
        <input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone" aria-label="Buscar cliente" />
      </div>
      <p className="vendas__total">{clientes.length} clientes cadastrados</p>
      {!lista.length && <div className="vazio">Ninguém com esse nome.</div>}
      {lista.map(c => {
        const x = porCliente.get(c.id) || { pedidos: 0, total: 0, aberto: 0 };
        const whats = numeroWhatsApp(c.telefone);
        return (
          <article key={c.id} className="cli-item">
            <div className="cli-item__topo">
              <strong>{c.nome}</strong>
              {x.aberto > 0 && <b className="cli-item__aberto">{fmt(x.aberto)}<small>em aberto</small></b>}
            </div>
            <p className="cli-item__contato">
              <span>{c.email}</span>
              {c.telefone && (whats
                ? <a href={`https://wa.me/${whats}`} target="_blank" rel="noopener noreferrer">{c.telefone}</a>
                : <span>{c.telefone}</span>)}
            </p>
            <p className="cli-item__numeros">{x.pedidos} {x.pedidos === 1 ? "compra" : "compras"}, {fmt(x.total)} no total</p>
          </article>
        );
      })}
    </section>
  );
}
