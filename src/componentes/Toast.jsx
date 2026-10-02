import { useEffect } from "react";
import Icone from "./Icone.jsx";
import { Miniatura } from "./Pecas.jsx";
import { fmt, nomeCurto } from "../lib/formato.js";

// Confirmação rápida ao adicionar, com a sugestão de combo quando houver.
export default function Toast({ dados, onAdd, onFechar }) {
  const s = dados.sugestao;
  useEffect(() => {
    const t = setTimeout(onFechar, s ? 5200 : 2200);
    return () => clearTimeout(t);
  }, [s, onFechar]);

  return (
    <div className="toast" role="status">
      <div className="toast__ok">
        <Icone nome="check" tamanho={18} espessura={2.6} />
        {nomeCurto(dados.produto.nome)} no carrinho
      </div>
      {s && (
        <div className="toast__sug">
          <Miniatura p={s.produto} />
          <p>{s.texto}<small>{nomeCurto(s.produto.nome)} por {fmt(s.produto.preco)}</small></p>
          <button type="button" className="toast__btn" onClick={() => onAdd(s.produto)}>
            <Icone nome="mais" tamanho={16} espessura={2.6} />Levar
          </button>
        </div>
      )}
    </div>
  );
}
