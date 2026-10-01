// Tela cheia do fluxograma: usa a API de tela cheia do navegador no próprio card
// (#fluxo-card), sem mover nada no DOM. O estado vem sempre do evento
// `fullscreenchange`, porque o navegador também sai sozinho (tecla Esc).
// Enquanto o card está em tela cheia o resto da página fica `inert`: sem isso o
// Tab chegaria a botões invisíveis e o Espaço acionaria, por exemplo, o
// "Limpar" escondido atrás do fluxograma.
const ID_CARD = "fluxo-card";
const ID_BOTAO = "fluxo-tela-cheia";
const ID_DICA = "fluxo-dica-teclado";
const CLASSE_ATIVA = "em-tela-cheia";
const ATRASO_AJUSTE = 250;
const TAGS_IGNORADAS = new Set(["SCRIPT", "STYLE", "LINK", "TEMPLATE"]);

let ativa = false;
let aoMudar = null;
let isolados = [];
let aguardandoSaida = [];

function obter(id) {
  return document.getElementById(id);
}

export function telaCheiaDisponivel() {
  const card = obter(ID_CARD);
  return !!(card && document.fullscreenEnabled && card.requestFullscreen);
}

export function fluxoEmTelaCheia() {
  const card = obter(ID_CARD);
  return !!card && document.fullscreenElement === card;
}

export function definirBotaoTelaCheia(visivel) {
  const botao = obter(ID_BOTAO);
  if (botao)
    botao.hidden = !(visivel && telaCheiaDisponivel());
}

function isolarOResto(card) {
  const lista = [];
  for (let no = card; no && no !== document.body; no = no.parentElement) {
    for (const irmao of no.parentElement.children) {
      if (irmao === no || irmao.inert || TAGS_IGNORADAS.has(irmao.tagName))
        continue;
      // a dica dos botões se muda para dentro do card em tela cheia
      if (irmao.getAttribute("role") === "tooltip")
        continue;
      irmao.inert = true;
      lista.push(irmao);
    }
  }
  return lista;
}

function desfazerIsolamento() {
  for (const elemento of isolados)
    elemento.inert = false;
  isolados = [];
}

function atualizarBotao(emTelaCheia) {
  const botao = obter(ID_BOTAO);
  if (!botao)
    return;
  botao.setAttribute("aria-pressed", emTelaCheia ? "true" : "false");
  const icone = botao.querySelector("i");
  if (icone)
    icone.className = emTelaCheia
      ? "fa-solid fa-compress"
      : "fa-solid fa-expand";
}

function aoEntrar(card) {
  isolados = isolarOResto(card);
  // o foco fica no card (e não em um botão) para o Espaço avançar o passo
  card.setAttribute("tabindex", "-1");
  card.setAttribute("aria-describedby", ID_DICA);
  card.focus({ preventScroll: true });
}

function aoSair(card) {
  const foco = document.activeElement;
  const botao = obter(ID_BOTAO);
  desfazerIsolamento();
  card.removeAttribute("tabindex");
  card.removeAttribute("aria-describedby");
  // só devolve o foco ao botão se ninguém o levou para outro lugar
  // (ex.: o campo de entrada do input())
  const focoPerdido = !foco || foco === document.body || card.contains(foco);
  if (botao && !botao.hidden && focoPerdido)
    botao.focus({ preventScroll: true });
  const esperando = aguardandoSaida;
  aguardandoSaida = [];
  for (const resolver of esperando)
    resolver();
}

function ajustar() {
  if (aoMudar)
    aoMudar(ativa);
}

function sincronizar() {
  const card = obter(ID_CARD);
  const agora = fluxoEmTelaCheia();
  if (!card || agora === ativa)
    return;
  ativa = agora;
  card.classList.toggle(CLASSE_ATIVA, agora);
  atualizarBotao(agora);
  if (agora)
    aoEntrar(card);
  else
    aoSair(card);
  // o navegador redimensiona a janela um instante depois do evento
  requestAnimationFrame(ajustar);
  setTimeout(ajustar, ATRASO_AJUSTE);
}

export function entrarNaTelaCheia() {
  const card = obter(ID_CARD);
  if (!card || !telaCheiaDisponivel() || fluxoEmTelaCheia())
    return;
  // o navegador pode recusar (política da página, aba em segundo plano)
  Promise.resolve(card.requestFullscreen()).catch(() => {});
}

// Devolve uma promessa resolvida quando a página já saiu da tela cheia. O
// navegador só aceita foco fora do card depois disso (focus() em um campo da
// página escondida não tem efeito durante a tela cheia).
export function sairDaTelaCheia() {
  if (!fluxoEmTelaCheia())
    return Promise.resolve();
  // a página volta a responder já; o navegador conclui a saída em seguida
  desfazerIsolamento();
  return new Promise((resolver) => {
    aguardandoSaida.push(resolver);
    Promise.resolve(document.exitFullscreen()).catch(resolver);
  });
}

export function alternarTelaCheia() {
  if (fluxoEmTelaCheia())
    sairDaTelaCheia();
  else
    entrarNaTelaCheia();
}

export function iniciarTelaCheia(opcoes = {}) {
  aoMudar = opcoes.aoMudar || null;
  const botao = obter(ID_BOTAO);
  if (botao)
    botao.addEventListener("click", alternarTelaCheia);
  document.addEventListener("fullscreenchange", sincronizar);
}
