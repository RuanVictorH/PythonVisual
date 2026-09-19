// Tooltip compartilhada por todas as páginas. Cada controle declara `data-tip="chave"`;
// o texto vem do dicionário abaixo, no idioma salvo em localStorage, e é resolvido no
// momento em que a dica aparece (por isso acompanha idioma, tema e estado do botão).
(function () {
  "use strict";

  var TIPS = {
    pt: {
      navHome: "Voltar à página inicial",
      navVisualizer: "Abrir o visualizador para executar e acompanhar seu código passo a passo",
      navAbout: "Ver informações sobre o projeto e seus créditos",
      navLimitations: "Ver as limitações e o que a ferramenta não cobre",
      langPt: "Exibir o sistema em português",
      langEn: "Exibir o sistema em inglês",
      fontDown: "Diminuir a fonte da página (mínimo de 60%)",
      fontUp: "Aumentar a fonte da página (máximo de 180%)",
      themeDark: "Ativar o tema escuro",
      themeLight: "Voltar ao tema claro",
      ctaOpen: "Ir para o visualizador e começar a executar seu código",
      examples: "Carregar um exemplo pronto no editor de código",
      run: "Executar o código e gerar a visualização passo a passo (Ctrl + Enter)",
      clear: "Apagar o código do editor e limpar a execução atual",
      collapse: "Minimizar o bloco «{name}»",
      expand: "Expandir o bloco «{name}»",
      needsRun: "Execute o código para navegar pelos passos",
      stepFirst: "Ir para o primeiro passo da execução (Home)",
      stepFirstOff: "Você já está no primeiro passo",
      stepPrev: "Voltar um passo (←)",
      stepPrevOff: "Você já está no primeiro passo",
      stepNext: "Avançar um passo (→ ou Espaço)",
      stepNextOff: "Você já está no último passo",
      stepLast: "Ir para o último passo da execução (End)",
      stepLastOff: "Você já está no último passo",
      slider: "Arraste para percorrer os passos da execução",
      sendInput: "Enviar o valor digitado para o input() do programa (Enter)",
      flowSelect: "Escolher qual fluxograma exibir: programa principal, função, método ou classe",
      follow: "Voltar a acompanhar automaticamente a função em execução",
      followOff: "Já está acompanhando a função em execução automaticamente"
    },
    en: {
      navHome: "Go back to the home page",
      navVisualizer: "Open the visualizer to run and follow your code step by step",
      navAbout: "See information about the project and its credits",
      navLimitations: "See the limitations and what the tool does not cover",
      langPt: "Display the system in Portuguese",
      langEn: "Display the system in English",
      fontDown: "Decrease the page font size (minimum 60%)",
      fontUp: "Increase the page font size (maximum 180%)",
      themeDark: "Turn on the dark theme",
      themeLight: "Go back to the light theme",
      ctaOpen: "Go to the visualizer and start running your code",
      examples: "Load a ready-made example into the code editor",
      run: "Run the code and generate the step-by-step visualization (Ctrl + Enter)",
      clear: "Erase the editor code and clear the current execution",
      collapse: "Minimize the “{name}” block",
      expand: "Expand the “{name}” block",
      needsRun: "Run the code to navigate through the steps",
      stepFirst: "Go to the first step of the execution (Home)",
      stepFirstOff: "You are already at the first step",
      stepPrev: "Go back one step (←)",
      stepPrevOff: "You are already at the first step",
      stepNext: "Go forward one step (→ or Space)",
      stepNextOff: "You are already at the last step",
      stepLast: "Go to the last step of the execution (End)",
      stepLastOff: "You are already at the last step",
      slider: "Drag to move through the execution steps",
      sendInput: "Send the typed value to the program's input() (Enter)",
      flowSelect: "Choose which flowchart to show: main program, function, method or class",
      follow: "Go back to automatically following the running function",
      followOff: "Already following the running function automatically"
    }
  };

  var ATRASO_MOUSE = 400;
  var ATRASO_OCULTAR = 120;
  var ID_DICA = "tooltip-pv";

  var dica = null;
  var alvoAtual = null;
  var alvoDoPonteiro = null;
  var descricaoAnterior = null;
  var temporizadorExibir = 0;
  var temporizadorOcultar = 0;

  function idioma() {
    try {
      return localStorage.getItem("pythonvisual_lang") === "en" ? "en" : "pt";
    } catch (erro) {
      return "pt";
    }
  }

  function texto(chave, variaveis) {
    var dicionario = TIPS[idioma()] || TIPS.pt;
    var t = dicionario[chave] || TIPS.pt[chave] || "";
    Object.keys(variaveis || {}).forEach(function (nome) {
      t = t.split("{" + nome + "}").join(variaveis[nome]);
    });
    return t;
  }

  function nomeDoCard(botao) {
    var cabecalho = botao.closest(".card-header");
    var titulo = cabecalho && cabecalho.querySelector("[data-i18n]");
    return titulo ? titulo.textContent.trim() : "";
  }

  // Resolve o texto do controle no estado atual (desabilitado, expandido, tema, etc.).
  function resolver(el) {
    var chave = el.dataset.tip;
    switch (chave) {
      case "theme":
        return texto(document.body.classList.contains("tema-escuro") ? "themeLight" : "themeDark");
      case "collapse":
        return texto(el.getAttribute("aria-expanded") === "false" ? "expand" : "collapse", {
          name: nomeDoCard(el)
        });
      case "stepFirst":
      case "stepPrev":
      case "stepNext":
      case "stepLast": {
        if (!el.disabled) return texto(chave);
        var slider = document.getElementById("slider");
        return texto(slider && slider.disabled ? "needsRun" : chave + "Off");
      }
      case "slider":
        return texto(el.disabled ? "needsRun" : "slider");
      case "follow":
        return texto(el.getAttribute("aria-pressed") === "true" ? "followOff" : "follow");
      default:
        return texto(chave);
    }
  }

  function criarDica() {
    dica = document.createElement("div");
    dica.id = ID_DICA;
    dica.className = "tooltip-pv";
    dica.setAttribute("role", "tooltip");
    dica.addEventListener("pointerenter", function () {
      clearTimeout(temporizadorOcultar);
    });
    dica.addEventListener("pointerleave", function () {
      alvoDoPonteiro = null;
      agendarOcultar();
    });
    document.body.appendChild(dica);
  }

  function posicionar(alvo) {
    var margem = 8;
    var folga = 8;
    var largura = document.documentElement.clientWidth;
    var altura = document.documentElement.clientHeight;
    var r = alvo.getBoundingClientRect();
    var w = dica.offsetWidth;
    var h = dica.offsetHeight;
    var x = r.left + r.width / 2 - w / 2;
    x = Math.max(margem, Math.min(x, largura - w - margem));
    var y = r.bottom + folga;
    if (y + h > altura - margem) y = r.top - folga - h;
    y = Math.max(margem, y);
    dica.style.left = Math.round(x) + "px";
    dica.style.top = Math.round(y) + "px";
  }

  function exibir(alvo) {
    var conteudo = resolver(alvo);
    if (!conteudo || !alvo.isConnected) return;
    if (alvoAtual && alvoAtual !== alvo) restaurarDescricao();
    alvoAtual = alvo;
    dica.textContent = conteudo;
    dica.classList.remove("visivel");
    dica.style.left = "0px";
    dica.style.top = "0px";
    dica.style.visibility = "hidden";
    dica.style.display = "block";
    posicionar(alvo);
    dica.style.visibility = "";
    dica.classList.add("visivel");
    if (alvo.getAttribute("aria-describedby") !== ID_DICA) {
      descricaoAnterior = alvo.getAttribute("aria-describedby");
      alvo.setAttribute("aria-describedby", ID_DICA);
    }
  }

  function restaurarDescricao() {
    if (!alvoAtual) return;
    if (descricaoAnterior) alvoAtual.setAttribute("aria-describedby", descricaoAnterior);
    else alvoAtual.removeAttribute("aria-describedby");
    descricaoAnterior = null;
  }

  function ocultar() {
    clearTimeout(temporizadorExibir);
    clearTimeout(temporizadorOcultar);
    if (!dica) return;
    restaurarDescricao();
    alvoAtual = null;
    dica.classList.remove("visivel");
    dica.style.display = "none";
  }

  function agendarExibir(alvo, atraso) {
    clearTimeout(temporizadorExibir);
    clearTimeout(temporizadorOcultar);
    if (alvo === alvoAtual) return;
    if (alvoAtual) {
      // já há uma dica aberta: troca sem esperar de novo
      exibir(alvo);
      return;
    }
    temporizadorExibir = setTimeout(function () {
      exibir(alvo);
    }, atraso);
  }

  function agendarOcultar() {
    clearTimeout(temporizadorExibir);
    clearTimeout(temporizadorOcultar);
    temporizadorOcultar = setTimeout(ocultar, ATRASO_OCULTAR);
  }

  // Controles desabilitados não recebem eventos de mouse em todos os navegadores,
  // então a posição do ponteiro também é testada contra eles.
  function alvoSobPonteiro(evento) {
    var direto = evento.target.closest && evento.target.closest("[data-tip]");
    if (direto) return direto;
    var desabilitados = document.querySelectorAll("[data-tip]:disabled");
    for (var i = 0; i < desabilitados.length; i++) {
      var r = desabilitados[i].getBoundingClientRect();
      if (
        r.width > 0 &&
        evento.clientX >= r.left &&
        evento.clientX <= r.right &&
        evento.clientY >= r.top &&
        evento.clientY <= r.bottom
      ) {
        return desabilitados[i];
      }
    }
    return null;
  }

  function iniciar() {
    if (dica) return;
    criarDica();

    document.addEventListener(
      "pointermove",
      function (evento) {
        if (evento.pointerType === "touch") return;
        if (dica.contains(evento.target)) return;
        var alvo = alvoSobPonteiro(evento);
        if (alvo === alvoDoPonteiro) return;
        alvoDoPonteiro = alvo;
        if (alvo) agendarExibir(alvo, ATRASO_MOUSE);
        else agendarOcultar();
      },
      { passive: true }
    );

    document.documentElement.addEventListener("mouseleave", function () {
      alvoDoPonteiro = null;
      ocultar();
    });

    document.addEventListener("pointerdown", function () {
      alvoDoPonteiro = null;
      ocultar();
    });

    document.addEventListener("focusin", function (evento) {
      var alvo = evento.target.closest && evento.target.closest("[data-tip]");
      if (alvo && alvo.matches(":focus-visible")) {
        clearTimeout(temporizadorExibir);
        exibir(alvo);
      }
    });

    document.addEventListener("focusout", function (evento) {
      var alvo = evento.target.closest && evento.target.closest("[data-tip]");
      if (alvo && alvo === alvoAtual) ocultar();
    });

    // Esc fecha a dica sem disparar outros atalhos da página (fase de captura).
    document.addEventListener(
      "keydown",
      function (evento) {
        if (evento.key === "Escape" && dica.classList.contains("visivel")) {
          evento.stopPropagation();
          ocultar();
        }
      },
      true
    );

    document.addEventListener("click", function () {
      alvoDoPonteiro = null;
      ocultar();
    });
    window.addEventListener("scroll", ocultar, { passive: true, capture: true });
    window.addEventListener("resize", ocultar);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
