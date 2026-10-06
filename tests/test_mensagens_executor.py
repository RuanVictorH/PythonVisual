import subprocess
import unittest
from unittest import mock

import app as aplicacao
import executor


# Mensagens que o usuario ve na caixa de erro precisam de acento. O tipo antes dos dois
# pontos (FalhaInterna, RequisicaoInvalida) fica sem acento: o frontend escolhe a
# orientacao de correcao por ele. Nada aqui usa o Docker de verdade: tudo e simulado.
class TestMensagensDoExecutor(unittest.TestCase):
    def test_docker_indisponivel(self):
        with mock.patch.object(executor, "USAR_SANDBOX_DOCKER", True), mock.patch.object(
            executor, "_docker_disponivel", return_value=False
        ):
            resultado = executor.executar_codigo("print(1)")
        self.assertEqual(len(resultado), 1)
        self.assertTrue(
            resultado[0]["erro"].startswith("FalhaInterna: o Docker não está disponível. "),
            resultado[0]["erro"],
        )

    def test_imagem_do_sandbox_que_nao_foi_preparada(self):
        with mock.patch.object(executor, "USAR_SANDBOX_DOCKER", True), mock.patch.object(
            executor, "_docker_disponivel", return_value=True
        ), mock.patch.object(executor, "_garantir_imagem_sandbox", return_value=False):
            resultado = executor.executar_codigo("print(1)")
        self.assertEqual(
            resultado[0]["erro"],
            "FalhaInterna: não foi possível preparar a imagem de sandbox (docker build falhou).",
        )

    def test_resposta_que_nao_e_json(self):
        # modo local, com o processo filho simulado: ele devolve um texto que nao e JSON
        filho = subprocess.CompletedProcess(args=[], returncode=0, stdout="isto nao e json", stderr="")
        with mock.patch.object(executor, "USAR_SANDBOX_DOCKER", False), mock.patch.object(
            executor.subprocess, "run", return_value=filho
        ):
            resultado = executor.executar_codigo("print(1)")
        self.assertEqual(resultado[0]["erro"], "FalhaInterna: resposta inválida do executor.")


class TestMensagensDaRequisicao(unittest.TestCase):
    def test_codigo_que_nao_e_texto(self):
        with mock.patch.object(aplicacao, "registrar_execucao"):
            resposta = aplicacao.app.test_client().post("/executar", json={"codigo": 123})
        self.assertEqual(resposta.status_code, 400)
        self.assertEqual(
            resposta.get_json()[0]["erro"],
            "RequisicaoInvalida: código e entrada devem ser textos.",
        )


if __name__ == "__main__":
    unittest.main()
