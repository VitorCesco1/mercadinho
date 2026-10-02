export const fmt = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Mesmo formato de texto que o app sempre gravou em "data" e "dataPagamento"
export const agoraTexto = () => new Date().toLocaleString("pt-BR");

// Momento atual em ms, pra usar dentro de eventos (toque de botão)
export const agoraMs = () => Date.now();

export const primeiroNome = (nome = "") => nome.trim().split(/\s+/)[0] || "";

export const semAcento = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// "Red Bull (zero e normal)" -> "Red Bull", "Charge." -> "Charge"
export const nomeCurto = (nome = "") => nome.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").replace(/[.\s]+$/, "").trim();
