import { useState } from "react";
import Icone from "./Icone.jsx";

// Mesmo login de sempre: só o e-mail do cadastro. Criar conta pede nome, WhatsApp e e-mail.
export default function Login({ api, demo, onFechar, onEntrou }) {
  const [modo, setModo] = useState("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const limpar = (f) => (e) => { f(e.target.value); setErro(""); };

  const entrar = async () => {
    if (!email.trim()) { setErro("Digite seu e-mail"); return; }
    setCarregando(true);
    try {
      const c = await api.buscarClientePorEmail(email);
      if (!c) { setErro("E-mail não encontrado. Confira ou crie uma conta."); return; }
      onEntrou(c, lembrar);
    } catch {
      setErro("Não deu pra conectar. Confira sua internet.");
    } finally {
      setCarregando(false);
    }
  };

  const cadastrar = async () => {
    if (!nome.trim()) { setErro("Digite seu nome"); return; }
    if (!telefone.trim()) { setErro("Digite seu WhatsApp"); return; }
    if (!email.trim() || !email.includes("@")) { setErro("E-mail inválido"); return; }
    setCarregando(true);
    try {
      if (await api.buscarClientePorEmail(email)) { setErro("Esse e-mail já tem cadastro. É só entrar."); return; }
      const c = await api.cadastrarCliente({ nome: nome.trim(), email: email.trim().toLowerCase(), telefone: telefone.trim() });
      onEntrou(c, lembrar);
    } catch {
      setErro("Erro ao cadastrar. Verifique sua conexão.");
    } finally {
      setCarregando(false);
    }
  };

  const enviar = (e) => { e.preventDefault(); if (!carregando) (modo === "login" ? entrar() : cadastrar()); };
  const trocar = () => { setModo(m => (m === "login" ? "cadastro" : "login")); setErro(""); };

  return (
    <div className="folha">
      <div className="veu" onClick={onFechar} />
      <form className="folha__painel" role="dialog" aria-modal="true" aria-labelledby="titulo-login" onSubmit={enviar}>
        <div className="folha__alca" />
        <button type="button" className="icone-btn folha__fechar" onClick={onFechar} aria-label="Fechar"><Icone nome="fechar" /></button>
        <h2 className="folha__titulo" id="titulo-login">{modo === "login" ? "Entrar" : "Criar conta"}</h2>
        <p className="folha__sub">{modo === "login" ? "Use o e-mail do seu cadastro no Mercadinho." : "É rapidinho, só uma vez."}</p>

        {demo && modo === "login" && api?.EMAIL_DEMO && (
          <p className="dica-demo">Pra testar, use <button type="button" onClick={() => { setEmail(api.EMAIL_DEMO); setErro(""); }}>{api.EMAIL_DEMO}</button></p>
        )}

        {modo === "cadastro" && (
          <>
            <label className="campo"><span>Nome completo</span>
              <input value={nome} onChange={limpar(setNome)} autoComplete="name" placeholder="Ex: João Silva" />
            </label>
            <label className="campo"><span>WhatsApp</span>
              <input value={telefone} onChange={limpar(setTelefone)} type="tel" inputMode="tel" autoComplete="tel" placeholder="(49) 99999-9999" />
            </label>
          </>
        )}
        <label className="campo"><span>E-mail</span>
          <input value={email} onChange={limpar(setEmail)} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="seu@email.com" />
        </label>
        <label className="lembrar">
          <input type="checkbox" checked={lembrar} onChange={e => setLembrar(e.target.checked)} />
          Lembrar de mim neste celular
        </label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button type="submit" className="btn-principal" disabled={carregando || !api}>
          {carregando ? <><span className="girando" />Aguarde…</> : modo === "login" ? "Entrar" : "Criar conta e entrar"}
        </button>
        <p className="folha__troca">
          {modo === "login" ? "Primeira vez aqui? " : "Já tem cadastro? "}
          <button type="button" className="link" onClick={trocar}>{modo === "login" ? "Criar conta" : "Entrar"}</button>
        </p>
      </form>
    </div>
  );
}
