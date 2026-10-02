// localStorage pode falhar (aba anônima, navegador embutido); o app funciona sem ele.
const PREFIXO = "mercadinho.";

export function ler(chave, padrao = null) {
  try {
    const v = localStorage.getItem(PREFIXO + chave);
    return v === null ? padrao : JSON.parse(v);
  } catch {
    return padrao;
  }
}

export function gravar(chave, valor) {
  try { localStorage.setItem(PREFIXO + chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ }
}

export function apagar(chave) {
  try { localStorage.removeItem(PREFIXO + chave); } catch { /* sem armazenamento */ }
}
