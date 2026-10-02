import Icone from "./Icone.jsx";
import { PassoQtd } from "./Pecas.jsx";
import { fmt } from "../lib/formato.js";

export default function CartaoProduto({ p, qtd = 0, selo, onAdd, onMenos }) {
  const nome = p.nome.trim(); // alguns nomes no banco têm espaço sobrando no fim
  const estoque = p.estoque || 0;
  const esgotado = estoque <= 0;
  const aviso = !esgotado && estoque <= 3 ? (estoque === 1 ? "Última unidade" : `Últimas ${estoque} unidades`) : "";
  return (
    <article className={`produto${qtd ? " no-carrinho" : ""}${esgotado ? " esgotado" : ""}`}>
      {p.foto
        ? <div className="produto__foto"><img src={p.foto} alt="" loading="lazy" decoding="async" /></div>
        : <div className="produto__emoji" aria-hidden="true">{p.emoji || "🛍️"}</div>}
      {selo && <span className="selo">{selo}</span>}
      <div className="produto__corpo">
        <h3 className="produto__nome">{nome}</h3>
        <div className="produto__preco">{fmt(p.preco)}</div>
        <div className="produto__aviso">{aviso}</div>
        <div className="produto__acao">
          {qtd > 0
            ? <PassoQtd qtd={qtd} nome={nome} noLimite={qtd >= estoque} onMais={() => onAdd(p)} onMenos={() => onMenos(p.id)} />
            : (
              <button type="button" className="btn-add" disabled={esgotado} onClick={() => onAdd(p)} aria-label={esgotado ? `${nome} esgotado` : `Adicionar ${nome}`}>
                {esgotado ? "Esgotado" : <><Icone nome="mais" tamanho={18} espessura={2.4} />Adicionar</>}
              </button>
            )}
        </div>
      </div>
    </article>
  );
}
