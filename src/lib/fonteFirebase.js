// Acesso ao Firestore de produção. Mesmas coleções e o mesmo formato de sempre:
// produtos, vendas, clientes, avisos. "estatisticas" é nova e opcional (só leitura
// pros clientes; quem grava é o painel do dono).
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, onSnapshot,
  updateDoc, deleteDoc, serverTimestamp, query, where, writeBatch, deleteField,
} from "firebase/firestore";
import { ordenarVendas } from "./datas.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxN2rnc2igfFiJ0a87YmIdJaKUCLr0bcE",
  authDomain: "mercadinho-transcredi.firebaseapp.com",
  projectId: "mercadinho-transcredi",
  storageBucket: "mercadinho-transcredi.firebasestorage.app",
  messagingSenderId: "788980813205",
  appId: "1:788980813205:web:f01b875454f005edaa3a9c",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

export const DEMO = false;

const PRODUTOS_INICIAIS = [
  { id:"p1", nome:"Coca-Cola 600ml",    preco:6.0,  emoji:"🥤", foto:"", disponivel:true, estoque:20 },
  { id:"p2", nome:"Água mineral 500ml", preco:2.5,  emoji:"💧", foto:"", disponivel:true, estoque:30 },
  { id:"p3", nome:"Suco de caixinha",   preco:4.0,  emoji:"🧃", foto:"", disponivel:true, estoque:15 },
  { id:"p4", nome:"Pão de queijo",      preco:3.5,  emoji:"🧀", foto:"", disponivel:true, estoque:25 },
];

const lista = (s) => s.docs.map(d => ({ id: d.id, ...d.data() }));

export async function garantirProdutosIniciais() {
  try {
    const snap = await getDocs(collection(db, "produtos"));
    if (snap.empty) for (const p of PRODUTOS_INICIAIS) await setDoc(doc(db, "produtos", p.id), p);
  } catch (e) { console.error("initProdutos:", e); }
}

export const ouvirProdutos = (cb, erro) =>
  onSnapshot(collection(db, "produtos"), s => cb(lista(s)), e => { console.error("produtos:", e); erro?.(e); });

export const ouvirAvisos = (cb) =>
  onSnapshot(collection(db, "avisos"), s => cb(lista(s).filter(a => a.ativo)), e => console.error("avisos:", e));

// Todas as vendas: só o painel do dono usa
export const ouvirVendas = (cb, erro) =>
  onSnapshot(collection(db, "vendas"), s => cb(ordenarVendas(lista(s))), e => { console.error("vendas:", e); erro?.(e); });

export const ouvirClientes = (cb) =>
  onSnapshot(collection(db, "clientes"), s => cb(lista(s)), e => console.error("clientes:", e));

// Só os pedidos de um cliente (filtro de um campo só, não precisa de índice)
export const ouvirVendasDoCliente = (clienteId, cb, erro) =>
  onSnapshot(query(collection(db, "vendas"), where("clienteId", "==", clienteId)),
    s => cb(ordenarVendas(lista(s))), e => { console.error("minhas vendas:", e); erro?.(e); });

export async function buscarClientePorEmail(email) {
  const alvo = email.trim().toLowerCase();
  const snap = await getDocs(query(collection(db, "clientes"), where("email", "==", alvo)));
  if (!snap.empty) return lista(snap)[0];
  // Garantia pra cadastro antigo gravado com maiúscula ou espaço
  const todos = lista(await getDocs(collection(db, "clientes")));
  return todos.find(c => c.email?.trim().toLowerCase() === alvo) || null;
}

export async function cadastrarCliente(d) {
  const ref = await addDoc(collection(db, "clientes"), d);
  return { id: ref.id, ...d };
}

// SALVAR VENDA — com retry automático se perder conexão momentânea
export async function adicionarVenda(venda) {
  const payload = {
    ...venda,
    dataCriacao: serverTimestamp(), // timestamp do servidor (confiável)
    dataLocal:   Date.now(),        // backup numérico local
    salvo: true,                    // flag de integridade
  };
  let tentativas = 0;
  while (true) {
    try {
      const ref = await addDoc(collection(db, "vendas"), payload);
      return ref.id;
    } catch (e) {
      tentativas++;
      console.error(`Tentativa ${tentativas} falhou:`, e);
      if (tentativas >= 3) throw e;
      await new Promise(r => setTimeout(r, 1500 * tentativas));
    }
  }
}

export async function lerEstatisticas() {
  try {
    const s = await getDoc(doc(db, "estatisticas", "loja"));
    return s.exists() ? s.data() : null;
  } catch (e) { console.error("estatisticas:", e); return null; }
}
export async function salvarEstatisticas(dados) {
  try { await setDoc(doc(db, "estatisticas", "loja"), dados); } catch (e) { console.error("salvar estatisticas:", e); }
}

// Cobrança: quita (ou reabre) vários pedidos de uma vez. Tudo ou nada (batch atômico).
// Mesmos campos que o "Marcar como pago" de sempre: pago + dataPagamento em texto.
export async function marcarPedidosPagos(ids, dataPagamento) {
  const lote = writeBatch(db);
  ids.forEach(id => lote.update(doc(db, "vendas", id), { pago: true, dataPagamento }));
  await lote.commit();
}
export async function reabrirPedidos(ids) {
  const lote = writeBatch(db);
  ids.forEach(id => lote.update(doc(db, "vendas", id), { pago: false, dataPagamento: deleteField() }));
  await lote.commit();
}

export const atualizarProduto = async (id, d) => { try { await updateDoc(doc(db, "produtos", id), d); } catch (e) { console.error(e); } };
export const adicionarProduto = async (d)     => { try { await addDoc(collection(db, "produtos"), d); } catch (e) { console.error(e); } };
export const removerProduto   = async (id)    => { try { await deleteDoc(doc(db, "produtos", id)); } catch (e) { console.error(e); } };
export const atualizarVenda   = async (id, d) => { try { await updateDoc(doc(db, "vendas", id), d); } catch (e) { console.error(e); } };
export const removerVenda     = async (id)    => { try { await deleteDoc(doc(db, "vendas", id)); } catch (e) { console.error(e); } };

export async function salvarAviso(d) {
  try {
    if (d.id) await updateDoc(doc(db, "avisos", d.id), d);
    else      await addDoc(collection(db, "avisos"), d);
  } catch (e) { console.error(e); }
}
export const removerAviso = async (id) => { try { await deleteDoc(doc(db, "avisos", id)); } catch (e) { console.error(e); } };
