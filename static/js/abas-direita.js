// Abas da coluna da direita: Visualização | Fluxograma, um painel por vez.
// O resto do código continua mostrando e escondendo os cards com
// `style.display`; a aba só decide qual dos dois painéis fica à vista, por uma
// classe na coluna. A barra aparece junto com o card Visualização (depois da
// primeira execução) e a aba Fluxograma só fica habilitada enquanto o card
// Fluxograma está à vista.
const CLASSE_FLUXOGRAMA = "aba-fluxograma";
const ABAS = ["visualizacao", "fluxograma"];

let aoMostrarFluxograma = null;
let aoMostrarVisualizacao = null;

function obter(id) {
  return document.getElementById(id);
}

function coluna() {
  return document.querySelector(".coluna-direita");
}

function aba(nome) {
  return obter("aba-" + nome);
}

function estaVisivel(card) {
  return !!card && card.style.display !== "none";
}

function abaAtiva() {
  const area = coluna();
  return area && area.classList.contains(CLASSE_FLUXOGRAMA)
    ? "fluxograma"
    : "visualizacao";
}

function selecionarAba(nome) {
  const area = coluna();
  if (!area)
    return;
  area.classList.toggle(CLASSE_FLUXOGRAMA, nome === "fluxograma");
  for (const chave of ABAS) {
    const botao = aba(chave);
    if (botao)
      botao.setAttribute("aria-pressed", chave === nome ? "true" : "false");
  }
  // o painel que acabou de aparecer estava escondido (sem tamanho): o diagrama
  // precisa voltar ao bloco ativo e as setas da memória precisam ser medidas
  // e desenhadas de novo
  if (nome === "fluxograma" && aoMostrarFluxograma)
    requestAnimationFrame(aoMostrarFluxograma);
  if (nome === "visualizacao" && aoMostrarVisualizacao)
    requestAnimationFrame(aoMostrarVisualizacao);
}

function sincronizar() {
  const barra = obter("abas-direita");
  const botaoFluxograma = aba("fluxograma");
  if (!barra || !botaoFluxograma)
    return;
  const temVisualizacao = estaVisivel(obter("saida"));
  const temFluxograma = estaVisivel(obter("fluxo-card"));
  barra.hidden = !temVisualizacao;
  botaoFluxograma.disabled = !temFluxograma;
  if ((!temVisualizacao || !temFluxograma) && abaAtiva() === "fluxograma")
    selecionarAba("visualizacao");
}

export function iniciarAbas(opcoes = {}) {
  aoMostrarFluxograma = opcoes.aoMostrarFluxograma || null;
  aoMostrarVisualizacao = opcoes.aoMostrarVisualizacao || null;
  const barra = obter("abas-direita");
  if (!barra)
    return;
  barra.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-aba]");
    if (botao && !botao.disabled)
      selecionarAba(botao.dataset.aba);
  });
  // os cards são mostrados e escondidos por `style.display` em vários módulos;
  // observar o estilo evita que cada um deles precise conhecer as abas
  const observador = new MutationObserver(sincronizar);
  for (const id of ["saida", "fluxo-card"]) {
    const card = obter(id);
    if (card) {
      observador.observe(card, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }
  }
  sincronizar();
}
