import { editor } from "./editor.js";
import { traduzir } from "./i18n.js";
import { escaparHTML } from "./util.js";
import {
  renderizarMemoria,
  renderizarPilhaChamadas,
  montarTerminalSaida,
  montarTerminalSaidaErro,
  desenharSetasMemoria,
} from "./renderizar-memoria.js";
import {
  explicarComandoPython,
  montarCaixaErro,
  obterBlocoAspasTriplas,
} from "./explicacao.js";

let passos = [];
let indiceAtual = 0;
let linhaExecutadaMarcada = null;
let linhaProximaMarcada = null;
let entradasColetadas = [];
let entradaPendente = null;

export function obterPassos() {
  return passos;
}

export function obterEntradaPendente() {
  return entradaPendente;
}

export function entradaPendenteAtual() {
  if (passos.length === 0)
    return null;
  const ultimo = passos[passos.length - 1];
  return ultimo && ultimo.entrada_pendente ? ultimo : null;
}

export function ocultarEntradaPendente() {
  entradaPendente = null;
  document.getElementById("entrada-card").style.display = "none";
  document.getElementById("entrada").value = "";
}

export function mostrarEntradaPendente(passoAtual) {
  entradaPendente = {
    linha: passoAtual.linha,
    prompt: passoAtual.prompt || "",
  };
  document.getElementById("entrada-card").style.display = "block";
  document.getElementById("entrada-linha-badge").textContent =
    traduzir("input.line") + " " + passoAtual.linha;
  document.getElementById("entrada-prompt-texto").textContent =
    entradaPendente.prompt || traduzir("input.promptDefault");
  const campoEntrada = document.getElementById("entrada");
  campoEntrada.value = "";
  campoEntrada.focus();
}

export function atualizarEntradaDinamica() {
  if (!entradaPendente)
    ocultarEntradaPendente();
}

export function limparEntradasColetadas() {
  entradasColetadas = [];
}

export function ocultarExplicacaoLinha() {
  document.getElementById("explicacao-card").style.display = "none";
  document.getElementById("explicacao-corpo").innerHTML = "";
  document.getElementById("explicacao-linha-numero").textContent = "";
}

export function limparMarcacoes() {
  if (linhaExecutadaMarcada !== null) {
    editor.removeLineClass(
      linhaExecutadaMarcada,
      "background",
      "linha-executada",
    );
    linhaExecutadaMarcada = null;
  }
  if (linhaProximaMarcada !== null) {
    editor.removeLineClass(linhaProximaMarcada, "background", "linha-proxima");
    linhaProximaMarcada = null;
  }
  editor.clearGutter("exec-gutter");
}

function criarMarcador(tipo) {
  const marcador = document.createElement("div");
  marcador.className = "exec-marker " + tipo;
  marcador.title =
    tipo === "proxima"
      ? traduzir("marker.running")
      : traduzir("marker.executed");
  marcador.innerHTML =
    tipo === "proxima"
      ? '<i class="fa-solid fa-arrow-right"></i>'
      : '<i class="fa-solid fa-check"></i>';
  return marcador;
}

export function resetarExecucaoVisual() {
  passos = [];
  indiceAtual = 0;
  entradasColetadas = [];
  ocultarEntradaPendente();
  limparMarcacoes();
  const slider = document.getElementById("slider");
  slider.max = 0;
  slider.value = 0;
  slider.disabled = true;
  document.getElementById("contador").textContent = traduzir("counter.empty");
  ocultarExplicacaoLinha();
  atualizarBotoes();
}

export function linhaExecutadaAtual() {
  const passoAtual = passos[indiceAtual];
  if (
    passoAtual &&
    (passoAtual.evento === "return" || passoAtual.evento === "exception") &&
    Number.isInteger(passoAtual.linha)
  ) {
    return passoAtual.linha - 1;
  }
  for (let i = indiceAtual - 1; i >= 0; i--) {
    if (Number.isInteger(passos[i].linha))
      return passos[i].linha - 1;
  }
  return null;
}

export function linhaProximaAtual() {
  const passoAtual = passos[indiceAtual];
  if (
    passoAtual &&
    (passoAtual.evento === "line" || passoAtual.evento === "input_pendente") &&
    Number.isInteger(passoAtual.linha)
  ) {
    return passoAtual.linha - 1;
  }
  if (passoAtual && passoAtual.evento === "exception") {
    for (let i = indiceAtual + 1; i < passos.length; i++) {
      if (passos[i].evento === "line" && Number.isInteger(passos[i].linha)) {
        return passos[i].linha - 1;
      }
      if (passos[i].erro)
        break;
    }
  }
  return null;
}

function aplicarMarcacoes() {
  limparMarcacoes();
  const executada = linhaExecutadaAtual();
  const proxima = linhaProximaAtual();

  if (executada !== null) {
    linhaExecutadaMarcada = executada;
    editor.addLineClass(executada, "background", "linha-executada");
    editor.setGutterMarker(
      executada,
      "exec-gutter",
      criarMarcador("executada"),
    );
  }
  if (proxima !== null) {
    linhaProximaMarcada = proxima;
    editor.addLineClass(proxima, "background", "linha-proxima");
    editor.setGutterMarker(proxima, "exec-gutter", criarMarcador("proxima"));
  }

  const alvo = proxima !== null ? proxima : executada;
  if (alvo !== null)
    editor.scrollIntoView({ line: alvo, ch: 0 }, 60);
}

export function atualizarBotoes() {
  const semPassos = passos.length === 0;
  document.getElementById("btn-primeiro").disabled =
    semPassos || indiceAtual === 0;
  document.getElementById("btn-anterior").disabled =
    semPassos || indiceAtual === 0;
  document.getElementById("btn-proximo").disabled =
    semPassos || indiceAtual === passos.length - 1;
  document.getElementById("btn-ultimo").disabled =
    semPassos || indiceAtual === passos.length - 1;
}

function alvoExplicacaoLinha() {
  const proxima = linhaProximaAtual();
  if (proxima !== null) return { indice: proxima };
  const executada = linhaExecutadaAtual();
  if (executada !== null) return { indice: executada };
  return null;
}

function atualizarExplicacaoLinha() {
  const card = document.getElementById("explicacao-card");
  const corpo = document.getElementById("explicacao-corpo");
  if (passos.length === 0) {
    ocultarExplicacaoLinha();
    return;
  }

  const alvo = alvoExplicacaoLinha();
  card.style.display = "block";
  const numeroLinha = document.getElementById("explicacao-linha-numero");
  if (!alvo) {
    numeroLinha.textContent = "";
    corpo.innerHTML =
      '<p class="explicacao-texto">' +
      escaparHTML(traduzir("line.finishedExplain")) +
      "</p>";
    return;
  }

  const linhaCodigo = editor.getLine(alvo.indice) || "";
  const blocoAspasTriplas = obterBlocoAspasTriplas(alvo.indice);
  const codigoExplicado = blocoAspasTriplas
    ? blocoAspasTriplas.codigo
    : linhaCodigo;
  const identificadorLinha =
    blocoAspasTriplas && blocoAspasTriplas.indiceFinal !== alvo.indice
      ? alvo.indice + 1 + "–" + (blocoAspasTriplas.indiceFinal + 1)
      : String(alvo.indice + 1);
  numeroLinha.textContent =
    " (" + traduzir("input.line") + " " + identificadorLinha + ")";
  corpo.innerHTML =
    '<pre class="explicacao-codigo">' +
    escaparHTML(codigoExplicado || traduzir("line.empty")) +
    "</pre>" +
    '<p class="explicacao-texto">' +
    escaparHTML(explicarComandoPython(linhaCodigo, blocoAspasTriplas)) +
    "</p>";
}

export function renderizarPasso() {
  if (passos.length === 0)
    return;
  const p = passos[indiceAtual];
  const corpo = document.getElementById("saida-corpo");
  const corpoSaida = document.getElementById("saida-programa-corpo");
  const corpoPilha = document.getElementById("pilha-corpo");
  const linhaExecutada = linhaExecutadaAtual();
  const linhaProxima = linhaProximaAtual();
  const textoExecutada =
    linhaExecutada === null ? "-" : String(linhaExecutada + 1);
  const textoProxima =
    linhaProxima === null
      ? traduzir("status.finished")
      : String(linhaProxima + 1);
  const escopo =
    p.evento === "fim"
      ? traduzir("scope.end")
      : p.escopo === "Global"
        ? traduzir("scope.global")
        : p.escopo || traduzir("scope.global");

  const pendenteNoFim = entradaPendenteAtual();
  const estaNoPassoPendente = pendenteNoFim && indiceAtual === passos.length - 1;
  document.getElementById("contador").textContent = estaNoPassoPendente
    ? ""
    : traduzir("counter.step", {
        current: indiceAtual + 1,
        total: pendenteNoFim ? passos.length - 1 : passos.length,
      });
  atualizarBotoes();
  aplicarMarcacoes();
  atualizarExplicacaoLinha();

  if (p.erro) {
    corpo.innerHTML = montarCaixaErro(p.erro);
    corpoSaida.innerHTML =
      '<div class="section-label"><i class="fa-solid fa-square-terminal" aria-hidden="true"></i>' +
      escaparHTML(traduzir("output.errorUntil")) +
      "</div>" +
      montarTerminalSaida(p.saida, "output.none") +
      montarTerminalSaidaErro(p.saida_erro);
    corpoPilha.innerHTML = renderizarPilhaChamadas(p.pilha_chamadas, p);
    requestAnimationFrame(desenharSetasMemoria);
    return;
  }

  const etapaTexto =
    p.evento === "fim"
      ? traduzir("state.finished")
      : p.evento === "input_pendente"
        ? traduzir("state.waitingInput")
        : p.evento === "return"
          ? traduzir("state.return")
          : traduzir("state.running");

  corpo.innerHTML =
    '<div class="passo-info">' +
    escaparHTML(etapaTexto) +
    '<span class="linha-badge executada"><i class="fa-solid fa-check"></i>' +
    escaparHTML(traduzir("status.executed")) +
    ": " +
    textoExecutada +
    "</span>" +
    '<span class="linha-badge proxima"><i class="fa-solid fa-arrow-right"></i>' +
    escaparHTML(traduzir("status.running")) +
    ": " +
    textoProxima +
    "</span>" +
    '<span class="escopo-badge">' +
    escaparHTML(escopo) +
    "</span>" +
    "</div>" +
    renderizarMemoria(p.variaveis, p.quadros_memoria);
  corpoSaida.innerHTML =
    montarTerminalSaida(p.saida, "output.noPrint") +
    montarTerminalSaidaErro(p.saida_erro) +
    (p.erro_ocorrido ? montarCaixaErro(p.erro_ocorrido, "erro-saida") : "");
  corpoPilha.innerHTML = renderizarPilhaChamadas(p.pilha_chamadas, p);
  requestAnimationFrame(desenharSetasMemoria);
}

export async function executar() {
  entradasColetadas = [];
  ocultarEntradaPendente();
  await executarComEntradas();
}

export async function executarComEntradas() {
  const codigo = editor.getValue();
  const ehPrimeiraExecucao = entradasColetadas.length === 0;
  document.getElementById("saida").style.display = "block";
  document.getElementById("saida-card").style.display = "block";
  document.getElementById("pilha-card").style.display = "block";
  document.getElementById("saida-corpo").innerHTML =
    '<p class="empty">' + escaparHTML(traduzir("run.executing")) + "</p>";
  document.getElementById("saida-programa-corpo").innerHTML =
    '<p class="empty">' + escaparHTML(traduzir("run.executing")) + "</p>";
  document.getElementById("pilha-corpo").innerHTML =
    '<p class="empty">' + escaparHTML(traduzir("run.executing")) + "</p>";
  limparMarcacoes();

  try {
    const resp = await fetch("/executar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, entradas: entradasColetadas }),
    });

    if (!resp.ok) {
      const texto = await resp.text();
      throw new Error(texto || resp.statusText);
    }

    passos = await resp.json();
    const pendente = entradaPendenteAtual();
    indiceAtual = ehPrimeiraExecucao ? 0 : passos.length - 1;

    const slider = document.getElementById("slider");

    if (passos.length === 0) {
      document.getElementById("saida-corpo").innerHTML =
        '<p class="empty">' + escaparHTML(traduzir("run.noSteps")) + "</p>";
      document.getElementById("saida-programa-corpo").innerHTML =
        '<p class="empty">' + escaparHTML(traduzir("output.none")) + "</p>";
      document.getElementById("pilha-corpo").innerHTML =
        '<p class="empty">' + escaparHTML(traduzir("stack.empty")) + "</p>";
      resetarExecucaoVisual();
      return;
    }

    slider.max = passos.length - 1;
    slider.value = indiceAtual;
    slider.disabled = false;
    renderizarPasso();
    if (pendente)
      mostrarEntradaPendente(pendente);
    else
      ocultarEntradaPendente();
  } catch (erro) {
    resetarExecucaoVisual();
    document.getElementById("saida-corpo").innerHTML =
      '<div class="error-box">' +
      escaparHTML(traduzir("run.serverError", { error: String(erro) })) +
      "</div>";
    document.getElementById("saida-programa-corpo").innerHTML =
      '<p class="empty">' + escaparHTML(traduzir("output.none")) + "</p>";
    document.getElementById("pilha-corpo").innerHTML =
      '<p class="empty">' + escaparHTML(traduzir("stack.empty")) + "</p>";
  }
}

export async function enviarEntradaPendente() {
  if (!entradaPendente)
    return;
  const valor = document.getElementById("entrada").value;
  entradasColetadas.push({
    linha: entradaPendente.linha,
    valor,
  });
  ocultarEntradaPendente();
  await executarComEntradas();
}

export function passo(direcao) {
  const novo = indiceAtual + direcao;
  if (novo < 0 || novo >= passos.length)
    return;
  indiceAtual = novo;
  document.getElementById("slider").value = indiceAtual;
  renderizarPasso();
}

export function irPara(valor) {
  if (passos.length === 0)
    return;
  indiceAtual = parseInt(valor);
  renderizarPasso();
}

export function irParaPrimeiro() {
  if (passos.length === 0)
    return;
  indiceAtual = 0;
  document.getElementById("slider").value = indiceAtual;
  renderizarPasso();
}

export function irParaUltimo() {
  if (passos.length === 0)
    return;
  indiceAtual = passos.length - 1;
  document.getElementById("slider").value = indiceAtual;
  renderizarPasso();
}
