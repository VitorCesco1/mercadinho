import { useState } from "react";
import Icone from "./Icone.jsx";
import { CHAVE_PIX, copiarTexto } from "../lib/pix.js";

export function Miniatura({ p }) {
  return (
    <span className="miniatura" aria-hidden="true">
      {p.foto ? <img src={p.foto} alt="" loading="lazy" decoding="async" /> : (p.emoji || "🛍️")}
    </span>
  );
}

export function PassoQtd({ qtd, nome, noLimite, onMais, onMenos, mini = false }) {
  const t = mini ? 16 : 18;
  return (
    <div className={`passo-qtd${mini ? " passo-qtd--mini" : ""}`}>
      <button type="button" onClick={onMenos} aria-label={`Tirar um ${nome}`}><Icone nome="menos" tamanho={t} espessura={2.4} /></button>
      <span aria-live="polite">{qtd}</span>
      <button type="button" onClick={onMais} disabled={noLimite} aria-label={`Mais um ${nome}`}><Icone nome="mais" tamanho={t} espessura={2.4} /></button>
    </div>
  );
}

// Copia o PIX. Se o navegador bloquear (alguns navegadores embutidos bloqueiam), mostra o código pra copiar na mão.
export function CopiarPix() {
  const [estado, setEstado] = useState("");
  const copiar = async () => {
    const ok = await copiarTexto(CHAVE_PIX);
    setEstado(ok ? "ok" : "falhou");
    if (ok) setTimeout(() => setEstado(""), 3000);
  };
  return (
    <>
      <button type="button" className={`btn-secundario${estado === "ok" ? " feito" : ""}`} onClick={copiar}>
        <Icone nome={estado === "ok" ? "check" : "copiar"} tamanho={20} />{estado === "ok" ? "Código copiado" : "Copiar código PIX"}
      </button>
      {estado === "falhou" && (
        <div className="pix__manual">
          <p>Não deu pra copiar sozinho. Toque e segure no código abaixo pra copiar.</p>
          <textarea readOnly rows={4} value={CHAVE_PIX} onFocus={e => e.target.select()} aria-label="Código PIX" />
        </div>
      )}
    </>
  );
}
