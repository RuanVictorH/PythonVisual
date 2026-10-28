import struct
import unittest
from html.parser import HTMLParser
from pathlib import Path

import app as aplicacao

RAIZ = Path(__file__).resolve().parents[1]
IMAGENS = RAIZ / "static" / "img"
TEMPLATES = RAIZ / "templates"
PARCIAL = TEMPLATES / "_favicon.html"
PAGINAS = ("index.html", "home.html", "sobre.html", "limitacoes.html")

ASSINATURA_PNG = b"\x89PNG\r\n\x1a\n"


class Links(HTMLParser):
    """Lê do parcial os <link> de ícone, com seus atributos."""

    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, atributos):
        if tag == "link":
            self.links.append(dict(atributos))


def ler_links():
    analisador = Links()
    analisador.feed(PARCIAL.read_text(encoding="utf-8"))

    return analisador.links


def ler_ico(caminho):
    """Devolve, para cada imagem do .ico, (largura, altura, bytes da imagem)."""
    dados = caminho.read_bytes()
    reservado, tipo, quantidade = struct.unpack_from("<HHH", dados, 0)
    imagens = []

    for i in range(quantidade):
        largura, altura, _, _, _, _, tamanho, deslocamento = struct.unpack_from(
            "<BBBBHHII", dados, 6 + 16 * i
        )
        imagens.append((largura, altura, dados[deslocamento : deslocamento + tamanho]))

    return reservado, tipo, imagens


def tamanho_do_png(imagem):
    largura, altura = struct.unpack(">II", imagem[16:24])

    return largura, altura


class TestArquivosDoFavicon(unittest.TestCase):
    def test_ico_e_valido_e_tem_16_32_e_48(self):
        reservado, tipo, imagens = ler_ico(IMAGENS / "favicon.ico")

        self.assertEqual((reservado, tipo), (0, 1))
        self.assertEqual([(l, a) for l, a, _ in imagens], [(16, 16), (32, 32), (48, 48)])

    def test_cada_imagem_do_ico_e_um_png_do_tamanho_declarado(self):
        _, _, imagens = ler_ico(IMAGENS / "favicon.ico")

        for largura, altura, imagem in imagens:
            with self.subTest(tamanho=largura):
                self.assertTrue(imagem.startswith(ASSINATURA_PNG))
                self.assertEqual(tamanho_do_png(imagem), (largura, altura))

    def test_apple_touch_icon_e_um_png_de_180_por_180(self):
        imagem = (IMAGENS / "apple-touch-icon.png").read_bytes()

        self.assertTrue(imagem.startswith(ASSINATURA_PNG))
        self.assertEqual(tamanho_do_png(imagem), (180, 180))


class TestLigacaoDoFavicon(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.links = {link["rel"]: link for link in ler_links()}

    def test_parcial_declara_o_icone_e_o_apple_touch_icon(self):
        self.assertEqual(set(self.links), {"icon", "apple-touch-icon"})
        self.assertEqual(self.links["icon"]["href"], "/static/img/favicon.ico")
        self.assertEqual(self.links["apple-touch-icon"]["href"], "/static/img/apple-touch-icon.png")

    def test_arquivos_apontados_existem(self):
        for rel, link in self.links.items():
            with self.subTest(rel=rel):
                self.assertTrue((RAIZ / link["href"].lstrip("/")).is_file())

    def test_todas_as_paginas_usam_o_mesmo_parcial(self):
        for pagina in PAGINAS:
            with self.subTest(pagina=pagina):
                texto = (TEMPLATES / pagina).read_text(encoding="utf-8")
                cabecalho = texto.split("</head>")[0]

                self.assertIn('{% include "_favicon.html" %}', cabecalho)

    def test_paginas_renderizadas_trazem_os_links_do_favicon(self):
        cliente = aplicacao.app.test_client()

        for rota in ("/", "/visualizador", "/sobre", "/limitacoes"):
            with self.subTest(rota=rota):
                html = cliente.get(rota).get_data(as_text=True)

                self.assertIn('<link rel="icon" href="/static/img/favicon.ico"', html)
                self.assertIn('<link rel="apple-touch-icon" href="/static/img/apple-touch-icon.png"', html)


class TestRotaDoFavicon(unittest.TestCase):
    def test_favicon_ico_na_raiz_devolve_o_mesmo_arquivo(self):
        with aplicacao.app.test_client().get("/favicon.ico") as resposta:
            self.assertEqual(resposta.status_code, 200)
            self.assertEqual(resposta.mimetype, "image/vnd.microsoft.icon")
            self.assertEqual(resposta.data, (IMAGENS / "favicon.ico").read_bytes())

    def test_arquivos_estaticos_sao_servidos(self):
        cliente = aplicacao.app.test_client()

        for caminho in ("/static/img/favicon.ico", "/static/img/apple-touch-icon.png"):
            with self.subTest(caminho=caminho):
                with cliente.get(caminho) as resposta:
                    self.assertEqual(resposta.status_code, 200)


if __name__ == "__main__":
    unittest.main()
