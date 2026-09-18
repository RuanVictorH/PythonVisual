# Construtor do fluxograma. Funcao pura: recebe o codigo do usuario e devolve uma arvore
# estruturada (JSON) com os nos do fluxo. Este arquivo e embutido no RUNNER_CODE (executor.py),
# entao: so stdlib, ASCII, sem strings de aspas triplas e sem bloco de execucao direta.
import ast


class _FxConstrutor:
    def __init__(self, codigo, maximo, tam):
        self.linhas = codigo.replace("\r\n", "\n").replace("\r", "\n").split("\n")
        self.bl = [x.encode("utf-8") for x in self.linhas]
        self.restante = maximo
        self.tam = tam
        self.n = 0
        self.cid = 0
        self.gid = 0
        self.nome = None
        self.omitidos = 0
        self.fila = []

    def cortar(self, t):
        t = " ".join(t.split())
        return t if len(t) <= self.tam else t[: max(0, self.tam - 3)] + "..."

    def seg(self, no):
        # col_offset do ast e em bytes UTF-8, entao fatiamos os bytes da linha
        a, b = no.lineno - 1, no.end_lineno - 1
        if a == b:
            bs = self.bl[a][no.col_offset : no.end_col_offset]
        else:
            meio = self.bl[a + 1 : b]
            bs = b" ".join([self.bl[a][no.col_offset :]] + meio + [self.bl[b][: no.end_col_offset]])
        return bs.decode("utf-8", "replace")

    def no(self, tipo, texto, ini, fim, **extra):
        self.restante -= 1
        self.n += 1
        d = {"id": self.n, "tipo": tipo, "texto": self.cortar(texto), "linha": ini, "linha_fim": fim}
        d.update(extra)
        return d

    def contar(self, lista):
        return sum(1 for t in lista for x in ast.walk(t) if isinstance(x, ast.stmt))

    def doc(self, s):
        return isinstance(s, ast.Expr) and isinstance(s.value, ast.Constant) and isinstance(s.value.value, str)

    def bloco(self, lista, funcao=False):
        # docstring de funcao nao gera bytecode (nem evento de linha), entao nao vira no
        if funcao and lista and self.doc(lista[0]):
            lista = lista[1:]
        saida = []
        for i, s in enumerate(lista):
            if self.restante <= 0:
                cauda = lista[i:]
                q = self.contar(cauda)
                self.omitidos += q
                self.n += 1
                saida.append({"id": self.n, "tipo": "omitido", "texto": "", "linha": cauda[0].lineno,
                              "linha_fim": cauda[-1].end_lineno, "quantidade": q})
                break
            saida.extend(self.stmt(s))
        return saida

    def stmt(self, s):
        if isinstance(s, ast.If):
            return self.se(s)
        if isinstance(s, (ast.For, ast.While)):
            return self.laco(s)
        if isinstance(s, ast.Try):
            return self.tentar(s)
        if isinstance(s, (ast.FunctionDef, ast.ClassDef)):
            return self.definicao(s)
        if isinstance(s, ast.With):
            return self.com(s)
        if isinstance(s, ast.Return):
            return [self.no("retorno", self.seg(s), s.lineno, s.end_lineno)]
        if isinstance(s, (ast.Break, ast.Continue, ast.Raise)):
            return [self.no("interrupcao", self.seg(s), s.lineno, s.end_lineno, subtipo=type(s).__name__.lower())]
        simples = (ast.Assign, ast.AugAssign, ast.AnnAssign, ast.Expr, ast.Import, ast.ImportFrom,
                   ast.Pass, ast.Delete, ast.Global, ast.Nonlocal, ast.Assert)
        if not isinstance(s, simples):
            # match, async, try/except*, etc: um unico no cobrindo a faixa inteira
            return [self.no("processo", self.linhas[s.lineno - 1], s.lineno, s.end_lineno)]
        return [self.no(self.tipo_simples(s), self.seg(s), s.lineno, s.end_lineno)]

    def tipo_simples(self, s):
        for x in ast.walk(s):
            if isinstance(x, ast.Call) and isinstance(x.func, ast.Name) and x.func.id == "input":
                return "entrada"
        if isinstance(s, ast.Expr) and isinstance(s.value, ast.Call):
            f = s.value.func
            if isinstance(f, ast.Name) and f.id == "print":
                return "saida"
        return "processo"

    def se(self, s):
        no = self.no("se", "if " + self.seg(s.test), s.lineno, s.test.end_lineno)
        no["entao"] = self.bloco(s.body)
        no["elifs"] = []
        resto, pai = s.orelse, s
        # elif = orelse com um unico If alinhado (mesma coluna) ao If pai
        while self.restante > 0 and len(resto) == 1 and isinstance(resto[0], ast.If) \
                and resto[0].col_offset == pai.col_offset:
            e = resto[0]
            d = self.no("elif", "elif " + self.seg(e.test), e.lineno, e.test.end_lineno)
            d["entao"] = self.bloco(e.body)
            no["elifs"].append(d)
            resto, pai = e.orelse, e
        no["senao"] = self.bloco(resto)
        return [no]

    def laco(self, s):
        if isinstance(s, ast.While):
            inf = isinstance(s.test, ast.Constant) and bool(s.test.value)
            no = self.no("enquanto", "while " + self.seg(s.test), s.lineno, s.test.end_lineno, infinito=inf)
        else:
            t = "for " + self.seg(s.target) + " in " + self.seg(s.iter)
            no = self.no("para", t, s.lineno, s.iter.end_lineno)
        no["corpo"] = self.bloco(s.body)
        # else do laco: achatado logo depois do laco
        return [no] + self.bloco(s.orelse)

    def tentar(self, s):
        no = self.no("tentar", "try", s.lineno, s.lineno)
        no["corpo"] = self.bloco(s.body)
        no["tratadores"] = []
        for h in s.handlers:
            if self.restante <= 0:
                self.omitidos += self.contar(h.body)
                continue
            t = "except" + (" " + self.seg(h.type) if h.type else "") + (" as " + h.name if h.name else "")
            d = self.no("tratador", t, h.lineno, h.type.end_lineno if h.type else h.lineno, tipado=h.type is not None)
            d["corpo"] = self.bloco(h.body)
            no["tratadores"].append(d)
        no["senao"] = self.bloco(s.orelse)
        no["finalmente"] = self.bloco(s.finalbody)
        return [no]

    def com(self, s):
        t = "with " + ", ".join(
            self.seg(i.context_expr) + (" as " + self.seg(i.optional_vars) if i.optional_vars else "")
            for i in s.items)
        fim = max((i.optional_vars or i.context_expr).end_lineno for i in s.items)
        return [self.no("processo", t, s.lineno, fim)] + self.bloco(s.body)

    def definicao(self, s):
        cls = isinstance(s, ast.ClassDef)
        if cls:
            bases = ", ".join(self.seg(b) for b in s.bases)
            t = "class " + s.name + ("(" + bases + ")" if bases else "")
        else:
            t = "def " + s.name + "(" + ast.unparse(s.args) + ")"
        ini = min([d.lineno for d in s.decorator_list] + [s.lineno])
        self.cid += 1
        gid = self.cid
        no = self.no("definicao", t, ini, max(s.lineno, s.body[0].lineno - 1),
                     subtipo="classe" if cls else "funcao", grafico=gid)
        nome = (self.nome + "." if self.nome else "") + s.name
        self.fila.append((no, s, gid, self.gid, nome))
        return [no]


def construir_fluxo(codigo, maximo_nos, tamanho_texto):
    try:
        arvore = ast.parse(codigo)
    except (SyntaxError, ValueError):
        return None
    c = _FxConstrutor(codigo, maximo_nos, tamanho_texto)
    graficos = [{"id": 0, "tipo": "principal", "nome": None, "texto": None, "escopo": "Global",
                 "pai": None, "linha_def": 0, "linha_ini": 1, "linha_fim": max(1, len(c.linhas)),
                 "nos": c.bloco(arvore.body)}]
    # funcoes e classes entram em largura, depois do programa principal
    while c.fila:
        no, s, gid, pai, nome = c.fila.pop(0)
        if c.restante <= 0:
            no["grafico"] = None
            c.omitidos += c.contar(s.body)
            continue
        cls = isinstance(s, ast.ClassDef)
        c.gid, c.nome = gid, nome
        graficos.append({"id": gid, "tipo": "classe" if cls else "funcao", "nome": nome, "texto": no["texto"],
                         "escopo": s.name, "pai": pai, "linha_def": s.lineno, "linha_ini": s.body[0].lineno,
                         "linha_fim": s.end_lineno, "nos": c.bloco(s.body, not cls)})
    graficos.sort(key=lambda g: (g["linha_def"], g["id"]))
    return {"versao": 1, "graficos": graficos, "total_nos": maximo_nos - c.restante,
            "limite_nos": maximo_nos, "truncado": c.omitidos > 0, "omitidos": c.omitidos}
