import { traduzir } from "./i18n.js";
import { escaparHTML } from "./util.js";

function normalizarTipoPython(tipo) {
  const equivalencias = {
    lista: "list",
    tupla: "tuple",
    conjunto: "set",
    dicionario: "dict",
    funcao: "function",
    funcao_importada: "function",
    classe: "class",
    classe_importada: "class",
    modulo: "module",
  };
  return equivalencias[tipo] || tipo || "object";
}

function normalizarItemObjeto(item) {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    return {
      repr: Object.prototype.hasOwnProperty.call(item, "repr")
        ? String(item.repr)
        : "",
      tipo: normalizarTipoPython(item.tipo),
    };
  }
  return { repr: String(item ?? ""), tipo: "object" };
}

function classeChipTipoInterno(tipo) {
  const primitivos = [
    "int",
    "float",
    "bool",
    "str",
    "NoneType",
    "complex",
    "bytes",
    "bytearray",
  ];
  return primitivos.includes(tipo)
    ? "tipo-chip-primitivo"
    : "tipo-chip-derivado";
}

function renderizarValorTipado(item) {
  const dado = normalizarItemObjeto(item);
  return (
    '<span class="objeto-valor">' +
    escaparHTML(dado.repr) +
    "</span>" +
    '<span class="tipo-chip tipo-chip-interno ' +
    classeChipTipoInterno(dado.tipo) +
    '">' +
    escaparHTML(dado.tipo) +
    "</span>"
  );
}

function paresDicionario(info) {
  if (Array.isArray(info.pares))
    return info.pares;
  return Object.entries(info.pares || {}).map(([chave, valor]) => ({
    chave: { repr: chave, tipo: "object" },
    valor,
  }));
}

function atributosObjeto(info) {
  if (Array.isArray(info.atributos))
    return info.atributos;
  return Object.entries(info.atributos || {}).map(([nome, valor]) => ({
    nome,
    valor,
  }));
}

function renderizarQuadroFuncoes(funcoes, vazio) {
  const linhas =
    funcoes.length === 0
      ? '<div class="quadro-linha"><div class="quadro-cel"><span class="empty">' +
        escaparHTML(vazio) +
        "</span></div></div>"
      : funcoes
          .map(({ nome, info }) => {
            const assinatura =
              typeof info.assinatura === "string" ? info.assinatura : "()";
            return (
              '<div class="quadro-linha"><div class="quadro-cel quadro-cel-funcao">' +
              escaparHTML(nome + assinatura) +
              "</div></div>"
            );
          })
          .join("");

  return (
    '<div class="quadro quadro-funcoes">' +
    '<div class="quadro-titulo">' +
    escaparHTML(traduzir("memory.functions")) +
    "</div>" +
    '<div class="quadro-linhas">' +
    linhas +
    "</div>" +
    "</div>"
  );
}

function renderizarQuadroClasses(classes, vazio) {
  const linhas =
    classes.length === 0
      ? '<div class="quadro-linha"><div class="quadro-cel"><span class="empty">' +
        escaparHTML(vazio) +
        "</span></div></div>"
      : classes
          .map(
            ({ nome }) =>
              '<div class="quadro-linha">' +
              '<div class="quadro-cel quadro-cel-nome">' +
              escaparHTML(nome) +
              "</div>" +
              '<div class="quadro-cel quadro-cel-tipo"><span class="tipo-chip tipo-chip-classe">class</span></div>' +
              "</div>",
          )
          .join("");

  return (
    '<div class="quadro quadro-classes">' +
    '<div class="quadro-titulo">' +
    escaparHTML(traduzir("memory.classes")) +
    "</div>" +
    '<div class="quadro-linhas">' +
    linhas +
    "</div>" +
    "</div>"
  );
}

function renderizarQuadroImportacoes(importacoes, vazio) {
  const linhas =
    importacoes.length === 0
      ? '<div class="quadro-linha"><div class="quadro-cel"><span class="empty">' +
        escaparHTML(vazio) +
        "</span></div></div>"
      : importacoes
          .map(({ nome, info }) => {
            const tipo = normalizarTipoPython(info.tipo);
            const nomeOriginal = info.nome || nome;
            const rotulo =
              nomeOriginal !== nome ? nomeOriginal + " (" + nome + ")" : nome;
            const modulo = info.modulo || nomeOriginal;
            let descricao;
            if (tipo === "module") {
              descricao = traduzir("memory.importModule");
            } else if (tipo === "function") {
              descricao = traduzir("memory.importFunction", { module: modulo });
            } else if (tipo === "class") {
              descricao = traduzir("memory.importClass", { module: modulo });
            } else {
              descricao = traduzir("memory.importItem", { module: modulo });
            }
            return (
              '<div class="quadro-linha">' +
              '<div class="quadro-cel quadro-cel-nome">' +
              escaparHTML(rotulo) +
              ' <span class="importacao-separador">|</span></div>' +
              '<div class="quadro-cel quadro-cel-detalhe importacao-descricao">' +
              escaparHTML(descricao) +
              "</div>" +
              "</div>"
            );
          })
          .join("");

  return (
    '<div class="quadro quadro-importacoes">' +
    '<div class="quadro-titulo">' +
    escaparHTML(traduzir("memory.imports")) +
    "</div>" +
    '<div class="quadro-linhas">' +
    linhas +
    "</div>" +
    "</div>"
  );
}

export function renderizarMemoria(variaveis, quadrosMemoria) {
  const quadros =
    Array.isArray(quadrosMemoria) && quadrosMemoria.length > 0
      ? quadrosMemoria
      : [{ escopo: "Global", atual: true, variaveis: variaveis || {} }];
  const possuiConteudo = quadros.some(
    (quadro) => quadro.variaveis && Object.keys(quadro.variaveis).length > 0,
  );
  if (!possuiConteudo) {
    return (
      '<div class="memoria-vazia"><span class="section-label">' +
      escaparHTML(traduzir("memory.title")) +
      '</span><span class="empty">' +
      escaparHTML(traduzir("memory.empty")) +
      "</span></div>"
    );
  }
  const objetosPorReferencia = new Map();
  const funcoes = [];
  const classes = [];
  const importacoes = [];
  const paineisQuadros = [];
  let indiceImportacao = 0;

  for (const [indiceQuadro, quadro] of quadros.entries()) {
    const variaveisQuadro = [];
    const variaveisDoEscopo = quadro.variaveis || {};
    for (const [nome, info] of Object.entries(variaveisDoEscopo)) {
      if (info.categoria === "primitivo" || info.categoria === "objeto") {
        variaveisQuadro.push({ nome, info });
      }
      if (info.categoria === "objeto") {
        const referencia =
          info.referencia || "quadro-" + indiceQuadro + "-" + nome;
        if (!objetosPorReferencia.has(referencia)) {
          objetosPorReferencia.set(referencia, { nome, info, referencia });
        }
      } else if (info.categoria === "classe")
        classes.push({ nome, info });
      else if (
        info.categoria === "funcao" &&
        normalizarTipoPython(info.tipo) === "class"
      )
        classes.push({ nome, info });
      else if (info.categoria === "funcao")
        funcoes.push({ nome, info });
      else if (info.categoria === "importacao") {
        importacoes.push({ nome, info, indice: indiceImportacao });
        indiceImportacao += 1;
      } else if (!["primitivo", "objeto"].includes(info.categoria)) {
        variaveisQuadro.push({ nome, info });
      }
    }

    let linhasQuadro = "";
    for (const { nome, info } of variaveisQuadro) {
      if (info.categoria === "objeto") {
        const referencia =
          info.referencia || "quadro-" + indiceQuadro + "-" + nome;
        linhasQuadro +=
          '<div class="quadro-linha">' +
          '<div class="quadro-cel quadro-cel-nome">' +
          escaparHTML(nome) +
          "</div>" +
          '<div class="quadro-cel quadro-cel-tipo"><span class="tipo-chip tipo-chip-derivado">' +
          escaparHTML(normalizarTipoPython(info.tipo)) +
          "</span></div>" +
          '<div class="quadro-cel quadro-cel-seta"><span class="referencia-dot" data-ref-origem="' +
          escaparHTML(referencia) +
          '" title="' +
          escaparHTML(traduzir("memory.referenceTitle", { name: nome })) +
          '"></span></div>' +
          "</div>";
      } else {
        linhasQuadro +=
          '<div class="quadro-linha">' +
          '<div class="quadro-cel quadro-cel-nome">' +
          escaparHTML(nome) +
          "</div>" +
          '<div class="quadro-cel quadro-cel-tipo"><span class="tipo-chip tipo-chip-primitivo">' +
          escaparHTML(normalizarTipoPython(info.tipo || "var")) +
          "</span></div>" +
          '<div class="quadro-cel quadro-cel-valor">' +
          escaparHTML(info.repr) +
          "</div>" +
          "</div>";
      }
    }

    const nomeEscopo =
      quadro.escopo === "Global"
        ? traduzir("scope.global")
        : quadro.escopo || traduzir("scope.global");
    paineisQuadros.push(
      '<div class="painel-memoria">' +
        '<div class="painel-titulo">' +
        escaparHTML(nomeEscopo) +
        "</div>" +
        '<div class="quadro">' +
        '<div class="quadro-titulo">' +
        escaparHTML(traduzir("memory.variables")) +
        "</div>" +
        '<div class="quadro-linhas">' +
        (linhasQuadro ||
          '<div class="quadro-linha"><div class="quadro-cel"><span class="empty">' +
            escaparHTML(traduzir("memory.emptyShort")) +
            "</span></div></div>") +
        "</div></div></div>",
    );
  }

  if (
    importacoes.every(({ info }) => Number.isInteger(info.ordem_importacao))
  ) {
    importacoes.sort(
      (a, b) =>
        a.info.ordem_importacao - b.info.ordem_importacao ||
        a.indice - b.indice,
    );
  }

  let objetosHTML = "";
  for (const { nome, info, referencia } of objetosPorReferencia.values()) {
    let corpo = "";
    const tipoPython = normalizarTipoPython(info.tipo);
    if (tipoPython === "list" || tipoPython === "tuple") {
      corpo = info.elementos
        .map(
          (e, i) =>
            '<div class="objeto-item"><span class="objeto-item-idx">' +
            i +
            "</span>" +
            renderizarValorTipado(e) +
            "</div>",
        )
        .join("");
    } else if (tipoPython === "set") {
      corpo = info.elementos
        .map(
          (e) =>
            '<div class="objeto-item">' + renderizarValorTipado(e) + "</div>",
        )
        .join("");
    } else if (tipoPython === "dict") {
      corpo = paresDicionario(info)
        .map(
          ({ chave, valor }) =>
            '<div class="objeto-dict-par"><span class="objeto-dict-chave">' +
            escaparHTML(normalizarItemObjeto(chave).repr) +
            '</span><span>:</span><span class="objeto-valor-tipado">' +
            renderizarValorTipado(valor) +
            "</span></div>",
        )
        .join("");
    } else if (info.atributos) {
      corpo = atributosObjeto(info)
        .map(
          ({ nome: atributo, valor }) =>
            '<div class="objeto-dict-par"><span class="objeto-dict-chave">' +
            escaparHTML(atributo) +
            '</span><span>=</span><span class="objeto-valor-tipado">' +
            renderizarValorTipado(valor) +
            "</span></div>",
        )
        .join("");
    }
    if (info.truncado) {
      corpo += '<div class="objeto-item">...</div>';
    }
    const classeVisual = ["list", "tuple", "set", "dict"].includes(tipoPython)
      ? "objeto-tipo-" + tipoPython
      : "objeto-tipo-classe";
    objetosHTML +=
      '<div class="objeto-card ' +
      classeVisual +
      '" data-ref-destino="' +
      escaparHTML(referencia) +
      '">' +
      '<div class="objeto-titulo">' +
      escaparHTML(nome) +
      " — " +
      escaparHTML(tipoPython) +
      "</div>" +
      '<div class="objeto-corpo">' +
      (corpo ||
        '<span class="empty">' +
          escaparHTML(traduzir("memory.objectEmpty")) +
          "</span>") +
      "</div>" +
      "</div>";
  }

  const painelObjetos = objetosHTML
    ? '<div class="painel-memoria">' +
      '<div class="painel-titulo">' +
      escaparHTML(traduzir("memory.objects")) +
      "</div>" +
      objetosHTML +
      "</div>"
    : "";
  const painelFuncoes =
    funcoes.length > 0
      ? '<div class="painel-memoria">' +
        renderizarQuadroFuncoes(funcoes, traduzir("memory.noFunctions")) +
        "</div>"
      : "";
  const painelClasses =
    classes.length > 0
      ? '<div class="painel-memoria">' +
        renderizarQuadroClasses(classes, traduzir("memory.noClasses")) +
        "</div>"
      : "";
  const painelImportacoes =
    importacoes.length > 0
      ? '<div class="painel-memoria">' +
        renderizarQuadroImportacoes(importacoes, traduzir("memory.noImports")) +
        "</div>"
      : "";
  const outrosHTML = painelFuncoes + painelClasses + painelImportacoes;

  return (
    '<div class="memoria-bloco">' +
    '<div class="memoria-topo">' +
    '<div class="section-label">' +
    escaparHTML(traduzir("memory.title")) +
    "</div>" +
    '<div class="memoria-subtitulo">' +
    escaparHTML(traduzir("memory.subtitle")) +
    "</div>" +
    "</div>" +
    '<div class="memoria-diagrama">' +
    '<svg class="memoria-setas" id="memoria-setas" aria-hidden="true"></svg>' +
    '<div class="memoria-container">' +
    '<div class="memoria-coluna memoria-coluna-variaveis">' +
    paineisQuadros.join("") +
    "</div>" +
    '<div class="memoria-coluna memoria-coluna-objetos">' +
    painelObjetos +
    "</div>" +
    "</div>" +
    (outrosHTML ? '<div class="memoria-outros">' + outrosHTML + "</div>" : "") +
    "</div>" +
    "</div>"
  );
}

export function desenharSetasMemoria() {
  const diagrama = document.querySelector(".memoria-diagrama");
  const svg = document.getElementById("memoria-setas");
  if (!diagrama || !svg)
    return;

  const area = diagrama.getBoundingClientRect();
  if (area.width === 0 || area.height === 0)
    return;

  const cor = document.body.classList.contains("tema-escuro")
    ? "#38bdf8"
    : "#0f5f8f";
  svg.setAttribute("viewBox", "0 0 " + area.width + " " + area.height);
  svg.setAttribute("width", area.width);
  svg.setAttribute("height", area.height);
  svg.innerHTML =
    '<defs><marker id="memoria-arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,4 L0,8 Z" fill="' +
    cor +
    '"></path></marker></defs>';

  const destinos = Array.from(diagrama.querySelectorAll("[data-ref-destino]"));
  const origens = Array.from(diagrama.querySelectorAll("[data-ref-origem]"));

  for (const origem of origens) {
    const nome = origem.dataset.refOrigem;
    const destino = destinos.find((item) => item.dataset.refDestino === nome);
    if (!destino)
      continue;

    const origemRect = origem.getBoundingClientRect();
    const destinoRect = destino.getBoundingClientRect();
    const x1 = origemRect.left + origemRect.width / 2 - area.left;
    const y1 = origemRect.top + origemRect.height / 2 - area.top;
    const destinoEstaADireita = destinoRect.left >= origemRect.left;
    const x2 =
      (destinoEstaADireita ? destinoRect.left : destinoRect.right) - area.left;
    const y2 =
      destinoRect.top + Math.min(30, destinoRect.height / 2) - area.top;
    const distancia = Math.max(34, Math.abs(x2 - x1) * 0.45);
    const c1x = destinoEstaADireita ? x1 + distancia : x1 - distancia;
    const c2x = destinoEstaADireita ? x2 - distancia : x2 + distancia;

    const caminho = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    caminho.setAttribute(
      "d",
      "M " +
        x1 +
        " " +
        y1 +
        " C " +
        c1x +
        " " +
        y1 +
        ", " +
        c2x +
        " " +
        y2 +
        ", " +
        x2 +
        " " +
        y2,
    );
    caminho.setAttribute("fill", "none");
    caminho.setAttribute("stroke", cor);
    caminho.setAttribute("stroke-width", "2");
    caminho.setAttribute("marker-end", "url(#memoria-arrowhead)");
    svg.appendChild(caminho);
  }
}

function formatarChamadaPilha(item) {
  if (!item || item.escopo === "Global")
    return traduzir("scope.global");
  const argumentos = Array.isArray(item.argumentos) ? item.argumentos : [];
  const textoArgumentos = argumentos
    .map((arg) => {
      const nome = escaparHTML(arg.nome);
      return arg.exibir_valor === false
        ? nome
        : nome + "=" + escaparHTML(arg.valor);
    })
    .join(", ");
  return escaparHTML(item.escopo) + "(" + textoArgumentos + ")";
}

export function renderizarPilhaChamadas(pilha, passoAtual) {
  if (!Array.isArray(pilha) || pilha.length <= 1) {
    return '<p class="empty">' + escaparHTML(traduzir("stack.empty")) + "</p>";
  }
  const ultimoIndice = pilha.length - 1;
  const mostrarRetorno =
    passoAtual &&
    passoAtual.evento === "return" &&
    passoAtual.valor_retorno !== undefined;

  const itens = pilha
    .map((item, indice) => {
      const atual = item.atual ? " atual" : "";
      const marcadorAtual = item.atual
        ? " - " + traduzir("stack.currentScope")
        : "";
      const linha = Number.isInteger(item.linha)
        ? traduzir("input.line") + " " + item.linha
        : traduzir("input.line") + " -";
      const retornoHTML =
        indice === ultimoIndice && mostrarRetorno
          ? '<div class="pilha-retorno"><i class="fa-solid fa-turn-up" aria-hidden="true"></i>' +
            escaparHTML(traduzir("stack.returns")) +
            " " +
            escaparHTML(passoAtual.valor_retorno) +
            "</div>"
          : "";
      const conectorHTML =
        indice < ultimoIndice
          ? '<div class="pilha-conector"><i class="fa-solid fa-arrow-down" aria-hidden="true"></i>' +
            escaparHTML(traduzir("stack.calls")) +
            "</div>"
          : "";
      return (
        '<div class="pilha-item' +
        atual +
        '">' +
        '<div class="pilha-indice">' +
        (indice + 1) +
        "</div>" +
        "<div>" +
        '<div class="pilha-chamada">' +
        formatarChamadaPilha(item) +
        "</div>" +
        '<div class="pilha-meta">' +
        linha +
        marcadorAtual +
        "</div>" +
        retornoHTML +
        "</div>" +
        "</div>" +
        conectorHTML
      );
    })
    .join("");

  return (
    '<div class="pilha-bloco">' +
    '<div class="pilha-subtitulo">' +
    escaparHTML(traduzir("stack.subtitle")) +
    "</div>" +
    '<div class="pilha-lista">' +
    itens +
    "</div>" +
    "</div>"
  );
}

export function montarTerminalSaida(saida, chaveVazio) {
  const conteudo =
    saida && String(saida).trim()
      ? escaparHTML(saida)
      : '<span class="empty">' + escaparHTML(traduzir(chaveVazio)) + "</span>";
  return (
    '<div class="terminal">' +
    '<div class="terminal-header">' +
    '<div class="terminal-dot vermelho"></div>' +
    '<div class="terminal-dot amarelo"></div>' +
    '<div class="terminal-dot verde"></div>' +
    '<span class="terminal-label"><i class="fa-solid fa-terminal"></i>' +
    escaparHTML(traduzir("output.label")) +
    "</span></div>" +
    '<div class="terminal-body">' +
    conteudo +
    "</div></div>"
  );
}

export function montarTerminalSaidaErro(saidaErro) {
  if (!saidaErro || !String(saidaErro).trim())
    return "";
  return (
    '<div class="terminal terminal-erro" role="alert">' +
    '<div class="terminal-header">' +
    '<div class="terminal-dot vermelho"></div>' +
    '<span class="terminal-label"><i class="fa-solid fa-triangle-exclamation"></i>' +
    escaparHTML(traduzir("output.errorLabel")) +
    "</span></div>" +
    '<div class="terminal-body">' +
    escaparHTML(saidaErro) +
    "</div></div>"
  );
}
