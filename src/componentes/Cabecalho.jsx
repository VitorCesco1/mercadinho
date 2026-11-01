import Icone from "./Icone.jsx";
import logo from "../assets/logo-transcredi.webp";

export default function Cabecalho({ cliente, qtd, pulso, onCarrinho, onEntrar, onPedidos, onMarca }) {
  return (
    <header className="topo">
      <div className="topo__dentro">
        <button type="button" className="topo__marca" onClick={onMarca} aria-label="Início">
          <img src={logo} alt="Sicoob Transcredi" width="126" height="32" />
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
