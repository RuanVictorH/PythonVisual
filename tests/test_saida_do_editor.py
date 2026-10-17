import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
MODULO = RAIZ / "static" / "js" / "saida-do-editor.js"

# Lê sequências de eventos da entrada padrão, passa cada uma por um liberador
# novo e escreve, em JSON, o que cada tecla da sequência devolveu. Um passo
# "reiniciar" simula o blur ou o clique do mouse.
SCRIPT_NODE = """
import { criarSaidaDoEditor } from "./saida-do-editor.mjs";

let entrada = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (pedaco) => {
  entrada += pedaco;
});
process.stdin.on("end", () => {
  const sequencias = JSON.parse(entrada);
  const saida = sequencias.map((passos) => {
    const saidaDoEditor = criarSaidaDoEditor();

    return passos.map((passo) => {
      if (passo === "reiniciar") {
        saidaDoEditor.reiniciar();
        return null;
      }

      return saidaDoEditor.liberaTecla(passo);
    });
  });

  process.stdout.write(JSON.stringify(saida));
});
"""


def tecla(nome, **modificadores):
    return {
        "key": nome,
        "ctrlKey": False,
        "altKey": False,
        "metaKey": False,
        "shiftKey": False,
        **modificadores,
    }


ESC = tecla("Escape")
TAB = tecla("Tab")
SHIFT = tecla("Shift", shiftKey=True)
SHIFT_TAB = tecla("Tab", shiftKey=True)
LETRA = tecla("a")
REINICIAR = "reiniciar"

# (descrição, sequência de teclas, o que cada passo deve devolver)
SEQUENCIAS = [
    ("Tab sozinho continua recuando o código", [TAB], [False]),
    (
        "Shift+Tab sozinho continua recuando o código",
        [SHIFT, SHIFT_TAB],
        [False, False],
    ),
    ("Esc e depois Tab sai do editor", [ESC, TAB], [False, True]),
    (
        "Esc e depois Shift+Tab sai do editor",
        [ESC, SHIFT, SHIFT_TAB],
        [False, False, True],
    ),
    (
        "o Esc vale uma vez só: o segundo Tab volta a recuar",
        [ESC, TAB, TAB],
        [False, True, False],
    ),
    (
        "uma letra entre o Esc e o Tab desfaz o Esc",
        [ESC, LETRA, TAB],
        [False, False, False],
    ),
    ("Esc repetido continua valendo", [ESC, ESC, TAB], [False, False, True]),
    (
        "o blur ou o clique entre o Esc e o Tab desfaz o Esc",
        [ESC, REINICIAR, TAB],
        [False, None, False],
    ),
    (
        "Esc com Ctrl não conta",
        [tecla("Escape", ctrlKey=True), TAB],
        [False, False],
    ),
    (
        "Tab com Ctrl depois do Esc não é liberado",
        [ESC, tecla("Tab", ctrlKey=True)],
        [False, False],
    ),
    (
        "Tab com Alt depois do Esc não é liberado",
        [ESC, tecla("Tab", altKey=True)],
        [False, False],
    ),
    (
        "Tab com Meta depois do Esc não é liberado",
        [ESC, tecla("Tab", metaKey=True)],
        [False, False],
    ),
    (
        "o Ctrl sozinho não desfaz o Esc",
        [ESC, tecla("Control", ctrlKey=True), TAB],
        [False, False, True],
    ),
]


@unittest.skipUnless(shutil.which("node"), "Node.js não está instalado")
class TestSaidaDoEditor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pasta = tempfile.TemporaryDirectory()
        pasta = Path(cls.pasta.name)
        shutil.copy(MODULO, pasta / "saida-do-editor.mjs")
        (pasta / "rodar.mjs").write_text(SCRIPT_NODE, encoding="utf-8")

    @classmethod
    def tearDownClass(cls):
        cls.pasta.cleanup()

    def rodar(self, sequencias):
        resultado = subprocess.run(
            ["node", "rodar.mjs"],
            input=json.dumps(sequencias),
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=self.pasta.name,
            timeout=60,
        )

        self.assertEqual(resultado.returncode, 0, resultado.stderr)

        return json.loads(resultado.stdout)

    def test_sequencias_de_teclas(self):
        obtidas = self.rodar([passos for _, passos, _ in SEQUENCIAS])

        for (descricao, _, esperada), obtida in zip(SEQUENCIAS, obtidas):
            with self.subTest(descricao):
                self.assertEqual(obtida, esperada)


class TestLigacaoNoEditor(unittest.TestCase):
    """A ligação com o CodeMirror e o aviso de leitor de tela não rodam no Node."""

    def test_editor_usa_a_regra_e_descreve_o_gesto(self):
        editor = (RAIZ / "static" / "js" / "editor.js").read_text(
            encoding="utf-8"
        )

        self.assertIn('from "./saida-do-editor.js"', editor)
        # o nome da propriedade tem de ser exatamente este: com outra grafia o
        # CodeMirror a ignora e o Tab continua recuando o código
        self.assertIn("evento.codemirrorIgnore = true", editor)
        self.assertIn("editor-dica-saida", editor)

    def test_pagina_tem_o_texto_escondido_nos_dois_idiomas(self):
        pagina = (RAIZ / "templates" / "index.html").read_text(encoding="utf-8")
        i18n = (RAIZ / "static" / "js" / "i18n.js").read_text(
            encoding="utf-8"
        )

        self.assertIn('id="editor-dica-saida"', pagina)
        self.assertIn('data-i18n="editor.exitHint"', pagina)
        self.assertEqual(i18n.count('"editor.exitHint"'), 2)


if __name__ == "__main__":
    unittest.main()
