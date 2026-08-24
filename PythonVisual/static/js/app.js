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
  ocultarExplicacaoLinha,
  atualizarEntradaDinamica,
  limparEntradasColetadas,
  obterPassos,
  obterEntradaPendente,
  renderizarPasso,
} from "./execucao.js";

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
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const texto = traduzir(el.dataset.i18nTitle);
    el.title = texto;
    el.setAttribute("aria-label", texto);
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
  botao.title = texto;
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

function focoEmCampoDeTexto(evento) {
  const alvo = evento.target;
  if (!alvo)
    return false;
  if (alvo.closest && alvo.closest(".CodeMirror"))
    return true;
  if (alvo.isContentEditable)
    return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName);
}

function alvoAtivavel(alvo) {
  return !!(alvo && alvo.closest && alvo.closest("button, a"));
}

editor.on("change", () => {
  limparEntradasColetadas();
  ocultarEntradaPendente();
  ocultarExplicacaoLinha();
});
document.getElementById("entrada").addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    evento.preventDefault();
    enviarEntradaPendente();
  }
});

document.addEventListener("keydown", (evento) => {
  const tecla = evento.key;

  if ((evento.ctrlKey || evento.metaKey) && tecla === "Enter") {
    evento.preventDefault();
    executar();
    return;
  }

  if (tecla === "Escape") {
    evento.preventDefault();
    editor.focus();
    return;
  }

  if (
    focoEmCampoDeTexto(evento) ||
    evento.altKey ||
    evento.ctrlKey ||
    evento.metaKey
  )
    return;
  if (tecla === " " && alvoAtivavel(evento.target))
    return;

  if (tecla === "ArrowRight" || tecla === " ") {
    evento.preventDefault();
    passo(1);
    return;
  }
  if (tecla === "ArrowLeft") {
    evento.preventDefault();
    passo(-1);
    return;
  }
  if (tecla === "Home") {
    evento.preventDefault();
    irParaPrimeiro();
    return;
  }
  if (tecla === "End") {
    evento.preventDefault();
    irParaUltimo();
    return;
  }
  if (tecla.toLowerCase() === "r") {
    evento.preventDefault();
    executar();
    return;
  }
  if (tecla.toLowerCase() === "c") {
    evento.preventDefault();
    limparCodigo();
  }
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

carregarExemplos();
resetarExecucaoVisual();
document.body.classList.toggle("tema-escuro", temaEscuro);
aplicarTemaEditor();
aplicarFonte();
aplicarIdioma();
atualizarEntradaDinamica();
