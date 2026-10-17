// Regra da saída do editor pelo teclado, sem DOM. No editor o Tab recua o
// código, então quem usa só o teclado ficaria preso nele. O Esc seguido de Tab
// (ou de Shift+Tab) devolve a tecla ao navegador, que move o foco; qualquer
// outra tecla desfaz o Esc. A ligação com o CodeMirror fica em editor.js.
const TECLAS_DE_MODIFICADOR = new Set(["Shift", "Control", "Alt", "Meta"]);

function semCtrlAltMeta(evento) {
  return !evento.ctrlKey && !evento.altKey && !evento.metaKey;
}

export function criarSaidaDoEditor() {
  let escPressionado = false;

  return {
    // Diz se a tecla deve ir ao navegador em vez de ao editor. Chamar a cada
    // keydown, na ordem em que as teclas chegam.
    liberaTecla(evento) {
      // o Shift do Shift+Tab chega antes do Tab e não desfaz o Esc
      if (TECLAS_DE_MODIFICADOR.has(evento.key))
        return false;

      const vinhaDoEsc = escPressionado;
      const atalhoLivre = semCtrlAltMeta(evento);

      escPressionado = evento.key === "Escape" && atalhoLivre;

      return vinhaDoEsc && evento.key === "Tab" && atalhoLivre;
    },

    reiniciar() {
      escPressionado = false;
    },
  };
}
