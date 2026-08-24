import { editor } from "./editor.js";
import { traduzir } from "./i18n.js";
import { escaparHTML } from "./util.js";

export function obterBlocoAspasTriplas(indiceInicial) {
  const linhaInicial = editor.getLine(indiceInicial) || "";
  const inicio = linhaInicial.trimStart().match(/^(?:[rRuUbB]{0,2})?("""|''')/);
  if (!inicio)
    return null;

  const delimitador = inicio[1];
  const posicaoAbertura = linhaInicial.indexOf(delimitador);
  const restanteLinha = linhaInicial.slice(
    posicaoAbertura + delimitador.length,
  );
  let indiceFinal = indiceInicial;

  if (!restanteLinha.includes(delimitador)) {
    indiceFinal = null;
    for (
      let indice = indiceInicial + 1;
      indice < editor.lineCount();
      indice++
    ) {
      if ((editor.getLine(indice) || "").includes(delimitador)) {
        indiceFinal = indice;
        break;
      }
    }
  }

  if (indiceFinal === null)
    return null;
  const linhas = [];
  for (let indice = indiceInicial; indice <= indiceFinal; indice++) {
    linhas.push(editor.getLine(indice) || "");
  }

  return {
    codigo: linhas.join("\n"),
    indiceFinal,
  };
}

export function explicarComandoPython(linha, blocoAspasTriplas = null) {
  const texto = String(linha || "").trim();
  if (!texto)
    return traduzir("explain.empty");
  if (blocoAspasTriplas)
    return traduzir("explain.multilineComment");
  if (/^#/.test(texto))
    return traduzir("explain.comment");
  if (/^def\s+\w+\s*\(/.test(texto))
    return traduzir("explain.def");
  if (/^class\s+\w+/.test(texto))
    return traduzir("explain.class");
  if (/^return\b/.test(texto))
    return traduzir("explain.return");
  if (/^if\b/.test(texto))
    return traduzir("explain.if");
  if (/^elif\b/.test(texto))
    return traduzir("explain.elif");
  if (/^else\s*:/.test(texto))
    return traduzir("explain.else");
  if (/^for\b/.test(texto))
    return traduzir("explain.for");
  if (/^while\b/.test(texto))
    return traduzir("explain.while");
  if (/^try\s*:/.test(texto))
    return traduzir("explain.try");
  if (/^except\b/.test(texto))
    return traduzir("explain.except");
  if (/^finally\s*:/.test(texto))
    return traduzir("explain.finally");
  if (/^import\b/.test(texto) || /^from\b.+\bimport\b/.test(texto))
    return traduzir("explain.import");
  if (/^print\s*\(/.test(texto))
    return traduzir("explain.print");
  if (/(^|[^\w.])input\s*\(/.test(texto))
    return traduzir("explain.input");
  if (/^break\b/.test(texto))
    return traduzir("explain.break");
  if (/^continue\b/.test(texto))
    return traduzir("explain.continue");
  if (/^pass\b/.test(texto))
    return traduzir("explain.pass");
  if (/^raise\b/.test(texto))
    return traduzir("explain.raise");
  if (/^[A-Za-z_]\w*\.[A-Za-z_]\w*\s*\(/.test(texto))
    return traduzir("explain.method");
  if (/^[A-Za-z_]\w*\s*\(/.test(texto))
    return traduzir("explain.call");
  if (/^[^=<>!]+(\+=|-=|\*=|\/=|\/\/=|%=|\*\*=)/.test(texto))
    return traduzir("explain.update");
  if (/^[^=<>!]+=[^=]/.test(texto))
    return traduzir("explain.assign");
  return traduzir("explain.generic");
}

export function orientarCorrecaoErro(erro) {
  const mensagem = String(erro || "").trim();
  const mensagemMinuscula = mensagem.toLowerCase();
  const correspondenciaTipo = mensagem.match(/^([A-Za-z_][A-Za-z0-9_]*):/);
  const tipo = correspondenciaTipo ? correspondenciaTipo[1] : "";

  if (tipo === "TabError")
    return traduzir("error.guidance.tab");

  if (tipo === "IndentationError") {
    if (mensagemMinuscula.includes("expected an indented block"))
      return traduzir("error.guidance.indentExpected");
    if (mensagemMinuscula.includes("unexpected indent"))
      return traduzir("error.guidance.indentUnexpected");
    if (mensagemMinuscula.includes("unindent does not match"))
      return traduzir("error.guidance.indentMismatch");
    return traduzir("error.guidance.indentation");
  }

  if (tipo === "SyntaxError") {
    if (
      mensagemMinuscula.includes("unterminated string literal") ||
      mensagemMinuscula.includes("eol while scanning string literal")
    ) {
      return traduzir("error.guidance.stringLiteral");
    }
    if (mensagemMinuscula.includes("invalid decimal literal"))
      return traduzir("error.guidance.decimalLiteral");
    if (
      mensagemMinuscula.includes("was never closed") ||
      mensagemMinuscula.includes("unmatched") ||
      mensagemMinuscula.includes("does not match opening") ||
      mensagemMinuscula.includes("expecting '}'") ||
      mensagemMinuscula.includes("closing parenthesis")
    ) {
      return traduzir("error.guidance.delimiter");
    }
    if (mensagemMinuscula.includes("expected ':'"))
      return traduzir("error.guidance.colon");
    if (mensagemMinuscula.includes("'return' outside function"))
      return traduzir("error.guidance.returnOutside");
    if (
      mensagemMinuscula.includes("'break' outside loop") ||
      mensagemMinuscula.includes("'continue' not properly in loop")
    ) {
      return traduzir("error.guidance.loopControlOutside");
    }
    if (
      mensagemMinuscula.includes("cannot assign to") ||
      mensagemMinuscula.includes("assignment expression")
    ) {
      return traduzir("error.guidance.assignment");
    }
    return traduzir("error.guidance.syntax");
  }

  if (tipo === "UnboundLocalError") {
    const variavelLocal =
      mensagem.match(/local variable ['\"]([^'\"]+)['\"]/i) ||
      mensagem.match(/cannot access local variable ['\"]([^'\"]+)['\"]/i);
    return traduzir("error.guidance.unboundLocal", {
      name: variavelLocal
        ? "'" + variavelLocal[1] + "'"
        : traduzir("error.guidance.indicatedFeminine"),
    });
  }

  if (tipo === "NameError") {
    const nome = mensagem.match(/name ['\"]([^'\"]+)['\"] is not defined/i);
    return nome
      ? traduzir("error.guidance.name", { name: "'" + nome[1] + "'" })
      : traduzir("error.guidance.nameGeneric");
  }

  if (tipo === "TypeError") {
    if (
      mensagemMinuscula.includes("concatenate") ||
      mensagemMinuscula.includes("can only concatenate")
    ) {
      return traduzir("error.guidance.typeConcat");
    }
    if (mensagemMinuscula.includes("unsupported operand type"))
      return traduzir("error.guidance.typeOperands");
    if (mensagemMinuscula.includes("not callable"))
      return traduzir("error.guidance.notCallable");
    if (
      mensagemMinuscula.includes("argument") ||
      mensagemMinuscula.includes("takes ") ||
      mensagemMinuscula.includes("missing ")
    ) {
      return traduzir("error.guidance.arguments");
    }
    return traduzir("error.guidance.type");
  }

  if (tipo === "ValueError") {
    const valorInteiro = mensagem.match(
      /invalid literal for int\(\) with base \d+:\s*(.+)$/i,
    );
    if (valorInteiro)
      return traduzir("error.guidance.intValue", { value: valorInteiro[1] });
    if (mensagemMinuscula.includes("values to unpack"))
      return traduzir("error.guidance.unpack");
    if (mensagemMinuscula.includes("math domain error"))
      return traduzir("error.guidance.mathDomain");
    return traduzir("error.guidance.value");
  }

  if (tipo === "ZeroDivisionError")
    return traduzir("error.guidance.zeroDivision");
  if (tipo === "IndexError")
    return traduzir("error.guidance.index");

  if (tipo === "KeyError") {
    const chave = mensagem.replace(/^KeyError:\s*/, "").trim();
    const chaveExibida = chave || traduzir("error.guidance.indicatedFeminine");
    return traduzir("error.guidance.key", { key: chaveExibida });
  }

  if (tipo === "AttributeError") {
    const atributo = mensagem.match(
      /['\"]([^'\"]+)['\"] object has no attribute ['\"]([^'\"]+)['\"]/i,
    );
    return traduzir("error.guidance.attribute", {
      type: atributo
        ? "'" + atributo[1] + "'"
        : traduzir("error.guidance.indicated"),
      attribute: atributo
        ? "'" + atributo[2] + "'"
        : traduzir("error.guidance.indicated"),
    });
  }

  if (tipo === "ModuleNotFoundError") {
    const modulo = mensagem.match(/no module named ['\"]([^'\"]+)['\"]/i);
    return traduzir("error.guidance.moduleNotFound", {
      module: modulo
        ? "'" + modulo[1] + "'"
        : traduzir("error.guidance.indicated"),
    });
  }

  if (tipo === "ImportError")
    return traduzir("error.guidance.import");
  if (tipo === "FileNotFoundError")
    return traduzir("error.guidance.fileNotFound");
  if (tipo === "PermissionError")
    return traduzir("error.guidance.permission");
  if (tipo === "RecursionError")
    return traduzir("error.guidance.recursion");
  if (tipo === "AssertionError")
    return traduzir("error.guidance.assertion");
  if (tipo === "OverflowError")
    return traduzir("error.guidance.overflow");
  if (tipo === "EOFError")
    return traduzir("error.guidance.eof");
  if (tipo === "MemoryError")
    return traduzir("error.guidance.memory");
  if (tipo === "TempoLimite" || tipo === "TimeoutError")
    return traduzir("error.guidance.timeout");
  if (tipo === "LimiteDePassos")
    return traduzir("error.guidance.stepLimit");
  if (tipo === "FalhaInterna")
    return traduzir("error.guidance.internal");
  return traduzir("error.guidance.generic");
}

export function montarCaixaErro(erro, classeExtra = "") {
  const orientacao = orientarCorrecaoErro(erro);
  const classe = classeExtra ? " " + classeExtra : "";
  return (
    '<div class="error-box' +
    classe +
    '" role="alert">' +
    "<div><strong>" +
    escaparHTML(traduzir("error.label")) +
    "</strong> " +
    escaparHTML(erro) +
    "</div>" +
    '<div class="error-guidance"><strong class="error-guidance-label">' +
    escaparHTML(traduzir("error.guidanceLabel")) +
    "</strong> " +
    escaparHTML(orientacao) +
    "</div>" +
    "</div>"
  );
}
