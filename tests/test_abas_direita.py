import json
import re
import shutil
import subprocess
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
INDEX = RAIZ / "templates" / "index.html"
MODULO = RAIZ / "static" / "js" / "abas-direita.js"
I18N = RAIZ / "static" / "js" / "i18n.js"
CSS = RAIZ / "static" / "css" / "style.css"

ATRIBUTOS_DE_TRADUCAO = (
    "data-i18n",
    "data-i18n-aria",
    "data-i18n-placeholder",
)

ELEMENTOS_VAZIOS = {
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
}


class No:
    def __init__(self, tag, atributos, pai):
        self.tag = tag
        self.atributos = dict(atributos)
        self.pai = pai
        self.filhos = []

    @property
    def id(self):
        return self.atributos.get("id", "")

    @property
    def classes(self):
        return self.atributos.get("class", "").split()

    def descendentes(self):
        for filho in self.filhos:
            yield filho
            yield from filho.descendentes()

    def ancestrais(self):
        no = self.pai
        while no is not None:
            yield no
            no = no.pai


class Arvore(HTMLParser):
    """Árvore de elementos do HTML, o bastante para conferir a estrutura."""

    def __init__(self):
        super().__init__()
        self.raiz = No("raiz", [], None)
        self.atual = self.raiz
        self.por_id = {}

    def handle_starttag(self, tag, atributos):
        no = No(tag, atributos, self.atual)
        self.atual.filhos.append(no)

        if no.id:
            self.por_id[no.id] = no

        if tag not in ELEMENTOS_VAZIOS:
            self.atual = no

    def handle_endtag(self, tag):
        no = self.atual

        while no is not self.raiz and no.tag != tag:
            no = no.pai

        if no is not self.raiz:
            self.atual = no.pai

    def por_classe(self, classe):
        for no in self.raiz.descendentes():
            if classe in no.classes:
                return no

        return None


def carregar_index():
    arvore = Arvore()
    arvore.feed(INDEX.read_text(encoding="utf-8"))
    return arvore


def chaves_de_traducao(idioma):
    """Lê as chaves do dicionário de um idioma em static/js/i18n.js."""
    texto = I18N.read_text(encoding="utf-8").replace("\r\n", "\n")
    inicio = texto.index(f"\n  {idioma}: {{")
    fim = texto.index("\n  }", inicio)
    bloco = texto[inicio:fim]
    chaves = re.findall(r'^    (?:"([^"]+)"|([A-Za-z_]\w*)):', bloco, re.M)

    return {aspas or simples for aspas, simples in chaves}


class TestEstruturaDasAbas(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.index = carregar_index()
        cls.coluna = cls.index.por_classe("coluna-direita")

    def test_ordem_dos_cards_da_coluna_da_direita(self):
        ids_ou_classes = [
            filho.id or " ".join(filho.classes) for filho in self.coluna.filhos
        ]

        self.assertEqual(
            ids_ou_classes,
            ["abas-direita", "saida", "fluxo-card", "entrada-card"]
            + ["faixa-saida-pilha"],
        )

    def test_fluxograma_fica_dentro_da_coluna_da_direita(self):
        fluxo = self.index.por_id["fluxo-card"]

        self.assertIs(fluxo.pai, self.coluna)

    def test_saida_e_pilha_ficam_lado_a_lado_na_faixa(self):
        faixa = self.index.por_classe("faixa-saida-pilha")

        ids = [no.id for no in faixa.filhos]

        self.assertIs(faixa.pai, self.coluna)
        self.assertEqual(ids, ["saida-card", "pilha-card"])

    def test_cards_comecam_escondidos(self):
        for id_card in ("saida", "fluxo-card", "saida-card", "pilha-card"):
            with self.subTest(card=id_card):
                estilo = self.index.por_id[id_card].atributos.get("style", "")
                self.assertIn("display:none", estilo.replace(" ", ""))

    def test_cada_aba_controla_um_painel_da_coluna(self):
        barra = self.index.por_id["abas-direita"]
        abas = [no for no in barra.filhos if no.tag == "button"]

        self.assertEqual(
            [aba.id for aba in abas], ["aba-visualizacao", "aba-fluxograma"]
        )

        for aba, painel in zip(abas, ("saida", "fluxo-card")):
            with self.subTest(aba=aba.id):
                self.assertEqual(aba.atributos["aria-controls"], painel)
                self.assertEqual(aba.id, "aba-" + aba.atributos["data-aba"])
                self.assertIn(painel, self.index.por_id)

    def test_estado_inicial_das_abas(self):
        barra = self.index.por_id["abas-direita"]
        visualizacao = self.index.por_id["aba-visualizacao"]
        fluxograma = self.index.por_id["aba-fluxograma"]

        self.assertIn("hidden", barra.atributos)
        self.assertEqual(visualizacao.atributos["aria-pressed"], "true")
        self.assertEqual(fluxograma.atributos["aria-pressed"], "false")
        self.assertNotIn("disabled", visualizacao.atributos)
        self.assertIn("disabled", fluxograma.atributos)

    def test_rotulos_das_abas_reusam_as_chaves_dos_cabecalhos(self):
        self.assertEqual(
            self.index.por_id["aba-visualizacao"].atributos["data-i18n"],
            "section.visualization",
        )
        self.assertEqual(
            self.index.por_id["aba-fluxograma"].atributos["data-i18n"],
            "section.flowchart",
        )

    def test_chaves_de_traducao_do_index_existem_nos_dois_idiomas(self):
        usadas = set()

        for no in self.index.raiz.descendentes():
            for atributo in ATRIBUTOS_DE_TRADUCAO:
                if atributo in no.atributos:
                    usadas.add(no.atributos[atributo])

        self.assertIn("tabs.label", usadas)

        for idioma in ("pt", "en"):
            faltando = usadas - chaves_de_traducao(idioma)

            with self.subTest(idioma=idioma):
                self.assertEqual(faltando, set())

    def test_subtitulo_do_visualizador_foi_removido(self):
        self.assertIsNone(self.index.por_classe("intro-visualizador"))

        for idioma in ("pt", "en"):
            with self.subTest(idioma=idioma):
                self.assertNotIn("app.subtitle", chaves_de_traducao(idioma))

    def test_classe_do_modulo_existe_no_css(self):
        modulo = MODULO.read_text(encoding="utf-8")
        achado = re.search(r'const CLASSE_FLUXOGRAMA = "([^"]+)"', modulo)
        classe = achado.group(1)
        css = CSS.read_text(encoding="utf-8")

        self.assertIn(f".coluna-direita.{classe} > #saida", css)
        self.assertIn(f".coluna-direita:not(.{classe}) > #fluxo-card", css)


# Um DOM de mentira só com o que o módulo usa: ids, estilo, classes, atributos,
# ouvintes de clique e um MutationObserver que o roteiro dispara à mão.
SCRIPT_NODE = """
class Classes {
  constructor() {
    this.conjunto = new Set();
  }

  add(nome) {
    this.conjunto.add(nome);
  }

  remove(nome) {
    this.conjunto.delete(nome);
  }

  contains(nome) {
    return this.conjunto.has(nome);
  }

  toggle(nome, forcar) {
    const ligar = forcar === undefined ? !this.conjunto.has(nome) : forcar;
    if (ligar)
      this.conjunto.add(nome);
    else
      this.conjunto.delete(nome);
    return ligar;
  }
}

class Elemento {
  constructor(id, opcoes = {}) {
    this.id = id;
    this.tagName = (opcoes.tag || "div").toUpperCase();
    this.style = { display: opcoes.display || "" };
    this.hidden = false;
    this.disabled = false;
    this.dataset = opcoes.aba ? { aba: opcoes.aba } : {};
    this.atributos = { ...(opcoes.atributos || {}) };
    this.classList = new Classes();
    this.ouvintes = {};
  }

  setAttribute(nome, valor) {
    this.atributos[nome] = String(valor);
  }

  getAttribute(nome) {
    return this.atributos[nome];
  }

  addEventListener(tipo, funcao) {
    this.ouvintes[tipo] = funcao;
  }

  closest(seletor) {
    const ehAba = this.tagName === "BUTTON" && this.dataset.aba;
    return seletor === "button[data-aba]" && ehAba ? this : null;
  }
}

const elementos = {
  "abas-direita": new Elemento("abas-direita"),
  "aba-visualizacao": new Elemento("aba-visualizacao", {
    tag: "button",
    aba: "visualizacao",
    atributos: { "aria-pressed": "true" },
  }),
  "aba-fluxograma": new Elemento("aba-fluxograma", {
    tag: "button",
    aba: "fluxograma",
    atributos: { "aria-pressed": "false" },
  }),
  saida: new Elemento("saida", { display: "none" }),
  "fluxo-card": new Elemento("fluxo-card", { display: "none" }),
};
elementos["abas-direita"].hidden = true;
elementos["aba-fluxograma"].disabled = true;

const coluna = new Elemento("coluna-direita");
const observadores = [];

globalThis.document = {
  getElementById: (id) => elementos[id] || null,
  querySelector: (seletor) => (seletor === ".coluna-direita" ? coluna : null),
};
globalThis.MutationObserver = class {
  constructor(funcao) {
    this.funcao = funcao;
    observadores.push(this);
  }

  observe() {}
};
globalThis.requestAnimationFrame = (funcao) => funcao();

const { iniciarAbas } = await import("./abas-direita.mjs");
const chamadas = [];

iniciarAbas({
  aoMostrarFluxograma: () => chamadas.push("fluxograma"),
  aoMostrarVisualizacao: () => chamadas.push("visualizacao"),
});

const fotos = [];

function foto(passo) {
  fotos.push({
    passo,
    barraOculta: elementos["abas-direita"].hidden,
    fluxogramaDesabilitado: elementos["aba-fluxograma"].disabled,
    classes: [...coluna.classList.conjunto],
    pressionadas: [
      elementos["aba-visualizacao"].getAttribute("aria-pressed"),
      elementos["aba-fluxograma"].getAttribute("aria-pressed"),
    ],
    chamadas: [...chamadas],
  });
}

function mostrar(id, visivel) {
  elementos[id].style.display = visivel ? "block" : "none";
  observadores.forEach((observador) => observador.funcao());
}

function clicar(id) {
  elementos["abas-direita"].ouvintes.click({ target: elementos[id] });
}

foto("inicio");

mostrar("saida", true);
foto("visualizacao_a_vista");

mostrar("fluxo-card", true);
foto("fluxograma_a_vista");

clicar("aba-fluxograma");
foto("abriu_fluxograma");

clicar("aba-visualizacao");
foto("voltou_para_visualizacao");

clicar("aba-fluxograma");
mostrar("fluxo-card", false);
foto("fluxograma_sumiu_com_a_aba_aberta");

clicar("aba-fluxograma");
foto("clique_na_aba_desabilitada");

mostrar("fluxo-card", true);
clicar("aba-fluxograma");
mostrar("saida", false);
foto("visualizacao_sumiu_com_a_aba_fluxograma_aberta");

process.stdout.write(JSON.stringify(fotos));
"""


@unittest.skipUnless(shutil.which("node"), "Node.js não está instalado")
class TestComportamentoDasAbas(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pasta = tempfile.TemporaryDirectory()
        pasta = Path(cls.pasta.name)
        shutil.copy(MODULO, pasta / "abas-direita.mjs")
        (pasta / "rodar.mjs").write_text(SCRIPT_NODE, encoding="utf-8")

        resultado = subprocess.run(
            ["node", "rodar.mjs"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            cwd=cls.pasta.name,
            timeout=60,
        )

        if resultado.returncode != 0:
            cls.pasta.cleanup()
            raise AssertionError(resultado.stderr)

        fotos = json.loads(resultado.stdout)
        cls.fotos = {item["passo"]: item for item in fotos}

    @classmethod
    def tearDownClass(cls):
        cls.pasta.cleanup()

    def test_antes_da_primeira_execucao_nao_ha_abas(self):
        inicio = self.fotos["inicio"]

        self.assertTrue(inicio["barraOculta"])
        self.assertTrue(inicio["fluxogramaDesabilitado"])
        self.assertEqual(inicio["classes"], [])
        self.assertEqual(inicio["pressionadas"], ["true", "false"])

    def test_barra_aparece_com_o_card_visualizacao(self):
        foto = self.fotos["visualizacao_a_vista"]

        self.assertFalse(foto["barraOculta"])
        self.assertTrue(foto["fluxogramaDesabilitado"])

    def test_aba_fluxograma_habilita_com_o_card_fluxograma(self):
        foto = self.fotos["fluxograma_a_vista"]

        self.assertFalse(foto["fluxogramaDesabilitado"])

    def test_abrir_o_fluxograma_troca_o_painel_e_avisa_o_diagrama(self):
        foto = self.fotos["abriu_fluxograma"]

        self.assertEqual(foto["classes"], ["aba-fluxograma"])
        self.assertEqual(foto["pressionadas"], ["false", "true"])
        self.assertEqual(foto["chamadas"], ["fluxograma"])

    def test_voltar_para_a_visualizacao_avisa_as_setas_da_memoria(self):
        foto = self.fotos["voltou_para_visualizacao"]

        self.assertEqual(foto["classes"], [])
        self.assertEqual(foto["pressionadas"], ["true", "false"])
        self.assertEqual(foto["chamadas"], ["fluxograma", "visualizacao"])

    def test_sem_fluxograma_a_aba_volta_sozinha_para_a_visualizacao(self):
        foto = self.fotos["fluxograma_sumiu_com_a_aba_aberta"]

        self.assertTrue(foto["fluxogramaDesabilitado"])
        self.assertEqual(foto["classes"], [])
        self.assertEqual(foto["pressionadas"], ["true", "false"])

    def test_clique_na_aba_desabilitada_nao_faz_nada(self):
        antes = self.fotos["fluxograma_sumiu_com_a_aba_aberta"]
        depois = self.fotos["clique_na_aba_desabilitada"]

        self.assertEqual(depois["classes"], [])
        self.assertEqual(depois["pressionadas"], ["true", "false"])
        self.assertEqual(depois["chamadas"], antes["chamadas"])

    def test_sem_o_card_visualizacao_a_barra_some_e_a_aba_volta(self):
        foto = self.fotos["visualizacao_sumiu_com_a_aba_fluxograma_aberta"]

        self.assertTrue(foto["barraOculta"])
        self.assertEqual(foto["classes"], [])
        self.assertEqual(foto["pressionadas"], ["true", "false"])


if __name__ == "__main__":
    unittest.main()
