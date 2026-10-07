import { editor } from "./editor.js";
import { traduzir, obterIdioma, definirIdioma } from "./i18n.js";
import { desenharSetasMemoria } from "./renderizar-memoria.js";
import {
  executar,
  enviarEntradaPendente,
  passo,
  irPara,
  irParaPrimeiro,
  irParaUltimo,
  resetarExecucaoVisual,
  ocultarEntradaPendente,
  atualizarEntradaDinamica,
  limparEntradasColetadas,
  obterPassos,
  obterEntradaPendente,
  renderizarPasso,
} from "./execucao.js";
import { iniciarAbas } from "./abas-direita.js";
import { acaoDoAtalho } from "./atalhos.js";
import { iniciarCopiarCodigo } from "./copiar-codigo.js";
import { rolarFluxoParaNoAtivo } from "./fluxo.js";
import { fluxoEmTelaCheia, sairDaTelaCheia } from "./fluxo-tela-cheia.js";
import {
  alternarTraducaoCodigo,
  iniciarTraducaoCodigo,
} from "./traducao-editor.js";

let escalaFonte = parseFloat(localStorage.getItem("pythonvisual_escala_fonte")) || 1;
let temaEscuro = localStorage.getItem("pythonvisual_tema_escuro") === "1";

function atualizarBotaoTema() {
  const botao = document.getElementById("btn-tema");
  const icone = document.getElementById("tema-icone");
  const label = document.getElementById("tema-label");
  if (!botao || !icone || !label)
    return;
  icone.className = temaEscuro ? "fa-solid fa-sun" : "fa-solid fa-moon";
  label.textContent = temaEscuro
    ? traduzir("theme.light")
    : traduzir("theme.dark");
}

function aplicarIdioma() {
  const langAttr = obterIdioma() === "en" ? "en" : "pt-br";
  document.documentElement.lang = langAttr;
  document.title = traduzir("title");
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = traduzir(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", traduzir(el.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = traduzir(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll(".lang-btn").forEach((botao) => {
    const ativo = botao.id === "lang-" + obterIdioma();
    botao.classList.toggle("active", ativo);
    botao.setAttribute("aria-pressed", ativo ? "true" : "false");
  });
  editor.setOption("placeholder", traduzir("editor.shortcutsPlaceholder"));
  atualizarBotaoTema();
  atualizarBotoesRecolher();
  const entradaPendente = obterEntradaPendente();
  if (entradaPendente) {
    document.getElementById("entrada-linha-badge").textContent =
      traduzir("input.line") + " " + entradaPendente.linha;
    document.getElementById("entrada-prompt-texto").textContent =
      entradaPendente.prompt || traduzir("input.promptDefault");
  } else {
    document.getElementById("entrada-prompt-texto").textContent = traduzir(
      "input.promptDefault",
    );
  }
  if (obterPassos().length > 0) {
    renderizarPasso();
  } else {
    document.getElementById("contador").textContent = traduzir("counter.empty");
  }
}

function setLang(lang) {
  definirIdioma(lang);
  aplicarIdioma();
}

let exemplos = {};
async function carregarExemplos() {
  try {
    const resposta = await fetch("/static/data/exemplos.json");
    exemplos = await resposta.json();
  } catch (e) {
    console.error("Erro carregando exemplos", e);
  }
}

function carregarExemplo() {
  const chave = document.getElementById("exemplos").value;
  if (!chave || !exemplos[chave])
    return;
  editor.setValue(exemplos[chave]);
  document.getElementById("saida").style.display = "none";
  document.getElementById("saida-card").style.display = "none";
  document.getElementById("pilha-card").style.display = "none";
  ocultarEntradaPendente();
  resetarExecucaoVisual();
}

function limparCodigo() {
  editor.setValue("");
  document.getElementById("entrada").value = "";
  document.getElementById("saida").style.display = "none";
  document.getElementById("saida-card").style.display = "none";
  document.getElementById("pilha-card").style.display = "none";
  resetarExecucaoVisual();
  editor.focus();
}

function aplicarFonte() {
  document.documentElement.style.setProperty(
    "--font-scale",
    escalaFonte.toFixed(2),
  );
  document.documentElement.classList.toggle(
    "fonte-ampliada",
    escalaFonte > 1.3,
  );
  localStorage.setItem("pythonvisual_escala_fonte", escalaFonte.toFixed(2));
  editor.refresh();
  requestAnimationFrame(desenharSetasMemoria);
  requestAnimationFrame(rolarFluxoParaNoAtivo);
}

function alterarFonte(delta) {
  escalaFonte = Math.max(0.6, Math.min(1.8, escalaFonte + delta));
  aplicarFonte();
}

function atualizarBotaoRecolher(botao) {
  const card = botao.closest(".card");
  if (!card)
    return;
  const recolhido = card.classList.contains("recolhido");
  const texto = traduzir(recolhido ? "card.expand" : "card.collapse");
  const icone = botao.querySelector("i");
  botao.setAttribute("aria-expanded", recolhido ? "false" : "true");
  botao.setAttribute("aria-label", texto);
  if (icone)
    icone.className = recolhido
      ? "fa-solid fa-chevron-down"
      : "fa-solid fa-chevron-up";
}

function atualizarBotoesRecolher() {
  document.querySelectorAll(".btn-recolher").forEach(atualizarBotaoRecolher);
}

function alternarCard(cardId) {
  const card = document.getElementById(cardId);
  if (!card)
    return;
  card.classList.toggle("recolhido");
  const botao = card.querySelector(":scope > .card-header .btn-recolher");
  if (botao)
    atualizarBotaoRecolher(botao);
  if (cardId === "codigo-card" && !card.classList.contains("recolhido"))
    editor.refresh();
  if (cardId === "fluxo-card" && !card.classList.contains("recolhido"))
    requestAnimationFrame(rolarFluxoParaNoAtivo);
  requestAnimationFrame(desenharSetasMemoria);
}

function aplicarTemaEditor() {
  editor.setOption("theme", temaEscuro ? "material-darker" : "default");
}

function alternarTema() {
  temaEscuro = !temaEscuro;
  document.body.classList.toggle("tema-escuro", temaEscuro);
  localStorage.setItem("pythonvisual_tema_escuro", temaEscuro ? "1" : "0");
  atualizarBotaoTema();
  aplicarTemaEditor();
  editor.refresh();
  requestAnimationFrame(desenharSetasMemoria);
}

function ehCampoNativo(alvo) {
  if (!alvo)
    return false;
  if (alvo.isContentEditable)
    return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName);
}

function focoEmCampoDeTexto(evento) {
  const alvo = evento.target;
  if (!alvo)
    return false;
  if (alvo.closest && alvo.closest(".CodeMirror, .fluxo-rolagem"))
    return true;
  return ehCampoNativo(alvo);
}

function alvoAtivavel(alvo) {
  return !!(alvo && alvo.closest && alvo.closest("button, a"));
}

// As regras dos atalhos ficam em atalhos.js; aqui só se descreve o foco.
function contextoDoAtalho(evento) {
  const alvo = evento.target;
  return {
    telaCheia: fluxoEmTelaCheia(),
    campoDeTexto: focoEmCampoDeTexto(evento),
    campoNativo: ehCampoNativo(alvo),
    noEditor: !!(alvo && alvo.closest && alvo.closest(".CodeMirror")),
    ativavel: alvoAtivavel(alvo),
  };
}

const ACOES_DE_ATALHO = {
  executar: () => executar(),
  limpar: () => limparCodigo(),
  traduzir: () => alternarTraducaoCodigo(),
  proximo: () => passo(1),
  anterior: () => passo(-1),
  primeiro: () => irParaPrimeiro(),
  ultimo: () => irParaUltimo(),
  sairTelaCheia: () => sairDaTelaCheia(),
  focarEditor: () => editor.focus(),
};

editor.on("change", () => {
  limparEntradasColetadas();
  ocultarEntradaPendente();
});
document.getElementById("entrada").addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    evento.preventDefault();
    enviarEntradaPendente();
  }
});

// O Ctrl+Delete é tratado na fase de captura, antes do CodeMirror, que o usa
// para apagar a palavra seguinte: sem isso o Ctrl+Z devolveria o código sem
// essa palavra.
document.addEventListener(
  "keydown",
  (evento) => {
    if (evento.key !== "Delete")
      return;
    if (acaoDoAtalho(evento, contextoDoAtalho(evento)) !== "limpar")
      return;
    evento.preventDefault();
    evento.stopPropagation();
    limparCodigo();
  },
  true,
);

document.addEventListener("keydown", (evento) => {
  const acao = acaoDoAtalho(evento, contextoDoAtalho(evento));
  if (!acao)
    return;
  evento.preventDefault();
  ACOES_DE_ATALHO[acao]();
});

window.addEventListener("resize", desenharSetasMemoria);

// Funções chamadas a partir de atributos onclick/oninput/onchange no HTML
// precisam ser expostas explicitamente, já que módulos ES não criam
// automaticamente variáveis globais.
window.executar = executar;
window.enviarEntradaPendente = enviarEntradaPendente;
window.passo = passo;
window.irPara = irPara;
window.irParaPrimeiro = irParaPrimeiro;
window.irParaUltimo = irParaUltimo;
window.setLang = setLang;
window.carregarExemplo = carregarExemplo;
window.limparCodigo = limparCodigo;
window.alterarFonte = alterarFonte;
window.alternarCard = alternarCard;
window.alternarTema = alternarTema;
window.alternarTraducaoCodigo = alternarTraducaoCodigo;

carregarExemplos();
iniciarAbas({
  aoMostrarFluxograma: rolarFluxoParaNoAtivo,
  aoMostrarVisualizacao: desenharSetasMemoria,
});
resetarExecucaoVisual();
document.body.classList.toggle("tema-escuro", temaEscuro);
aplicarTemaEditor();
aplicarFonte();
aplicarIdioma();
atualizarEntradaDinamica();
iniciarTraducaoCodigo();
iniciarCopiarCodigo({ obterCodigo: () => editor.getValue(), traduzir });
