import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
MODULO = RAIZ / "static" / "js" / "atalhos.js"

# Lê pares [evento, contexto] da entrada padrão e escreve as ações em JSON.
SCRIPT_NODE = """
import { acaoDoAtalho } from "./atalhos.mjs";

let entrada = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (pedaco) => {
  entrada += pedaco;
});
process.stdin.on("end", () => {
  const pares = JSON.parse(entrada);
  const saida = pares.map(([evento, contexto]) =>
    acaoDoAtalho(evento, contexto),
  );

  process.stdout.write(JSON.stringify(saida));
});
"""

# Onde está o foco, no contexto que o app.js monta.
EDITOR = {"campoDeTexto": True, "campoNativo": True, "noEditor": True}
CAMPO = {"campoDeTexto": True, "campoNativo": True}
DIAGRAMA = {"campoDeTexto": True}
BOTAO = {"ativavel": True}

TELA_CHEIA = {"telaCheia": True}
TELA_CHEIA_DIAGRAMA = {**TELA_CHEIA, **DIAGRAMA}
TELA_CHEIA_BOTAO = {**TELA_CHEIA, **BOTAO}
TELA_CHEIA_CAMPO = {**TELA_CHEIA, **CAMPO}


def caso(descricao, esperado, tecla, foco=None, **extra):
    evento = {
        "key": tecla,
        "code": "",
        "ctrlKey": False,
        "altKey": False,
        "metaKey": False,
        "shiftKey": False,
        "repeat": False,
        **extra,
    }
    contexto = {
        "telaCheia": False,
        "campoDeTexto": False,
        "campoNativo": False,
        "noEditor": False,
        "ativavel": False,
        **(foco or {}),
    }

    return descricao, evento, contexto, esperado


# Atalhos que já existiam: não podem mudar.
CASOS_ANTIGOS = [
    caso("→ fora de campo avança", "proximo", "ArrowRight"),
    caso("Espaço fora de campo avança", "proximo", " "),
    caso("← volta", "anterior", "ArrowLeft"),
    caso("Home vai ao início", "primeiro", "Home"),
    caso("End vai ao fim", "ultimo", "End"),
    caso("→ com o foco num botão avança", "proximo", "ArrowRight", BOTAO),
    caso("Espaço num botão é do botão", None, " ", BOTAO),
    caso("→ no editor é do editor", None, "ArrowRight", EDITOR),
    caso("Home no editor é do editor", None, "Home", EDITOR),
    caso("Espaço no editor é do editor", None, " ", EDITOR),
    caso("→ num campo é do campo", None, "ArrowRight", CAMPO),
    caso("→ na área do diagrama rola o diagrama", None, "ArrowRight", DIAGRAMA),
    caso("R executa", "executar", "r"),
    caso("R maiúsculo executa", "executar", "R", shiftKey=True),
    caso("C limpa", "limpar", "c"),
    caso("R digitando no editor não executa", None, "r", EDITOR),
    caso("C no campo de entrada não limpa", None, "c", CAMPO),
    caso(
        "Ctrl+Enter executa fora do editor", "executar", "Enter", ctrlKey=True
    ),
    caso(
        "Ctrl+Enter executa no editor",
        "executar",
        "Enter",
        EDITOR,
        ctrlKey=True,
    ),
    caso("Cmd+Enter executa", "executar", "Enter", metaKey=True),
    caso("Enter sozinho não faz nada", None, "Enter"),
    caso("Esc foca o editor", "focarEditor", "Escape"),
    caso("Esc no editor foca o editor", "focarEditor", "Escape", EDITOR),
    caso("Ctrl+→ não navega", None, "ArrowRight", ctrlKey=True),
    caso("Alt+← não navega", None, "ArrowLeft", altKey=True),
    caso("Ctrl+R não executa (recarregar)", None, "r", ctrlKey=True),
    caso("Ctrl+C não limpa (copiar)", None, "c", ctrlKey=True),
    caso("outras teclas não fazem nada", None, "x"),
]

CASOS_TELA_CHEIA = [
    caso("Esc sai da tela cheia", "sairTelaCheia", "Escape", TELA_CHEIA),
    caso("Ctrl+Enter não executa", None, "Enter", TELA_CHEIA, ctrlKey=True),
    caso("R não executa", None, "r", TELA_CHEIA),
    caso("C não limpa", None, "c", TELA_CHEIA),
    caso("Espaço avança", "proximo", " ", TELA_CHEIA),
    caso("→ avança", "proximo", "ArrowRight", TELA_CHEIA),
    caso("← volta", "anterior", "ArrowLeft", TELA_CHEIA),
    caso("Home vai ao início", "primeiro", "Home", TELA_CHEIA),
    caso("End vai ao fim", "ultimo", "End", TELA_CHEIA),
    caso(
        "Espaço avança na área do diagrama", "proximo", " ", TELA_CHEIA_DIAGRAMA
    ),
    caso(
        "→ avança na área do diagrama",
        "proximo",
        "ArrowRight",
        TELA_CHEIA_DIAGRAMA,
    ),
    caso(
        "← volta na área do diagrama",
        "anterior",
        "ArrowLeft",
        TELA_CHEIA_DIAGRAMA,
    ),
    caso(
        "Home vai ao início na área do diagrama",
        "primeiro",
        "Home",
        TELA_CHEIA_DIAGRAMA,
    ),
    caso(
        "End vai ao fim na área do diagrama",
        "ultimo",
        "End",
        TELA_CHEIA_DIAGRAMA,
    ),
    caso(
        "→ avança com o foco num botão",
        "proximo",
        "ArrowRight",
        TELA_CHEIA_BOTAO,
    ),
    caso(
        "Home vai ao início com o foco num botão",
        "primeiro",
        "Home",
        TELA_CHEIA_BOTAO,
    ),
    caso("Espaço num botão é do botão", None, " ", TELA_CHEIA_BOTAO),
    caso("Espaço numa lista de opções é da lista", None, " ", TELA_CHEIA_CAMPO),
    caso(
        "→ numa lista de opções é da lista",
        None,
        "ArrowRight",
        TELA_CHEIA_CAMPO,
    ),
    caso("Home num campo é do campo", None, "Home", TELA_CHEIA_CAMPO),
    caso("Ctrl+→ não navega", None, "ArrowRight", TELA_CHEIA, ctrlKey=True),
    caso("Alt+Home não navega", None, "Home", TELA_CHEIA, altKey=True),
    caso("Cmd+← não navega", None, "ArrowLeft", TELA_CHEIA, metaKey=True),
    caso("↓ rola o diagrama", None, "ArrowDown", TELA_CHEIA_DIAGRAMA),
    caso("Page Down rola o diagrama", None, "PageDown", TELA_CHEIA_DIAGRAMA),
]

CASOS_CTRL_DELETE = [
    caso(
        "limpa com o foco no editor", "limpar", "Delete", EDITOR, ctrlKey=True
    ),
    caso("limpa fora de campos", "limpar", "Delete", ctrlKey=True),
    caso(
        "limpa com o foco na área do diagrama",
        "limpar",
        "Delete",
        DIAGRAMA,
        ctrlKey=True,
    ),
    caso("limpa com o foco num botão", "limpar", "Delete", BOTAO, ctrlKey=True),
    caso(
        "no campo de entrada continua apagando a palavra",
        None,
        "Delete",
        CAMPO,
        ctrlKey=True,
    ),
    caso(
        "na tela cheia não faz nada", None, "Delete", TELA_CHEIA, ctrlKey=True
    ),
    caso("com Shift não limpa", None, "Delete", ctrlKey=True, shiftKey=True),
    caso("com Alt não limpa", None, "Delete", ctrlKey=True, altKey=True),
    caso("com Meta não limpa", None, "Delete", metaKey=True),
    caso("Delete sozinho não limpa", None, "Delete"),
    caso(
        "segurar a tecla não repete", None, "Delete", ctrlKey=True, repeat=True
    ),
]

CASOS_ALT_T = [
    caso("traduz fora de campos", "traduzir", "t", code="KeyT", altKey=True),
    caso(
        "traduz com o foco no editor",
        "traduzir",
        "t",
        EDITOR,
        code="KeyT",
        altKey=True,
    ),
    caso(
        "traduz com o foco no campo de entrada",
        "traduzir",
        "t",
        CAMPO,
        code="KeyT",
        altKey=True,
    ),
    caso(
        "traduz com o foco num botão",
        "traduzir",
        "t",
        BOTAO,
        code="KeyT",
        altKey=True,
    ),
    caso(
        "traduz quando o Alt muda a letra (Option+T no Mac)",
        "traduzir",
        "†",
        code="KeyT",
        altKey=True,
    ),
    caso(
        "na tela cheia não faz nada",
        None,
        "t",
        TELA_CHEIA,
        code="KeyT",
        altKey=True,
    ),
    caso(
        "com Ctrl (AltGr) não traduz",
        None,
        "t",
        code="KeyT",
        altKey=True,
        ctrlKey=True,
    ),
    caso(
        "com Shift não traduz",
        None,
        "T",
        code="KeyT",
        altKey=True,
        shiftKey=True,
    ),
    caso(
        "com Meta não traduz", None, "t", code="KeyT", altKey=True, metaKey=True
    ),
    caso(
        "segurar a tecla não repete",
        None,
        "t",
        code="KeyT",
        altKey=True,
        repeat=True,
    ),
    caso("T sozinho não traduz", None, "t", code="KeyT"),
    caso(
        "T maiúsculo sozinho não traduz", None, "T", code="KeyT", shiftKey=True
    ),
    caso("Ctrl+T não traduz", None, "t", code="KeyT", ctrlKey=True),
]


@unittest.skipUnless(shutil.which("node"), "Node.js não está instalado")
class TestAtalhos(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pasta = tempfile.TemporaryDirectory()
        pasta = Path(cls.pasta.name)
        shutil.copy(MODULO, pasta / "atalhos.mjs")
        (pasta / "rodar.mjs").write_text(SCRIPT_NODE, encoding="utf-8")

    @classmethod
    def tearDownClass(cls):
        cls.pasta.cleanup()

    def decidir(self, casos):
        pares = [[evento, contexto] for _, evento, contexto, _ in casos]
        resultado = subprocess.run(
            ["node", "rodar.mjs"],
            input=json.dumps(pares),
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=self.pasta.name,
            timeout=60,
        )

        self.assertEqual(resultado.returncode, 0, resultado.stderr)

        return json.loads(resultado.stdout)

    def conferir(self, casos):
        obtidas = self.decidir(casos)

        for (descricao, _, _, esperada), obtida in zip(casos, obtidas):
            with self.subTest(descricao):
                self.assertEqual(obtida, esperada)

    def test_atalhos_que_ja_existiam(self):
        self.conferir(CASOS_ANTIGOS)

    def test_tela_cheia(self):
        self.conferir(CASOS_TELA_CHEIA)

    def test_ctrl_delete_limpa(self):
        self.conferir(CASOS_CTRL_DELETE)

    def test_alt_t_traduz(self):
        self.conferir(CASOS_ALT_T)


if __name__ == "__main__":
    unittest.main()
