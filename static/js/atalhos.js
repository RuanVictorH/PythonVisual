// Regras dos atalhos de teclado do visualizador, sem DOM: dados o evento e o
// contexto do foco, diz qual ação executar (ou null). A ligação com a página
// fica em app.js.
//
// evento: key, code, ctrlKey, altKey, metaKey, shiftKey e repeat do
// KeyboardEvent.
//
// contexto:
//   telaCheia     o fluxograma está em tela cheia (só ele está à vista)
//   campoDeTexto  foco no editor, na área do diagrama ou num campo editável
//   campoNativo   foco em INPUT, TEXTAREA, SELECT ou elemento editável
//   noEditor      foco dentro do editor de código
//   ativavel      foco em botão ou link (o Espaço é deles)
//
// Ações: executar, limpar, traduzir, proximo, anterior, primeiro, ultimo,
// sairTelaCheia e focarEditor.
const NAVEGACAO = new Map([
  [" ", "proximo"],
  ["ArrowRight", "proximo"],
  ["ArrowLeft", "anterior"],
  ["Home", "primeiro"],
  ["End", "ultimo"],
]);

function ehCtrlDelete(evento) {
  return (
    evento.key === "Delete" &&
    evento.ctrlKey &&
    !evento.shiftKey &&
    !evento.altKey &&
    !evento.metaKey
  );
}

// O `code` cobre os sistemas em que o Alt muda a letra digitada (Option+T no
// Mac gera "†").
function ehAltT(evento) {
  const ehT = evento.code === "KeyT" || evento.key.toLowerCase() === "t";

  return (
    ehT &&
    evento.altKey &&
    !evento.ctrlKey &&
    !evento.metaKey &&
    !evento.shiftKey
  );
}

// Na tela cheia só o fluxograma está à vista: o Espaço, as setas, o Home e o
// End navegam pelos passos mesmo com o foco na área do diagrama, que sem isso
// rolaria. Campos e listas ficam com as próprias teclas, e o Espaço é dos
// botões.
function navegarNaTelaCheia(tecla, contexto) {
  if (contexto.campoNativo)
    return null;

  if (tecla === " " && contexto.ativavel)
    return null;

  return NAVEGACAO.get(tecla) || null;
}

export function acaoDoAtalho(evento, contexto) {
  const tecla = evento.key;
  const comCtrl = evento.ctrlKey || evento.metaKey;
  const comModificador = evento.altKey || comCtrl;

  // em tela cheia só o fluxograma está à vista: executar, limpar e traduzir
  // agiriam às cegas
  if (!contexto.telaCheia && comCtrl && tecla === "Enter")
    return "executar";

  if (tecla === "Escape")
    return contexto.telaCheia ? "sairTelaCheia" : "focarEditor";

  // limpar e traduzir não se repetem ao segurar a tecla
  if (!contexto.telaCheia && !evento.repeat) {
    const foraDeCampoNativo = contexto.noEditor || !contexto.campoNativo;

    if (ehCtrlDelete(evento) && foraDeCampoNativo)
      return "limpar";

    if (ehAltT(evento))
      return "traduzir";
  }

  if (contexto.telaCheia && !comModificador) {
    const acao = navegarNaTelaCheia(tecla, contexto);

    if (acao)
      return acao;
  }

  if (contexto.campoDeTexto || comModificador)
    return null;

  if (tecla === " " && contexto.ativavel)
    return null;

  if (NAVEGACAO.has(tecla))
    return NAVEGACAO.get(tecla);

  if (!contexto.telaCheia) {
    const minuscula = tecla.toLowerCase();

    if (minuscula === "r")
      return "executar";

    if (minuscula === "c")
      return "limpar";
  }

  return null;
}
