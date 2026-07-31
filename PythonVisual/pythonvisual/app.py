from flask import Flask, jsonify, render_template, request

from executor import executar_codigo

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
app.json.sort_keys = False


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


@app.route("/executar", methods=["POST"])
def executar():
    dados = request.get_json(silent=True) or {}
    codigo = dados.get("codigo", "")
    entrada = dados.get("entrada", "")
    entradas = dados.get("entradas")

    if not isinstance(codigo, str) or not isinstance(entrada, str):
        return jsonify([{
            "erro": "RequisicaoInvalida: codigo e entrada devem ser textos.",
            "saida": ""
        }]), 400

    if entradas is not None and not isinstance(entradas, list):
        return jsonify([{
            "erro": "RequisicaoInvalida: entradas deve ser uma lista.",
            "saida": ""
        }]), 400

    return jsonify(executar_codigo(codigo, entrada=entrada, entradas=entradas))


if __name__ == "__main__":
    app.run(debug=True)
