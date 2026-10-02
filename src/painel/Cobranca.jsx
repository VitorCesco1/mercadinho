import { useEffect, useMemo, useState } from "react";
import Icone from "../componentes/Icone.jsx";
import { agoraTexto, fmt, nomeCurto } from "../lib/formato.js";
import { chaveMes, dataCurta, msDaVenda } from "../lib/datas.js";
import { CHAVE_PIX, copiarTexto } from "../lib/pix.js";
import { cobrancaDoMes, linkWhatsApp, mensagemCobranca, mesesDeCobranca, mesPadrao, rotuloMes } from "../lib/cobranca.js";
import { gravar, ler } from "../lib/memoria.js";

const DEMO = import.meta.env.MODE === "demo";

const quando = (ms) => {
  const [dia, hora] = dataCurta(ms).split(", ");
  if (dia === "Hoje") return `hoje às ${hora}`;
  if (dia === "Ontem") return `ontem às ${hora}`;
  return `em ${dia}`;
};
const nomeDoMes = (chave) => rotuloMes(chave).split("/")[0].toLowerCase();
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const momento = () => Date.now();

export default function Cobranca({ vendas, clientes, api }) {
  const meses = useMemo(() => mesesDeCobranca(vendas), [vendas]);
  const [escolhido, setEscolhido] = useState(null);
  const [filtro, setFiltro] = useState("aberto");
  const [enviados, setEnviados] = useState(() => ler("cobrancas-enviadas", {}));
  const [previa, setPrevia] = useState(null);
  const [agora] = useState(() => new Date());

  const mes = escolhido && meses.some(m => m.chave === escolhido) ? escolhido : mesPadrao(meses, agora);
  const lista = useMemo(() => cobrancaDoMes(vendas, mes, clientes), [vendas, mes, clientes]);
  const resumo = meses.find(m => m.chave === mes) || { aberto: 0, pago: 0 };
  const emAberto = lista.filter(c => c.aberto > 0);
  const quitados = lista.filter(c => c.aberto === 0);
  const mostrados = filtro === "aberto" ? emAberto : quitados;
  const total = resumo.aberto + resumo.pago;
  const mesAtual = mes === chaveMes(agora.getTime());

  // chamado no toque do botão (WhatsApp / copiar), não durante a renderização
  const registrarEnvio = (clienteId) => {
    const novo = { ...enviados, [`${mes}:${clienteId}`]: momento() };
    setEnviados(novo);
    gravar("cobrancas-enviadas", novo);
  };

  if (!meses.length) return <div className="vazio">Nenhum pedido pro fim do mês ainda.</div>;

  return (
    <section className="cob">
      <div className="cob-meses" aria-label="Mês da cobrança">
        {meses.map(m => (
          <button type="button" key={m.chave} className={`cob-mes${m.chave === mes ? " ativo" : ""}`} onClick={() => setEscolhido(m.chave)} aria-pressed={m.chave === mes}>
            <b>{rotuloMes(m.chave)}</b>
            <small className={m.aberto > 0 ? "" : "ok"}>{m.aberto > 0 ? `${fmt(m.aberto)} em aberto` : "Tudo pago"}</small>
          </button>
        ))}
      </div>

      <div className="cartao cob-resumo">
        <span className="cob-resumo__rotulo">Em aberto em {rotuloMes(mes)}</span>
        <strong className={`cob-resumo__valor${resumo.aberto > 0 ? "" : " ok"}`}>{fmt(resumo.aberto)}</strong>
        <p>
          {emAberto.length ? `${plural(emAberto.length, "cliente", "clientes")} pra cobrar.` : "Ninguém pra cobrar."}{" "}
          {fmt(resumo.pago)} já recebido.
        </p>
        <div className="progresso" aria-hidden="true"><i style={{ width: `${total ? (resumo.pago / total) * 100 : 0}%` }} /></div>
        {mesAtual && <p className="cob-alerta">Esse mês ainda não acabou. Pode entrar pedido novo até o fim do mês.</p>}
      </div>

      <div className="cob-filtro" role="tablist">
        <button type="button" role="tab" aria-selected={filtro === "aberto"} className={filtro === "aberto" ? "ativo" : ""} onClick={() => setFiltro("aberto")}>Em aberto ({emAberto.length})</button>
        <button type="button" role="tab" aria-selected={filtro === "quitado"} className={filtro === "quitado" ? "ativo" : ""} onClick={() => setFiltro("quitado")}>Quitados ({quitados.length})</button>
      </div>

      {mostrados.map(c => (
        <ClienteCobranca
          key={`${mes}:${c.clienteId}`} c={c} mes={mes} api={api}
          enviadoEm={enviados[`${mes}:${c.clienteId}`]} onEnviado={() => registrarEnvio(c.clienteId)} onPrevia={setPrevia}
        />
      ))}
      {!mostrados.length && (
        <div className="vazio">{filtro === "aberto" ? `Ninguém deve nada de ${nomeDoMes(mes)}. 🎉` : `Ninguém quitou ${nomeDoMes(mes)} ainda.`}</div>
      )}

      {previa && (
        <div className="folha">
          <div className="veu" onClick={() => setPrevia(null)} />
          <div className="folha__painel" role="dialog" aria-modal="true" aria-label="Prévia da mensagem">
            <div className="folha__alca" />
            <h2 className="folha__titulo">Prévia do WhatsApp</h2>
            <p className="folha__sub">Na versão real, o botão abre a conversa com {previa.nome} ({previa.telefone}) com esta mensagem pronta:</p>
            <div className="previa-msg">{previa.msg}</div>
            <button type="button" className="btn-principal" onClick={() => setPrevia(null)}>Fechar</button>
          </div>
        </div>
      )}
    </section>
  );
}

function ClienteCobranca({ c, mes, api, enviadoEm, onEnviado, onPrevia }) {
  const [confirma, setConfirma] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(null);
  const [erro, setErro] = useState(false);

  // o segundo toque de confirmação expira sozinho
  useEffect(() => {
    if (!confirma) return;
    const t = setTimeout(() => setConfirma(null), 5000);
    return () => clearTimeout(t);
  }, [confirma]);

  const quitado = c.aberto === 0;
  const msg = mensagemCobranca(c.nome, mes, c.aberto);
  const link = linkWhatsApp(c.telefone, msg);

  const copiar = async (tipo) => {
    if (!(await copiarTexto(tipo === "msg" ? msg : CHAVE_PIX))) return;
    setCopiado(tipo);
    if (tipo === "msg") onEnviado();
    setTimeout(() => setCopiado(null), 2500);
  };

  const abrirWhats = (e) => {
    onEnviado();
    if (DEMO) { e.preventDefault(); onPrevia({ nome: c.nome, telefone: c.telefone, msg }); }
  };

  const executar = async () => {
    setSalvando(true);
    setErro(false);
    try {
      if (confirma === "quitar") await api.marcarPedidosPagos(c.idsAbertos, agoraTexto());
      else await api.reabrirPedidos(c.idsUltimoAcerto);
      setConfirma(null);
    } catch {
      setErro(true);
    } finally {
      setSalvando(false);
    }
  };
  const tocar = (acao) => (confirma === acao ? executar() : setConfirma(acao));

  return (
    <article className={`cob-cliente${quitado ? " quitado" : ""}`}>
      <div className="cob-cliente__topo">
        <div className="cob-cliente__quem">
          <strong>{c.nome}</strong>
          <span>{c.telefone || "Sem telefone"}</span>
        </div>
        <div className="cob-cliente__valor">{fmt(quitado ? c.pago : c.aberto)}</div>
      </div>

      {quitado && <p className="cob-nota ok"><Icone nome="check" tamanho={16} espessura={2.6} />Quitado{c.pagoEm ? ` em ${c.pagoEm.split(",")[0]}` : ""}</p>}
      {!quitado && c.pago > 0 && <p className="cob-nota">{fmt(c.pago)} desse mês já foi pago.</p>}
      {!quitado && enviadoEm && <p className="cob-nota enviado"><Icone nome="conversa" tamanho={15} />Cobrança enviada {quando(enviadoEm)}</p>}

      <details className="cob-pedidos">
        <summary>Ver {c.pedidos.length === 1 ? "o pedido" : `os ${c.pedidos.length} pedidos`}</summary>
        <ul>
          {c.pedidos.map(v => (
            <li key={v.id} className={v.pago ? "pago" : ""}>
              <span className="cob-pedidos__data">{new Date(msDaVenda(v)).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
              <span className="cob-pedidos__itens">{(v.itens || []).map(i => `${i.qty}× ${nomeCurto(i.nome)}`).join(", ")}</span>
              <b>{fmt(v.total)}</b>
            </li>
          ))}
        </ul>
      </details>

      {!quitado && (
        <div className="cob-acoes">
          {link
            ? <a className="btn-whats" href={link} target="_blank" rel="noopener noreferrer" onClick={abrirWhats}><Icone nome="conversa" tamanho={19} />Cobrar no WhatsApp</a>
            : <span className="btn-whats desativado" title="Confira o telefone no cadastro">Telefone inválido, use Copiar mensagem</span>}
          <button type="button" className="btn-leve" onClick={() => copiar("msg")}>
            <Icone nome={copiado === "msg" ? "check" : "copiar"} tamanho={17} />{copiado === "msg" ? "Copiada" : "Copiar mensagem"}
          </button>
          <button type="button" className="btn-leve" onClick={() => copiar("pix")} aria-label="Copiar só o código PIX">
            <Icone nome={copiado === "pix" ? "check" : "pix"} tamanho={17} />{copiado === "pix" ? "Copiado" : "Copiar PIX"}
          </button>
        </div>
      )}

      {quitado ? (
        <button type="button" className={`btn-reabrir${confirma === "reabrir" ? " confirmar" : ""}`} disabled={salvando} onClick={() => tocar("reabrir")}>
          {salvando ? "Salvando…" : confirma === "reabrir" ? "Toque de novo pra reabrir" : "Desfazer esse acerto"}
        </button>
      ) : (
        <button type="button" className={`btn-quitar${confirma === "quitar" ? " confirmar" : ""}`} disabled={salvando} onClick={() => tocar("quitar")}>
          {salvando ? <><span className="girando" />Salvando…</>
            : confirma === "quitar" ? `Toque de novo pra confirmar ${fmt(c.aberto)}`
            : `Marcar ${nomeDoMes(mes)} todo como pago`}
        </button>
      )}
      {erro && <p className="erro" role="alert">Não deu pra salvar. Confira a internet e tente de novo.</p>}
    </article>
  );
}
