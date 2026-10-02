// Ícones em SVG inline (sem biblioteca, pra não pesar o carregamento).
const P = {
  sacola: <><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></>,
  fechar: <><path d="M6 6l12 12M18 6L6 18" /></>,
  mais: <><path d="M12 5v14M5 12h14" /></>,
  menos: <><path d="M5 12h14" /></>,
  voltar: <><path d="M15 5l-7 7 7 7" /></>,
  seta: <><path d="M9 5l7 7-7 7" /></>,
  copiar: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></>,
  check: <><path d="M5 12.5l4.5 4.5L19 7.5" /></>,
  busca: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>,
  recibo: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  sair: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 16l-4-4 4-4M6 12h10" /></>,
  raio: <><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" /></>,
  calendario: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  pix: <><path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z" /><path d="M8 12h8" /></>,
  escudo: <><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  sobe: <><path d="M4 16l6-6 4 4 6-7" /><path d="M15 7h5v5" /></>,
  desce: <><path d="M4 8l6 6 4-4 6 7" /><path d="M15 17h5v-5" /></>,
  planilha: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 9h16M4 15h16M10 9v12" /></>,
  baixar: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
  lixo: <><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" /></>,
  lapis: <><path d="M4 20l4-1 11-11-3-3L5 16z" /><path d="M14 6l3 3" /></>,
  conversa: <><path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.6A7.5 7.5 0 1 1 20 11.5z" /></>,
  usuario: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" /></>,
};

export default function Icone({ nome, tamanho = 22, espessura = 2, className }) {
  return (
    <svg className={className} width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={espessura} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[nome]}
    </svg>
  );
}
