// Dica de tradução do código: com o botão "Traduzir código" ligado, passar o
// mouse sobre uma linha do editor mostra essa linha em linguagem simples.
// Vale só para o editor do card Código.
import { editor } from "./editor.js";
import { obterIdioma } from "./i18n.js";
import { traduzirLinhaCodigo } from "./traducao-codigo.js";

const CHAVE_PREFERENCIA = "pythonvisual_traducao_codigo";
const AFASTAMENTO = 15;
const MARGEM = 8;

let ativa = lerPreferencia();
let dica = null;

function lerPreferencia() {
  try {
    return localStorage.getItem(CHAVE_PREFERENCIA) === "1";
  } catch (erro) {
    return false;
  }
}

function salvarPreferencia() {
  try {
    localStorage.setItem(CHAVE_PREFERENCIA, ativa ? "1" : "0");
  } catch (erro) {
    // sem armazenamento disponível: a escolha vale só até recarregar a página
  }
}

function atualizarBotao() {
  const botao = document.getElementById("btn-traduzir");

  if (!botao)
    return;

  botao.setAttribute("aria-pressed", ativa ? "true" : "false");
  botao.classList.toggle("ativo", ativa);
}

function criarDica() {
  dica = document.createElement("div");
  dica.id = "tooltip-traducao";
  dica.className = "tooltip-traducao";
  dica.setAttribute("aria-hidden", "true");
  document.body.appendChild(dica);
}

function ocultarDica() {
  if (dica)
    dica.style.display = "none";
}

// Mostra a dica perto do ponteiro, mudando de lado quando não cabe na janela.
function exibirDica(texto, x, y) {
  if (dica.textContent !== texto)
    dica.textContent = texto;

  // no canto (0, 0) a caixa tem a largura natural, sem espremer o texto
  dica.style.left = "0px";
  dica.style.top = "0px";
  dica.style.display = "block";

  const largura = document.documentElement.clientWidth;
  const altura = document.documentElement.clientHeight;
  let esquerda = x + AFASTAMENTO;
  let topo = y + AFASTAMENTO;

  if (esquerda + dica.offsetWidth > largura - MARGEM)
    esquerda = x - AFASTAMENTO - dica.offsetWidth;

  if (topo + dica.offsetHeight > altura - MARGEM)
    topo = y - AFASTAMENTO - dica.offsetHeight;

  dica.style.left = Math.max(MARGEM, esquerda) + "px";
  dica.style.top = Math.max(MARGEM, topo) + "px";
}

function aoMoverPonteiro(evento) {
  if (!ativa || evento.pointerType === "touch")
    return;

  // arrastando para selecionar texto, a dica só atrapalharia
  if (evento.buttons) {
    ocultarDica();
    return;
  }

  const posicao = editor.coordsChar(
    { left: evento.clientX, top: evento.clientY },
    "window",
  );

  // ponteiro fora das linhas, por exemplo abaixo da última
  if (posicao.outside) {
    ocultarDica();
    return;
  }

  const traducao = traduzirLinhaCodigo(
    editor.getLine(posicao.line),
    obterIdioma(),
  );

  if (!traducao) {
    ocultarDica();
    return;
  }

  exibirDica(traducao, evento.clientX, evento.clientY);
}

export function alternarTraducaoCodigo() {
  ativa = !ativa;
  salvarPreferencia();
  atualizarBotao();

  if (!ativa)
    ocultarDica();
}

export function iniciarTraducaoCodigo() {
  if (dica)
    return;

  criarDica();
  atualizarBotao();

  const area = editor.getWrapperElement();

  area.addEventListener("pointermove", aoMoverPonteiro);
  area.addEventListener("pointerleave", ocultarDica);
  editor.on("change", ocultarDica);
  window.addEventListener("blur", ocultarDica);
  window.addEventListener("resize", ocultarDica);

  // rolar o editor ou a página muda a linha sob o ponteiro parado
  window.addEventListener("scroll", ocultarDica, {
    passive: true,
    capture: true,
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape")
      ocultarDica();
  });
}
