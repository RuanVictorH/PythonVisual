import os

from flask import Flask, jsonify, render_template, request, send_from_directory

from auditoria import registrar_execucao
from executor import (
    AMBIENTE_PRODUCAO,
    TAMANHO_MAXIMO_CODIGO,
    TAMANHO_MAXIMO_ENTRADA,
    TAMANHO_MAXIMO_REQUISICAO,
    executar_codigo,
)

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
app.config["MAX_CONTENT_LENGTH"] = TAMANHO_MAXIMO_REQUISICAO
app.json.sort_keys = False


def validar_depuracao(ativa):
    # O depurador do Werkzeug executa codigo no servidor para quem passar pelo PIN.
    if ativa and AMBIENTE_PRODUCAO:
        raise RuntimeError(
            "O modo debug não é permitido quando PYTHONVISUAL_ENV=production: "
            "o depurador do Flask executa código no servidor."
        )
    return ativa


# cobre o FLASK_DEBUG, que liga o depurador sem passar pelo PYTHONVISUAL_DEBUG
validar_depuracao(app.debug)


@app.errorhandler(413)
def requisicao_grande_demais(_erro):
    limite = app.config["MAX_CONTENT_LENGTH"]
    return (
        jsonify([{"erro": f"RequisicaoInvalida: a requisição excede {limite} bytes.", "saida": ""}]),
        413,
    )


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/visualizador")
def visualizador():
    return render_template("index.html")


@app.route("/sobre")
def sobre():
    return render_template("sobre.html")


@app.route("/limitacoes")
def limitacoes():
    return render_template("limitacoes.html")


@app.route("/favicon.ico")
def favicon():
    # os navegadores pedem este caminho sozinhos, mesmo sem o <link> da página
    return send_from_directory(
        os.path.join(app.static_folder, "img"), "favicon.ico", mimetype="image/vnd.microsoft.icon"
    )


def _erro_de_tamanho(codigo, entrada, entradas):
    if len(codigo) > TAMANHO_MAXIMO_CODIGO:
        return f"o código excede {TAMANHO_MAXIMO_CODIGO} caracteres."

    valores = [entrada] + [
        item.get("valor") for item in entradas or [] if isinstance(item, dict)
    ]
    if any(isinstance(v, str) and len(v) > TAMANHO_MAXIMO_ENTRADA for v in valores):
        return f"uma entrada excede {TAMANHO_MAXIMO_ENTRADA} caracteres."
    return None


@app.route("/executar", methods=["POST"])
def executar():
    dados = request.get_json(silent=True) or {}
    codigo = dados.get("codigo", "")
    entrada = dados.get("entrada", "")
    entradas = dados.get("entradas")

    if not isinstance(codigo, str) or not isinstance(entrada, str):
        execucoes = [
            {"erro": "RequisicaoInvalida: código e entrada devem ser textos.", "saida": ""}
        ]
        registrar_execucao(request, codigo, execucoes)
        return jsonify(execucoes), 400

    if entradas is not None and not isinstance(entradas, list):
        execucoes = [{"erro": "RequisicaoInvalida: entradas deve ser uma lista.", "saida": ""}]
        registrar_execucao(request, codigo, execucoes)
        return jsonify(execucoes), 400

    erro_de_tamanho = _erro_de_tamanho(codigo, entrada, entradas)
    if erro_de_tamanho:
        execucoes = [{"erro": f"RequisicaoInvalida: {erro_de_tamanho}", "saida": ""}]
        registrar_execucao(request, codigo, execucoes)
        return jsonify(execucoes), 413

    execucoes = executar_codigo(codigo, entrada=entrada, entradas=entradas)
    registrar_execucao(request, codigo, execucoes)
    return jsonify(execucoes)


if __name__ == "__main__":
    modo_debug = validar_depuracao(
        os.environ.get("PYTHONVISUAL_DEBUG", "false").strip().lower() == "true"
    )
    app.run(debug=modo_debug)
