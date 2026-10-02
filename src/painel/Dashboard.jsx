import { useMemo, useState } from "react";
import Icone from "../componentes/Icone.jsx";
import { Colunas, ColunasEmpilhadas, Legenda, Ranking, TabelaDados } from "./Graficos.jsx";
import { COR } from "./cores.js";
import { fmt, nomeCurto } from "../lib/formato.js";
import { chaveMes, msDaVenda } from "../lib/datas.js";
import { rotuloMes } from "../lib/cobranca.js";
import { DIAS_SEMANA, DIAS_SEMANA_LONGO, diasDoMes, doPeriodo, faixaDeHoras, mesAnterior, mesesComVendas, resumir, serieMensal } from "../lib/relatorios.js";
import { baixarCSV, baixarExcel } from "../lib/exportar.js";

const MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesCurto = (k) => MES_CURTO[+k.split("-")[1] - 1];
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

export default function Dashboard({ vendas, produtos }) {
  const [agora] = useState(() => new Date());
  const atual = chaveMes(agora.getTime());
  const meses = useMemo(() => mesesComVendas(vendas), [vendas]);
  const [escolhido, setEscolhido] = useState(null);
  const periodo = escolhido ?? (meses.includes(atual) ? atual : meses[0] ?? atual);
  const ehMes = periodo !== "tudo";
  const [baixando, setBaixando] = useState("");
  const [erro, setErro] = useState(false);

  const lista = useMemo(() => doPeriodo(vendas, periodo), [vendas, periodo]);
  const r = useMemo(() => resumir(lista), [lista]);
  const fimSerie = ehMes ? periodo : meses[0] ?? atual;
  const serie = useMemo(() => {
    const s = serieMensal(vendas, fimSerie, ehMes ? 6 : 12);
    const primeiro = s.findIndex(m => m.pedidos > 0); // não mostra os meses antes do mercadinho começar
    return primeiro > 0 ? s.slice(primeiro) : s;
  }, [vendas, fimSerie, ehMes]);

  // Mês atual ainda não acabou: compara com o mesmo pedaço do mês anterior (dia 1 até hoje)
  const comparacao = useMemo(() => {
    if (!ehMes) return null;
    const ant = mesAnterior(periodo);
    const parcial = periodo === atual;
    const doAnterior = doPeriodo(vendas, ant).filter(v => !parcial || new Date(msDaVenda(v)).getDate() <= agora.getDate());
    const fat = doAnterior.reduce((a, v) => a + (v.total || 0), 0);
    if (!fat) return null;
    const nome = rotuloMes(ant).split("/")[0].toLowerCase();
    return { pct: (r.faturamento - fat) / fat, rotulo: parcial ? `vs 1 a ${agora.getDate()} de ${nome}` : `vs ${nome}` };
  }, [ehMes, periodo, atual, vendas, agora, r.faturamento]);

  const dias = ehMes ? diasDoMes(periodo, r.porDia) : [];
  const diaTop = dias.reduce((m, d, i) => (d.total > (dias[m]?.total ?? -1) ? i : m), 0);
  const horas = faixaDeHoras(r.porHora);
  const horaTop = horas.reduce((m, h, i) => (h.pedidos > horas[m].pedidos ? i : m), 0);
  const semana = [1, 2, 3, 4, 5, 6, 0].map(d => ({ d, ...r.porSemana[d] })).filter(x => x.d !== 0 && x.d !== 6 || x.pedidos > 0);
  const semanaTop = semana.reduce((m, s, i) => (s.pedidos > semana[m].pedidos ? i : m), 0);
  const serieIdx = serie.findIndex(m => m.chave === fimSerie);
  const vendidosIds = new Set(r.produtos.map(p => p.id));
  const parados = (produtos || []).filter(p => p.disponivel && !vendidosIds.has(p.id));
  const pctRecebido = r.faturamento ? (r.recebido / r.faturamento) * 100 : 0;

  const exportar = async (tipo) => {
    setErro(false);
    setBaixando(tipo);
    try {
      if (tipo === "excel") await baixarExcel(lista, periodo, vendas);
      else baixarCSV(lista, periodo);
    } catch (e) {
      console.error(e);
      setErro(true);
    } finally {
      setBaixando("");
    }
  };

  const opcoes = [...meses.map(k => ({ chave: k, rotulo: rotuloMes(k) })), { chave: "tudo", rotulo: "Tudo" }];

  return (
    <section className="dash">
      <div className="cob-meses" aria-label="Período">
        {opcoes.map(o => (
          <button type="button" key={o.chave} className={`cob-mes${o.chave === periodo ? " ativo" : ""}`} onClick={() => setEscolhido(o.chave)} aria-pressed={o.chave === periodo}>
            <b>{o.rotulo}</b>
            <small className="neutro">{o.chave === "tudo" ? "Histórico" : o.chave === atual ? "Em andamento" : "Fechado"}</small>
          </button>
        ))}
      </div>

      <div className="cartao dash-heroi">
        <span className="dash-heroi__rotulo">Faturamento {ehMes ? `de ${rotuloMes(periodo)}` : "total"}</span>
        <strong className="dash-heroi__valor">{fmt(r.faturamento)}</strong>
        <p className="dash-heroi__sub">{plural(r.pedidos, "pedido", "pedidos")}, ticket médio de {fmt(r.ticket)}</p>
        {comparacao && (
          <p className={`dash-delta ${comparacao.pct >= 0 ? "sobe" : "desce"}`}>
            <Icone nome={comparacao.pct >= 0 ? "sobe" : "desce"} tamanho={16} espessura={2.6} />
            {comparacao.pct >= 0 ? "+" : ""}{Math.round(comparacao.pct * 100)}% {comparacao.rotulo}
          </p>
        )}
        <div className="dash-split" aria-hidden="true">
          <i style={{ width: `${pctRecebido}%`, background: COR.principal }} />
          <i style={{ width: `${100 - pctRecebido}%`, background: COR.aReceber }} />
        </div>
        <div className="dash-pares">
          <div><span><i style={{ background: COR.principal }} />Recebido</span><b>{fmt(r.recebido)}</b></div>
          <div><span><i style={{ background: COR.aReceber }} />A receber</span><b>{fmt(r.aReceber)}</b></div>
          <div><span>Itens vendidos</span><b>{r.itens}</b></div>
          <div><span>Clientes</span><b>{r.clientes.length}</b></div>
        </div>
      </div>

      <div className="dash-exportar">
        <button type="button" className="btn-leve btn-leve--forte" onClick={() => exportar("excel")} disabled={!!baixando || !lista.length}>
          {baixando === "excel" ? <span className="girando" /> : <Icone nome="planilha" tamanho={18} />}Baixar Excel
        </button>
        <button type="button" className="btn-leve" onClick={() => exportar("csv")} disabled={!!baixando || !lista.length}>
          <Icone nome="baixar" tamanho={18} />CSV
        </button>
      </div>
      {erro && <p className="erro" role="alert">Não deu pra gerar o arquivo. Tente de novo.</p>}

      {ehMes && (
        <article className="cartao dash-grafico">
          <h2>Faturamento por dia</h2>
          <p className="dash-grafico__sub">{rotuloMes(periodo)}, em R$</p>
          <Colunas
            dados={dias.map(d => ({ chave: d.dia, rotulo: String(d.dia), valor: d.total, dica: [fmt(d.total), `${DIAS_SEMANA[d.semana]}, dia ${d.dia}`, plural(d.pedidos, "pedido", "pedidos")] }))}
            mostrarRotulo={i => i === 0 || (i + 1) % 5 === 0}
            destaque={dias[diaTop]?.total > 0 ? diaTop : -1}
            textoDestaque={dias[diaTop] ? fmt(dias[diaTop].total) : ""}
            rotuloAria={`Faturamento por dia em ${rotuloMes(periodo)}. Melhor dia: ${dias[diaTop]?.dia}, ${fmt(dias[diaTop]?.total)}.`}
          />
          <TabelaDados colunas={["Dia", "Pedidos", "Faturamento"]} linhas={dias.filter(d => d.pedidos).map(d => [`${String(d.dia).padStart(2, "0")} (${DIAS_SEMANA[d.semana]})`, d.pedidos, fmt(d.total)])} />
        </article>
      )}

      <article className="cartao dash-grafico">
        <h2>Mês a mês</h2>
        <p className="dash-grafico__sub">Faturamento dos últimos {serie.length} meses, em R$</p>
        <Legenda itens={[["Recebido", COR.principal], ["A receber", COR.aReceber]]} />
        <ColunasEmpilhadas
          dados={serie.map(m => ({ chave: m.chave, rotulo: mesCurto(m.chave), partes: [m.recebido, m.aReceber], dica: [fmt(m.total), rotuloMes(m.chave), `Recebido ${fmt(m.recebido)}`, `A receber ${fmt(m.aReceber)}`] }))}
          cores={[COR.principal, COR.aReceber]}
          destaque={serieIdx}
          textoDestaque={serie[serieIdx] ? fmt(serie[serieIdx].total) : ""}
          rotuloAria="Faturamento mês a mês, recebido e a receber"
        />
        <TabelaDados colunas={["Mês", "Pedidos", "Recebido", "A receber", "Total"]} linhas={serie.map(m => [rotuloMes(m.chave), m.pedidos, fmt(m.recebido), fmt(m.aReceber), fmt(m.total)])} />
      </article>

      <div className="dash-dupla">
        <article className="cartao dash-grafico">
          <h2>Horário de pico</h2>
          <p className="dash-grafico__sub">
            {r.pedidos ? <>Mais pedidos às <b>{horas[horaTop].hora}h</b> ({plural(horas[horaTop].pedidos, "pedido", "pedidos")})</> : "Sem pedidos no período"}
          </p>
          <Colunas
            altura={150}
            dados={horas.map(h => ({ chave: h.hora, rotulo: `${h.hora}h`, valor: h.pedidos, dica: [plural(h.pedidos, "pedido", "pedidos"), `das ${h.hora}h às ${h.hora + 1}h`, fmt(h.total)] }))}
            mostrarRotulo={i => horas.length <= 8 || i % 2 === 0}
            rotuloAria="Pedidos por horário"
          />
          <TabelaDados colunas={["Horário", "Pedidos", "Faturamento"]} linhas={horas.filter(h => h.pedidos).map(h => [`${h.hora}h`, h.pedidos, fmt(h.total)])} />
        </article>

        <article className="cartao dash-grafico">
          <h2>Dia da semana</h2>
          <p className="dash-grafico__sub">
            {r.pedidos ? <>Dia mais forte: <b>{DIAS_SEMANA_LONGO[semana[semanaTop].d]}</b> ({plural(semana[semanaTop].pedidos, "pedido", "pedidos")})</> : "Sem pedidos no período"}
          </p>
          <Colunas
            altura={150}
            dados={semana.map(s => ({ chave: s.d, rotulo: DIAS_SEMANA[s.d], valor: s.pedidos, dica: [plural(s.pedidos, "pedido", "pedidos"), DIAS_SEMANA[s.d], fmt(s.total)] }))}
            rotuloAria="Pedidos por dia da semana"
          />
          <TabelaDados colunas={["Dia", "Pedidos", "Faturamento"]} linhas={semana.map(s => [DIAS_SEMANA[s.d], s.pedidos, fmt(s.total)])} />
        </article>
      </div>

      <div className="dash-dupla">
        <article className="cartao dash-grafico">
          <h2>Mais vendidos</h2>
          <p className="dash-grafico__sub">Em unidades</p>
          <Ranking itens={r.produtos.slice(0, 10).map(p => ({ chave: p.id, nome: nomeCurto(p.nome), valor: p.qtd, valorTexto: `${p.qtd} un.`, sub: fmt(p.total) }))} />
        </article>

        <article className="cartao dash-grafico">
          <h2>Quem mais compra</h2>
          <p className="dash-grafico__sub">Total gasto no período</p>
          <Ranking itens={r.clientes.slice(0, 10).map(c => ({ chave: c.id, nome: c.nome, valor: c.total, valorTexto: fmt(c.total), sub: `${plural(c.pedidos, "pedido", "pedidos")}${c.aberto > 0 ? `, ${fmt(c.aberto)} em aberto` : ""}` }))} />
        </article>
      </div>

      {parados.length > 0 && (
        <article className="cartao dash-grafico">
          <h2>{ehMes ? "Sem venda no mês" : "Nunca venderam"}</h2>
          <p className="dash-grafico__sub">Produtos ativos na loja que não saíram {ehMes ? `em ${rotuloMes(periodo)}` : "até hoje"}</p>
          <ul className="parados">{parados.map(p => <li key={p.id}>{nomeCurto(p.nome)}</li>)}</ul>
        </article>
      )}
    </section>
  );
}
