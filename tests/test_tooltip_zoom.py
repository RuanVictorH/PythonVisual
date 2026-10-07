import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
TOOLTIP = RAIZ / "static" / "js" / "tooltip.js"

# Roda o tooltip.js de verdade num DOM de mentira: passa o ponteiro por um botão com
# data-tip e devolve o texto da dica que apareceria. Cada cenário tem seu próprio
# ambiente (idioma salvo, valor de --font-scale e zoom salvo no navegador).
SCRIPT_NODE = """
const fs = require("node:fs");
const vm = require("node:vm");

const codigo = fs.readFileSync(process.argv[2], "utf8");
const cenarios = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));

function rodar(cenario) {
  const ouvintes = {};
  const dica = {
    style: {},
    classList: { add() {}, remove() {}, contains: () => false },
    offsetWidth: 120,
    offsetHeight: 24,
    textContent: "",
    setAttribute() {},
    addEventListener() {},
    contains: () => false,
  };
  const armazenado = { ...(cenario.armazenado || {}) };
  if (cenario.idioma) armazenado.pythonvisual_lang = cenario.idioma;

  const botao = {
    dataset: { tip: cenario.tecla },
    isConnected: true,
    getBoundingClientRect: () => ({ left: 100, top: 10, right: 150, bottom: 40, width: 50, height: 30 }),
    getAttribute: () => null,
    setAttribute() {},
    removeAttribute() {},
    closest() {
      return this;
    },
    matches: () => false,
  };
  const documento = {
    readyState: "complete",
    documentElement: { clientWidth: 1200, clientHeight: 800, addEventListener() {} },
    body: { appendChild() {}, classList: { contains: () => false } },
    createElement: () => dica,
    addEventListener(tipo, funcao) {
      (ouvintes[tipo] = ouvintes[tipo] || []).push(funcao);
    },
    querySelectorAll: () => [],
    getElementById: () => null,
  };
  const ambiente = {
    document: documento,
    localStorage: { getItem: (chave) => (chave in armazenado ? armazenado[chave] : null) },
    getComputedStyle: () => ({ getPropertyValue: () => cenario.escala }),
    setTimeout: (funcao) => {
      funcao();
      return 1;
    },
    clearTimeout() {},
    addEventListener() {},
  };
  ambiente.window = ambiente;

  vm.createContext(ambiente);
  vm.runInContext(codigo, ambiente);
  for (const funcao of ouvintes.pointermove)
    funcao({ pointerType: "mouse", target: botao, clientX: 120, clientY: 20 });

  return dica.textContent;
}

process.stdout.write(JSON.stringify(cenarios.map(rodar)));
"""


def cenario(tecla, escala="1.00", idioma=None, armazenado=None):
    return {
        "tecla": tecla,
        "escala": escala,
        "idioma": idioma,
        "armazenado": armazenado or {},
    }


CENARIOS = {
    "mais_100": cenario("fontUp"),
    "menos_100": cenario("fontDown"),
    "mais_110": cenario("fontUp", "1.10"),
    "menos_110": cenario("fontDown", "1.10"),
    "mais_60": cenario("fontUp", "0.60"),
    "menos_180": cenario("fontDown", "1.80"),
    "arredonda": cenario("fontUp", "1.2000000000000002"),
    "com_espaco": cenario("fontUp", " 1.30 "),
    "ingles_mais": cenario("fontUp", "1.20", idioma="en"),
    "ingles_menos": cenario("fontDown", "0.80", idioma="en"),
    "salvo": cenario("fontUp", "", armazenado={"pythonvisual_escala_fonte": "1.40"}),
    "sem_nada": cenario("fontUp", ""),
    "valor_invalido": cenario("fontUp", "abc", armazenado={"pythonvisual_escala_fonte": "xyz"}),
    "idioma_pt_intacto": cenario("langPt", "1.50"),
    "tema_intacto": cenario("run", "1.50"),
}


@unittest.skipUnless(shutil.which("node"), "Node.js não está instalado")
class TestZoomNaDicaDosBotoes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with tempfile.TemporaryDirectory() as pasta:
            pasta = Path(pasta)
            (pasta / "roteiro.cjs").write_text(SCRIPT_NODE, encoding="utf-8")
            (pasta / "cenarios.json").write_text(json.dumps(list(CENARIOS.values())), encoding="utf-8")
            resultado = subprocess.run(
                ["node", str(pasta / "roteiro.cjs"), str(TOOLTIP), str(pasta / "cenarios.json")],
                capture_output=True,
                text=True,
                encoding="utf-8",
                timeout=60,
            )

        if resultado.returncode != 0:
            raise AssertionError(resultado.stderr)

        cls.dicas = dict(zip(CENARIOS, json.loads(resultado.stdout)))

    def test_aumentar_mostra_o_zoom_atual(self):
        self.assertEqual(
            self.dicas["mais_100"],
            "Aumentar a fonte da página (máximo de 180%)\nZoom atual: 100%",
        )

    def test_diminuir_mostra_o_zoom_atual(self):
        self.assertEqual(
            self.dicas["menos_100"],
            "Diminuir a fonte da página (mínimo de 60%)\nZoom atual: 100%",
        )

    def test_os_dois_botoes_acompanham_o_zoom_da_pagina(self):
        self.assertIn("Zoom atual: 110%", self.dicas["mais_110"])
        self.assertIn("Zoom atual: 110%", self.dicas["menos_110"])

    def test_nos_limites_do_zoom(self):
        self.assertIn("Zoom atual: 60%", self.dicas["mais_60"])
        self.assertIn("Zoom atual: 180%", self.dicas["menos_180"])

    def test_arredonda_o_erro_de_ponto_flutuante(self):
        self.assertIn("Zoom atual: 120%", self.dicas["arredonda"])

    def test_aceita_espacos_ao_redor_do_valor(self):
        self.assertIn("Zoom atual: 130%", self.dicas["com_espaco"])

    def test_em_ingles(self):
        self.assertEqual(
            self.dicas["ingles_mais"],
            "Increase the page font size (maximum 180%)\nCurrent zoom: 120%",
        )
        self.assertEqual(
            self.dicas["ingles_menos"],
            "Decrease the page font size (minimum 60%)\nCurrent zoom: 80%",
        )

    def test_sem_valor_na_pagina_vale_o_zoom_salvo(self):
        self.assertIn("Zoom atual: 140%", self.dicas["salvo"])

    def test_sem_nada_ou_com_valor_invalido_vale_100(self):
        self.assertIn("Zoom atual: 100%", self.dicas["sem_nada"])
        self.assertIn("Zoom atual: 100%", self.dicas["valor_invalido"])

    def test_as_outras_dicas_nao_mudam(self):
        self.assertEqual(self.dicas["idioma_pt_intacto"], "Exibir o sistema em português")
        self.assertNotIn("zoom", self.dicas["tema_intacto"])


if __name__ == "__main__":
    unittest.main()
