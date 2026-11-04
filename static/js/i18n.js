/**
 * Sistema centralizado de internacionalização (i18n) do PythonVisual.
 * Carrega e armazena traduções a partir dos arquivos JSON centralizados
 * (/static/locales/pt.json e /static/locales/en.json).
 */

const IDIOMA_PADRAO = "pt";
const IDIOMAS_SUPORTADOS = ["pt", "en"];

const cache = {
  pt: null,
  en: null,
};

const carregamentosEmAndamento = {
  pt: null,
  en: null,
};

function validarIdioma(lang) {
  if (typeof lang === "string" && IDIOMAS_SUPORTADOS.includes(lang.toLowerCase())) {
    return lang.toLowerCase();
  }
  return IDIOMA_PADRAO;
}

let currentLang = IDIOMA_PADRAO;
try {
  currentLang = validarIdioma(localStorage.getItem("pythonvisual_lang"));
} catch (e) {
  currentLang = IDIOMA_PADRAO;
}

/**
 * Carrega assincronamente as traduções de um idioma via fetch(), com cache em memória.
 */
export async function carregarTraducoes(lang) {
  const idiomaAlvo = validarIdioma(lang);

  if (cache[idiomaAlvo]) {
    return cache[idiomaAlvo];
  }

  if (carregamentosEmAndamento[idiomaAlvo]) {
    return await carregamentosEmAndamento[idiomaAlvo];
  }

  carregamentosEmAndamento[idiomaAlvo] = (async () => {
    try {
      const resposta = await fetch(`/static/locales/${idiomaAlvo}.json`);
      if (!resposta.ok) {
        throw new Error(`Falha HTTP ${resposta.status} ao obter ${idiomaAlvo}.json`);
      }
      const dados = await resposta.json();
      cache[idiomaAlvo] = dados;
      return dados;
    } catch (erro) {
      console.warn(`[i18n] Não foi possível carregar o arquivo do idioma '${idiomaAlvo}':`, erro);
      if (idiomaAlvo !== IDIOMA_PADRAO && !cache[IDIOMA_PADRAO]) {
        try {
          return await carregarTraducoes(IDIOMA_PADRAO);
        } catch (_) {
          return null;
        }
      }
      return cache[IDIOMA_PADRAO] || null;
    } finally {
      carregamentosEmAndamento[idiomaAlvo] = null;
    }
  })();

  return await carregamentosEmAndamento[idiomaAlvo];
}

function buscarValorChave(objeto, chave) {
  if (!objeto || typeof objeto !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(objeto, chave)) {
    return objeto[chave];
  }
  if (typeof chave === "string" && chave.includes(".")) {
    const partes = chave.split(".");
    let atual = objeto;
    for (const parte of partes) {
      if (atual && typeof atual === "object" && parte in atual) {
        atual = atual[parte];
      } else {
        return undefined;
      }
    }
    if (typeof atual === "string") return atual;
  }
  return undefined;
}

/**
 * Retorna a tradução correspondente à chave informada, substituindo interpolações {variavel}.
 */
export function translate(chave, valores = {}) {
  const dadosAtuais = cache[currentLang];
  let texto = buscarValorChave(dadosAtuais, chave);

  if (typeof texto !== "string" && currentLang !== IDIOMA_PADRAO) {
    texto = buscarValorChave(cache[IDIOMA_PADRAO], chave);
  }

  if (typeof texto !== "string") {
    texto = chave;
  }

  if (valores && typeof valores === "object") {
    for (const [nome, valor] of Object.entries(valores)) {
      texto = texto.replaceAll("{" + nome + "}", String(valor));
    }
  }

  return texto;
}

export const traduzir = translate;

/**
 * Retorna o código do idioma ativo ('pt' ou 'en').
 */
export function getLanguage() {
  return currentLang;
}

export const obterIdioma = getLanguage;

/**
 * Atualiza o título da página de acordo com a chave declarada em <title> ou a rota atual.
 */
function atualizarTitulo() {
  const titleEl = document.querySelector("title[data-i18n]");
  if (titleEl) {
    const chave = titleEl.dataset.i18n;
    const texto = translate(chave);
    if (texto && texto !== chave) {
      document.title = texto;
      return;
    }
  }

  const path = window.location.pathname || "";
  let titulo = "PythonVisual";
  
  if (path === "/" || path.endsWith("/home.html") || path.endsWith("index.html") || path === "") {
    const texto = translate("home.pageTitle");
    titulo = texto !== "home.pageTitle" ? texto : "PythonVisual - Principal";
  } else if (path.startsWith("/sobre")) {
    const texto = translate("about.pageTitle");
    titulo = texto !== "about.pageTitle" ? texto : "Sobre - PythonVisual";
  } else if (path.startsWith("/limitacoes")) {
    const texto = translate("limitations.pageTitle");
    titulo = texto !== "limitations.pageTitle" ? texto : "Limitações - PythonVisual";
  } else if (path.startsWith("/visualizador")) {
    const texto = translate("visualizer.pageTitle");
    titulo = texto !== "visualizer.pageTitle" ? texto : "PythonVisual";
  }

  document.title = titulo;
}

/**
 * Aplica as traduções a todos os elementos identificados por atributos data-i18n* no documento.
 */
export function applyTranslations(raiz = document) {
  document.documentElement.lang = currentLang === "en" ? "en" : "pt-br";

  atualizarTitulo();

  raiz.querySelectorAll("[data-i18n]").forEach((el) => {
    const chave = el.dataset.i18n;
    const texto = translate(chave);
    if (texto && texto !== chave) {
      el.textContent = texto;
    }
  });

  raiz.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const chave = el.dataset.i18nAria;
    const texto = translate(chave);
    if (texto && texto !== chave) {
      el.setAttribute("aria-label", texto);
    }
  });

  raiz.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const chave = el.dataset.i18nAlt;
    const texto = translate(chave);
    if (texto && texto !== chave) {
      el.alt = texto;
    }
  });

  raiz.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const chave = el.dataset.i18nPlaceholder;
    const texto = translate(chave);
    if (texto && texto !== chave) {
      el.placeholder = texto;
    }
  });

  raiz.querySelectorAll(".lang-btn").forEach((botao) => {
    const ativo = botao.id === "lang-" + currentLang;
    botao.classList.toggle("active", ativo);
    botao.setAttribute("aria-pressed", ativo ? "true" : "false");
  });

  const temaLabel = document.getElementById("tema-label");
  if (temaLabel) {
    const temaEscuro =
      document.body.classList.contains("tema-escuro") ||
      localStorage.getItem("pythonvisual_tema_escuro") === "1";
    temaLabel.textContent = temaEscuro
      ? translate("theme.light")
      : translate("theme.dark");
  }

  window.dispatchEvent(
    new CustomEvent("pythonvisual:langchange", { detail: { lang: currentLang } })
  );
}

export const aplicarTraducoes = applyTranslations;

/**
 * Altera o idioma ativo, persiste a preferência e atualiza a interface.
 */
export async function setLanguage(lang) {
  const novoIdioma = validarIdioma(lang);
  currentLang = novoIdioma;
  try {
    localStorage.setItem("pythonvisual_lang", currentLang);
  } catch (e) {
    // localStorage indisponível
  }

  await carregarTraducoes(currentLang);
  aplicarTraducoes();
  return currentLang;
}

export const definirIdioma = setLanguage;
export const setLang = setLanguage;

/**
 * Inicializa o mecanismo de i18n, carregando o idioma configurado e o fallback.
 */
export async function initI18n() {
  try {
    currentLang = validarIdioma(localStorage.getItem("pythonvisual_lang"));
  } catch (e) {
    currentLang = IDIOMA_PADRAO;
  }

  await carregarTraducoes(currentLang);

  if (currentLang !== IDIOMA_PADRAO && !cache[IDIOMA_PADRAO]) {
    carregarTraducoes(IDIOMA_PADRAO).catch(() => {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => aplicarTraducoes(), { once: true });
  } else {
    aplicarTraducoes();
  }

  return currentLang;
}

// Expõe no escopo global para garantir compatibilidade com onclick inline e scripts legados
if (typeof window !== "undefined") {
  window.translate = translate;
  window.traduzir = traduzir;
  window.getLanguage = getLanguage;
  window.obterIdioma = obterIdioma;
  window.setLanguage = setLanguage;
  window.definirIdioma = definirIdioma;
  window.setLang = setLanguage;
  window.applyTranslations = applyTranslations;
  window.aplicarTraducoes = aplicarTraducoes;
  window.initI18n = initI18n;
}

// Dispara inicialização automática
initI18n();