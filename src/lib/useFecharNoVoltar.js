import { useEffect, useRef } from "react";

// No celular, o botão "voltar" fecha o carrinho/janela aberta em vez de sair do app.
// Cada janela empilha um estado no histórico com um id próprio; ao fechar pelo X, desempilha.
let contador = 0;

// Fechar uma janela chama history.back(), que termina depois. Abrir outra coisa antes
// disso faria o "voltar" pendente fechar a coisa nova. Então espera o voltar terminar.
export function depoisDoVoltar(fn) {
  let feito = false;
  const rodar = () => {
    if (feito) return;
    feito = true;
    window.removeEventListener("popstate", rodar);
    fn();
  };
  window.addEventListener("popstate", rodar);
  setTimeout(rodar, 350);
}

export default function useFecharNoVoltar(aberto, fechar) {
  const fecharRef = useRef(fechar);
  useEffect(() => { fecharRef.current = fechar; }, [fechar]);

  useEffect(() => {
    if (!aberto) return;
    const id = ++contador;
    let porVoltar = false;
    history.pushState({ ...(history.state || {}), modal: id }, "");
    const aoVoltar = (e) => {
      if (e.state?.modal === id) return; // voltou pra este mesmo nível (outra janela por cima fechou)
      porVoltar = true;
      fecharRef.current();
    };
    window.addEventListener("popstate", aoVoltar);
    return () => {
      window.removeEventListener("popstate", aoVoltar);
      if (!porVoltar && history.state?.modal === id) history.back();
    };
  }, [aberto]);
}
