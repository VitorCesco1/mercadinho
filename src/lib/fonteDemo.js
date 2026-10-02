// Fonte de dados de DEMONSTRAÇÃO (npm run demo). Tudo em memória: recarregou a página, voltou ao início.
// Produtos reais (fotos recomprimidas) e histórico real de pedidos com nomes de clientes fictícios.
// Os arquivos de dados ficam em ./demo/dados (fora do git).
import produtosBase from "./demo/dados/produtos.json";
import clientesBase from "./demo/dados/clientes.json";
import vendasBase from "./demo/dados/vendas.json";
import { ordenarVendas } from "./datas.js";
import { calcularEstatisticas } from "./sugestoes.js";

export const DEMO = true;
export const EMAIL_DEMO = clientesBase[0]?.email || "";

const banco = {
  produtos: produtosBase.map(p => ({ ...p })),
  clientes: clientesBase.map(c => ({ ...c })),
  vendas: vendasBase.map(v => ({ ...v })),
  avisos: [],
  pagamentosInformados: [],
};
const ouvintes = { produtos: new Set(), clientes: new Set(), vendas: new Set(), avisos: new Set(), pagamentosInformados: new Set() };
const espera = (ms = 250) => new Promise(r => setTimeout(r, ms));
let seq = 1;
const novoId = (p) => `${p}-${Date.now().toString(36)}-${seq++}`;

function avisar(colecao) {
  for (const f of ouvintes[colecao]) f();
}
function ouvir(colecao, mapear, cb) {
  const f = () => cb(mapear(banco[colecao].map(x => ({ ...x }))));
  ouvintes[colecao].add(f);
  setTimeout(f, 350); // simula a primeira resposta da rede
  return () => ouvintes[colecao].delete(f);
}

export const garantirProdutosIniciais = async () => {};
export const ouvirProdutos = (cb) => ouvir("produtos", x => x, cb);
export const ouvirAvisos = (cb) => ouvir("avisos", x => x.filter(a => a.ativo), cb);
export const ouvirVendas = (cb) => ouvir("vendas", ordenarVendas, cb);
export const ouvirClientes = (cb) => ouvir("clientes", x => x, cb);
export const ouvirVendasDoCliente = (clienteId, cb) => ouvir("vendas", x => ordenarVendas(x.filter(v => v.clienteId === clienteId)), cb);

export async function buscarClientePorEmail(email) {
  await espera();
  const alvo = email.trim().toLowerCase();
  return banco.clientes.find(c => c.email?.trim().toLowerCase() === alvo) || null;
}
export async function cadastrarCliente(d) {
  await espera();
  const c = { id: novoId("demo-cli"), ...d };
  banco.clientes.push(c); avisar("clientes");
  return c;
}
export async function adicionarVenda(venda) {
  await espera(700);
  const id = novoId("demo-ped");
  banco.vendas.push({ ...venda, id, dataCriacao: Date.now(), dataLocal: Date.now(), salvo: true });
  avisar("vendas");
  return id;
}

export async function lerEstatisticas() {
  await espera();
  return calcularEstatisticas(banco.vendas);
}
export const salvarEstatisticas = async () => {};

const editar = (colecao, id, d) => { const x = banco[colecao].find(i => i.id === id); if (x) Object.assign(x, d); avisar(colecao); };
const remover = (colecao, id) => { banco[colecao] = banco[colecao].filter(i => i.id !== id); avisar(colecao); };

export async function informarPagamento(aviso) {
  await espera(300);
  banco.pagamentosInformados.push({ id: novoId("demo-aviso-pag"), ...aviso, dataLocal: Date.now() });
  avisar("pagamentosInformados");
}
export const ouvirPagamentosInformados = (cb) => ouvir("pagamentosInformados", x => x, cb);

export async function marcarPedidosPagos(ids, dataPagamento) {
  await espera(400);
  for (const v of banco.vendas) if (ids.includes(v.id)) Object.assign(v, { pago: true, dataPagamento });
  avisar("vendas");
}
export async function reabrirPedidos(ids) {
  await espera(400);
  for (const v of banco.vendas) if (ids.includes(v.id)) { v.pago = false; delete v.dataPagamento; }
  avisar("vendas");
}

export const atualizarProduto = async (id, d) => editar("produtos", id, d);
export const adicionarProduto = async (d) => { banco.produtos.push({ id: novoId("demo-prod"), ...d }); avisar("produtos"); };
export const removerProduto = async (id) => remover("produtos", id);
export const atualizarVenda = async (id, d) => editar("vendas", id, d);
export const removerVenda = async (id) => remover("vendas", id);
export async function salvarAviso(d) {
  if (d.id) editar("avisos", d.id, d);
  else { banco.avisos.push({ id: novoId("demo-aviso"), ...d }); avisar("avisos"); }
}
export const removerAviso = async (id) => remover("avisos", id);
