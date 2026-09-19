// Fluxograma: recebe o objeto `fluxo` que o backend anexa ao primeiro passo, desenha um SVG
// por gráfico (programa principal, funções, classes) e destaca, a cada passo, o bloco que
// está prestes a rodar (.proximo), o último executado (.executado) e os já visitados
// (.visitado). O texto dos nós vem do código do usuário: entra sempre como textContent.
import { traduzir, obterIdioma } from "./i18n.js";
import { calcularLayout, GEOMETRIA } from "./fluxo-layout.js";

const NS = "http://www.w3.org/2000/svg";
const FONTE =
  '13px ui-monospace, "Cascadia Mono", Consolas, "Liberation Mono", "Courier New", monospace';
const LIMITE_DURO_NOS = 500;
const CLASSES_DE_FORMA = {
  terminal: "terminal",
  processo: "processo",
  decisao: "decisao",
  es: "es",
  definicao: "definicao",
  salto: "salto",
  omitido: "omitido",
};
const TIPOS_DE_NO = new Set([
  "processo", "entrada", "saida", "se", "elif", "para", "enquanto", "tentar",
  "tratador", "interrupcao", "retorno", "definicao", "omitido",
]);

const estado = {
  fluxo: null,
  assinatura: null,
  idioma: null,
  graficos: new Map(),
  exibidoId: null,
  execId: null,
  seguir: true,
  fixadoId: null,
  ultimoCtx: null,
  noAtivoId: null,
};

let contexto2d = null;

function medir(texto) {
  if (!contexto2d) {
    contexto2d = document.createElement("canvas").getContext("2d");
    contexto2d.font = FONTE;
  }
  return contexto2d.measureText(texto).width;
}

function ajustar(texto, larguraMaxima) {
  if (medir(texto) <= larguraMaxima)
    return texto;
  const letras = Array.from(texto);
  let baixo = 0;
  let alto = letras.length;
  while (baixo < alto) {
    const meio = Math.ceil((baixo + alto) / 2);
    if (medir(letras.slice(0, meio).join("") + "…") <= larguraMaxima)
      baixo = meio;
    else
      alto = meio - 1;
  }
  return letras.slice(0, baixo).join("") + "…";
}

function el(tag, atributos, texto) {
  const elemento = document.createElementNS(NS, tag);
  for (const chave of Object.keys(atributos || {}))
    elemento.setAttribute(chave, String(atributos[chave]));
  if (texto !== undefined && texto !== null)
    elemento.textContent = texto;
  return elemento;
}

function obter(id) {
  return document.getElementById(id);
}

function validar(fluxo) {
  if (!fluxo || typeof fluxo !== "object" || fluxo.versao !== 1)
    return false;
  if (!Array.isArray(fluxo.graficos) || fluxo.graficos.length === 0)
    return false;
  if (fluxo.graficos[0].tipo !== "principal")
    return false;
  let total = 0;
  const ehNo = (n) =>
    n &&
    typeof n === "object" &&
    Number.isInteger(n.id) &&
    Number.isInteger(n.linha) &&
    Number.isInteger(n.linha_fim) &&
    typeof n.texto === "string";
  const checarLista = (lista) => {
    if (!Array.isArray(lista))
      return false;
    for (const n of lista) {
      if (!ehNo(n) || !TIPOS_DE_NO.has(n.tipo) || ++total > LIMITE_DURO_NOS)
        return false;
      if (n.tipo === "se") {
        if (!checarLista(n.entao) || !checarLista(n.senao) || !Array.isArray(n.elifs))
          return false;
        for (const e of n.elifs) {
          if (!ehNo(e) || !checarLista(e.entao) || ++total > LIMITE_DURO_NOS)
            return false;
        }
      } else if (n.tipo === "para" || n.tipo === "enquanto") {
        if (!checarLista(n.corpo))
          return false;
      } else if (n.tipo === "tentar") {
        if (
          !checarLista(n.corpo) ||
          !checarLista(n.senao) ||
          !checarLista(n.finalmente) ||
          !Array.isArray(n.tratadores)
        )
          return false;
        for (const t of n.tratadores) {
          if (!ehNo(t) || !checarLista(t.corpo) || ++total > LIMITE_DURO_NOS)
            return false;
        }
      } else if (n.tipo === "definicao") {
        if (n.grafico !== null && !Number.isInteger(n.grafico))
          return false;
      }
    }
    return true;
  };
  const ids = new Set();
  for (const g of fluxo.graficos) {
    if (
      !g ||
      !Number.isInteger(g.id) ||
      ids.has(g.id) ||
      !Number.isInteger(g.linha_def) ||
      !Number.isInteger(g.linha_ini) ||
      !Number.isInteger(g.linha_fim) ||
      typeof g.escopo !== "string" ||
      !checarLista(g.nos)
    )
      return false;
    ids.add(g.id);
  }
  return true;
}

function ehMetodo(g) {
  if (g.tipo !== "funcao" || !estado.fluxo)
    return false;
  const pai = estado.fluxo.graficos.find((outro) => outro.id === g.pai);
  return !!pai && pai.tipo === "classe";
}

function rotuloDoGrafico(g) {
  if (g.tipo === "principal")
    return traduzir("flow.main");
  let chave = "flow.functionOption";
  if (g.tipo === "classe")
    chave = "flow.classOption";
  else if (ehMetodo(g))
    chave = "flow.methodOption";
  return traduzir(chave, { name: g.nome || g.escopo });
}

function formaSvg(f) {
  const { x, y, w, h } = f;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const poligono = (pontos) => el("polygon", { class: "fluxo-forma", points: pontos });
  if (f.kind === "decisao")
    return poligono(`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`);
  if (f.kind === "es") {
    const i = GEOMETRIA.INCL;
    return poligono(`${x + i},${y} ${x + w},${y} ${x + w - i},${y + h} ${x},${y + h}`);
  }
  if (f.kind === "salto")
    return poligono(`${x},${y} ${x + w},${y} ${x + w},${y + h * 0.6} ${cx},${y + h} ${x},${y + h * 0.6}`);
  if (f.kind === "terminal")
    return el("rect", { class: "fluxo-forma", x, y, width: w, height: h, rx: h / 2 });
  const retangulo = el("rect", { class: "fluxo-forma", x, y, width: w, height: h, rx: 4 });
  if (f.kind !== "definicao")
    return retangulo;
  const grupo = el("g");
  grupo.appendChild(retangulo);
  for (const lado of [x + 8, x + w - 8])
    grupo.appendChild(el("line", { class: "fluxo-forma-detalhe", x1: lado, y1: y, x2: lado, y2: y + h }));
  return grupo;
}

function marcaSvg(f) {
  let px = f.x + 4;
  let py = f.y + 4;
  if (f.kind === "decisao") {
    // fora da aresta superior esquerda do losango, para não cobrir o começo do texto
    px = f.x + f.w / 4 - 6;
    py = f.y + f.h / 4 - 4;
  } else if (f.kind === "es") {
    px = f.x + GEOMETRIA.INCL + 4;
  }
  const marca = el("g", { class: "fluxo-marca", transform: `translate(${px} ${py})` });
  marca.appendChild(el("circle", { class: "fluxo-marca-fundo", r: 9 }));
  marca.appendChild(el("path", { class: "fluxo-glifo-seta", d: "M-4,0 L3,0 M0,-3.5 L3.5,0 L0,3.5" }));
  marca.appendChild(el("path", { class: "fluxo-glifo-check", d: "M-4,0.5 L-1,3.5 L4,-3" }));
  return marca;
}

function desenharSvg(grafico, layout) {
  const larg = layout.largura;
  const alt = layout.altura;
  const svg = el("svg", {
    class: "fluxo-svg",
    viewBox: `0 0 ${larg} ${alt}`,
    role: "img",
    focusable: "false",
  });
  svg.style.width = `${larg / 16}rem`;
  svg.style.height = `${alt / 16}rem`;
  const idSeta = `fluxo-seta-${grafico.id}`;
  const defs = el("defs");
  const marcador = el("marker", {
    id: idSeta,
    viewBox: "0 0 10 10",
    refX: 9,
    refY: 5,
    markerWidth: 9,
    markerHeight: 9,
    markerUnits: "userSpaceOnUse",
    orient: "auto",
  });
  marcador.appendChild(el("path", { class: "fluxo-seta", d: "M0,0 L10,5 L0,10 z" }));
  defs.appendChild(marcador);
  svg.appendChild(defs);

  for (const a of layout.arestas) {
    const d = a.pts.map(([px, py], i) => `${i ? "L" : "M"}${px},${py}`).join(" ");
    const atributos = { class: "fluxo-aresta", d, fill: "none" };
    if (a.seta)
      atributos["marker-end"] = `url(#${idSeta})`;
    svg.appendChild(el("path", atributos));
  }
  for (const j of layout.juncoes)
    svg.appendChild(el("circle", { class: "fluxo-juncao", cx: j.x, cy: j.y, r: 3.5 }));

  const formas = new Map();
  const info = new Map();
  for (const f of layout.formas) {
    const g = el("g", {
      class: `fluxo-no fluxo-no-${CLASSES_DE_FORMA[f.kind] || "processo"}`,
      "data-no": f.id,
      "data-linha": f.ini === null ? "" : f.ini,
      "data-linha-fim": f.fim === null ? "" : f.fim,
    });
    if (f.dica)
      g.appendChild(el("title", {}, f.dica));
    g.appendChild(formaSvg(f));
    g.appendChild(
      el(
        "text",
        {
          class: "fluxo-texto",
          x: f.x + f.w / 2,
          y: f.y + f.h / 2,
          "text-anchor": "middle",
          dy: "0.35em",
        },
        f.texto,
      ),
    );
    g.appendChild(marcaSvg(f));
    if (f.grafico !== null && f.grafico !== undefined) {
      g.classList.add("fluxo-clicavel");
      const destino = f.grafico;
      g.addEventListener("click", () => fixarGrafico(destino));
    }
    svg.appendChild(g);
    formas.set(f.id, g);
    info.set(f.id, f);
  }
  for (const a of layout.arestas) {
    if (!a.rotulo)
      continue;
    svg.appendChild(
      el(
        "text",
        {
          class: "fluxo-rotulo",
          x: a.rotulo.x,
          y: a.rotulo.y,
          "text-anchor": a.rotulo.ancora,
        },
        traduzir(a.rotulo.chave),
      ),
    );
  }
  return { svg, formas, info };
}

function selecionarGrafico(linha, escopo) {
  const graficos = estado.fluxo.graficos;
  let melhor = graficos[0];
  for (let i = 1; i < graficos.length; i++) {
    const g = graficos[i];
    if (linha < g.linha_ini || linha > g.linha_fim)
      continue;
    if (g.linha_ini <= g.linha_def && g.escopo !== escopo)
      continue;
    if (g.linha_ini >= melhor.linha_ini)
      melhor = g;
  }
  return melhor;
}

function reconstruir(fluxo, assinatura) {
  estado.graficos.clear();
  for (const g of fluxo.graficos) {
    const layout = calcularLayout(g, { medir, ajustar, traduzir });
    const { svg, formas, info } = desenharSvg(g, layout);
    estado.graficos.set(g.id, { def: g, layout, svg, formas, info, aplicados: new Map() });
  }
  estado.fluxo = fluxo;
  estado.assinatura = assinatura;
  estado.idioma = obterIdioma();
  estado.exibidoId = null;
  preencherSeletor();
  const aviso = obter("fluxo-aviso");
  if (aviso) {
    aviso.hidden = !fluxo.truncado;
    aviso.textContent = fluxo.truncado
      ? traduzir("flow.truncated", { max: fluxo.limite_nos, count: fluxo.omitidos })
      : "";
  }
  const legenda = obter("fluxo-legenda");
  if (legenda)
    legenda.hidden = false;
}

function preencherSeletor() {
  const seletor = obter("fluxo-select");
  const barra = obter("fluxo-barra");
  if (!seletor || !barra)
    return;
  seletor.replaceChildren();
  for (const g of estado.fluxo.graficos) {
    const opcao = document.createElement("option");
    opcao.value = String(g.id);
    opcao.textContent = rotuloDoGrafico(g);
    seletor.appendChild(opcao);
  }
  barra.hidden = estado.fluxo.graficos.length < 2;
}

function esconder() {
  const carta = obter("fluxo-card");
  if (carta)
    carta.style.display = "none";
  estado.fluxo = null;
  estado.assinatura = null;
  estado.exibidoId = null;
  estado.ultimoCtx = null;
  estado.noAtivoId = null;
  estado.graficos.clear();
  const rolagem = obter("fluxo-rolagem");
  if (rolagem)
    rolagem.replaceChildren();
}

function mostrarIndisponivel() {
  esconder();
  const carta = obter("fluxo-card");
  const aviso = obter("fluxo-aviso");
  if (!carta || !aviso)
    return;
  carta.style.display = "block";
  aviso.hidden = false;
  aviso.textContent = traduzir("flow.unavailable");
  const barra = obter("fluxo-barra");
  const legenda = obter("fluxo-legenda");
  if (barra)
    barra.hidden = true;
  if (legenda)
    legenda.hidden = true;
}

export function definirFluxo(fluxo, opcoes = {}) {
  try {
    if (!obter("fluxo-card"))
      return;
    if (fluxo === undefined) {
      esconder();
      return;
    }
    if (fluxo === null || !validar(fluxo)) {
      mostrarIndisponivel();
      return;
    }
    const assinatura = JSON.stringify(fluxo) + "|" + obterIdioma();
    obter("fluxo-card").style.display = "block";
    if (assinatura !== estado.assinatura) {
      reconstruir(fluxo, assinatura);
      if (!estado.graficos.has(estado.fixadoId)) {
        estado.fixadoId = null;
        estado.seguir = true;
      }
    }
    if (opcoes.reiniciar) {
      estado.seguir = true;
      estado.fixadoId = null;
    }
  } catch (erro) {
    console.error(erro);
    mostrarIndisponivel();
  }
}

export function limparFluxo() {
  try {
    esconder();
  } catch (erro) {
    console.error(erro);
  }
}

export function limparDestaquesFluxo() {
  try {
    const g = estado.graficos.get(estado.exibidoId);
    if (g)
      aplicarEstados(g, new Map());
  } catch (erro) {
    console.error(erro);
  }
}

function fixarGrafico(id) {
  if (!estado.graficos.has(id))
    return;
  estado.fixadoId = id;
  estado.seguir = false;
  reaplicar();
}

function reaplicar() {
  if (estado.ultimoCtx)
    atualizar(estado.ultimoCtx);
}

function aplicarEstados(g, novos) {
  for (const [id, valor] of g.aplicados) {
    if (novos.get(id) !== valor) {
      const no = g.formas.get(id);
      if (no)
        no.classList.remove(valor);
    }
  }
  for (const [id, valor] of novos) {
    if (g.aplicados.get(id) !== valor) {
      const no = g.formas.get(id);
      if (no)
        no.classList.add(valor);
    }
  }
  g.aplicados = novos;
}

function profundidade(passo) {
  return Array.isArray(passo.pilha_chamadas) ? passo.pilha_chamadas.length : 0;
}

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

function todasAsLinhasExecutadas(passos, k) {
  const linhas = new Set();
  for (let j = 0; j < k; j++) {
    const p = passos[j];
    if (p.evento === "line" && Number.isInteger(p.linha))
      linhas.add(p.linha);
  }
  return linhas;
}

function mostrarGrafico(id) {
  if (estado.exibidoId === id)
    return;
  const anterior = estado.graficos.get(estado.exibidoId);
  if (anterior)
    aplicarEstados(anterior, new Map());
  const rolagem = obter("fluxo-rolagem");
  const g = estado.graficos.get(id);
  if (rolagem && g)
    rolagem.replaceChildren(g.svg);
  estado.exibidoId = id;
  const seletor = obter("fluxo-select");
  if (seletor)
    seletor.value = String(id);
}

function atualizarControles(exibido, executando, passo) {
  const botao = obter("fluxo-seguir");
  if (botao) {
    botao.setAttribute("aria-pressed", estado.seguir ? "true" : "false");
    botao.classList.toggle("ativo", estado.seguir);
  }
  const status = obter("fluxo-status");
  if (!status)
    return;
  const partes = [];
  if (!executando) {
    partes.push(
      traduzir("flow.runningIn", { name: rotuloDoGrafico(estado.graficos.get(estado.execId).def) }),
    );
  } else if (exibido.def.tipo !== "principal" && Array.isArray(passo.pilha_chamadas)) {
    const repetidos = passo.pilha_chamadas.filter((f) => f.escopo === passo.escopo).length;
    if (repetidos >= 2)
      partes.push(traduzir("flow.depth", { n: repetidos }));
  }
  status.textContent = partes.join(" · ");
}

function atualizarResumo(exibido, idProximo, idExecutado) {
  const idAlvo = idProximo !== undefined ? idProximo : idExecutado;
  const chave = idProximo !== undefined ? "flow.ariaNext" : "flow.ariaExecuted";
  let resumo = traduzir("flow.aria", {
    name: rotuloDoGrafico(exibido.def),
    count: exibido.layout.formas.length,
  });
  const forma = idAlvo !== undefined ? exibido.info.get(idAlvo) : null;
  if (forma && forma.texto)
    resumo += " " + traduzir(chave, { text: forma.texto });
  exibido.svg.setAttribute("aria-label", resumo);
}

function rolarAte(exibido, id) {
  const rolagem = obter("fluxo-rolagem");
  const no = id === undefined ? null : exibido.formas.get(id);
  if (!rolagem || !no)
    return;
  const c = rolagem.getBoundingClientRect();
  const r = no.getBoundingClientRect();
  if (c.width === 0 || c.height === 0)
    return;
  const margem = 24;
  if (r.top < c.top + margem || r.bottom > c.bottom - margem)
    rolagem.scrollTop += r.top + r.height / 2 - (c.top + c.height / 2);
  if (r.left < c.left + margem || r.right > c.right - margem)
    rolagem.scrollLeft += r.left + r.width / 2 - (c.left + c.width / 2);
}

function atualizar(ctx) {
  if (!estado.fluxo)
    return;
  estado.ultimoCtx = ctx;
  if (estado.idioma !== obterIdioma()) {
    reconstruir(estado.fluxo, estado.assinatura);
  }
  const { passos, indiceAtual } = ctx;
  const passo = passos[indiceAtual];
  if (!passo)
    return;
  const linhaProxima = ctx.linhaProxima === null ? null : ctx.linhaProxima + 1;
  const linhaExecutada = ctx.linhaExecutada === null ? null : ctx.linhaExecutada + 1;
  const linhaRef = linhaProxima !== null ? linhaProxima : linhaExecutada;
  let idExecutando = estado.fluxo.graficos[0].id;
  if (passo.evento !== "fim" && linhaRef !== null)
    idExecutando = selecionarGrafico(linhaRef, passo.escopo).id;
  estado.execId = idExecutando;
  const seguindo = estado.seguir || !estado.graficos.has(estado.fixadoId);
  const idExibido = seguindo ? idExecutando : estado.fixadoId;
  mostrarGrafico(idExibido);
  const exibido = estado.graficos.get(idExibido);
  const executando = idExibido === idExecutando;
  const indice = exibido.layout.indice;

  const novos = new Map();
  const visitadas = executando
    ? visitadasDaInvocacao(passos, indiceAtual)
    : todasAsLinhasExecutadas(passos, indiceAtual);
  for (const linha of visitadas) {
    if (indice.has(linha))
      novos.set(indice.get(linha), "visitado");
  }
  if (executando && exibido.formas.has("inicio"))
    novos.set("inicio", "visitado");
  let idExecutado;
  if (linhaExecutada !== null && indice.has(linhaExecutada)) {
    idExecutado = indice.get(linhaExecutada);
    novos.set(idExecutado, "executado");
  }
  if (exibido.formas.has("fim") && executando) {
    const ehFimDoGlobal = passo.evento === "fim" && exibido.def.tipo === "principal";
    if (ehFimDoGlobal || (passo.evento === "return" && exibido.def.tipo !== "principal"))
      novos.set("fim", "executado");
  }
  let idProximo;
  if (linhaProxima !== null && executando && indice.has(linhaProxima)) {
    idProximo = indice.get(linhaProxima);
    novos.set(idProximo, "proximo");
  }
  aplicarEstados(exibido, novos);
  estado.noAtivoId = idProximo !== undefined ? idProximo : idExecutado;
  atualizarControles(exibido, executando, passo);
  atualizarResumo(exibido, idProximo, idExecutado);
  rolarAte(exibido, estado.noAtivoId);
}

export function atualizarFluxo(ctx) {
  try {
    atualizar(ctx);
  } catch (erro) {
    console.error(erro);
  }
}

export function rolarFluxoParaNoAtivo() {
  try {
    const exibido = estado.graficos.get(estado.exibidoId);
    if (exibido)
      rolarAte(exibido, estado.noAtivoId);
  } catch (erro) {
    console.error(erro);
  }
}

function iniciarInterface() {
  const seletor = obter("fluxo-select");
  if (seletor) {
    seletor.addEventListener("change", () => fixarGrafico(Number(seletor.value)));
  }
  const botao = obter("fluxo-seguir");
  if (botao) {
    botao.addEventListener("click", () => {
      estado.seguir = true;
      estado.fixadoId = null;
      reaplicar();
    });
  }
}

iniciarInterface();
