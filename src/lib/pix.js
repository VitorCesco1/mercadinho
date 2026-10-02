// PIX do Mercadinho. Código estático, sem valor: o cliente digita o valor no app do banco.
export const CHAVE_PIX = "00020126580014br.gov.bcb.pix0136d9279dc5-dad2-408c-950c-fec2c859fc355204000053039865802BR5920ADRIEL_SOARES_LUCION6009Concordia610989703-16662290525PLTC042473701779757084622630439F6";
export const FAVORECIDO = "Adriel Soares Lucion";
export const DADOS_CONTA = { banco: "756", cooperativa: "3288", conta: "58.736-2" };

export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Alguns navegadores embutidos (WhatsApp, Instagram) bloqueiam a API de clipboard
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    area.remove();
    return ok;
  }
}
