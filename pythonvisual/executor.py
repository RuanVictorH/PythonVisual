import json
import subprocess
import sys
import tempfile


TEMPO_LIMITE_SEGUNDOS = 3
LIMITE_PASSOS = 1000


RUNNER_CODE = r"""
import io
import json
import sys
import types

ARQUIVO_USUARIO = "<codigo_usuario>"


class LimiteDePassos(Exception):
    pass


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
            "tipo": "modulo",
            "nome": getattr(valor, "__name__", tipo),
            "repr": repr_seguro(valor)
        }

    if isinstance(valor, types.FunctionType):
        modulo = getattr(valor, "__module__", "")
        arquivo_codigo = getattr(getattr(valor, "__code__", None), "co_filename", "")
        if modulo and (modulo != "__main__" or arquivo_codigo != ARQUIVO_USUARIO):
            return {
                "categoria": "importacao",
                "tipo": "funcao_importada",
                "nome": getattr(valor, "__name__", tipo),
                "modulo": modulo,
                "repr": repr_seguro(valor)
            }
        return {
            "categoria": "funcao",
            "tipo": "funcao",
            "nome": getattr(valor, "__name__", tipo),
            "repr": repr_seguro(valor)
        }

    if isinstance(valor, type) and getattr(valor, "__module__", "builtins") != "builtins":
        return {
            "categoria": "importacao",
            "tipo": "classe_importada",
            "nome": getattr(valor, "__name__", tipo),
            "modulo": getattr(valor, "__module__", ""),
            "repr": repr_seguro(valor)
        }

    if isinstance(valor, (types.BuiltinFunctionType, types.BuiltinMethodType)):
        modulo = getattr(valor, "__module__", "")
        categoria = "importacao" if modulo and modulo != "builtins" else "primitivo"
        return {
            "categoria": categoria,
            "tipo": "funcao_importada" if categoria == "importacao" else tipo,
            "nome": getattr(valor, "__name__", tipo),
            "modulo": modulo,
            "repr": repr_seguro(valor)
        }

    if isinstance(valor, (int, float, bool, str, type(None))):
        return {"categoria": "primitivo", "tipo": tipo, "repr": repr_seguro(valor)}

    if isinstance(valor, list):
        dados = serializar_sequencia(valor)
        return {"categoria": "objeto", "tipo": "lista", **dados}

    if isinstance(valor, tuple):
        dados = serializar_sequencia(valor)
        return {"categoria": "objeto", "tipo": "tupla", **dados}

    if isinstance(valor, set):
        dados = serializar_sequencia(valor)
        return {"categoria": "objeto", "tipo": "conjunto", **dados}

    if isinstance(valor, dict):
        pares = {}
        for indice, (chave, item) in enumerate(valor.items()):
            if indice >= 50:
                break
            pares[repr_seguro(chave)] = repr_seguro(item)
        return {
            "categoria": "objeto",
            "tipo": "dicionario",
            "pares": pares,
            "truncado": len(valor) > 50
        }

    return {"categoria": "primitivo", "tipo": tipo, "repr": repr_seguro(valor)}


payload = json.loads(sys.stdin.read() or "{}")
codigo = payload.get("codigo", "")
entrada = payload.get("entrada", "")
limite_passos = int(payload.get("limite_passos", 1000))

execucoes = []
stdout_capture = io.StringIO()


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
        "variaveis": variaveis,
        "saida": stdout_capture.getvalue(),
        "evento": evento
    })


def tracer(frame, event, arg):
    if event in ("line", "return"):
        registrar_passo(frame, event)
    return tracer


stdout_original = sys.stdout
stdin_original = sys.stdin
ambiente = {"__name__": "__main__"}

sys.stdout = stdout_capture
sys.stdin = io.StringIO(entrada)
sys.settrace(tracer)

try:
    exec(compile(codigo, ARQUIVO_USUARIO, "exec"), ambiente, ambiente)
    execucoes.append({
        "linha": None,
        "escopo": "Fim",
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
    tempo_limite=TEMPO_LIMITE_SEGUNDOS,
    limite_passos=LIMITE_PASSOS,
):
    payload = json.dumps({
        "codigo": codigo,
        "entrada": entrada,
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
