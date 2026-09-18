import json
import sys
import textwrap
import unittest
from pathlib import Path

from fluxo_builder import construir_fluxo

RAIZ = Path(__file__).resolve().parent.parent
TIPOS_PERMITIDOS = {
    "processo", "entrada", "saida", "se", "elif", "para", "enquanto", "tentar",
    "tratador", "interrupcao", "retorno", "definicao", "omitido",
}


def percorrer(nos):
    for n in nos:
        yield n
        for e in n.get("elifs", []):
            yield e
            yield from percorrer(e["entao"])
        for t in n.get("tratadores", []):
            yield t
            yield from percorrer(t["corpo"])
        for chave in ("entao", "corpo", "senao", "finalmente"):
            yield from percorrer(n.get(chave, []))


def todos_os_nos(fluxo):
    for g in fluxo["graficos"]:
        yield from percorrer(g["nos"])


class TestConstruirFluxo(unittest.TestCase):
    def validar(self, fluxo, codigo, maximo=150):
        self.assertEqual(json.loads(json.dumps(fluxo)), fluxo)
        self.assertEqual(fluxo["graficos"][0]["tipo"], "principal")
        total_linhas = len(codigo.replace("\r\n", "\n").replace("\r", "\n").split("\n"))
        nos = list(todos_os_nos(fluxo))
        ids = [n["id"] for n in nos]
        self.assertEqual(len(ids), len(set(ids)), "ids de nos duplicados")
        ids_graficos = [g["id"] for g in fluxo["graficos"]]
        self.assertEqual(len(ids_graficos), len(set(ids_graficos)))
        for g in fluxo["graficos"]:
            self.assertTrue(g["pai"] is None or g["pai"] in ids_graficos)
        for n in nos:
            self.assertIn(n["tipo"], TIPOS_PERMITIDOS)
            self.assertTrue(1 <= n["linha"] <= n["linha_fim"] <= total_linhas, n)
            if n["tipo"] == "definicao":
                self.assertTrue(n["grafico"] is None or n["grafico"] in ids_graficos)
        reais = [n for n in nos if n["tipo"] != "omitido"]
        self.assertEqual(len(reais), fluxo["total_nos"])
        self.assertLessEqual(fluxo["total_nos"], maximo)

    def fluxo(self, codigo, maximo=150, tam=100):
        codigo = textwrap.dedent(codigo).lstrip("\n")
        f = construir_fluxo(codigo, maximo, tam)
        self.assertIsNotNone(f)
        self.validar(f, codigo, maximo)
        return f

    def principal(self, codigo, **kw):
        return self.fluxo(codigo, **kw)["graficos"][0]["nos"]

    def test_vazio_e_so_comentario(self):
        for codigo in ("", "# so comentario\n", "\n\n"):
            f = self.fluxo(codigo)
            self.assertEqual(f["graficos"][0]["nos"], [])
            self.assertFalse(f["truncado"])

    def test_erro_de_sintaxe_e_bytes_nulos(self):
        self.assertIsNone(construir_fluxo("def f(:", 150, 100))
        self.assertIsNone(construir_fluxo("x = 1\0", 150, 100))
        self.assertIsNone(construir_fluxo("if True\n    pass", 150, 100))

    def test_exemplos_do_projeto(self):
        exemplos = json.loads((RAIZ / "static" / "data" / "exemplos.json").read_text(encoding="utf-8"))
        self.assertEqual(len(exemplos), 15)
        for chave, codigo in exemplos.items():
            with self.subTest(exemplo=chave):
                f = construir_fluxo(codigo, 150, 100)
                self.assertIsNotNone(f)
                self.validar(f, codigo)
                self.assertFalse(f["truncado"])

    def test_classificacao_de_entrada_e_saida(self):
        casos = [
            ("x = input()", "entrada"),
            ("x = int(input('n'))", "entrada"),
            ("print(input())", "entrada"),
            ("print('a')", "saida"),
            ("x = print()", "processo"),
            ("x = 1", "processo"),
            ("x += 1", "processo"),
            ("import math", "processo"),
            ("obj.metodo()", "processo"),
        ]
        for codigo, esperado in casos:
            with self.subTest(codigo=codigo):
                self.assertEqual(self.principal(codigo)[0]["tipo"], esperado)

    def test_input_no_cabecalho_continua_losango(self):
        nos = self.principal("if input() == 'a':\n    pass\n")
        self.assertEqual(nos[0]["tipo"], "se")

    def test_return_com_input_e_retorno(self):
        f = self.fluxo("def f():\n    return int(input())\n")
        self.assertEqual(f["graficos"][1]["nos"][0]["tipo"], "retorno")

    def test_if_elif_else(self):
        nos = self.principal("""
            if a:
                x = 1
            elif b:
                x = 2
            elif c:
                x = 3
            else:
                x = 4
        """)
        se = nos[0]
        self.assertEqual([e["texto"] for e in se["elifs"]], ["elif b", "elif c"])
        self.assertEqual(len(se["entao"]), 1)
        self.assertEqual(len(se["senao"]), 1)
        self.assertEqual(se["texto"], "if a")

    def test_else_com_if_aninhado_continua_aninhado(self):
        nos = self.principal("""
            if a:
                x = 1
            else:
                if b:
                    x = 2
        """)
        se = nos[0]
        self.assertEqual(se["elifs"], [])
        self.assertEqual(se["senao"][0]["tipo"], "se")

    def test_if_sem_else(self):
        se = self.principal("if a:\n    x = 1\n")[0]
        self.assertEqual(se["senao"], [])
        self.assertEqual(se["elifs"], [])

    def test_cadeia_longa_de_elif_sem_recursao(self):
        linhas = ["if x == 0:", "    y = 0"]
        for i in range(1, 300):
            linhas += [f"elif x == {i}:", f"    y = {i}"]
        linhas += ["else:", "    y = -1"]
        codigo = "\n".join(linhas) + "\n"
        f = construir_fluxo(codigo, 2000, 100)
        self.validar(f, codigo, 2000)
        self.assertEqual(len(f["graficos"][0]["nos"][0]["elifs"]), 299)

    def test_aninhamento_profundo(self):
        codigo = ""
        for nivel in range(12):
            recuo = "    " * nivel
            codigo += recuo + ("if x:\n" if nivel % 2 == 0 else "for i in y:\n")
        codigo += "    " * 12 + "z = 1\n"
        f = construir_fluxo(codigo, 150, 100)
        self.validar(f, codigo)
        profundidade, nos = 0, f["graficos"][0]["nos"]
        while nos and nos[0]["tipo"] in ("se", "para"):
            nos = nos[0].get("entao") or nos[0].get("corpo")
            profundidade += 1
        self.assertEqual(profundidade, 12)

    def test_lacos(self):
        nos = self.principal("""
            while True:
                pass
            while x:
                pass
            for i in range(3):
                pass
            else:
                y = 1
        """)
        self.assertEqual([n["tipo"] for n in nos], ["enquanto", "enquanto", "para", "processo"])
        self.assertTrue(nos[0]["infinito"])
        self.assertFalse(nos[1]["infinito"])
        self.assertEqual(nos[2]["texto"], "for i in range(3)")
        self.assertEqual(nos[3]["texto"], "y = 1")

    def test_break_continue_return_raise(self):
        f = self.fluxo("""
            def f(x):
                for i in x:
                    if i:
                        break
                    continue
                if x:
                    raise ValueError("x")
                return 1
        """)
        subtipos = [n.get("subtipo") for n in todos_os_nos(f) if n["tipo"] == "interrupcao"]
        self.assertEqual(subtipos, ["break", "continue", "raise"])
        self.assertEqual([n["tipo"] for n in todos_os_nos(f)].count("retorno"), 1)

    def test_instrucao_multilinha(self):
        nos = self.principal("x = f(\n    1,\n    2,\n)\ny = 2\n")
        self.assertEqual((nos[0]["linha"], nos[0]["linha_fim"]), (1, 4))
        self.assertEqual(nos[0]["texto"], "x = f( 1, 2, )")
        self.assertEqual(nos[1]["linha"], 5)

    def test_cabecalho_multilinha(self):
        se = self.principal("if (a and\n        b):\n    x = 1\n")[0]
        self.assertEqual((se["linha"], se["linha_fim"]), (1, 2))
        self.assertEqual(se["entao"][0]["linha"], 3)

    def test_continuacao_com_barra(self):
        nos = self.principal("x = 1 + \\\n    2\n")
        self.assertEqual((nos[0]["linha"], nos[0]["linha_fim"]), (1, 2))

    def test_decoradores_e_def_multilinha(self):
        f = self.fluxo("""
            @dec
            @dec2(1)
            def f(a,
                  b):
                return a
        """)
        d = f["graficos"][0]["nos"][0]
        self.assertEqual((d["linha"], d["linha_fim"]), (1, 4))
        g = f["graficos"][1]
        self.assertEqual((g["linha_def"], g["linha_ini"], g["linha_fim"]), (3, 5, 5))

    def test_def_em_uma_linha(self):
        f = self.fluxo("def f(x): return x\ny = f(1)\n")
        g = f["graficos"][1]
        self.assertEqual((g["linha_def"], g["linha_ini"]), (1, 1))

    def test_classes_e_funcoes_aninhadas(self):
        f = self.fluxo("""
            class A:
                class B:
                    def m(self):
                        def interna():
                            return 1
                        return interna()
                def n(self):
                    pass
        """)
        nomes = {g["nome"]: g for g in f["graficos"] if g["tipo"] != "principal"}
        self.assertEqual(set(nomes), {"A", "A.B", "A.B.m", "A.B.m.interna", "A.n"})
        self.assertEqual(nomes["A.B.m"]["escopo"], "m")
        self.assertEqual(nomes["A.B"]["tipo"], "classe")
        self.assertEqual(nomes["A.B.m.interna"]["pai"], nomes["A.B.m"]["id"])

    def test_definicao_aponta_para_o_grafico(self):
        f = self.fluxo("def f():\n    pass\nclass C:\n    pass\n")
        nos = f["graficos"][0]["nos"]
        ids = {g["nome"]: g["id"] for g in f["graficos"]}
        self.assertEqual(nos[0]["grafico"], ids["f"])
        self.assertEqual(nos[1]["grafico"], ids["C"])
        self.assertEqual(nos[1]["subtipo"], "classe")
        self.assertEqual(nos[1]["texto"], "class C")

    def test_lambda_e_compreensao_sao_um_no(self):
        nos = self.principal("f = lambda x: x + 1\ny = [i for i in range(3) if i]\n")
        self.assertEqual([n["tipo"] for n in nos], ["processo", "processo"])

    def test_try_except(self):
        nos = self.principal("""
            try:
                x = 1
            except ValueError:
                x = 2
            except (A, B) as e:
                x = 3
            except:
                x = 4
            else:
                x = 5
            finally:
                x = 6
        """)
        t = nos[0]
        self.assertEqual(t["tipo"], "tentar")
        self.assertEqual([h["texto"] for h in t["tratadores"]],
                         ["except ValueError", "except (A, B) as e", "except"])
        self.assertEqual([h["tipado"] for h in t["tratadores"]], [True, True, False])
        self.assertEqual(len(t["senao"]), 1)
        self.assertEqual(len(t["finalmente"]), 1)
        self.assertEqual(t["tratadores"][0]["linha"], 3)

    def test_try_finally_sem_except(self):
        t = self.principal("try:\n    x = 1\nfinally:\n    y = 2\n")[0]
        self.assertEqual(t["tratadores"], [])
        self.assertEqual(len(t["finalmente"]), 1)

    def test_with_achata_o_corpo(self):
        nos = self.principal("with open('a') as f, g():\n    x = f.read()\n    y = 1\n")
        self.assertEqual([n["tipo"] for n in nos], ["processo", "processo", "processo"])
        self.assertEqual(nos[0]["texto"], "with open('a') as f, g()")
        self.assertEqual(nos[0]["linha_fim"], 1)

    def test_construcoes_sem_suporte_viram_um_no(self):
        casos = ["async def f():\n    await g()\n", "async def f():\n    async for x in y:\n        pass\n"]
        if sys.version_info >= (3, 10):
            casos.append("match x:\n    case 1:\n        y = 1\n    case _:\n        y = 2\n")
        if sys.version_info >= (3, 11):
            casos.append("try:\n    x = 1\nexcept* ValueError:\n    y = 2\n")
        for codigo in casos:
            with self.subTest(codigo=codigo):
                total = len(codigo.rstrip("\n").split("\n"))
                nos = self.principal(codigo)
                self.assertEqual(len(nos), 1)
                self.assertEqual(nos[0]["tipo"], "processo")
                self.assertEqual((nos[0]["linha"], nos[0]["linha_fim"]), (1, total))
                self.assertEqual(nos[0]["texto"], codigo.split("\n")[0])

    @unittest.skipUnless(sys.version_info >= (3, 12), "type alias exige Python 3.12")
    def test_type_alias(self):
        self.assertEqual(self.principal("type X = int\n")[0]["tipo"], "processo")

    def test_ponto_e_virgula_e_uma_linha(self):
        nos = self.principal("x = 1; y = 2\nif x: y = 1\n")
        self.assertEqual([(n["linha"], n["linha_fim"]) for n in nos[:2]], [(1, 1), (1, 1)])
        se = nos[2]
        self.assertEqual((se["linha"], se["linha_fim"]), (2, 2))
        self.assertEqual((se["entao"][0]["linha"], se["entao"][0]["linha_fim"]), (2, 2))

    def test_docstrings(self):
        f = self.fluxo('"""modulo"""\nclass C:\n    """classe"""\n    def m(self):\n        """funcao"""\n        return 1\n')
        principal = f["graficos"][0]["nos"]
        self.assertEqual(principal[0]["tipo"], "processo")
        classe = next(g for g in f["graficos"] if g["nome"] == "C")
        self.assertEqual(classe["nos"][0]["texto"], '"""classe"""')
        metodo = next(g for g in f["graficos"] if g["nome"] == "C.m")
        self.assertEqual([n["tipo"] for n in metodo["nos"]], ["retorno"])

    def test_teto_em_sequencia_plana(self):
        codigo = "".join(f"x{i} = {i}\n" for i in range(1000))
        f = construir_fluxo(codigo, 20, 100)
        self.validar(f, codigo, 20)
        nos = f["graficos"][0]["nos"]
        self.assertEqual(len(nos), 21)
        self.assertEqual(nos[-1]["tipo"], "omitido")
        self.assertEqual(nos[-1]["quantidade"], 980)
        self.assertEqual((nos[-1]["linha"], nos[-1]["linha_fim"]), (21, 1000))
        self.assertTrue(f["truncado"])
        self.assertEqual(f["omitidos"], 980)
        self.assertEqual(f["total_nos"], 20)

    def test_teto_no_meio_de_corpo_aninhado(self):
        codigo = "for i in range(3):\n" + "".join(f"    x{i} = {i}\n" for i in range(10)) + "y = 1\n"
        f = construir_fluxo(codigo, 5, 100)
        self.validar(f, codigo, 5)
        laco = f["graficos"][0]["nos"][0]
        self.assertEqual(laco["corpo"][-1]["tipo"], "omitido")
        self.assertEqual(laco["corpo"][-1]["quantidade"], 6)
        self.assertEqual(f["graficos"][0]["nos"][-1]["tipo"], "omitido")
        self.assertEqual(f["omitidos"], 7)

    def test_teto_deixa_grafico_de_funcao_sem_construir(self):
        f = construir_fluxo("a = 1\nb = 2\ndef f():\n    x = 1\n    y = 2\n", 3, 100)
        self.validar(f, "a = 1\nb = 2\ndef f():\n    x = 1\n    y = 2\n", 3)
        self.assertEqual(len(f["graficos"]), 1)
        self.assertIsNone(f["graficos"][0]["nos"][2]["grafico"])
        self.assertEqual(f["omitidos"], 2)
        self.assertTrue(f["truncado"])

    def test_teto_corta_cadeia_de_elif_e_tratadores(self):
        linhas = ["if a:", "    x = 0"]
        for i in range(1, 50):
            linhas += [f"elif a == {i}:", f"    x = {i}"]
        codigo = "\n".join(linhas) + "\n"
        f = construir_fluxo(codigo, 10, 100)
        self.validar(f, codigo, 10)
        self.assertTrue(f["truncado"])
        codigo = "try:\n    x = 1\n" + "".join(f"except E{i}:\n    x = {i}\n" for i in range(30))
        f = construir_fluxo(codigo, 6, 100)
        self.validar(f, codigo, 6)
        self.assertTrue(f["truncado"])

    def test_nao_ascii_com_colunas_em_bytes(self):
        nos = self.principal("é = 1; y = 'ação'\nprint('ç', é)\n")
        self.assertEqual(nos[0]["texto"], "é = 1")
        self.assertEqual(nos[1]["texto"], "y = 'ação'")
        self.assertEqual(nos[2]["texto"], "print('ç', é)")

    def test_texto_de_xss_volta_cru(self):
        nos = self.principal("print('<script>alert(1)</script>')\n")
        self.assertEqual(nos[0]["texto"], "print('<script>alert(1)</script>')")

    def test_texto_longo_e_cortado(self):
        nos = self.principal("x = '" + "a" * 500 + "'\n", tam=50)
        self.assertEqual(len(nos[0]["texto"]), 50)
        self.assertTrue(nos[0]["texto"].endswith("..."))

    def test_quebras_de_linha_do_windows_e_mac(self):
        for quebra in ("\r\n", "\r"):
            with self.subTest(quebra=repr(quebra)):
                codigo = quebra.join(["x = 1", "if x:", "    y = 2", "z = 3", ""])
                nos = self.principal(codigo)
                self.assertEqual([n["linha"] for n in nos], [1, 2, 4])
                self.assertEqual(nos[0]["texto"], "x = 1")

    def test_resultado_deterministico(self):
        codigo = "for i in range(3):\n    print(i)\n"
        a = json.dumps(construir_fluxo(codigo, 150, 100))
        b = json.dumps(construir_fluxo(codigo, 150, 100))
        self.assertEqual(a, b)

    def test_ordem_dos_graficos_por_linha_da_definicao(self):
        f = self.fluxo("def b():\n    pass\n\ndef a():\n    pass\n")
        self.assertEqual([g["nome"] for g in f["graficos"]], [None, "b", "a"])

    def test_restricoes_do_arquivo_embutido_no_runner(self):
        fonte = (RAIZ / "fluxo_builder.py").read_text(encoding="utf-8")
        self.assertNotIn('"' * 3, fonte)
        self.assertNotIn("'" * 3, fonte)
        self.assertNotIn("__main__", fonte)
        self.assertTrue(fonte.isascii())
        enxuto = "\n".join(l for l in fonte.splitlines() if l.strip() and not l.strip().startswith("#"))
        self.assertLessEqual(len(enxuto), 9000)


if __name__ == "__main__":
    unittest.main()
