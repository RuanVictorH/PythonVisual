import json
import subprocess
import unittest
from pathlib import Path
from unittest import mock

import app as aplicacao
import executor

RAIZ = Path(__file__).resolve().parent.parent


# Nada aqui usa o Docker de verdade: o processo filho e simulado ou roda no Python local.
class TestModosPerigososEmProducao(unittest.TestCase):
    def test_sem_sandbox_em_producao_e_recusado(self):
        with mock.patch.object(executor, "AMBIENTE_PRODUCAO", True), mock.patch.object(
            executor, "USAR_SANDBOX_DOCKER", False
        ):
            with self.assertRaises(RuntimeError) as contexto:
                executor.validar_modo_de_execucao()
        self.assertIn("USAR_SANDBOX_DOCKER", str(contexto.exception))

    def test_com_sandbox_em_producao_passa(self):
        with mock.patch.object(executor, "AMBIENTE_PRODUCAO", True), mock.patch.object(
            executor, "USAR_SANDBOX_DOCKER", True
        ):
            executor.validar_modo_de_execucao()

    def test_sem_sandbox_fora_de_producao_passa(self):
        with mock.patch.object(executor, "AMBIENTE_PRODUCAO", False), mock.patch.object(
            executor, "USAR_SANDBOX_DOCKER", False
        ):
            executor.validar_modo_de_execucao()

    def test_depuracao_em_producao_e_recusada(self):
        with mock.patch.object(aplicacao, "AMBIENTE_PRODUCAO", True):
            with self.assertRaises(RuntimeError) as contexto:
                aplicacao.validar_depuracao(True)
        self.assertIn("PYTHONVISUAL_ENV", str(contexto.exception))

    def test_depuracao_desligada_em_producao_passa(self):
        with mock.patch.object(aplicacao, "AMBIENTE_PRODUCAO", True):
            self.assertFalse(aplicacao.validar_depuracao(False))

    def test_depuracao_fora_de_producao_passa(self):
        with mock.patch.object(aplicacao, "AMBIENTE_PRODUCAO", False):
            self.assertTrue(aplicacao.validar_depuracao(True))


class TestTamanhoDaRequisicao(unittest.TestCase):
    def setUp(self):
        for alvo in ("registrar_execucao", "executar_codigo"):
            patcher = mock.patch.object(aplicacao, alvo, return_value=[])
            patcher.start()
            self.addCleanup(patcher.stop)
        self.cliente = aplicacao.app.test_client()

    def test_corpo_maior_que_o_limite_da_requisicao(self):
        with mock.patch.dict(aplicacao.app.config, {"MAX_CONTENT_LENGTH": 1000}):
            resposta = self.cliente.post("/executar", json={"codigo": "x" * 2000})
        self.assertEqual(resposta.status_code, 413)
        self.assertEqual(
            resposta.get_json()[0]["erro"],
            "RequisicaoInvalida: a requisição excede 1000 bytes.",
        )
        aplicacao.executar_codigo.assert_not_called()

    def test_codigo_maior_que_o_limite(self):
        with mock.patch.object(aplicacao, "TAMANHO_MAXIMO_CODIGO", 10):
            resposta = self.cliente.post("/executar", json={"codigo": "x" * 11})
        self.assertEqual(resposta.status_code, 413)
        self.assertEqual(
            resposta.get_json()[0]["erro"],
            "RequisicaoInvalida: o código excede 10 caracteres.",
        )
        aplicacao.executar_codigo.assert_not_called()

    def test_codigo_no_limite_passa(self):
        with mock.patch.object(aplicacao, "TAMANHO_MAXIMO_CODIGO", 10):
            resposta = self.cliente.post("/executar", json={"codigo": "x" * 10})
        self.assertEqual(resposta.status_code, 200)
        aplicacao.executar_codigo.assert_called_once()

    def test_entrada_maior_que_o_limite(self):
        with mock.patch.object(aplicacao, "TAMANHO_MAXIMO_ENTRADA", 10):
            resposta = self.cliente.post("/executar", json={"codigo": "print(1)", "entrada": "x" * 11})
        self.assertEqual(resposta.status_code, 413)
        self.assertEqual(
            resposta.get_json()[0]["erro"],
            "RequisicaoInvalida: uma entrada excede 10 caracteres.",
        )
        aplicacao.executar_codigo.assert_not_called()

    def test_valor_de_entradas_maior_que_o_limite(self):
        entradas = [{"linha": 1, "valor": "ok"}, {"linha": 2, "valor": "x" * 11}]
        with mock.patch.object(aplicacao, "TAMANHO_MAXIMO_ENTRADA", 10):
            resposta = self.cliente.post("/executar", json={"codigo": "print(1)", "entradas": entradas})
        self.assertEqual(resposta.status_code, 413)
        aplicacao.executar_codigo.assert_not_called()

    def test_entradas_dentro_do_limite_passam(self):
        entradas = [{"linha": 1, "valor": "x" * 10}, "item que nao e dicionario"]
        with mock.patch.object(aplicacao, "TAMANHO_MAXIMO_ENTRADA", 10):
            resposta = self.cliente.post("/executar", json={"codigo": "print(1)", "entradas": entradas})
        self.assertEqual(resposta.status_code, 200)

    def test_limites_padrao_aceitam_todos_os_exemplos(self):
        exemplos = json.loads((RAIZ / "static" / "data" / "exemplos.json").read_text(encoding="utf-8"))
        for chave, codigo in exemplos.items():
            with self.subTest(exemplo=chave):
                self.assertLessEqual(len(codigo), aplicacao.TAMANHO_MAXIMO_CODIGO)


class TestMensagemDoTempoLimite(unittest.TestCase):
    def esgotar_o_tempo(self, comando, **kw):
        if comando[:2] == ["docker", "run"] or comando[0] != "docker":
            raise subprocess.TimeoutExpired(comando, 1)
        return subprocess.CompletedProcess(args=comando, returncode=0, stdout="", stderr="")

    def test_no_docker_informa_o_limite_real_com_a_folga(self):
        with mock.patch.object(executor, "USAR_SANDBOX_DOCKER", True), mock.patch.object(
            executor, "_docker_disponivel", return_value=True
        ), mock.patch.object(executor, "_garantir_imagem_sandbox", return_value=True), mock.patch.object(
            executor.subprocess, "run", side_effect=self.esgotar_o_tempo
        ):
            resultado = executor.executar_codigo("while True: pass", tempo_limite=3)
        self.assertEqual(
            resultado[0]["erro"], "TempoLimite: execução interrompida após 8 segundos."
        )

    def test_no_modo_local_informa_o_proprio_limite(self):
        with mock.patch.object(executor, "USAR_SANDBOX_DOCKER", False), mock.patch.object(
            executor.subprocess, "run", side_effect=self.esgotar_o_tempo
        ):
            resultado = executor.executar_codigo("while True: pass", tempo_limite=3)
        self.assertEqual(
            resultado[0]["erro"], "TempoLimite: execução interrompida após 3 segundos."
        )


class TestParametrosDeTamanhoNoRunner(unittest.TestCase):
    # O runner roda num subprocesso do Python local, sem Docker.
    def setUp(self):
        patcher = mock.patch.object(executor, "USAR_SANDBOX_DOCKER", False)
        patcher.start()
        self.addCleanup(patcher.stop)

    def ultimo_passo(self, codigo, **kw):
        return executor.executar_codigo(codigo, gerar_fluxo=False, **kw)[-1]

    def test_limite_de_objeto_corta_lista_e_dicionario(self):
        codigo = "lista = list(range(10))\ndic = {i: i for i in range(10)}\n"
        passo = self.ultimo_passo(codigo, tamanho_maximo_objeto=3)
        lista = passo["variaveis"]["lista"]
        dic = passo["variaveis"]["dic"]
        self.assertEqual(len(lista["elementos"]), 3)
        self.assertTrue(lista["truncado"])
        self.assertEqual(len(dic["pares"]), 3)
        self.assertTrue(dic["truncado"])

    def test_limite_de_objeto_corta_atributos(self):
        codigo = (
            "class P:\n"
            "    def __init__(self):\n"
            "        self.a = 1\n        self.b = 2\n        self.c = 3\n        self.d = 4\n"
            "p = P()\n"
        )
        passo = self.ultimo_passo(codigo, tamanho_maximo_objeto=2)
        p = passo["variaveis"]["p"]
        self.assertEqual(len(p["atributos"]), 2)
        self.assertTrue(p["truncado"])

    def test_limite_de_repr_corta_o_texto(self):
        passo = self.ultimo_passo("texto = 'a' * 100\n", tamanho_maximo_repr=20)
        repr_texto = passo["variaveis"]["texto"]["repr"]
        self.assertEqual(len(repr_texto), 20)
        self.assertTrue(repr_texto.endswith("..."))

    def test_padroes_mantem_o_comportamento_anterior(self):
        passo = self.ultimo_passo("lista = list(range(60))\ntexto = 'a' * 200\n")
        lista = passo["variaveis"]["lista"]
        self.assertEqual(len(lista["elementos"]), 50)
        self.assertTrue(lista["truncado"])
        self.assertEqual(len(passo["variaveis"]["texto"]["repr"]), 120)


if __name__ == "__main__":
    unittest.main()
