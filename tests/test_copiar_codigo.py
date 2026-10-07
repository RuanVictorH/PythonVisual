import json
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from tests.test_abas_direita import carregar_index, chaves_de_traducao

RAIZ = Path(__file__).resolve().parents[1]
MODULO = RAIZ / "static" / "js" / "copiar-codigo.js"
TOOLTIP = RAIZ / "static" / "js" / "tooltip.js"
CSS = RAIZ / "static" / "css" / "style.css"

# Roda o copiar-codigo.js de verdade, com a área de transferência, o documento e os
# elementos da página simulados, e escreve em JSON o que aconteceu em cada cenário.
SCRIPT_NODE = r"""
import { copiarTexto, iniciarCopiarCodigo } from "./copiar-codigo.mjs";

const CODIGO = "def f():\n    return 'ação'\n";

// documento de mentira com o campo escondido do método antigo
function criarDocumento(comportamento) {
  const registro = { anexado: false, removido: false, selecionado: false, focoDevolvido: false };
  const campo = {
    value: "",
    style: {},
    atributos: {},
    setAttribute(nome, valor) {
      this.atributos[nome] = valor;
    },
    select() {
      registro.selecionado = true;
    },
    setSelectionRange(inicio, fim) {
      registro.intervalo = [inicio, fim];
    },
    remove() {
      registro.removido = true;
    },
  };
  const ativo = {
    focus(opcoes) {
      registro.focoDevolvido = true;
      registro.opcoesDeFoco = opcoes;
    },
  };
  const documento = {
    activeElement: ativo,
    body: {
      appendChild(elemento) {
        registro.anexado = elemento === campo;
      },
    },
    createElement(tag) {
      registro.tag = tag;
      return campo;
    },
    execCommand(comando) {
      registro.comando = comando;
      registro.valorNoComando = campo.value;
      registro.selecionadoNoComando = registro.selecionado;
      if (comportamento === "lanca") throw new Error("bloqueado");
      return comportamento === "ok";
    },
  };
  return { documento, registro, campo };
}

function clipboardQue(resultado) {
  const gravados = [];
  return {
    gravados,
    writeText: async (texto) => {
      gravados.push(texto);
      if (resultado === "recusa") throw new Error("negado");
    },
  };
}

async function cenariosDeCopia() {
  const saida = {};

  {
    const clipboard = clipboardQue("ok");
    const { documento, registro } = criarDocumento("ok");
    saida.api_moderna = {
      copiou: await copiarTexto(CODIGO, { clipboard, documento }),
      gravados: clipboard.gravados,
      usouMetodoAntigo: registro.comando !== undefined,
    };
  }
  {
    const clipboard = clipboardQue("recusa");
    const { documento, registro } = criarDocumento("ok");
    saida.api_recusa = {
      copiou: await copiarTexto(CODIGO, { clipboard, documento }),
      tentouAApi: clipboard.gravados.length === 1,
      comando: registro.comando,
      valorNoComando: registro.valorNoComando,
      selecionadoNoComando: registro.selecionadoNoComando,
      intervalo: registro.intervalo,
      removido: registro.removido,
      focoDevolvido: registro.focoDevolvido,
      semRolar: registro.opcoesDeFoco && registro.opcoesDeFoco.preventScroll,
    };
  }
  {
    const { documento, registro, campo } = criarDocumento("ok");
    saida.sem_api = {
      copiou: await copiarTexto(CODIGO, { clipboard: undefined, documento }),
      tag: registro.tag,
      anexado: registro.anexado,
      somenteLeitura: "readonly" in campo.atributos,
      escondidoParaLeitores: campo.atributos["aria-hidden"],
      removido: registro.removido,
    };
  }
  {
    const { documento, registro } = criarDocumento("falha");
    saida.comando_recusado = {
      copiou: await copiarTexto(CODIGO, { clipboard: undefined, documento }),
      removido: registro.removido,
      focoDevolvido: registro.focoDevolvido,
    };
  }
  {
    const { documento, registro } = criarDocumento("lanca");
    saida.comando_lanca = {
      copiou: await copiarTexto(CODIGO, { clipboard: undefined, documento }),
      removido: registro.removido,
      focoDevolvido: registro.focoDevolvido,
    };
  }
  saida.sem_nada = { copiou: await copiarTexto(CODIGO, { clipboard: undefined, documento: undefined }) };
  saida.documento_sem_corpo = {
    copiou: await copiarTexto(CODIGO, { clipboard: undefined, documento: { createElement() {}, execCommand() {} } }),
  };
  saida.sem_execcommand = {
    copiou: await copiarTexto(CODIGO, { clipboard: undefined, documento: { body: {}, createElement() {} } }),
  };

  return saida;
}

// elementos da página, só com o que o módulo usa
function elemento() {
  const atributos = {};
  const ouvintes = {};
  return {
    atributos,
    textContent: "",
    className: "",
    setAttribute(nome, valor) {
      atributos[nome] = String(valor);
    },
    removeAttribute(nome) {
      delete atributos[nome];
    },
    addEventListener(tipo, funcao) {
      ouvintes[tipo] = funcao;
    },
    clicar() {
      return ouvintes.click();
    },
  };
}

const TEXTOS = {
  "code.copied": "Código copiado!",
  "code.copyEmpty": "Nada para copiar",
  "code.copyFailed": "Não foi possível copiar",
};

async function cenariosDoBotao() {
  const saida = {};
  const original = { document: globalThis.document, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout };
  const navegador = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  function montar({ codigo, clipboard, documentoDeCopia }) {
    const botao = elemento();
    const icone = elemento();
    icone.className = "fa-regular fa-copy";
    botao.querySelector = () => icone;
    const aviso = elemento();
    const pendentes = [];
    const cancelados = [];
    globalThis.document = {
      getElementById: (id) => ({ "btn-copiar": botao, "copiar-aviso": aviso })[id] || null,
      ...(documentoDeCopia || {}),
    };
    Object.defineProperty(globalThis, "navigator", { value: { clipboard }, configurable: true, writable: true });
    globalThis.setTimeout = (funcao, atraso) => {
      pendentes.push({ funcao, atraso });
      return pendentes.length;
    };
    globalThis.clearTimeout = (id) => cancelados.push(id);
    iniciarCopiarCodigo({ obterCodigo: () => codigo.valor, traduzir: (chave) => TEXTOS[chave] });
    return { botao, icone, aviso, pendentes, cancelados };
  }
  const estado = ({ botao, icone, aviso }) => ({
    botao: botao.atributos["data-estado"] || null,
    aviso: aviso.atributos["data-estado"] || null,
    texto: aviso.textContent,
    icone: icone.className,
  });

  try {
    {
      const clipboard = clipboardQue("ok");
      const codigo = { valor: CODIGO };
      const pagina = montar({ codigo, clipboard });
      const antes = estado(pagina);
      await pagina.botao.clicar();
      const depois = estado(pagina);
      pagina.pendentes[0].funcao();
      saida.copiado = {
        antes,
        depois,
        gravados: clipboard.gravados,
        atraso: pagina.pendentes[0].atraso,
        restaurado: estado(pagina),
      };
    }
    {
      const clipboard = clipboardQue("ok");
      const pagina = montar({ codigo: { valor: "" }, clipboard });
      await pagina.botao.clicar();
      saida.vazio = { depois: estado(pagina), gravados: clipboard.gravados };
    }
    {
      const clipboard = clipboardQue("recusa");
      const pagina = montar({ codigo: { valor: CODIGO }, clipboard });
      await pagina.botao.clicar();
      saida.falhou = { depois: estado(pagina) };
    }
    {
      const clipboard = clipboardQue("ok");
      const pagina = montar({ codigo: { valor: CODIGO }, clipboard });
      await pagina.botao.clicar();
      await pagina.botao.clicar();
      saida.dois_cliques = { cancelou: pagina.cancelados.length, agendados: pagina.pendentes.length, gravados: clipboard.gravados.length };
    }
    {
      // o código muda entre um clique e outro: copia o que está no editor na hora
      const clipboard = clipboardQue("ok");
      const codigo = { valor: "a = 1" };
      const pagina = montar({ codigo, clipboard });
      await pagina.botao.clicar();
      codigo.valor = "a = 2";
      await pagina.botao.clicar();
      saida.codigo_atual = { gravados: clipboard.gravados };
    }
    {
      globalThis.document = { getElementById: () => null };
      let erro = null;
      try {
        iniciarCopiarCodigo({ obterCodigo: () => "x", traduzir: (chave) => chave });
      } catch (excecao) {
        erro = String(excecao);
      }
      saida.sem_elementos = { erro };
    }
  } finally {
    globalThis.document = original.document;
    globalThis.setTimeout = original.setTimeout;
    globalThis.clearTimeout = original.clearTimeout;
    if (navegador) Object.defineProperty(globalThis, "navigator", navegador);
  }

  return saida;
}

const copia = await cenariosDeCopia();
const botao = await cenariosDoBotao();
process.stdout.write(JSON.stringify({ copia, botao }));
"""

CODIGO = "def f():\n    return 'ação'\n"


@unittest.skipUnless(shutil.which("node"), "Node.js não está instalado")
class TestCopiarCodigo(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with tempfile.TemporaryDirectory() as pasta:
            pasta = Path(pasta)
            (pasta / "copiar-codigo.mjs").write_text(
                MODULO.read_text(encoding="utf-8"), encoding="utf-8"
            )
            (pasta / "roteiro.mjs").write_text(SCRIPT_NODE, encoding="utf-8")
            resultado = subprocess.run(
                ["node", "roteiro.mjs"],
                cwd=pasta,
                capture_output=True,
                text=True,
                encoding="utf-8",
                timeout=60,
            )

        if resultado.returncode != 0:
            raise AssertionError(resultado.stderr)

        dados = json.loads(resultado.stdout)
        cls.copia = dados["copia"]
        cls.botao = dados["botao"]

    def test_usa_a_api_da_area_de_transferencia_quando_ela_funciona(self):
        r = self.copia["api_moderna"]

        self.assertTrue(r["copiou"])
        self.assertEqual(r["gravados"], [CODIGO])
        self.assertFalse(r["usouMetodoAntigo"])

    def test_se_a_api_recusa_cai_no_metodo_do_campo_escondido(self):
        r = self.copia["api_recusa"]

        self.assertTrue(r["copiou"])
        self.assertTrue(r["tentouAApi"])
        self.assertEqual(r["comando"], "copy")
        # o campo já tinha o texto e estava selecionado quando o comando rodou
        self.assertEqual(r["valorNoComando"], CODIGO)
        self.assertTrue(r["selecionadoNoComando"])
        self.assertEqual(r["intervalo"], [0, len(CODIGO)])

    def test_metodo_antigo_limpa_o_que_criou_e_devolve_o_foco(self):
        for cenario in ("api_recusa", "comando_recusado", "comando_lanca"):
            with self.subTest(cenario=cenario):
                r = self.copia[cenario]

                self.assertTrue(r["removido"])
                self.assertTrue(r["focoDevolvido"])

        self.assertTrue(self.copia["api_recusa"]["semRolar"])

    def test_sem_a_api_o_campo_escondido_nao_atrapalha_a_pagina(self):
        r = self.copia["sem_api"]

        self.assertTrue(r["copiou"])
        self.assertEqual(r["tag"], "textarea")
        self.assertTrue(r["anexado"])
        self.assertTrue(r["somenteLeitura"])
        self.assertEqual(r["escondidoParaLeitores"], "true")
        self.assertTrue(r["removido"])

    def test_devolve_false_quando_nada_consegue_copiar(self):
        for cenario in (
            "comando_recusado",
            "comando_lanca",
            "sem_nada",
            "documento_sem_corpo",
            "sem_execcommand",
        ):
            with self.subTest(cenario=cenario):
                self.assertFalse(self.copia[cenario]["copiou"])

    def test_clique_copia_e_avisa(self):
        r = self.botao["copiado"]

        self.assertEqual(
            r["antes"],
            {"botao": None, "aviso": None, "texto": "", "icone": "fa-regular fa-copy"},
        )
        self.assertEqual(
            r["depois"],
            {
                "botao": "copiado",
                "aviso": "copiado",
                "texto": "Código copiado!",
                "icone": "fa-solid fa-check",
            },
        )
        self.assertEqual(r["gravados"], [CODIGO])

    def test_aviso_some_depois_de_um_tempo(self):
        r = self.botao["copiado"]

        self.assertEqual(r["atraso"], 1800)
        self.assertEqual(r["restaurado"], r["antes"])

    def test_editor_vazio_avisa_e_nao_copia(self):
        r = self.botao["vazio"]

        self.assertEqual(r["gravados"], [])
        self.assertEqual(r["depois"]["botao"], "vazio")
        self.assertEqual(r["depois"]["texto"], "Nada para copiar")
        self.assertEqual(r["depois"]["icone"], "fa-regular fa-copy")

    def test_falha_ao_copiar_avisa(self):
        r = self.botao["falhou"]["depois"]

        self.assertEqual(r["botao"], "falhou")
        self.assertEqual(r["texto"], "Não foi possível copiar")
        self.assertEqual(r["icone"], "fa-solid fa-triangle-exclamation")

    def test_novo_clique_reinicia_a_contagem_do_aviso(self):
        r = self.botao["dois_cliques"]

        self.assertEqual(r["gravados"], 2)
        self.assertEqual(r["agendados"], 2)
        self.assertEqual(r["cancelou"], 2)

    def test_copia_o_codigo_do_momento_do_clique(self):
        self.assertEqual(self.botao["codigo_atual"]["gravados"], ["a = 1", "a = 2"])

    def test_pagina_sem_o_botao_nao_da_erro(self):
        self.assertIsNone(self.botao["sem_elementos"]["erro"])


class TestBotaoNaPagina(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.index = carregar_index()

    def test_botao_fica_no_cabecalho_do_card_codigo_antes_do_recolher(self):
        botao = self.index.por_id["btn-copiar"]
        acoes = botao.pai
        cabecalho = acoes.pai

        self.assertIn("card-header-acoes", acoes.classes)
        self.assertIn("card-header", cabecalho.classes)
        self.assertEqual(cabecalho.pai.id, "codigo-card")
        self.assertEqual(
            [no.id or " ".join(no.classes) for no in acoes.filhos],
            ["copiar-aviso", "btn-copiar", "btn-recolher"],
        )

    def test_atributos_do_botao(self):
        botao = self.index.por_id["btn-copiar"]

        self.assertEqual(botao.tag, "button")
        self.assertEqual(botao.atributos["type"], "button")
        self.assertEqual(botao.atributos["data-tip"], "copyCode")
        self.assertEqual(botao.atributos["data-i18n-aria"], "code.copy")
        self.assertTrue(botao.atributos["aria-label"])
        self.assertEqual(botao.filhos[0].atributos["aria-hidden"], "true")

    def test_aviso_e_anunciado_pelos_leitores_de_tela(self):
        aviso = self.index.por_id["copiar-aviso"]

        self.assertEqual(aviso.atributos["role"], "status")
        self.assertEqual(aviso.atributos["aria-live"], "polite")

    def test_modulo_usa_os_ids_do_html(self):
        modulo = MODULO.read_text(encoding="utf-8")
        ids = dict(re.findall(r'const (ID_\w+) = "([^"]+)";', modulo))

        self.assertEqual(ids["ID_BOTAO"], "btn-copiar")
        self.assertEqual(ids["ID_AVISO"], "copiar-aviso")
        self.assertIn(ids["ID_BOTAO"], self.index.por_id)
        self.assertIn(ids["ID_AVISO"], self.index.por_id)

    def test_textos_existem_nos_dois_idiomas(self):
        modulo = MODULO.read_text(encoding="utf-8")
        chaves = set(re.findall(r'chave: "(code\.[A-Za-z]+)"', modulo)) | {"code.copy"}

        self.assertEqual(
            chaves,
            {"code.copy", "code.copied", "code.copyEmpty", "code.copyFailed"},
        )

        for idioma in ("pt", "en"):
            with self.subTest(idioma=idioma):
                self.assertEqual(chaves - chaves_de_traducao(idioma), set())

    def test_dica_do_botao_existe_nos_dois_idiomas(self):
        texto = TOOLTIP.read_text(encoding="utf-8").replace("\r\n", "\n")
        portugues = texto[texto.index("    pt: {") : texto.index("    en: {")]
        ingles = texto[texto.index("    en: {") :]

        self.assertIn("copyCode:", portugues)
        self.assertIn("copyCode:", ingles)

    def test_estilo_do_botao_acompanha_os_outros_botoes_quadrados(self):
        css = CSS.read_text(encoding="utf-8").replace("\r\n", "\n")

        # as regras antigas de celular forçam o padding de todo botão: sem estas
        # listas o botão de copiar ficaria deformado
        self.assertRegex(
            css,
            r"\.btn-recolher,\s*\.btn-tela-cheia,\s*\.btn-copiar\s*\{\s*padding: 0 !important;",
        )
        self.assertRegex(
            css,
            r"\.btn-recolher,\s*\.btn-tela-cheia,\s*\.btn-copiar\s*\{\s*width: 26px;",
        )
        self.assertRegex(
            css,
            r"body\.tema-escuro \.btn-tela-cheia,\s*body\.tema-escuro \.btn-copiar\s*\{",
        )


if __name__ == "__main__":
    unittest.main()
