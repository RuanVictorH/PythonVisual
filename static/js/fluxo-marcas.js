// Marcas dos blocos do fluxograma a cada passo: o que está prestes a rodar
// (proximo), o último executado (executado) e os já visitados (visitado).
// Só regras, sem DOM: o fluxo.js aplica as marcas ao desenho.

function profundidade(passo) {
  return Array.isArray(passo.pilha_chamadas) ? passo.pilha_chamadas.length : 0;
}

// Linhas já executadas na invocação atual: anda para trás na mesma
// profundidade da pilha, até a chamada da função ou até um return.
function visitadasDaInvocacao(passos, k) {
  const linhas = new Set();
  const d = profundidade(passos[k]);

  for (let j = k - 1; j >= 0; j--) {
    const p = passos[j];
    const dj = profundidade(p);

    if (dj < d || (p.evento === "return" && dj === d))
      break;

    if (dj === d && p.evento === "line" && Number.isInteger(p.linha))
      linhas.add(p.linha);
  }

  return linhas;
}

// Linhas executadas antes do passo k, em qualquer profundidade.
function todasAsLinhasExecutadas(passos, k) {
  const linhas = new Set();

  for (let j = 0; j < k; j++) {
    const p = passos[j];

    if (p.evento === "line" && Number.isInteger(p.linha))
      linhas.add(p.linha);
  }

  return linhas;
}

// linhaProxima e linhaExecutada vêm numeradas a partir de 1, como as chaves de
// `indice` (linha -> id do bloco); `formas` tem os ids dos blocos desenhados e
// `executando` diz se o gráfico exibido é o da função em execução. Devolve as
// marcas (id -> "visitado" | "executado" | "proximo") e os ids do próximo
// bloco e do último executado, quando existem.
export function calcularMarcas({
  passos,
  indiceAtual,
  linhaProxima,
  linhaExecutada,
  executando,
  indice,
  formas,
  tipo,
}) {
  const passo = passos[indiceAtual];
  const marcas = new Map();
  const visitadas = executando
    ? visitadasDaInvocacao(passos, indiceAtual)
    : todasAsLinhasExecutadas(passos, indiceAtual);

  for (const linha of visitadas) {
    if (indice.has(linha))
      marcas.set(indice.get(linha), "visitado");
  }

  // No passo final a pilha vem vazia e os demais blocos perdem a marca de
  // visitado; o Início sozinho com ela destoaria.
  if (executando && formas.has("inicio") && passo.evento !== "fim")
    marcas.set("inicio", "visitado");

  let idExecutado;

  if (linhaExecutada !== null && indice.has(linhaExecutada)) {
    idExecutado = indice.get(linhaExecutada);
    marcas.set(idExecutado, "executado");
  }

  if (formas.has("fim") && executando) {
    const ehFimDoGlobal = passo.evento === "fim" && tipo === "principal";
    const ehRetorno = passo.evento === "return" && tipo !== "principal";

    if (ehFimDoGlobal || ehRetorno)
      marcas.set("fim", "executado");
  }

  let idProximo;

  if (linhaProxima !== null && executando && indice.has(linhaProxima)) {
    idProximo = indice.get(linhaProxima);
    marcas.set(idProximo, "proximo");
  }

  return { marcas, idProximo, idExecutado };
}
