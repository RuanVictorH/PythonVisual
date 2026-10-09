import re
import unittest

from tests.test_abas_direita import (
    CSS,
    I18N,
    INDEX,
    Arvore,
    chaves_de_traducao,
)

ID_DICA = "fluxo-dica-teclado"

# ícone da ação e chave do rótulo, na ordem em que os atalhos aparecem na dica
ATALHOS = (
    ("fa-forward-step", "flow.fullscreen.key.next"),
    ("fa-backward-step", "flow.fullscreen.key.previous"),
    ("fa-backward-fast", "flow.fullscreen.key.first"),
    ("fa-forward-fast", "flow.fullscreen.key.last"),
    ("fa-compress", "flow.fullscreen.key.exit"),
)

CHAVES_DOS_ATALHOS = {
    "flow.fullscreen.key.space",
    "flow.fullscreen.key.or",
    "flow.fullscreen.key.next",
    "flow.fullscreen.key.previous",
    "flow.fullscreen.key.first",
    "flow.fullscreen.key.last",
    "flow.fullscreen.key.exit",
}

# a mesma mensagem de antes, só que sem os pontos que separavam os atalhos
FRASES = {
    "pt": "Espaço ou → avança ← volta Home início End fim Esc sai da tela cheia",
    "en": "Space or → next step ← back Home start End end Esc exits full screen",
}


class ArvoreComTexto(Arvore):
    """A árvore de elementos, guardando também os textos na ordem em que aparecem."""

    def __init__(self):
        super().__init__()
        self.textos = []

    def handle_data(self, dados):
        self.textos.append((self.atual, dados))

    def textos_de(self, no):
        for dono, dados in self.textos:
            if dono is no or no in dono.ancestrais():
                yield dono, dados

    def texto_de(self, no):
        return " ".join("".join(dados for _, dados in self.textos_de(no)).split())


def valores_de_traducao(idioma):
    """Lê as chaves e os textos do dicionário de um idioma em static/js/i18n.js."""
    texto = I18N.read_text(encoding="utf-8").replace("\r\n", "\n")
    inicio = texto.index(f"\n  {idioma}: {{")
    fim = texto.index("\n  }", inicio)
    bloco = texto[inicio:fim]
    pares = re.findall(r'^    "([^"]+)":\s*"((?:[^"\\]|\\.)*)"', bloco, re.M)

    return dict(pares)


def bloco_css(seletor):
    """Corpo da regra que começa em uma linha com o seletor dado, sem as chaves."""
    texto = CSS.read_text(encoding="utf-8").replace("\r\n", "\n")
    inicio = texto.index(f"\n{seletor} {{") + len(f"\n{seletor} {{")
    fim = texto.index("\n}", inicio)

    return texto[inicio:fim]


class TestDicaDaTelaCheia(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.arvore = ArvoreComTexto()
        cls.arvore.feed(INDEX.read_text(encoding="utf-8"))
        cls.dica = cls.arvore.por_id[ID_DICA]
        cls.atalhos = [no for no in cls.dica.descendentes() if "atalho" in no.classes]

    def test_a_dica_tem_um_atalho_para_cada_acao(self):
        self.assertEqual(len(self.atalhos), len(ATALHOS))

    def test_cada_atalho_tem_tecla_icone_da_acao_e_rotulo(self):
        for atalho, (icone, chave) in zip(self.atalhos, ATALHOS):
            with self.subTest(icone=icone):
                teclas = [no for no in atalho.descendentes() if no.tag == "kbd"]
                icones = [no for no in atalho.descendentes() if no.tag == "i"]
                rotulos = [
                    no
                    for no in atalho.descendentes()
                    if no.atributos.get("data-i18n") == chave
                ]

                self.assertTrue(teclas, "falta a tecla")
                self.assertEqual(len(icones), 1)
                self.assertIn("fa-solid", icones[0].classes)
                self.assertIn(icone, icones[0].classes)
                self.assertEqual(len(rotulos), 1)

    def test_icones_ficam_escondidos_dos_leitores_de_tela(self):
        icones = [no for no in self.dica.descendentes() if no.tag == "i"]

        # o do teclado, no começo, e um por atalho
        self.assertEqual(len(icones), 1 + len(ATALHOS))

        for icone in icones:
            with self.subTest(classes=icone.classes):
                self.assertEqual(icone.atributos.get("aria-hidden"), "true")

    def test_icone_do_teclado_e_os_atalhos_ficam_na_mesma_linha_que_quebra(self):
        # a dica é a linha que quebra: o ícone do teclado vai junto do primeiro
        # atalho, em vez de ficar solto à esquerda quando os atalhos descem
        filhos = self.dica.filhos

        self.assertEqual(filhos[0].tag, "i")
        self.assertIn("fa-keyboard", filhos[0].classes)
        self.assertEqual(filhos[1:], self.atalhos)

    def test_icone_da_acao_vem_depois_da_tecla_e_antes_do_rotulo(self):
        for atalho, (_, chave) in zip(self.atalhos, ATALHOS):
            with self.subTest(chave=chave):
                filhos = atalho.filhos
                ultima_tecla = max(i for i, no in enumerate(filhos) if no.tag == "kbd")
                icone = next(i for i, no in enumerate(filhos) if no.tag == "i")
                rotulo = next(
                    i
                    for i, no in enumerate(filhos)
                    if no.atributos.get("data-i18n") == chave
                )

                self.assertLess(ultima_tecla, icone)
                self.assertLess(icone, rotulo)

    def test_teclas_mostradas(self):
        teclas = [
            self.arvore.texto_de(no)
            for no in self.dica.descendentes()
            if no.tag == "kbd"
        ]

        self.assertEqual(teclas, ["Espaço", "→", "←", "Home", "End", "Esc"])

    def test_o_texto_em_portugues_e_o_de_antes(self):
        self.assertEqual(self.arvore.texto_de(self.dica), FRASES["pt"])

    def test_so_as_chaves_dos_atalhos_sao_traduzidas_na_dica(self):
        usadas = {
            no.atributos["data-i18n"]
            for no in self.dica.descendentes()
            if "data-i18n" in no.atributos
        }

        self.assertEqual(usadas, CHAVES_DOS_ATALHOS)

    def test_os_dois_idiomas_trazem_as_chaves_e_nao_a_antiga(self):
        for idioma in ("pt", "en"):
            with self.subTest(idioma=idioma):
                chaves = chaves_de_traducao(idioma)

                self.assertTrue(CHAVES_DOS_ATALHOS <= chaves)
                self.assertNotIn("flow.fullscreen.hint", chaves)

    def test_frase_montada_com_o_dicionario_de_cada_idioma(self):
        for idioma, esperada in FRASES.items():
            with self.subTest(idioma=idioma):
                valores = valores_de_traducao(idioma)
                trocados = set()
                pedacos = []

                for dono, dados in self.arvore.textos_de(self.dica):
                    chave = dono.atributos.get("data-i18n")

                    if chave is None:
                        pedacos.append(dados)
                    elif dono not in trocados:
                        trocados.add(dono)
                        pedacos.append(valores[chave])

                self.assertEqual(" ".join("".join(pedacos).split()), esperada)


class TestEstiloDaDicaDaTelaCheia(unittest.TestCase):
    def test_tokens_das_teclas_existem_nos_dois_temas(self):
        for seletor in (".fluxo-card", "body.tema-escuro .fluxo-card"):
            with self.subTest(seletor=seletor):
                corpo = bloco_css(seletor)

                for token in ("fundo", "borda", "texto"):
                    self.assertIn(f"--fluxo-tecla-{token}:", corpo)

    def test_tecla_usa_os_tokens_do_tema(self):
        corpo = bloco_css(".fluxo-dica-teclado kbd")

        for token in ("fundo", "borda", "texto"):
            self.assertIn(f"var(--fluxo-tecla-{token})", corpo)

    def test_icone_do_atalho_nao_leva_a_margem_dos_titulos(self):
        # .card-header i dá 6px à direita; no atalho o espaço vem do gap
        corpo = bloco_css(".fluxo-dica-teclado .atalho i")

        self.assertIn("margin-right: 0;", corpo)

    def test_atalhos_quebram_de_linha_sem_partir_um_atalho_ao_meio(self):
        dica = bloco_css(".fluxo-card.em-tela-cheia .fluxo-dica-teclado")

        self.assertIn("flex-wrap: wrap;", dica)
        self.assertIn("white-space: nowrap;", bloco_css(".fluxo-dica-teclado .atalho"))


if __name__ == "__main__":
    unittest.main()
