import json
import subprocess
import unittest
from pathlib import Path
from unittest import mock

import executor

RAIZ = Path(__file__).resolve().parent.parent
EXEMPLOS = json.loads((RAIZ / "static" / "data" / "exemplos.json").read_text(encoding="utf-8"))
ENTRADAS = {
    "input": ["Ana", "20"],
    "bhaskara": ["1", "-5", "6"],
}


def entradas_do_exemplo(chave):
    return [{"linha": None, "valor": v} for v in ENTRADAS.get(chave, [])]


def selecionar_grafico(fluxo, linha, escopo):
    # porte em Python da regra que o frontend usa para escolher o grafico exibido
    melhor = fluxo["graficos"][0]
    for g in fluxo["graficos"][1:]:
        if not (g["linha_ini"] <= linha <= g["linha_fim"]):
            continue
        if g["linha_ini"] <= g["linha_def"] and g["escopo"] != escopo:
            continue
        if g["linha_ini"] >= melhor["linha_ini"]:
            melhor = g
    return melhor


def indice_de_linhas(grafico):
    indice = {}

    def marcar(no):
        for linha in range(no["linha"], no["linha_fim"] + 1):
            indice.setdefault(linha, no)

    def visitar(nos):
        for n in nos:
            marcar(n)
            for e in n.get("elifs", []):
                marcar(e)
                visitar(e["entao"])
            for t in n.get("tratadores", []):
                marcar(t)
                visitar(t["corpo"])
            for chave in ("entao", "corpo", "senao", "finalmente"):
                visitar(n.get(chave, []))

    visitar(grafico["nos"])
    return indice


def sem_fluxo(passos):
    copia = json.loads(json.dumps(passos))
    if copia and isinstance(copia[0], dict):
        copia[0].pop("fluxo", None)
    return copia


class TestRunnerEmbutido(unittest.TestCase):
    def test_runner_compila(self):
        compile(executor.RUNNER_CODE, "<runner>", "exec")

    def test_linha_de_comando_do_docker_cabe_no_limite_do_windows(self):
        comando = [
            "docker", "run", "-i", "--name", "pythonvisual-sandbox-0123456789ab",
            "--network", "none", "--memory", "128m", "--memory-swap", "128m", "--cpus", "0.5",
            "--pids-limit", "64", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
            "--read-only", "--tmpfs", "/tmp:rw,size=16m", executor.SANDBOX_IMAGEM,
            "python", "-I", "-B", "-c", executor.RUNNER_CODE,
        ]
        self.assertLess(len(subprocess.list2cmdline(comando)), 28000)

    def test_fonte_do_construtor_foi_embutida_sem_comentarios_nem_linhas_em_branco(self):
        fonte = executor._carregar_fluxo_fonte()
        self.assertTrue(executor.RUNNER_CODE.startswith(fonte))
        self.assertIn("def construir_fluxo(", fonte)
        for linha in fonte.splitlines():
            self.assertTrue(linha.strip())
            self.assertFalse(linha.strip().startswith("#"))


class RoteiroDeExecucao:
    # Corpo dos testes compartilhado entre o caminho local e o caminho com Docker.
    # As subclasses definem `rodar(codigo, **kw)`.
    def rodar(self, codigo, **kw):
        raise NotImplementedError

    def test_primeiro_elemento_carrega_o_fluxo_e_o_resto_nao_muda(self):
        codigo = "x = 1\nfor i in range(2):\n    x = x + i\nprint(x)\n"
        com = self.rodar(codigo)
        sem = self.rodar(codigo, gerar_fluxo=False)
        self.assertIn("fluxo", com[0])
        self.assertNotIn("fluxo", sem[0])
        self.assertEqual(sem_fluxo(com), sem)
        self.assertEqual(com[0]["fluxo"]["graficos"][0]["tipo"], "principal")

    def test_erro_de_sintaxe_nao_tem_chave(self):
        r = self.rodar("if True\n    pass")
        self.assertNotIn("fluxo", r[0])
        self.assertIn("SyntaxError", r[-1]["erro"])

    def test_config_invalida_gera_fluxo_nulo_sem_quebrar_o_trace(self):
        r = self.rodar("x = 1\n", fluxo_maximo_nos="x")
        self.assertIn("fluxo", r[0])
        self.assertIsNone(r[0]["fluxo"])
        self.assertEqual(r[-1]["evento"], "fim")

    def test_classificacao_da_auditoria_nao_muda(self):
        executor.CONFIG["USAR_LOG_AUDITORIA"] = "false"
        import auditoria
        for codigo in ("print(1)\n", "1 / 0\n"):
            com = self.rodar(codigo)
            sem = self.rodar(codigo, gerar_fluxo=False)
            self.assertEqual(auditoria._classificar_resultado(com), auditoria._classificar_resultado(sem))

    def test_timeout_devolve_lista_de_erro_sem_chave(self):
        r = self.rodar("import time\ntime.sleep(100)\n", tempo_limite=1)
        self.assertEqual(len(r), 1)
        self.assertNotIn("fluxo", r[0])
        self.assertIn("TempoLimite", r[0]["erro"])

    def test_todo_passo_dos_exemplos_cai_em_um_no_do_grafico_certo(self):
        for chave, codigo in EXEMPLOS.items():
            with self.subTest(exemplo=chave):
                passos = self.rodar(codigo, entradas=entradas_do_exemplo(chave))
                fluxo = passos[0]["fluxo"]
                self.assertIsNotNone(fluxo)
                indices = {g["id"]: indice_de_linhas(g) for g in fluxo["graficos"]}
                verificados = 0
                for p in passos:
                    if not isinstance(p.get("linha"), int):
                        continue
                    grafico = selecionar_grafico(fluxo, p["linha"], p["escopo"])
                    self.assertIn(
                        p["linha"], indices[grafico["id"]],
                        f"{chave}: passo evento={p['evento']} linha={p['linha']} escopo={p['escopo']} "
                        f"caiu no grafico {grafico['nome']} sem no para a linha",
                    )
                    verificados += 1
                self.assertGreater(verificados, 0)

    def test_construcoes_com_eventos_de_linha_delicados(self):
        casos = {
            "try_except_finally": (
                "for t in ['1', 'x', '0']:\n"
                "    try:\n"
                "        n = int(t)\n"
                "        r = 10 / n\n"
                "    except ValueError:\n"
                "        r = -1\n"
                "    except ZeroDivisionError as e:\n"
                "        r = -2\n"
                "    else:\n"
                "        r = r + 1\n"
                "    finally:\n"
                "        print(t)\n"
            ),
            "except_nu": "try:\n    x = 1 / 0\nexcept:\n    x = 0\nprint(x)\n",
            "multilinha": "x = max(\n    1,\n    2,\n)\ny = [\n    1,\n    2,\n]\nprint(x, y)\n",
            "uma_linha": "x = 1; y = 2\nif x: y = 3\nfor i in range(2): y = y + i\n",
            "def_uma_linha": "def f(x): return x + 1\nprint(f(1))\n",
            "docstrings": '"""modulo"""\nclass C:\n    """classe"""\n    def m(self):\n        """funcao"""\n        return 1\nprint(C().m())\n',
            "lacos_com_else_e_break": (
                "for i in range(3):\n    if i == 5:\n        break\nelse:\n    print('fim')\n"
                "n = 0\nwhile n < 2:\n    n = n + 1\n    continue\nelse:\n    print(n)\n"
            ),
            "with_e_lambda": "import io\nwith io.StringIO('a') as f:\n    d = f.read()\ng = lambda v: v * 2\nprint(g(2), [k for k in range(3)])\n",
            "decorador": "def deco(fn):\n    return fn\n\n@deco\ndef f():\n    return 1\nprint(f())\n",
            "recursao": "def f(n):\n    if n == 0:\n        return 0\n    return 1 + f(n - 1)\nprint(f(3))\n",
        }
        for nome, codigo in casos.items():
            with self.subTest(caso=nome):
                passos = self.rodar(codigo)
                fluxo = passos[0]["fluxo"]
                self.assertIsNotNone(fluxo)
                indices = {g["id"]: indice_de_linhas(g) for g in fluxo["graficos"]}
                for p in passos:
                    if not isinstance(p.get("linha"), int):
                        continue
                    grafico = selecionar_grafico(fluxo, p["linha"], p["escopo"])
                    self.assertIn(
                        p["linha"], indices[grafico["id"]],
                        f"{nome}: evento={p['evento']} linha={p['linha']} escopo={p['escopo']} "
                        f"grafico={grafico['nome']}",
                    )


class TestExecucaoLocal(RoteiroDeExecucao, unittest.TestCase):
    # Roda o runner num subprocesso do proprio Python, sem Docker. Fixtures confiaveis e ASCII
    # (no Windows o stdout do filho nao e UTF-8 quando o Docker esta desligado).
    def setUp(self):
        patcher = mock.patch.object(executor, "USAR_SANDBOX_DOCKER", False)
        patcher.start()
        self.addCleanup(patcher.stop)

    def rodar(self, codigo, **kw):
        return executor.executar_codigo(codigo, **kw)


@unittest.skipUnless(executor._docker_disponivel(), "Docker indisponivel")
class TestExecucaoDocker(RoteiroDeExecucao, unittest.TestCase):
    # Roda o runner concatenado dentro do sandbox real (Python 3.12).
    def rodar(self, codigo, **kw):
        return executor.executar_codigo(codigo, **kw)


if __name__ == "__main__":
    unittest.main()
