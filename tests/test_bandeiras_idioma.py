import re
import unittest
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
IMAGENS = RAIZ / "static" / "img"
TEMPLATES = RAIZ / "templates"
PARCIAL = TEMPLATES / "_language_switch.html"
PAGINAS = ("index.html", "home.html", "sobre.html", "limitacoes.html")

BANDEIRAS = {
    "lang-pt": "/static/img/bandeira-brasil.svg",
    "lang-en": "/static/img/bandeira-reino-unido.svg",
}


class Botoes(HTMLParser):
    """Lê do seletor de idioma, para cada botão, a imagem e o texto visível."""

    def __init__(self):
        super().__init__()
        self.botoes = {}
        self.atual = None

    def handle_starttag(self, tag, atributos):
        atributos = dict(atributos)

        if tag == "button":
            self.atual = {"atributos": atributos, "imagens": [], "texto": ""}
            self.botoes[atributos["id"]] = self.atual
        elif tag == "img" and self.atual is not None:
            self.atual["imagens"].append(atributos)

    def handle_endtag(self, tag):
        if tag == "button":
            self.atual = None

    def handle_data(self, dados):
        if self.atual is not None:
            self.atual["texto"] += dados


def ler_botoes():
    analisador = Botoes()
    analisador.feed(PARCIAL.read_text(encoding="utf-8"))

    return analisador.botoes


def ler_svg(nome):
    arquivo = IMAGENS / nome
    texto = arquivo.read_text(encoding="utf-8")

    return ET.fromstring(texto), texto.lower()


class TestArquivosDasBandeiras(unittest.TestCase):
    def test_sao_svg_validos(self):
        for nome in ("bandeira-brasil.svg", "bandeira-reino-unido.svg"):
            with self.subTest(arquivo=nome):
                raiz, _ = ler_svg(nome)

                self.assertTrue(raiz.tag.endswith("}svg"), raiz.tag)

    def test_proporcao_de_10_por_7_nas_duas(self):
        # as duas ocupam o mesmo retângulo de 20x14 no botão
        for nome in ("bandeira-brasil.svg", "bandeira-reino-unido.svg"):
            with self.subTest(arquivo=nome):
                raiz, _ = ler_svg(nome)
                _, _, largura, altura = (float(n) for n in raiz.attrib["viewBox"].split())

                self.assertAlmostEqual(largura / altura, 10 / 7, places=6)

    def test_cores_do_brasil(self):
        _, texto = ler_svg("bandeira-brasil.svg")

        for cor in ("#009c3b", "#ffdf00", "#002776", "#ffffff"):
            with self.subTest(cor=cor):
                self.assertIn(cor, texto)

    def test_cores_do_reino_unido(self):
        _, texto = ler_svg("bandeira-reino-unido.svg")

        for cor in ("#012169", "#c8102e", "#ffffff"):
            with self.subTest(cor=cor):
                self.assertIn(cor, texto)

    def test_nao_dependem_de_endereco_externo(self):
        for nome in ("bandeira-brasil.svg", "bandeira-reino-unido.svg"):
            with self.subTest(arquivo=nome):
                _, texto = ler_svg(nome)
                externos = re.findall(r'(?:href|src)="(?!#)[^"]+"', texto)

                self.assertEqual(externos, [])


class TestSeletorDeIdioma(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.botoes = ler_botoes()

    def test_dois_botoes_de_idioma(self):
        self.assertEqual(list(self.botoes), ["lang-pt", "lang-en"])

    def test_cada_botao_tem_a_bandeira_do_seu_idioma(self):
        for id_botao, caminho in BANDEIRAS.items():
            with self.subTest(botao=id_botao):
                imagens = self.botoes[id_botao]["imagens"]

                self.assertEqual(len(imagens), 1)
                self.assertEqual(imagens[0]["src"], caminho)
                self.assertIn("lang-bandeira", imagens[0]["class"].split())

    def test_arquivos_das_bandeiras_existem(self):
        for caminho in BANDEIRAS.values():
            with self.subTest(caminho=caminho):
                self.assertTrue((RAIZ / caminho.lstrip("/")).is_file())

    def test_bandeira_e_decorativa_e_o_botao_continua_com_texto_e_nome(self):
        esperado = {"lang-pt": ("PT", "Português"), "lang-en": ("EN", "English")}

        for id_botao, (texto, nome) in esperado.items():
            with self.subTest(botao=id_botao):
                botao = self.botoes[id_botao]

                self.assertEqual(botao["imagens"][0]["alt"], "")
                self.assertEqual(botao["texto"].strip(), texto)
                self.assertEqual(botao["atributos"]["aria-label"], nome)

    def test_so_a_bandeira_do_brasil_fica_de_cabeca_para_baixo(self):
        classes_pt = self.botoes["lang-pt"]["imagens"][0]["class"].split()
        classes_en = self.botoes["lang-en"]["imagens"][0]["class"].split()

        self.assertIn("lang-bandeira-invertida", classes_pt)
        self.assertNotIn("lang-bandeira-invertida", classes_en)

        css = (RAIZ / "static" / "css" / "header.css").read_text(encoding="utf-8")
        regra = re.search(r"\.lang-bandeira-invertida\s*\{([^}]*)\}", css)

        self.assertIsNotNone(regra)
        self.assertIn("transform: rotate(180deg)", regra.group(1))

    def test_o_arquivo_da_bandeira_do_brasil_segue_o_desenho_normal(self):
        # a inversão é só de CSS: tirar a regra devolve a bandeira ao normal
        _, texto = ler_svg("bandeira-brasil.svg")

        self.assertNotIn("rotate", texto)
        self.assertNotIn("scale(", texto)

    def test_todas_as_paginas_usam_o_mesmo_seletor(self):
        for pagina in PAGINAS:
            with self.subTest(pagina=pagina):
                texto = (TEMPLATES / pagina).read_text(encoding="utf-8")

                self.assertIn('{% include "_language_switch.html" %}', texto)


if __name__ == "__main__":
    unittest.main()
