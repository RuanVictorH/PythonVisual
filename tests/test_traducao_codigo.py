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
    ('x = "a is not b"  # for x in y', 'x recebe "a is not b"  # for x in y'),
    ('print("round(x) max(y) not in")', 'escreva("round(x) max(y) not in")'),
    ('notas.append("a, b")', 'adicione "a, b" ao fim de notas'),
    ('assert x, "if for in is"', 'garanta que x (se falhar, mostre "if for in is")'),
    ('print("a;b"); x = 1', 'escreva("a;b"); x recebe 1'),
]

# Funções do Python que têm tradução. O round é a sugestão do orientador.
CASOS_FUNCOES = [
    ('print("Total:", round(total, 2))', 'escreva("Total:", arredonda(total, 2))'),
    (
        "media = round(soma / len(notas), 2)",
        "media recebe arredonda(soma / tamanho(notas), 2)",
    ),
    ("x = round(y)", "x recebe arredonda(y)"),
    ("m = max(a, b) + min(a, b)", "m recebe maior(a, b) + menor(a, b)"),
    ("s = sum(notas)", "s recebe soma(notas)"),
    ("v = abs(x)", "v recebe absoluto(x)"),
    (
        "o = sorted(lista, reverse=True)",
        "o recebe ordenado(lista, reverse=Verdadeiro)",
    ),
    ("r = reversed(lista)", "r recebe invertido(lista)"),
    ("a = list(x)", "a recebe lista(x)"),
    ("a = tuple(x)", "a recebe tupla(x)"),
    ("a = dict(x)", "a recebe dicionário(x)"),
    ("a = set(x)", "a recebe conjunto(x)"),
    ("a = bool(x)", "a recebe lógico(x)"),
    ("a = type(x)", "a recebe tipo(x)"),
    ("a = pow(x, 2)", "a recebe potência(x, 2)"),
    ("for i, v in enumerate(lista):", "para i, v em enumera(lista) faça"),
    ("for a, b in zip(x, y):", "para a, b em combina(x, y) faça"),
    ("sorted(lista)", "ordenado(lista)"),
    # sem "(" ou depois de um ponto, o nome fica como está
    ("f = round", "f recebe round"),
    ("x = obj.round(2)", "x recebe obj.round(2)"),
    ("y = sorted(lista, key=len)", "y recebe ordenado(lista, key=len)"),
]

# Palavras que mudam conforme o lugar e leituras que saíam erradas.
CASOS_LEITURAS = [
    ("if x not in lista:", "se x não está em lista então"),
    ("if nome in alunos:", "se nome está em alunos então"),
    ("while x in lista:", "enquanto x está em lista faça"),
    ("numero in lista", "numero está em lista"),
    ("if x is None:", "se x é Nulo então"),
    ("if x is not None:", "se x não é Nulo então"),
    ("if a is  not b:", "se a não é b então"),
    ("if not a is b:", "se não a é b então"),
    ("x = isnot", "x recebe isnot"),
    ("for c in 'abc': print(c)", "para c em 'abc' faça escreva(c)"),
    (
        "x = [i for i in range(5) if i % 2 == 0]",
        "x recebe [i para i em intervalo(5) se i % 2 == 0]",
    ),
    (
        'x = [c for c in "abc" if c in vogais]',
        'x recebe [c para c em "abc" se c está em vogais]',
    ),
    (
        "x = [a for a in b for c in d if a in c]",
        "x recebe [a para a em b para c em d se a está em c]",
    ),
    ("d = {k: v for k, v in itens}", "d recebe {k: v para k, v em itens}"),
    ("total = sum(x for x in lista)", "total recebe soma(x para x em lista)"),
    ("x = a if b else c", "x recebe a se b senão c"),
    ("return x if y else z", "retorne x se y senão z"),
    (
        'print("a") if x else print("b")',
        'escreva("a") se x senão escreva("b")',
    ),
    ("f = lambda x: x + 1", "f recebe função anônima x: x + 1"),
    ("g = lambda a=1: a", "g recebe função anônima a=1: a"),
    ("x = y = 0", "x e y recebem 0"),
    ("a = b = c = 0", "a, b e c recebem 0"),
    ("self.x = self.y = 0", "self.x e self.y recebem 0"),
    ("a[0] = b[0] = 1", "a[0] e b[0] recebem 1"),
    ("x = y == z", "x recebe y == z"),
    ("a = 1; b = 2", "a recebe 1; b recebe 2"),
    ("if x: a = 1; b = 2", "se x então a recebe 1; b recebe 2"),
    (
        "for i in range(3): print(i); print(i * 2)",
        "para i em intervalo(3) faça escreva(i); escreva(i * 2)",
    ),
    (
        'raise ValueError("x") from erro',
        'gere o erro ValueError("x"), causado por erro',
    ),
    (
        "from math import sqrt as raiz",
        "importe sqrt com o nome raiz do módulo math",
    ),
    ("from a import b, c as d", "importe b, c com o nome d do módulo a"),
    ("import os, sys", "importe os módulos os, sys"),
    (
        "import numpy as np, pandas as pd",
        "importe os módulos numpy com o nome np, pandas com o nome pd",
    ),
]

# Instruções que antes ficavam sem dica.
CASOS_INSTRUCOES_NOVAS = [
    ('with open("a.txt") as f:', 'usando open("a.txt") como f faça'),
    ("with a as x, b as y:", "usando a como x, b como y faça"),
    ("with lock:", "usando lock faça"),
    ("assert x > 0", "garanta que x > 0"),
    ('assert x > 0, "negativo"', 'garanta que x > 0 (se falhar, mostre "negativo")'),
    (
        "assert f(a, b), 'erro'",
        "garanta que f(a, b) (se falhar, mostre 'erro')",
    ),
    ("del x", "apague x"),
    ("del lista[0]", "apague lista[0]"),
    ("global total", "declare total como global"),
    ("nonlocal a, b", "declare a, b como variável da função externa"),
    ("yield x", "entregue x"),
    ("yield", "entregue"),
    ("@staticmethod", "aplique o decorador staticmethod"),
    ('@app.route("/")', 'aplique o decorador app.route("/")'),
    ("class Aluno(Pessoa):", "defina a classe Aluno, que herda de Pessoa"),
    ("class A(B, C):", "defina a classe A, que herda de B, C"),
    ("class A():", "defina a classe A()"),
    # nomes que só começam com o texto de uma instrução
    ("global_total = 0", "global_total recebe 0"),
    ("yield_valor = 1", "yield_valor recebe 1"),
    ("del_item = 3", "del_item recebe 3"),
    ("with_x = 1", "with_x recebe 1"),
]

# Linhas que são só uma chamada: métodos conhecidos e "chame ...".
CASOS_CHAMADAS = [
    ("notas.append(5.5)", "adicione 5.5 ao fim de notas"),
    ("self.itens.append(item)", "adicione item ao fim de self.itens"),
    ("lista.append(round(x, 2))", "adicione arredonda(x, 2) ao fim de lista"),
    ("notas.extend([1, 2])", "adicione os itens de [1, 2] ao fim de notas"),
    ("notas.insert(0, 9)", "insira 9 em notas na posição 0"),
    ("notas.remove(7)", "remova 7 de notas"),
    ("notas.pop()", "remova o último item de notas"),
    ("notas.pop(2)", "remova o item da posição 2 de notas"),
    ("notas.sort()", "ordene notas"),
    ("notas.reverse()", "inverta a ordem de notas"),
    ("notas.clear()", "esvazie notas"),
    ('alunos.update({"Ana": 8})', 'atualize alunos com {"Ana": 8}'),
    ("d.update(a=1)", "atualize d com a=1"),
    ("lista.append(x); lista.sort()", "adicione x ao fim de lista; ordene lista"),
    ("exibir_retangulo(largura, comprimento)", "chame exibir_retangulo(largura, comprimento)"),
    ("main()", "chame main()"),
    ("conta.depositar(50)", "chame conta.depositar(50)"),
    ("conta.exibir_saldo()", "chame conta.exibir_saldo()"),
    ("calcular(len(x), round(y, 1))", "chame calcular(tamanho(x), arredonda(y, 1))"),
    ('registrar("a, b", 1)', 'chame registrar("a, b", 1)'),
    ("chamar(a=1)", "chame chamar(a=1)"),
    ("obj.input('a')", "chame obj.input('a')"),
    ("obj.print(1)", "chame obj.print(1)"),
    # método conhecido com argumento nomeado ou com outra quantidade de argumentos
    ("notas.sort(reverse=True)", "chame notas.sort(reverse=Verdadeiro)"),
    ("notas.append(1, 2)", "chame notas.append(1, 2)"),
    ("notas.insert(1)", "chame notas.insert(1)"),
    # print e input seguem pela troca de palavras, e não por "chame"
    ("print(x)", "escreva(x)"),
    ("input()", "leia()"),
    ("print(x); y.append(1)", "escreva(x); adicione 1 ao fim de y"),
]

# Linhas em que não há o que mostrar na dica.
CASOS_SEM_TRADUCAO = [
    "",
    "   ",
    "#",
    '    "Ana": 8.5,',
    "}",
    "x =",
    "if :",
    "import",
    "flags |= 1",
    # chamadas encadeadas ou incompletas, e expressões soltas
    "a.b().c()",
    "obj.metodo(a)(b)",
    "foo(a, ",
    "(a + b)",
    "lista[0]",
    "x",
    # palavra de instrução sem o resto
    "@",
    "del",
    "assert",
    "global",
    "with:",
    "yield from x",
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

# As palavras seguem em inglês; mudam as instruções, as cadeias e as chamadas.
CASOS_INGLES_NOVOS = [
    ("if x not in lista:", "if x not in lista then"),
    ("x = y = 0", "x and y receive 0"),
    ("a = b = c = 0", "a, b and c receive 0"),
    ("a = 1; b = 2", "a receives 1; b receives 2"),
    ('with open("a.txt") as f:', 'with open("a.txt") as f do'),
    ("assert x > 0", "make sure that x > 0"),
    ('assert x > 0, "msg"', 'make sure that x > 0 (if it fails, show "msg")'),
    ("del x", "delete x"),
    ("global total", "declare total as global"),
    ("nonlocal a", "declare a as a variable of the outer function"),
    ("@staticmethod", "apply the decorator staticmethod"),
    ("class A(B):", "define the class A, which inherits from B"),
    (
        'raise ValueError("x") from e',
        'raise the error ValueError("x"), caused by e',
    ),
    ("import os, sys", "import the modules os, sys"),
    ("from a import b as c", "import b as c from the module a"),
    ("notas.append(5.5)", "add 5.5 to the end of notas"),
    ("notas.extend(x)", "add the items of x to the end of notas"),
    ("notas.insert(0, 9)", "insert 9 into notas at position 0"),
    ("notas.remove(7)", "remove 7 from notas"),
    ("notas.pop()", "remove the last item of notas"),
    ("notas.pop(2)", "remove the item at position 2 of notas"),
    ("notas.sort()", "sort notas"),
    ("notas.reverse()", "reverse the order of notas"),
    ("notas.clear()", "empty notas"),
    ("d.update(x)", "update d with x"),
    ("exibir(a, b)", "call exibir(a, b)"),
    ("conta.depositar(50)", "call conta.depositar(50)"),
]

CASOS_INGLES_SEM_TRADUCAO = [
    'print("hello")',
    "return x",
    "try:",
    "yield x",
    "print(round(total, 2))",
    "sorted(lista)",
    "input()",
]


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

    def test_funcoes(self):
        self.conferir(CASOS_FUNCOES)

    def test_round_vira_arredonda(self):
        # sugestão do orientador
        self.conferir(
            [
                ("round(x)", "arredonda(x)"),
                ("y = round(x, 2)", "y recebe arredonda(x, 2)"),
                (
                    'print("Média:", round(media, 2))',
                    'escreva("Média:", arredonda(media, 2))',
                ),
            ]
        )

    def test_leituras_corrigidas(self):
        self.conferir(CASOS_LEITURAS)

    def test_instrucoes_novas(self):
        self.conferir(CASOS_INSTRUCOES_NOVAS)

    def test_chamadas(self):
        self.conferir(CASOS_CHAMADAS)

    def test_ingles_novos(self):
        self.conferir(CASOS_INGLES_NOVOS, "en")

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
