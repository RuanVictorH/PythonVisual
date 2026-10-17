import { criarSaidaDoEditor } from "./saida-do-editor.js";

export const editor = CodeMirror.fromTextArea(document.getElementById("codigo"), {
  mode: "python",
  theme: "default",
  lineNumbers: true,
  gutters: ["exec-gutter", "CodeMirror-linenumbers"],
  indentUnit: 4,
  indentWithTabs: false,
  lineWrapping: true,
  placeholder: "",
  autofocus: true,
});
editor.setValue("");

// O Tab recua o código; o Esc seguido de Tab devolve o foco ao navegador
// (codemirrorIgnore, tudo em minúsculas: o CodeMirror não trata a tecla nem
// cancela o padrão do navegador).
const saidaDoEditor = criarSaidaDoEditor();

editor.on("keydown", (_, evento) => {
  if (saidaDoEditor.liberaTecla(evento))
    evento.codemirrorIgnore = true;
});
editor.on("blur", () => saidaDoEditor.reiniciar());
editor.on("mousedown", () => saidaDoEditor.reiniciar());

// o texto escondido de index.html avisa o gesto a quem usa leitor de tela
editor.getInputField().setAttribute("aria-describedby", "editor-dica-saida");
