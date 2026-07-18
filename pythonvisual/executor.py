import json
import subprocess
import sys
import tempfile


from pathlib import Path

def carregar_config():
    config = {}
    arquivo = Path(__file__).with_name("env.conf")
    if arquivo.exists():
        for linha in arquivo.read_text(encoding="utf-8").splitlines():
            if "=" in linha:
                chave, valor = linha.split("=", 1)
                config[chave.strip()] = valor.strip()
    return config

CONFIG = carregar_config()

TEMPO_LIMITE_SEGUNDOS = int(CONFIG.get("TEMPO_LIMITE_SEGUNDOS", 3))
LIMITE_PASSOS = int(CONFIG.get("LIMITE_PASSOS", 1000))
TAMANHO_MAXIMO_OBJETO = int(CONFIG.get("TAMANHO_MAXIMO_OBJETO", 50))


RUNNER_CODE = r"""
import io
import json
import sys
import types

ARQUIVO_USUARIO = "<codigo_usuario>"


class LimiteDePassos(Exception):
    pass


class EntradaPendente(Exception):
    def __init__(self, linha, prompt, frame):
        super().__init__("entrada pendente")
        self.linha = linha
        self.prompt = prompt
        self.frame = frame


def repr_seguro(valor, limite=120):
    try:
        texto = repr(valor)
    except Exception as exc:
        texto = f"<repr indisponivel: {type(exc).__name__}>"

    if len(texto) > limite:
        return texto[:limite - 3] + "..."
    return texto


def serializar_sequencia(valores, limite=50):
    itens = [repr_seguro(item) for item in list(valores)[:limite]]
    return {
        "elementos": itens,
        "truncado": len(valores) > limite
    }


def serializar_variavel(valor):
    tipo = type(valor).__name__

    if isinstance(valor, types.ModuleType):
        return {
            "categoria": "importacao",
            "tipo": "module",
            "nome": getattr(valor, "__name__", tipo),
            "repr": repr_seguro(valor)
        }

    if isinstance(valor, types.FunctionType):
        modulo = getattr(valor, "__module__", "")
        arquivo_codigo = getattr(getattr(valor, "__code__", None), "co_filename", "")
        if modulo and (modulo != "__main__" or arquivo_codigo != ARQUIVO_USUARIO):
            return {
                "categoria": "importacao",
                "tipo": "function",
                "nome": getattr(valor, "__name__", tipo),
                "modulo": modulo,
                "repr": repr_seguro(valor)
            }
        return {
            "categoria": "funcao",
            "tipo": "function",
            "nome": getattr(valor, "__name__", tipo),
            "repr": repr_seguro(valor)
        }

    if isinstance(valor, type):
        modulo = getattr(valor, "__module__", "builtins")
        if modulo == "__main__":
            return {
                "categoria": "classe",
                "tipo": "class",
                "nome": getattr(valor, "__name__", tipo),
                "repr": repr_seguro(valor)
            }
        if modulo != "builtins":
            return {
                "categoria": "importacao",
                "tipo": "class",
                "nome": getattr(valor, "__name__", tipo),
                "modulo": modulo,
                "repr": repr_seguro(valor)
            }

    if isinstance(valor, (types.BuiltinFunctionType, types.BuiltinMethodType)):
        modulo = getattr(valor, "__module__", "")
        categoria = "importacao" if modulo and modulo != "builtins" else "primitivo"
        return {
            "categoria": categoria,
            "tipo": "function" if categoria == "importacao" else tipo,
            "nome": getattr(valor, "__name__", tipo),
            "modulo": modulo,
            "repr": repr_seguro(valor)
        }

    if isinstance(valor, (int, float, bool, str, type(None))):
        return {"categoria": "primitivo", "tipo": tipo, "repr": repr_seguro(valor)}

    if isinstance(valor, list):
        dados = serializar_sequencia(valor)
        return {"categoria": "objeto", "tipo": "list", **dados}

    if isinstance(valor, tuple):
        dados = serializar_sequencia(valor)
        return {"categoria": "objeto", "tipo": "tuple", **dados}

    if isinstance(valor, set):
        dados = serializar_sequencia(valor)
        return {"categoria": "objeto", "tipo": "set", **dados}

    if isinstance(valor, dict):
        pares = {}
        for indice, (chave, item) in enumerate(valor.items()):
            if indice >= 50:
                break
            pares[repr_seguro(chave)] = repr_seguro(item)
        return {
            "categoria": "objeto",
            "tipo": "dict",
            "pares": pares,
            "truncado": len(valor) > 50
        }

    if hasattr(valor, "__dict__") and getattr(type(valor), "__module__", "") == "__main__":
        atributos = {}
        for indice, (nome, item) in enumerate(vars(valor).items()):
            if indice >= 50:
                break
            atributos[nome] = repr_seguro(item)
        return {
            "categoria": "objeto",
            "tipo": tipo,
            "atributos": atributos,
            "truncado": len(vars(valor)) > 50,
            "repr": repr_seguro(valor)
        }

    return {"categoria": "primitivo", "tipo": tipo, "repr": repr_seguro(valor)}


def serializar_pilha(frame):
    pilha = []
    atual = frame
    while atual:
        if atual.f_code.co_filename == ARQUIVO_USUARIO:
            escopo = atual.f_code.co_name
            argumentos = []
            total_argumentos = atual.f_code.co_argcount + atual.f_code.co_kwonlyargcount
            for nome in atual.f_code.co_varnames[:total_argumentos]:
                if nome in atual.f_locals:
                    argumentos.append({
                        "nome": nome,
                        "valor": repr_seguro(atual.f_locals[nome], limite=70)
                    })
            pilha.append({
                "escopo": escopo if escopo != "<module>" else "Global",
                "linha": atual.f_lineno,
                "argumentos": argumentos,
                "atual": False
            })
        atual = atual.f_back

    pilha.reverse()
    if pilha:
        pilha[-1]["atual"] = True
    return pilha


payload = json.loads(sys.stdin.read() or "{}")
codigo = payload.get("codigo", "")
entrada = payload.get("entrada", "")
entradas_payload = payload.get("entradas")
limite_passos = int(payload.get("limite_passos", 1000))

execucoes = []
stdout_capture = io.StringIO()

if isinstance(entradas_payload, list):
    entradas_fornecidas = entradas_payload
else:
    entradas_fornecidas = [{"linha": None, "valor": valor} for valor in entrada.splitlines()]
indice_entrada = 0


def registrar_passo(frame, evento):
    if frame.f_code.co_filename != ARQUIVO_USUARIO:
        return

    if len(execucoes) >= limite_passos:
        raise LimiteDePassos()

    variaveis = {}
    for nome, valor in frame.f_locals.items():
        if nome.startswith("__") and nome.endswith("__"):
            continue
        variaveis[nome] = serializar_variavel(valor)

    escopo = frame.f_code.co_name
    execucoes.append({
        "linha": frame.f_lineno,
        "escopo": escopo if escopo != "<module>" else "Global",
        "pilha_chamadas": serializar_pilha(frame),
        "variaveis": variaveis,
        "saida": stdout_capture.getvalue(),
        "evento": evento
    })


def tracer(frame, event, arg):
    if event in ("line", "return"):
        registrar_passo(frame, event)
    return tracer


def input_visual(prompt=""):
    global indice_entrada
    frame_chamador = sys._getframe(1)
    linha = frame_chamador.f_lineno if frame_chamador.f_code.co_filename == ARQUIVO_USUARIO else None
    texto_prompt = str(prompt)
    stdout_capture.write(texto_prompt)

    if indice_entrada < len(entradas_fornecidas):
        entrada_atual = entradas_fornecidas[indice_entrada]
        linha_entrada = entrada_atual.get("linha")
        if linha_entrada is None or linha_entrada == linha:
            indice_entrada += 1
            return str(entrada_atual.get("valor", ""))

    raise EntradaPendente(linha, texto_prompt, frame_chamador)


stdout_original = sys.stdout
stdin_original = sys.stdin
ambiente = {"__name__": "__main__", "input": input_visual}

sys.stdout = stdout_capture
sys.stdin = io.StringIO(entrada)
sys.settrace(tracer)

try:
    exec(compile(codigo, ARQUIVO_USUARIO, "exec"), ambiente, ambiente)
    execucoes.append({
        "linha": None,
        "escopo": "Fim",
        "pilha_chamadas": [],
        "variaveis": {
            nome: serializar_variavel(valor)
            for nome, valor in ambiente.items()
            if not (nome.startswith("__") and nome.endswith("__"))
        },
        "saida": stdout_capture.getvalue(),
        "evento": "fim"
    })
except LimiteDePassos:
    execucoes.append({
        "erro": f"LimiteDePassos: execução interrompida após {limite_passos} passos.",
        "saida": stdout_capture.getvalue()
    })
except EntradaPendente as exc:
    frame = exc.frame
    variaveis = {}
    if frame and frame.f_code.co_filename == ARQUIVO_USUARIO:
        for nome, valor in frame.f_locals.items():
            if nome.startswith("__") and nome.endswith("__"):
                continue
            variaveis[nome] = serializar_variavel(valor)
    escopo = frame.f_code.co_name if frame else "Global"
    execucoes.append({
        "linha": exc.linha,
        "escopo": escopo if escopo != "<module>" else "Global",
        "pilha_chamadas": serializar_pilha(frame) if frame else [],
        "variaveis": variaveis,
        "saida": stdout_capture.getvalue(),
        "evento": "input_pendente",
        "entrada_pendente": True,
        "prompt": exc.prompt,
    })
except BaseException as exc:
    execucoes.append({
        "erro": f"{type(exc).__name__}: {exc}",
        "saida": stdout_capture.getvalue()
    })
finally:
    sys.settrace(None)
    sys.stdout = stdout_original
    sys.stdin = stdin_original

print(json.dumps(execucoes, ensure_ascii=False))
"""


def executar_codigo(
    codigo,
    entrada="",
    entradas=None,
    tempo_limite=TEMPO_LIMITE_SEGUNDOS,
    limite_passos=LIMITE_PASSOS,
):
    payload = json.dumps({
        "codigo": codigo,
        "entrada": entrada,
        "entradas": entradas,
        "limite_passos": limite_passos,
    }, ensure_ascii=False)

    try:
        with tempfile.TemporaryDirectory(prefix="pythontutor-") as diretorio:
            resultado = subprocess.run(
                [sys.executable, "-I", "-B", "-c", RUNNER_CODE],
                input=payload,
                text=True,
                capture_output=True,
                timeout=tempo_limite,
                cwd=diretorio,
            )
    except subprocess.TimeoutExpired:
        return [{
            "erro": f"TempoLimite: execução interrompida após {tempo_limite} segundos.",
            "saida": ""
        }]

    if resultado.returncode != 0:
        erro = resultado.stderr.strip() or "processo de execução encerrado sem resposta."
        return [{
            "erro": f"FalhaInterna: {erro[:500]}",
            "saida": ""
        }]

    try:
        dados = json.loads(resultado.stdout)
    except json.JSONDecodeError:
        return [{
            "erro": "FalhaInterna: resposta invalida do executor.",
            "saida": ""
        }]

    if isinstance(dados, list):
        return dados

    return [{
        "erro": "FalhaInterna: resposta inesperada do executor.",
        "saida": ""
    }]
