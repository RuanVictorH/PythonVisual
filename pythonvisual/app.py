from flask import Flask, jsonify, render_template, request

from executor import executar_codigo

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/executar", methods=["POST"])
def executar():
    dados = request.get_json(silent=True) or {}
    codigo = dados.get("codigo", "")
    entrada = dados.get("entrada", "")

    if not isinstance(codigo, str) or not isinstance(entrada, str):
        return jsonify([{
            "erro": "RequisicaoInvalida: codigo e entrada devem ser textos.",
            "saida": ""
        }]), 400

    return jsonify(executar_codigo(codigo, entrada=entrada))


if __name__ == "__main__":
    app.run(debug=True)
