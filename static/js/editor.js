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
