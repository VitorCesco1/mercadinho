import { useState } from "react";
import Icone from "./Icone.jsx";
import { CopiarPix } from "./Pecas.jsx";
import PreviaWhatsApp from "./PreviaWhatsApp.jsx";
import { agoraMs, agoraTexto, fmt } from "../lib/formato.js";
import { chaveMes } from "../lib/datas.js";
import { FAVORECIDO } from "../lib/pix.js";
import { ASSINATURA, linkWhatsAppMercadinho, mensagemAvisoPagamento, rotuloMes } from "../lib/cobranca.js";
import qrPix from "../assets/pix-qr.svg";

const DEMO = import.meta.env.MODE === "demo";

// Cliente paga o saldo do fim do mês: escolhe o que pagar, paga no PIX e avisa no WhatsApp com o comprovante.
export default function PagarSaldo({ cliente, mesesAbertos, api, onFechar, onAvisou }) {
  const total = Math.round(mesesAbertos.reduce((a, m) => a + m.aberto, 0) * 100) / 100;
  const varios = mesesAbertos.length > 1;
  const [escolha, setEscolha] = useState("tudo");
  const [passo, setPasso] = useState(varios ? "escolher" : "pix");
  const [previa, setPrevia] = useState(null);
  const [agora] = useState(() => new Date());
  const mesAtual = chaveMes(agora.getTime());

  const chaves = escolha === "tudo" ? mesesAbertos.map(m => m.chave) : [escolha];
  const valor = escolha === "tudo" ? total : mesesAbertos.find(m => m.chave === escolha)?.aberto || 0;
  const texto = mensagemAvisoPagamento(cliente.nome, chaves, valor);
  const link = linkWhatsAppMercadinho(texto);

  const avisar = (e) => {
    const aviso = { clienteId: cliente.id, clienteNome: cliente.nome, valor, meses: [...chaves].sort(), data: agoraTexto() };
    // registra pro dono ver no painel; se falhar, o WhatsApp abre do mesmo jeito
    api?.informarPagamento(aviso).catch(() => {});
    onAvisou({ ...aviso, ms: agoraMs() });
    setPasso("enviado");
    if (DEMO) { e.preventDefault(); setPrevia(texto); }
  };

  let titulo, corpo, rodape;

  if (passo === "escolher") {
    titulo = "O que você quer pagar?";
    corpo = (
      <div className="escolhas" role="radiogroup">
        {[{ chave: "tudo", rotulo: "Tudo em aberto", valor: total }, ...mesesAbertos.map(m => ({ chave: m.chave, rotulo: rotuloMes(m.chave), valor: m.aberto }))].map(o => (
          <label key={o.chave} className={`escolha${escolha === o.chave ? " ativa" : ""}`}>
            <input type="radio" name="o-que-pagar" checked={escolha === o.chave} onChange={() => setEscolha(o.chave)} />
            <span className="escolha__texto">
              {o.rotulo}
              {o.chave === mesAtual && <small>Mês ainda em andamento</small>}
            </span>
            <b>{fmt(o.valor)}</b>
          </label>
        ))}
      </div>
    );
    rodape = <button type="button" className="btn-principal" onClick={() => setPasso("pix")}>Pagar {fmt(valor)}</button>;
  }

  if (passo === "pix") {
    titulo = "Pagar com PIX";
    corpo = (
      <div className="pix">
        <p className="pix__rotulo">Valor a pagar{escolha !== "tudo" ? ` de ${rotuloMes(escolha).toLowerCase()}` : ""}</p>
        <p className="pix__valor">{fmt(valor)}</p>
        <div className="pix__qr"><img src={qrPix} alt="QR Code PIX do Mercadinho" width="206" height="206" /></div>
        <CopiarPix />
        <ol className="pix__passos">
          <li>No app do seu banco, escolha <b>PIX Copia e Cola</b> ou leia o QR Code.</li>
          <li>Digite o valor de <b>{fmt(valor)}</b> e confira o nome <b>{FAVORECIDO}</b>.</li>
          <li>Depois de pagar, toque no botão verde e mande o comprovante pro {ASSINATURA}.</li>
        </ol>
      </div>
    );
    rodape = (
      <a className="btn-whats btn-whats--grande" href={link} target="_blank" rel="noopener noreferrer" onClick={avisar}>
        <Icone nome="conversa" tamanho={20} />Já paguei, avisar no WhatsApp
      </a>
    );
  }

  if (passo === "enviado") {
    titulo = "Falta só o comprovante";
    corpo = (
      <div className="enviado">
        <div className="enviado__icone"><Icone nome="conversa" tamanho={30} /></div>
        <p className="enviado__titulo">Mande o comprovante na conversa</p>
        <ol className="pix__passos">
          <li>Na conversa com o {ASSINATURA}, toque no <b>clipe 📎</b> e escolha a foto ou o PDF do comprovante.</li>
          <li>Ou, no app do banco, use <b>Compartilhar comprovante</b> e escolha o WhatsApp do {ASSINATURA}.</li>
        </ol>
        <p className="enviado__nota">O {ASSINATURA} confere no extrato e dá baixa. Até lá, o valor continua aparecendo em Meus pedidos.</p>
      </div>
    );
    rodape = (
      <>
        <button type="button" className="btn-principal" onClick={onFechar}>Pronto</button>
        <a className="btn-texto btn-texto--link" href={link} target="_blank" rel="noopener noreferrer"
          onClick={e => { if (DEMO) { e.preventDefault(); setPrevia(texto); } }}>Abrir o WhatsApp de novo</a>
      </>
    );
  }

  return (
    <div className="folha">
      <div className="veu" onClick={onFechar} />
      <div className="folha__painel folha__painel--pagar" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="folha__alca" />
        <div className="folha__cabeca">
          {passo === "pix" && varios && (
            <button type="button" className="icone-btn" onClick={() => setPasso("escolher")} aria-label="Voltar"><Icone nome="voltar" /></button>
          )}
          <h2 className="folha__titulo">{titulo}</h2>
          <button type="button" className="icone-btn" onClick={onFechar} aria-label="Fechar"><Icone nome="fechar" /></button>
        </div>
        {corpo}
        <div className="folha__rodape">{rodape}</div>
      </div>
      {previa && <PreviaWhatsApp para={`o ${ASSINATURA}`} texto={previa} onFechar={() => setPrevia(null)} />}
    </div>
  );
}
