import json
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
MODULO = RAIZ / "static" / "js" / "traducao-codigo.js"
EXEMPLOS = RAIZ / "static" / "data" / "exemplos.json"

TEXTOS_ENTRE_ASPAS = re.compile(r'"[^"]*"|\'[^\']*\'')

# Lê pares [linha, idioma] da entrada padrão e escreve as traduções em JSON.
SCRIPT_NODE = """
import { traduzirLinhaCodigo } from "./traducao-codigo.mjs";

let entrada = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (pedaco) => {
  entrada += pedaco;
});
process.stdin.on("end", () => {
  const pares = JSON.parse(entrada);
  const saida = pares.map(([linha, idioma]) =>
    traduzirLinhaCodigo(linha, idioma),
  );

  process.stdout.write(JSON.stringify(saida));
});
"""

# Linhas do protótipo enviado pelo usuário e o que ele mostra para cada uma.
CASOS_PROTOTIPO = [
    ('idade = int(input("Idade: "))', 'idade recebe inteiro(leia("Idade: "))'),
    ("if idade >= 18:", "se idade >= 18 então"),
    ('    print("Adulto")', 'escreva("Adulto")'),
    ("else:", "senão"),
    ('    print("Menor")', 'escreva("Menor")'),
    ("for i in range(5):", "para i em intervalo(5) faça"),
    ("    print(i)", "escreva(i)"),
    ('print("Fim")', 'escreva("Fim")'),
    ("elif nota >= 7 and faltas < 5:", "senão se nota >= 7 e faltas < 5 então"),
    ("while True:", "enquanto Verdadeiro faça"),
    ("def soma(a, b):", "defina a função soma(a, b)"),
    ("return a + b", "retorne a + b"),
    ("return", "retorne"),
    ("break", "interrompa o laço"),
    ("continue", "vá para a próxima repetição"),
    ("# soma dos valores", "comentário: soma dos valores"),
]

CASOS_ESTRUTURAS = [
    ("class Conta:", "defina a classe Conta"),
    ("pass", "não faça nada"),
    ("try:", "tente"),
    ("except ValueError:", "se ocorrer o erro ValueError"),
    (
        "except Exception as erro:",
        "se ocorrer o erro Exception (guardado em erro)",
    ),
    ("except:", "se ocorrer qualquer erro"),
    ("finally:", "ao final, de qualquer forma"),
    ('raise ValueError("x")', 'gere o erro ValueError("x")'),
    ("raise", "propague o erro"),
    ("import math", "importe o módulo math"),
    ("import numpy as np", "importe o módulo numpy com o nome np"),
    ("from math import sqrt", "importe sqrt do módulo math"),
    ("from math import *", "importe tudo do módulo math"),
    ("if x: print(1)", "se x então escreva(1)"),
    ("else: x = 2", "senão x recebe 2"),
]

CASOS_ATRIBUICAO = [
    ("total += valor", "total aumenta em valor"),
    ("saldo -= 10", "saldo diminui em 10"),
    ("x *= 2", "x é multiplicado por 2"),
    ("x /= 2", "x é dividido por 2"),
    ("x //= 2", "x é dividido por 2 (divisão inteira)"),
    ("x %= 3", "x recebe o resto da divisão de x por 3"),
    ("x **= 2", "x é elevado a 2"),
    ("x = a == b", "x recebe a == b"),
    ("ok = not (a or b)", "ok recebe não (a ou b)"),
    (
        "lista[j], lista[j + 1] = lista[j + 1], lista[j]",
        "lista[j], lista[j + 1] recebe lista[j + 1], lista[j]",
    ),
    ("x = 5  # valor inicial", "x recebe 5  # valor inicial"),
    ("constructor = toString", "constructor recebe toString"),
]

# Palavras dentro de textos entre aspas e de comentários não são trocadas.
CASOS_TEXTOS = [
    (
        'print("Digite in or and not True None")',
        'escreva("Digite in or and not True None")',
    ),
    ('print("Name not found")', 'escreva("Name not found")'),
    ("x = 'a # b'  # c", "x recebe 'a # b'  # c"),
    ('print(f"{a} in {b}")', 'escreva(f"{a} in {b}")'),
    (
        'print("fib(" + str(i) + ") =", fibonacci(i))',
        'escreva("fib(" + texto(i) + ") =", fibonacci(i))',
    ),
    ("x = 'it\\'s' and y", "x recebe 'it\\'s' e y"),
]

# Linhas em que não há o que mostrar na dica.
CASOS_SEM_TRADUCAO = [
    "",
    "   ",
    "#",
    "conta.depositar(50)",
    "notas.append(5.5)",
    "chamar(a=1)",
    "obj.input('a')",
    '    "Ana": 8.5,',
    "}",
    "x =",
    "if :",
    "import",
    "flags |= 1",
]

CASOS_INGLES = [
    ("if idade >= 18:", "if idade >= 18 then"),
    ("elif x:", "otherwise, if x then"),
    ("else:", "otherwise"),
    ("for i in range(5):", "for i in range(5) do"),
    ("while ok:", "while ok do"),
    ("def soma(a):", "define the function soma(a)"),
    ("x = 5", "x receives 5"),
    ("x += 1", "x increases by 1"),
    ("break", "stop the loop"),
    ("# note", "comment: note"),
    (
        "except ValueError as e:",
        "if the error ValueError happens (saved as e)",
    ),
    ("import math", "import the module math"),
]

CASOS_INGLES_SEM_TRADUCAO = ['print("hello")', "return x", "try:"]


@unittest.skipUnless(shutil.which("node"), "Node.js não está instalado")
class TestTraducaoCodigo(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pasta = tempfile.TemporaryDirectory()
        pasta = Path(cls.pasta.name)
        shutil.copy(MODULO, pasta / "traducao-codigo.mjs")
        (pasta / "rodar.mjs").write_text(SCRIPT_NODE, encoding="utf-8")

    @classmethod
    def tearDownClass(cls):
        cls.pasta.cleanup()

    def traduzir(self, pares):
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

    def conferir(self, casos, idioma="pt"):
        obtidos = self.traduzir([[linha, idioma] for linha, _ in casos])

        for (linha, esperado), obtido in zip(casos, obtidos):
            with self.subTest(linha=linha, idioma=idioma):
                self.assertEqual(obtido, esperado)

    def test_linhas_do_prototipo(self):
        self.conferir(CASOS_PROTOTIPO)

    def test_estruturas_alem_do_prototipo(self):
        self.conferir(CASOS_ESTRUTURAS)

    def test_atribuicoes(self):
        self.conferir(CASOS_ATRIBUICAO)

    def test_textos_e_comentarios_nao_sao_traduzidos(self):
        self.conferir(CASOS_TEXTOS)

    def test_linhas_sem_o_que_traduzir(self):
        casos = [(linha, "") for linha in CASOS_SEM_TRADUCAO]
        self.conferir(casos)

    def test_ingles(self):
        self.conferir(CASOS_INGLES, "en")

    def test_ingles_sem_o_que_traduzir(self):
        casos = [(linha, "") for linha in CASOS_INGLES_SEM_TRADUCAO]
        self.conferir(casos, "en")

    def test_idioma_desconhecido_usa_portugues(self):
        self.conferir([("else:", "senão")], "xx")

    def test_exemplos_oficiais(self):
        exemplos = json.loads(EXEMPLOS.read_text(encoding="utf-8"))
        linhas = [
            linha
            for codigo in exemplos.values()
            for linha in codigo.splitlines()
        ]

        for idioma in ("pt", "en"):
            traducoes = self.traduzir([[linha, idioma] for linha in linhas])
            self.assertTrue(any(traducoes), idioma)

            for linha, traducao in zip(linhas, traducoes):
                with self.subTest(linha=linha, idioma=idioma):
                    self.assertIsInstance(traducao, str)
                    self.assertNotIn("undefined", traducao)

                    if not traducao:
                        continue

                    for texto in TEXTOS_ENTRE_ASPAS.findall(linha):
                        self.assertIn(texto, traducao)


if __name__ == "__main__":
    unittest.main()
