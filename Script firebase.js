/* ===========================================================
   — SCRIPT-FIREBASE.JS
   Integração com Firebase: Authentication (Google) + Firestore
   ===========================================================
   1. Configuração e inicialização do Firebase
   2. Login / Logout com Google
   3. Envio de novo depoimento para o Firestore
   4. Leitura dos depoimentos (Home = 3 recentes | Avaliações = todos)
   5. Renderização dos cards no DOM
   6. Controle de UI (estado logado / deslogado, loading, erros)
   =========================================================== */

/* ===========================================================
   IMPORTS — SDKs modulares do Firebase (v9+)
   =========================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect, // <-- Troque signInWithPopup por este
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===========================================================
   1. CONFIGURAÇÃO DO FIREBASE
   -----------------------------------------------------------
   >>> SUBSTITUA os valores abaixo pelas credenciais do SEU
   projeto Firebase. Veja o README.md para o passo a passo de
   onde encontrar cada campo (Console Firebase > Configurações
   do projeto > Seus apps > SDK setup and configuration).
   =========================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyBLG7tS9-Gz0H0rOPpe9EdL9Q4Z6DN4cqo",
  authDomain: "drdaniellyvicente.firebaseapp.com",
  projectId: "drdaniellyvicente",
  storageBucket: "drdaniellyvicente.firebasestorage.app",
  messagingSenderId: "555712435165",
  appId: "1:555712435165:web:74d03014e347e18e68dc34",
  measurementId: "G-J963R43K6S"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Nome da coleção no Firestore (usado em toda a aplicação)
const COLLECTION_NAME = "avaliacoes";


/* ===========================================================
   2. LOGIN / LOGOUT COM GOOGLE
   =========================================================== */

/**
 * Abre o popup de login do Google.
 */
async function loginComGoogle() {
  try {
    await signInWithRedirect(auth, provider); // <-- Troque signInWithPopup por este
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    exibirErro("Não foi possível entrar com o Google. Tente novamente.");
  }
}

/**
 * Encerra a sessão do usuário atual.
 */
async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao sair:", error);
  }
}

/**
 * Observa mudanças no estado de autenticação e
 * atualiza a interface (mostrar formulário x botão de login).
 */
function observarAutenticacao() {
  const btnLogin = document.getElementById("btnLoginGoogle");
  const formWrapper = document.getElementById("avaliacaoFormWrapper");
  const userInfo = document.getElementById("userInfo");
  const btnLogout = document.getElementById("btnLogout");
  const userPhoto = document.getElementById("userPhoto");
  const userName = document.getElementById("userName");

  // Se estes elementos não existirem na página (ex.: index.html), não faz nada.
  if (!btnLogin) return;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Usuário logado
      btnLogin.style.display = "none";
      formWrapper.style.display = "block";
      userInfo.style.display = "flex";
      userPhoto.src = user.photoURL || "";
      userName.textContent = user.displayName || "Usuário";
    } else {
      // Usuário deslogado
      btnLogin.style.display = "inline-flex";
      formWrapper.style.display = "none";
      userInfo.style.display = "none";
    }
  });

  btnLogin.addEventListener("click", loginComGoogle);
  if (btnLogout) btnLogout.addEventListener("click", logout);
}


/* ===========================================================
   3. ENVIAR NOVO DEPOIMENTO PARA O FIRESTORE
   =========================================================== */

/**
 * Envia o depoimento digitado pelo usuário logado para o Firestore.
 */
async function enviarAvaliacao(texto) {
  const user = auth.currentUser;

  if (!user) {
    exibirErro("Você precisa estar logado para enviar uma avaliação.");
    return;
  }

  const textoLimpo = texto.trim();
  if (!textoLimpo) {
    exibirErro("Escreva seu depoimento antes de enviar.");
    return;
  }

  if (textoLimpo.length > 500) {
    exibirErro("Seu depoimento pode ter no máximo 500 caracteres.");
    return;
  }

  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      nome: user.displayName || "Paciente",
      foto: user.photoURL || "",
      uid: user.uid,
      texto: textoLimpo,
      criadoEm: serverTimestamp()
    });

    const textarea = document.getElementById("avaliacaoTextarea");
    if (textarea) textarea.value = "";
    exibirSucesso("Obrigado! Seu depoimento foi publicado.");
  } catch (error) {
    console.error("Erro ao enviar avaliação:", error);
    exibirErro("Não foi possível publicar seu depoimento. Tente novamente.");
  }
}

function configurarFormulario() {
  const form = document.getElementById("avaliacaoForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const textarea = document.getElementById("avaliacaoTextarea");
    enviarAvaliacao(textarea.value);
  });
}


/* ===========================================================
   4. LEITURA DOS DEPOIMENTOS (REALTIME)
   =========================================================== */

/**
 * Escuta em tempo real os depoimentos mais recentes (limitado).
 * Usado na Home (index.html) — exibe apenas os 3 mais recentes.
 */
function escutarDepoimentosRecentes(qtd = 3) {
  const grid = document.getElementById("testimonialsGrid");
  if (!grid) return;

  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("criadoEm", "desc"),
    limit(qtd)
  );

  onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderizarDepoimentos(docs, grid);
  }, (error) => {
    console.error("Erro ao carregar depoimentos:", error);
  });
}

/**
 * Escuta em tempo real TODOS os depoimentos, sem limite.
 * Usado na página avaliacoes.html.
 */
function escutarTodosDepoimentos() {
  const grid = document.getElementById("avaliacoesGrid");
  if (!grid) return;

  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("criadoEm", "desc")
  );

  onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderizarDepoimentos(docs, grid);
    atualizarContador(docs.length);
  }, (error) => {
    console.error("Erro ao carregar avaliações:", error);
  });
}


/* ===========================================================
   5. RENDERIZAÇÃO DOS CARDS NO DOM
   =========================================================== */

/**
 * Constrói o HTML de um card de depoimento, reaproveitando
 * exatamente as classes CSS já usadas no site (.card,
 * .testimonial-card, .testimonial-author, .stars).
 */
function criarCardDepoimento(dado) {
  const article = document.createElement("article");
  article.className = "card testimonial-card";
  article.setAttribute("data-reveal", "");

  const dataFormatada = formatarData(dado.criadoEm);
  const fotoSrc = dado.foto || "";
  const nomeSeguro = escaparHTML(dado.nome || "Paciente");
  const textoSeguro = escaparHTML(dado.texto || "");

  article.innerHTML = `
    <div class="stars" aria-label="Avaliação de paciente">★★★★★</div>
    <p>"${textoSeguro}"</p>
    <div class="testimonial-author">
      ${
        fotoSrc
          ? `<img src="${fotoSrc}" alt="Foto de ${nomeSeguro}" referrerpolicy="no-referrer">`
          : `<div class="testimonial-avatar-fallback">${nomeSeguro.charAt(0).toUpperCase()}</div>`
      }
      <div>
        <strong>${nomeSeguro}</strong>
        ${dataFormatada ? `<span>${dataFormatada}</span>` : ""}
      </div>
    </div>
  `;

  return article;
}

/**
 * Renderiza a lista de depoimentos dentro do grid informado.
 * Reconstrói o grid inteiro a cada atualização (simples e robusto
 * para o volume de dados de uma clínica).
 */
function renderizarDepoimentos(docs, grid) {
  grid.innerHTML = "";

  if (docs.length === 0) {
    grid.innerHTML = `
      <p class="testimonials-empty">
        Ainda não há depoimentos publicados. Seja o primeiro a avaliar!
      </p>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  docs.forEach(dado => fragment.appendChild(criarCardDepoimento(dado)));
  grid.appendChild(fragment);

  // Reaplica a animação de "reveal ao rolar" nos novos elementos,
  // caso a função global exposta pelo script.js esteja disponível.
  if (typeof window.reobservarReveal === "function") {
    window.reobservarReveal();
  } else {
    // Fallback: torna os cards visíveis imediatamente
    grid.querySelectorAll("[data-reveal]").forEach(el => el.classList.add("is-visible"));
  }
}


/* ===========================================================
   6. UTILITÁRIOS DE UI (mensagens, contador, formatação)
   =========================================================== */

function exibirErro(mensagem) {
  const feedback = document.getElementById("avaliacaoFeedback");
  if (!feedback) {
    alert(mensagem);
    return;
  }
  feedback.textContent = mensagem;
  feedback.className = "form-feedback form-feedback--erro";
  feedback.style.display = "block";
  setTimeout(() => { feedback.style.display = "none"; }, 4000);
}

function exibirSucesso(mensagem) {
  const feedback = document.getElementById("avaliacaoFeedback");
  if (!feedback) return;
  feedback.textContent = mensagem;
  feedback.className = "form-feedback form-feedback--sucesso";
  feedback.style.display = "block";
  setTimeout(() => { feedback.style.display = "none"; }, 4000);
}

function atualizarContador(total) {
  const el = document.getElementById("avaliacoesTotal");
  if (el) {
    el.textContent = total === 1 ? "1 avaliação" : `${total} avaliações`;
  }
}

function formatarData(timestamp) {
  if (!timestamp || !timestamp.toDate) return "";
  const data = timestamp.toDate();
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Escapa caracteres HTML para evitar XSS ao inserir texto
 * digitado pelo usuário diretamente no DOM via innerHTML.
 */
function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}


/* ===========================================================
   INICIALIZAÇÃO
   =========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  observarAutenticacao();
  configurarFormulario();

  // Detecta em qual página estamos e carrega os dados certos
  if (document.getElementById("testimonialsGrid")) {
    escutarDepoimentosRecentes(3); // Home
  }
  if (document.getElementById("avaliacoesGrid")) {
    escutarTodosDepoimentos(); // Página avaliacoes.html
  }
});