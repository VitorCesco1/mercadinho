// Painel do dono: entrada com senha, topo com os totais e as abas.
import { useEffect, useState } from "react";
import Icone from "../componentes/Icone.jsx";
import Dashboard from "./Dashboard.jsx";
import Cobranca from "./Cobranca.jsx";
import Vendas from "./Vendas.jsx";
import Produtos from "./Produtos.jsx";
import Clientes from "./Clientes.jsx";
import Avisos from "./Avisos.jsx";
import { fmt } from "../lib/formato.js";
import { calcularEstatisticas } from "../lib/sugestoes.js";
import { avisosPendentes } from "../lib/cobranca.js";

const SENHA_DONO = "dono123";
const ABAS = [["dashboard", "Dashboard"], ["cobranca", "Cobrança"], ["vendas", "Vendas"], ["produtos", "Produtos"], ["clientes", "Clientes"], ["avisos", "Avisos"]];

export default function PainelDono({ api, voltar }) {
  const [auth, setAuth] = useState(false);
  const [senha, setSenha] = useState("");
  const [errSenha, setErrSenha] = useState(false);
  const [aba, setAba] = useState("dashboard");
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [pagInformados, setPagInformados] = useState([]);
  const [erroConexao, setErroConexao] = useState(null);

  useEffect(() => {
    if (!auth || !api) return;
    api.garantirProdutosIniciais();
    const a = api.ouvirProdutos(setProdutos);
    const b = api.ouvirVendas(l => { setVendas(l); setErroConexao(null); }, () => setErroConexao("Erro ao carregar vendas. Verifique a conexão."));
    const c = api.ouvirClientes(setClientes);
    const d = api.ouvirAvisos(setAvisos);
    const e = api.ouvirPagamentosInformados(setPagInformados);
    return () => { a(); b(); c(); d(); e(); };
  }, [auth, api]);

  // Atualiza o resumo "mais vendidos / combos" que a loja usa nas sugestões (só ids e contagens)
  useEffect(() => {
    if (!auth || !api || !vendas?.length) return;
    const t = setTimeout(async () => {
      const novo = calcularEstatisticas(vendas);
      const atual = await api.lerEstatisticas();
      const igual = JSON.stringify(atual?.vendidos) === JSON.stringify(novo.vendidos) && JSON.stringify(atual?.pares) === JSON.stringify(novo.pares);
      if (!igual) await api.salvarEstatisticas({ ...novo, atualizadoEm: Date.now() });
    }, 3000);
    return () => clearTimeout(t);
  }, [auth, api, vendas]);

  useEffect(() => { window.scrollTo(0, 0); }, [aba]);

  const conferir = (e) => { e.preventDefault(); if (senha === SENHA_DONO) setAuth(true); else setErrSenha(true); };

  if (!auth) return (
    <form className="painel-entrar" onSubmit={conferir}>
      <div className="painel-entrar__icone">👑</div>
      <h1>Painel do Dono</h1>
      <p>Acesso restrito</p>
      <label className="campo">
        <span className="sr">Senha</span>
        <input type="password" placeholder="Senha" value={senha} autoComplete="current-password"
          onChange={e => { setSenha(e.target.value); setErrSenha(false); }} />
      </label>
      {errSenha && <p className="erro" role="alert">Senha incorreta</p>}
      <button type="submit" className="btn-principal">Entrar</button>
      <button type="button" className="btn-texto" onClick={voltar}>Voltar pra loja</button>
    </form>
  );

  const lista = vendas || [];
  const totalPendente = lista.filter(v => v.pagamento === "fim_do_mes" && !v.pago).reduce((a, v) => a + v.total, 0);
  const totalRecebido = lista.filter(v => v.pagamento === "na_hora" || v.pago).reduce((a, v) => a + v.total, 0);
  const pagamentosAConferir = avisosPendentes(pagInformados, lista);
  const ops = api || {};

  return (
    <div className="painel">
      <header className="painel-topo">
        <div className="painel-topo__linha">
          <button type="button" className="icone-btn" onClick={() => { setAuth(false); voltar(); }} aria-label="Sair do painel"><Icone nome="voltar" /></button>
          <h1 className="painel-topo__titulo">Painel do Dono</h1>
          <div className="painel-numero painel-numero--ok"><small>Recebido</small><b>{fmt(totalRecebido)}</b></div>
          <div className="painel-numero painel-numero--aberto"><small>A receber</small><b>{fmt(totalPendente)}</b></div>
        </div>
        <nav className="painel-abas" aria-label="Seções do painel">
          {ABAS.map(([k, nome]) => (
            <button type="button" key={k} className={`painel-aba${aba === k ? " ativo" : ""}`} onClick={() => setAba(k)} aria-pressed={aba === k}>
              {nome}
              {k === "cobranca" && pagamentosAConferir.length > 0 && (
                <span className="painel-aba__selo" aria-label={`${pagamentosAConferir.length} pagamentos pra conferir`}>{pagamentosAConferir.length}</span>
              )}
            </button>
          ))}
        </nav>
      </header>
      <main className="painel-corpo">
        {erroConexao && <div className="erro-caixa" role="alert">{erroConexao}</div>}
        {!vendas && !erroConexao && <div className="carregando-tela"><span className="girando" /></div>}
        {vendas && (
          <>
            {aba === "dashboard" && <Dashboard vendas={vendas} produtos={produtos} />}
            {aba === "cobranca" && <Cobranca vendas={vendas} clientes={clientes} api={api} pagamentosAConferir={pagamentosAConferir} />}
            {aba === "vendas" && <Vendas vendas={vendas} api={ops} />}
            {aba === "produtos" && <Produtos produtos={produtos} ops={ops} />}
            {aba === "clientes" && <Clientes clientes={clientes} vendas={vendas} />}
            {aba === "avisos" && <Avisos avisos={avisos} ops={ops} />}
          </>
        )}
      </main>
    </div>
  );
}
