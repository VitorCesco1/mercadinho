// Gráficos do painel em SVG próprio (sem biblioteca). Marcas finas, eixo discreto,
// dica ao passar o dedo/mouse e tabela com os números (nada fica só no gráfico).
import { useEffect, useRef, useState } from "react";
import { COR } from "./cores.js";

function useLargura() {
  const ref = useRef(null);
  const [largura, setLargura] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setLargura(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, largura];
}

// Eixo com números redondos (0, 50, 100, 150)
function escala(max) {
  if (!(max > 0)) return { topo: 1, ticks: [0] };
  const bruto = max / 3, pot = 10 ** Math.floor(Math.log10(bruto)), n = bruto / pot;
  const passo = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pot;
  const topo = Math.ceil(max / passo) * passo;
  const ticks = [];
  for (let t = 0; t <= topo + 1e-9; t += passo) ticks.push(Math.round(t * 100) / 100);
  return { topo, ticks };
}
const numEixo = (n) => n.toLocaleString("pt-BR", { maximumFractionDigits: n < 10 ? 1 : 0 });

// coluna com a ponta de cima arredondada (4px) e a base reta
function caminho(x, y, w, h, arredonda = true) {
  if (h <= 0) return "";
  const r = arredonda ? Math.min(4, h, w / 2) : 0;
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

function Dica({ ponto, largura }) {
  if (!ponto) return null;
  const x = Math.min(Math.max(ponto.x, 70), largura - 70);
  return (
    <div className="grafico__dica" style={{ left: x, top: ponto.y }} role="status">
      <b>{ponto.linhas[0]}</b>
      {ponto.linhas.slice(1).map((l, i) => <span key={i}>{l}</span>)}
    </div>
  );
}

const M = { esq: 34, dir: 6, topo: 22, base: 22 };

// Mouse: a dica segue o ponteiro. Toque: abre ao tocar e some sozinha (no celular o "sair" vem logo depois do toque).
function useDica() {
  const [ativo, setAtivo] = useState(null);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const abrir = (p, porToque) => {
    clearTimeout(timer.current);
    setAtivo(p);
    if (porToque) timer.current = setTimeout(() => setAtivo(null), 4000);
  };
  const fechar = () => { clearTimeout(timer.current); setAtivo(null); };
  const alvo = (p) => ({
    tabIndex: 0,
    onPointerEnter: (e) => { if (e.pointerType === "mouse") abrir(p); },
    onClick: (e) => abrir(p, e.nativeEvent?.pointerType !== "mouse"),
    onFocus: () => abrir(p),
    onBlur: fechar,
  });
  const sair = (e) => { if (e.pointerType === "mouse") fechar(); };
  return { ativo, alvo, sair };
}

/**
 * Colunas de uma série. dados: [{ chave, rotulo, valor, dica: [linha forte, ...] }]
 * mostrarRotulo(i): quais rótulos do eixo X aparecem; destaque: índice com o valor escrito no topo.
 */
export function Colunas({ dados, altura = 170, rotuloAria, mostrarRotulo = () => true, destaque = -1, textoDestaque }) {
  const [ref, largura] = useLargura();
  const { ativo, alvo, sair } = useDica();
  const { topo, ticks } = escala(Math.max(...dados.map(d => d.valor), 0));
  const W = largura, H = altura, plotW = W - M.esq - M.dir, plotH = H - M.topo - M.base;
  const banda = plotW / dados.length, barra = Math.min(24, banda * 0.62);
  const y = (v) => M.topo + plotH - (v / topo) * plotH;

  return (
    <div className="grafico" ref={ref} onPointerLeave={sair}>
      <svg width={W} height={H} role="img" aria-label={rotuloAria}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={M.esq} x2={W - M.dir} y1={y(t)} y2={y(t)} className="grafico__grade" />
            <text x={M.esq - 6} y={y(t)} dy="0.32em" textAnchor="end" className="grafico__eixo">{numEixo(t)}</text>
          </g>
        ))}
        {dados.map((d, i) => {
          const x = M.esq + i * banda + (banda - barra) / 2, h = y(0) - y(d.valor);
          const ponto = { i, x: M.esq + i * banda + banda / 2, y: Math.min(y(d.valor), y(0) - 4) - 8, linhas: d.dica };
          return (
            <g key={d.chave}>
              <path d={caminho(x, y(d.valor), barra, h)} fill={ativo?.i === i ? COR.realce : COR.principal} />
              {mostrarRotulo(i) && <text x={M.esq + i * banda + banda / 2} y={H - 6} textAnchor="middle" className="grafico__eixo">{d.rotulo}</text>}
              {i === destaque && d.valor > 0 && (
                <text x={M.esq + i * banda + banda / 2} y={y(d.valor) - 6} textAnchor="middle" className="grafico__valor">{textoDestaque}</text>
              )}
              <rect x={M.esq + i * banda} y={M.topo} width={banda} height={plotH} fill="transparent"
                aria-label={d.dica.join(", ")} {...alvo(ponto)} />
            </g>
          );
        })}
      </svg>
      <Dica ponto={ativo} largura={W} />
    </div>
  );
}

/**
 * Colunas empilhadas (2 partes) com 2px de vão entre as partes.
 * dados: [{ chave, rotulo, partes: [a, b], dica }]; cores: [corA, corB]
 */
export function ColunasEmpilhadas({ dados, cores, altura = 180, rotuloAria, destaque = -1, textoDestaque }) {
  const [ref, largura] = useLargura();
  const { ativo, alvo, sair } = useDica();
  const { topo, ticks } = escala(Math.max(...dados.map(d => d.partes[0] + d.partes[1]), 0));
  const W = largura, H = altura, plotW = W - M.esq - M.dir, plotH = H - M.topo - M.base;
  const banda = plotW / dados.length, barra = Math.min(24, banda * 0.5);
  const y = (v) => M.topo + plotH - (v / topo) * plotH;

  return (
    <div className="grafico" ref={ref} onPointerLeave={sair}>
      <svg width={W} height={H} role="img" aria-label={rotuloAria}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={M.esq} x2={W - M.dir} y1={y(t)} y2={y(t)} className="grafico__grade" />
            <text x={M.esq - 6} y={y(t)} dy="0.32em" textAnchor="end" className="grafico__eixo">{numEixo(t)}</text>
          </g>
        ))}
        {dados.map((d, i) => {
          const x = M.esq + i * banda + (banda - barra) / 2;
          const [a, b] = d.partes, hA = y(0) - y(a), hB = y(0) - y(a + b);
          const topoA = y(a), vao = a > 0 && b > 0 ? 2 : 0;
          const realce = ativo?.i === i;
          const ponto = { i, x: M.esq + i * banda + banda / 2, y: y(a + b) - 8, linhas: d.dica };
          return (
            <g key={d.chave}>
              <path d={caminho(x, topoA, barra, hA, b <= 0)} fill={realce ? COR.realce : cores[0]} />
              {b > 0 && <path d={caminho(x, y(a + b), barra, hB - hA - vao)} fill={realce ? COR.aReceberRealce : cores[1]} />}
              <text x={M.esq + i * banda + banda / 2} y={H - 6} textAnchor="middle" className={`grafico__eixo${i === destaque ? " forte" : ""}`}>{d.rotulo}</text>
              {i === destaque && a + b > 0 && (
                <text x={M.esq + i * banda + banda / 2} y={y(a + b) - 6} textAnchor="middle" className="grafico__valor">{textoDestaque}</text>
              )}
              <rect x={M.esq + i * banda} y={M.topo} width={banda} height={plotH} fill="transparent"
                aria-label={d.dica.join(", ")} {...alvo(ponto)} />
            </g>
          );
        })}
      </svg>
      <Dica ponto={ativo} largura={W} />
    </div>
  );
}

export function Legenda({ itens }) {
  return (
    <div className="legenda">
      {itens.map(([nome, cor]) => <span key={nome}><i style={{ background: cor }} />{nome}</span>)}
    </div>
  );
}

// Ranking em barras horizontais (HTML): nome e valor em texto, barra fina na cor da série
export function Ranking({ itens, vazio = "Nada no período." }) {
  if (!itens.length) return <p className="grafico__vazio">{vazio}</p>;
  const max = Math.max(...itens.map(i => i.valor), 1);
  return (
    <ol className="ranking">
      {itens.map((it, i) => (
        <li key={it.chave}>
          <div className="ranking__linha">
            <span className="ranking__pos">{i + 1}</span>
            <span className="ranking__nome">{it.nome}</span>
            <span className="ranking__valor">{it.valorTexto}</span>
          </div>
          <div className="ranking__barra"><i style={{ width: `${(it.valor / max) * 100}%` }} /></div>
          {it.sub && <small className="ranking__sub">{it.sub}</small>}
        </li>
      ))}
    </ol>
  );
}

// Os números do gráfico em tabela (acessível e sem depender de hover)
export function TabelaDados({ colunas, linhas }) {
  return (
    <details className="tabela-dados">
      <summary>Ver os números</summary>
      <div className="tabela-dados__rolagem">
        <table>
          <thead><tr>{colunas.map(c => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>{linhas.map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}
