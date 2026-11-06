import Icone from "./Icone.jsx";

export default function Cabecalho({ cliente, qtd, pulso, onCarrinho, onEntrar, onPedidos, onMarca }) {
  return (
    <header className="topo">
      <div className="topo__dentro">
        <button type="button" className="topo__marca" onClick={onMarca} aria-label="Início">
          <span className="topo__nome">Mercadinho <b>Transcredi</b></span>
        </button>
        {cliente
          ? <button type="button" className="topo__btn" onClick={onPedidos} aria-label="Minhas compras"><Icone nome="recibo" /></button>
          : <button type="button" className="topo__entrar" onClick={onEntrar}>Entrar</button>}
        <button type="button" className="topo__btn" onClick={onCarrinho} aria-label={qtd ? `Carrinho com ${qtd} itens` : "Carrinho vazio"}>
          <Icone nome="sacola" tamanho={25} />
          {qtd > 0 && <span key={pulso} className="contador pulou">{qtd}</span>}
        </button>
      </div>
    </header>
  );
}
