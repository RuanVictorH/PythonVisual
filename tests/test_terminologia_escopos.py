import unittest
from unittest import mock

import executor

CLASSE_COMPLETA = """class Conta:
    taxa = 0.5
    def __init__(self, t):
        self.t = t
    def dep(self, v):
        def aux(x):
            return x + 1
        return aux(v)
    @staticmethod
    def est(a):
        return a
    @classmethod
    def cri(cls):
        return cls(1)

c = Conta(1)
c.dep(2)
f = lambda z: z
f(1)
"""

CLASSE_VAZIA = "class V:\n    pass\n\nv = V()\n"

CLASSE_ANINHADA = """class Outer:
    class Inner:
        def m(self):
            return 1

o = Outer.Inner()
o.m()
"""

FUNCAO_ANINHADA = """def f(x):
    def g(y):
        return y
    return g(x)

f(1)
"""

MUITOS_METODOS = "class Grande:\n" + "".join(
    "    def m%d(self):\n        pass\n" % i for i in range(60)
)


def quadros(passos):
    return [q for p in passos for q in p.get("quadros_memoria", [])]


def tipos_de_quadro(passos):
    return {(q["escopo"], q.get("tipo_escopo"), q.get("classe")) for q in quadros(passos)}


def tipos_de_pilha(passos):
    return {
        (i["escopo"], i.get("tipo_escopo"), i.get("classe"))
        for p in passos
        for i in p.get("pilha_chamadas", [])
    }


def classe_global(passos, nome):
    for q in reversed(quadros(passos)):
        if q["escopo"] == "Global" and nome in q["variaveis"]:
            return q["variaveis"][nome]
    return None


class RoteiroDeTerminologia:
    # Corpo dos testes compartilhado entre o caminho local e o caminho com Docker.
    def rodar(self, codigo, **kw):
        raise NotImplementedError

    def test_tipo_de_escopo_de_cada_quadro(self):
        r = self.rodar(CLASSE_COMPLETA, gerar_fluxo=False)
        tipos = tipos_de_quadro(r)
        self.assertIn(("Global", "global", None), tipos)
        self.assertIn(("Conta", "classe", "Conta"), tipos)
        self.assertIn(("__init__", "metodo", "Conta"), tipos)
        self.assertIn(("dep", "metodo", "Conta"), tipos)
        self.assertIn(("aux", "funcao", None), tipos)
        self.assertIn(("<lambda>", "funcao", None), tipos)

    def test_escopo_original_nao_muda(self):
        r = self.rodar(CLASSE_COMPLETA, gerar_fluxo=False)
        escopos = {q["escopo"] for q in quadros(r)}
        self.assertEqual(escopos, {"Global", "Conta", "__init__", "dep", "aux", "<lambda>"})

    def test_pilha_de_chamadas_tem_os_mesmos_campos(self):
        r = self.rodar(CLASSE_COMPLETA, gerar_fluxo=False)
        tipos = tipos_de_pilha(r)
        self.assertIn(("Conta", "classe", "Conta"), tipos)
        self.assertIn(("dep", "metodo", "Conta"), tipos)
        self.assertIn(("aux", "funcao", None), tipos)

    def test_passo_final_tambem_marca_o_escopo_global(self):
        r = self.rodar("x = 1\n", gerar_fluxo=False)
        self.assertEqual(r[-1]["evento"], "fim")
        self.assertEqual(r[-1]["quadros_memoria"][0]["tipo_escopo"], "global")

    def test_corpo_da_classe_lista_metodos_incluindo_o_init(self):
        r = self.rodar(CLASSE_COMPLETA, gerar_fluxo=False)
        corpo = [q for q in quadros(r) if q["escopo"] == "Conta"][-1]["variaveis"]
        self.assertEqual(set(corpo), {"taxa", "__init__", "dep", "est", "cri"})
        self.assertEqual(corpo["__init__"]["categoria"], "funcao")
        self.assertEqual(corpo["dep"]["categoria"], "funcao")
        self.assertEqual(corpo["est"]["metodo"], "estatico")
        self.assertEqual(corpo["cri"]["metodo"], "classe")
        self.assertEqual(corpo["taxa"]["categoria"], "primitivo")

    def test_dunders_do_modulo_continuam_escondidos(self):
        r = self.rodar(CLASSE_COMPLETA, gerar_fluxo=False)
        globais = [q for q in quadros(r) if q["escopo"] == "Global"][-1]["variaveis"]
        self.assertFalse([n for n in globais if n.startswith("__")])

    def test_classe_global_traz_a_lista_de_metodos(self):
        r = self.rodar(CLASSE_COMPLETA, gerar_fluxo=False)
        info = classe_global(r, "Conta")
        self.assertEqual(info["categoria"], "classe")
        self.assertEqual(
            [(m["nome"], m["tipo"]) for m in info["metodos"]],
            [("__init__", "metodo"), ("dep", "metodo"), ("est", "estatico"), ("cri", "classe")],
        )
        self.assertEqual(info["metodos"][0]["assinatura"], "(self, t)")
        self.assertFalse(info["metodos_truncado"])

    def test_classe_vazia_nao_tem_metodos(self):
        r = self.rodar(CLASSE_VAZIA, gerar_fluxo=False)
        info = classe_global(r, "V")
        self.assertEqual(info["metodos"], [])

    def test_classe_aninhada_usa_o_nome_da_classe_dona(self):
        r = self.rodar(CLASSE_ANINHADA, gerar_fluxo=False)
        tipos = tipos_de_quadro(r)
        self.assertIn(("Outer", "classe", "Outer"), tipos)
        self.assertIn(("Inner", "classe", "Inner"), tipos)
        self.assertIn(("m", "metodo", "Inner"), tipos)

    def test_funcao_dentro_de_funcao_continua_funcao(self):
        r = self.rodar(FUNCAO_ANINHADA, gerar_fluxo=False)
        tipos = tipos_de_quadro(r)
        self.assertIn(("f", "funcao", None), tipos)
        self.assertIn(("g", "funcao", None), tipos)
        self.assertFalse([t for t in tipos if t[1] == "metodo"])

    def test_lista_de_metodos_tem_teto(self):
        r = self.rodar(MUITOS_METODOS, gerar_fluxo=False)
        info = classe_global(r, "Grande")
        self.assertEqual(len(info["metodos"]), 50)
        self.assertTrue(info["metodos_truncado"])


class TestTerminologiaLocal(RoteiroDeTerminologia, unittest.TestCase):
    # Fixtures confiaveis e ASCII (no Windows o stdout do filho nao e UTF-8 sem Docker).
    def setUp(self):
        patcher = mock.patch.object(executor, "USAR_SANDBOX_DOCKER", False)
        patcher.start()
        self.addCleanup(patcher.stop)

    def rodar(self, codigo, **kw):
        return executor.executar_codigo(codigo, **kw)


@unittest.skipUnless(executor._docker_disponivel(), "Docker indisponivel")
class TestTerminologiaDocker(RoteiroDeTerminologia, unittest.TestCase):
    # Mesmo roteiro dentro do sandbox real (Python 3.12).
    def rodar(self, codigo, **kw):
        return executor.executar_codigo(codigo, **kw)


if __name__ == "__main__":
    unittest.main()
