import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
MODULO = RAIZ / "static" / "js" / "fluxo-marcas.js"

# Lê os casos em JSON da entrada padrão e escreve as marcas calculadas.
SCRIPT_NODE = """
import { calcularMarcas } from "./fluxo-marcas.mjs";

let entrada = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (pedaco) => {
  entrada += pedaco;
});
process.stdin.on("end", () => {
  const casos = JSON.parse(entrada);
  const saida = casos.map((caso) => {
    const resultado = calcularMarcas({
      ...caso,
      indice: new Map(caso.indice),
      formas: new Set(caso.formas),
    });

    return {
      marcas: Object.fromEntries(resultado.marcas),
      idProximo: resultado.idProximo ?? null,
      idExecutado: resultado.idExecutado ?? null,
    };
  });

  process.stdout.write(JSON.stringify(saida));
});
"""

GLOBAL = {"escopo": "Global"}

# Programa sem funções:
#   1: x = 1
#   2: y = 2
#   3: print(x + y)
PASSOS_PRINCIPAL = [
    {"evento": "line", "linha": 1, "pilha_chamadas": [GLOBAL]},
    {"evento": "line", "linha": 2, "pilha_chamadas": [GLOBAL]},
    {"evento": "line", "linha": 3, "pilha_chamadas": [GLOBAL]},
    {"evento": "fim", "linha": None, "pilha_chamadas": []},
]
INDICE_PRINCIPAL = [[1, "n1"], [2, "n2"], [3, "n3"]]
FORMAS_PRINCIPAL = ["inicio", "fim", "n1", "n2", "n3"]

# Programa com uma função:
#   1: def dobro(n):
#   2:     return n * 2
#   3: print(dobro(4))
PASSOS_FUNCAO = [
    {"evento": "line", "linha": 1, "pilha_chamadas": [GLOBAL]},
    {"evento": "line", "linha": 3, "pilha_chamadas": [GLOBAL]},
    {"evento": "line", "linha": 2, "pilha_chamadas": [GLOBAL, GLOBAL]},
    {"evento": "return", "linha": 2, "pilha_chamadas": [GLOBAL, GLOBAL]},
    {"evento": "fim", "linha": None, "pilha_chamadas": []},
]
INDICE_FUNCAO = [[2, "f2"]]
FORMAS_FUNCAO = ["inicio", "fim", "f2"]


def caso(passos, indice_atual, proxima, executada, **extra):
    base = {
        "passos": passos,
        "indiceAtual": indice_atual,
        "linhaProxima": proxima,
        "linhaExecutada": executada,
        "executando": True,
        "indice": INDICE_PRINCIPAL,
        "formas": FORMAS_PRINCIPAL,
        "tipo": "principal",
    }

    return {**base, **extra}


@unittest.skipUnless(shutil.which("node"), "Node.js não está instalado")
class TestMarcasDoFluxograma(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pasta = tempfile.TemporaryDirectory()
        pasta = Path(cls.pasta.name)
        shutil.copy(MODULO, pasta / "fluxo-marcas.mjs")
        (pasta / "rodar.mjs").write_text(SCRIPT_NODE, encoding="utf-8")

    @classmethod
    def tearDownClass(cls):
        cls.pasta.cleanup()

    def calcular(self, um_caso):
        resultado = subprocess.run(
            ["node", "rodar.mjs"],
            input=json.dumps([um_caso]),
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=self.pasta.name,
            timeout=60,
        )

        self.assertEqual(resultado.returncode, 0, resultado.stderr)

        return json.loads(resultado.stdout)[0]

    def test_primeiro_passo_marca_o_inicio_e_o_proximo_bloco(self):
        obtido = self.calcular(caso(PASSOS_PRINCIPAL, 0, 1, None))

        self.assertEqual(
            obtido["marcas"], {"inicio": "visitado", "n1": "proximo"}
        )
        self.assertEqual(obtido["idProximo"], "n1")
        self.assertIsNone(obtido["idExecutado"])

    def test_passo_do_meio_mantem_os_checks_azuis(self):
        obtido = self.calcular(caso(PASSOS_PRINCIPAL, 2, 3, 2))

        self.assertEqual(
            obtido["marcas"],
            {
                "inicio": "visitado",
                "n1": "visitado",
                "n2": "executado",
                "n3": "proximo",
            },
        )
        self.assertEqual(obtido["idProximo"], "n3")
        self.assertEqual(obtido["idExecutado"], "n2")

    def test_passo_final_nao_deixa_o_check_azul_so_no_inicio(self):
        obtido = self.calcular(caso(PASSOS_PRINCIPAL, 3, None, 3))

        self.assertEqual(
            obtido["marcas"], {"n3": "executado", "fim": "executado"}
        )
        self.assertNotIn("visitado", obtido["marcas"].values())
        self.assertNotIn("inicio", obtido["marcas"])
        self.assertIsNone(obtido["idProximo"])
        self.assertEqual(obtido["idExecutado"], "n3")

    def test_return_da_funcao_mantem_o_inicio_e_marca_o_fim(self):
        obtido = self.calcular(
            caso(
                PASSOS_FUNCAO,
                3,
                None,
                2,
                indice=INDICE_FUNCAO,
                formas=FORMAS_FUNCAO,
                tipo="funcao",
            )
        )

        self.assertEqual(
            obtido["marcas"],
            {"inicio": "visitado", "f2": "executado", "fim": "executado"},
        )

    def test_grafico_fixado_fora_da_execucao_marca_so_o_que_ja_rodou(self):
        obtido = self.calcular(
            caso(
                PASSOS_FUNCAO,
                4,
                None,
                3,
                executando=False,
                indice=INDICE_FUNCAO,
                formas=FORMAS_FUNCAO,
                tipo="funcao",
            )
        )

        self.assertEqual(obtido["marcas"], {"f2": "visitado"})
        self.assertIsNone(obtido["idProximo"])
        self.assertIsNone(obtido["idExecutado"])

    def test_grafico_fixado_antes_da_chamada_nao_tem_marcas(self):
        obtido = self.calcular(
            caso(
                PASSOS_FUNCAO,
                1,
                3,
                1,
                executando=False,
                indice=INDICE_FUNCAO,
                formas=FORMAS_FUNCAO,
                tipo="funcao",
            )
        )

        self.assertEqual(obtido["marcas"], {})


if __name__ == "__main__":
    unittest.main()
