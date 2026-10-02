// Só no modo demonstração: em vez de abrir o WhatsApp de verdade, mostra a mensagem que iria.
export default function PreviaWhatsApp({ para, texto, onFechar }) {
  return (
    <div className="folha folha--topo">
      <div className="veu" onClick={onFechar} />
      <div className="folha__painel" role="dialog" aria-modal="true" aria-label="Prévia da mensagem">
        <div className="folha__alca" />
        <h2 className="folha__titulo">Prévia do WhatsApp</h2>
        <p className="folha__sub">Na versão real, o botão abre a conversa com {para} com esta mensagem pronta:</p>
        <div className="previa-msg">{texto}</div>
        <button type="button" className="btn-principal" onClick={onFechar}>Fechar</button>
      </div>
    </div>
  );
}
