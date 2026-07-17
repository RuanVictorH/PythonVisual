carregarExemplos();

    const editor = CodeMirror.fromTextArea(document.getElementById("codigo"), {
      mode: "python",
      theme: "default",
      lineNumbers: true,
      gutters: ["exec-gutter", "CodeMirror-linenumbers"],
      indentUnit: 4,
      indentWithTabs: false,
      placeholder: "",
      autofocus: true
    });
    editor.setValue('');

    let passos = [];
    let indiceAtual = 0;
    let linhaExecutadaMarcada = null;
    let linhaProximaMarcada = null;
    let escalaFonte = 1;
	    let temaEscuro = false;
	    let entradasColetadas = [];
	    let entradaPendente = null;

	    const i18n = {
	      pt: {
	        "title": "PythonVisual",
	        "app.subtitle": "Analise a execução do seu código Python passo a passo",
	        "nav.home": "Home",
	        "nav.visualizer": "Visualizador",
	        "nav.about": "Sobre",
	        "nav.limitations": "Limitações",
	        "editor.shortcutsPlaceholder": "Atalhos PythonVisual\n\n→ ou Espaço: próximo passo\n←: passo anterior\nHome: início\nEnd: fim\nCtrl + Enter: executar\nEsc: focar o editor\nR: executar, quando não estiver digitando\nC: limpar, quando não estiver digitando",
	        "access.fontDown": "Diminuir fonte",
	        "access.fontUp": "Aumentar fonte",
	        "access.themeToggle": "Alternar tema claro e escuro",
	        "theme.dark": "Tema escuro",
	        "theme.light": "Tema claro",
	        "section.code": "Código",
	        "section.navigation": "Navegação",
	        "section.explanation": "Explicação da linha atual",
	        "section.input": "Entrada solicitada",
	        "section.visualization": "Visualização",
	        "examples.label": "Exemplo:",
	        "examples.choose": "-- Escolha um exemplo --",
	        "examples.variables": "Variáveis e operações",
	        "examples.conditional": "Condicional (if/else)",
	        "examples.forLoop": "Loop com for",
	        "examples.whileLoop": "Loop com while",
	        "examples.function": "Função simples",
	        "examples.factorial": "Fatorial (recursão)",
	        "examples.list": "Manipulação de lista",
	        "examples.dictionary": "Dicionário",
	        "examples.tuple": "Tupla",
	        "examples.input": "Entrada com input()",
	        "examples.class": "Classe e objeto",
	        "actions.run": "Executar código",
	        "actions.clear": "Limpar",
	        "actions.clearTitle": "Limpar o código atual",
	        "navSteps.first": "Início",
	        "navSteps.previous": "Anterior",
	        "navSteps.next": "Próximo",
	        "navSteps.last": "Fim",
	        "input.promptDefault": "Informe o valor solicitado por input().",
	        "input.placeholder": "Digite o valor para esta linha",
	        "input.send": "Enviar",
	        "input.line": "Linha",
	        "input.prompt": "Prompt",
	        "counter.empty": "Execute o código para navegar pelos passos",
	        "counter.step": "Passo {current} de {total}",
	        "state.running": "Execução",
	        "state.finished": "Execução finalizada",
	        "state.waitingInput": "Aguardando entrada",
	        "state.return": "Retorno",
	        "status.running": "Em execução",
	        "status.executed": "Executada",
	        "status.finished": "fim",
	        "scope.global": "Global",
	        "scope.end": "Fim",
	        "output.section": "Saída",
	        "output.label": "saída",
	        "output.none": "Nenhuma saída.",
	        "output.noPrint": "Nenhum print executado até aqui.",
	        "output.errorUntil": "Saída até o erro",
	        "run.executing": "Executando...",
	        "run.noSteps": "Nenhum passo registrado.",
	        "run.serverError": "Erro ao comunicar com o servidor: {error}",
	        "error.label": "Erro:",
	        "line.empty": "(linha vazia)",
	        "line.finishedExplain": "Execução finalizada. Não há uma próxima linha de código para explicar neste passo.",
	        "marker.running": "Linha em execução",
	        "marker.executed": "Linha executada",
	        "stack.title": "Pilha de chamadas",
	        "stack.subtitle": "Mostra a sequência dinâmica de funções ativas neste passo.",
	        "stack.currentScope": "escopo atual",
	        "memory.title": "Memória",
	        "memory.empty": "Nenhuma variável criada ainda.",
	        "memory.frames": "Quadros de memória",
	        "memory.variables": "Variáveis",
	        "memory.emptyShort": "Vazio",
	        "memory.objects": "Objetos na memória",
	        "memory.noObjects": "Nenhum objeto neste passo.",
	        "memory.functions": "Funções",
	        "memory.noFunctions": "Nenhuma função definida neste passo.",
	        "memory.imports": "Importações",
	        "memory.noImports": "Nenhuma importação neste passo.",
	        "memory.subtitle": "Quadros, objetos, funções e importações separados por categoria.",
	        "memory.referenceTitle": "Referência para o objeto {name}",
	        "memory.objectEmpty": "vazio",
	        "type.list": "Lista",
	        "type.tuple": "Tupla",
	        "type.set": "Conjunto",
	        "type.dict": "Dicionário",
	        "explain.empty": "Esta linha está vazia. Ela apenas separa visualmente partes do código.",
	        "explain.comment": "Comentário: serve para documentar o código e não é executado pelo Python.",
	        "explain.def": "Define uma função. O bloco indentado abaixo só será executado quando essa função for chamada.",
	        "explain.class": "Define uma classe, que funciona como um modelo para criar objetos.",
	        "explain.return": "Retorna um valor para quem chamou a função e encerra aquela chamada.",
	        "explain.if": "Testa uma condição. Se ela for verdadeira, o Python executa o bloco indentado abaixo.",
	        "explain.elif": "Testa uma nova condição quando os testes anteriores do mesmo if não foram verdadeiros.",
	        "explain.else": "Executa este bloco quando nenhuma condição anterior do mesmo if foi verdadeira.",
	        "explain.for": "Inicia uma repetição. A variável do laço recebe um valor por vez da sequência percorrida.",
	        "explain.while": "Repete o bloco enquanto a condição continuar verdadeira.",
	        "explain.try": "Tenta executar um bloco que pode gerar erro, permitindo tratar esse erro depois.",
	        "explain.except": "Trata um erro ocorrido dentro do bloco try.",
	        "explain.finally": "Executa este bloco no final do try, com ou sem erro.",
	        "explain.import": "Carrega recursos de outro módulo para usar neste código.",
	        "explain.print": "Mostra uma informação na saída do programa.",
	        "explain.input": "Solicita uma entrada do usuário. A execução pausa até o valor ser informado.",
	        "explain.break": "Interrompe o laço atual imediatamente.",
	        "explain.continue": "Pula o restante do bloco atual e avança para a próxima repetição do laço.",
	        "explain.pass": "Não executa nenhuma ação. É usado como espaço reservado em blocos ainda vazios.",
	        "explain.raise": "Dispara um erro manualmente.",
	        "explain.method": "Chama um método de um objeto, alterando ou consultando esse objeto.",
	        "explain.call": "Chama uma função, transferindo a execução para o bloco definido por ela.",
	        "explain.update": "Atualiza uma variável usando o valor que ela já tinha.",
	        "explain.assign": "Atribui um valor a uma variável, guardando essa informação na memória.",
	        "explain.generic": "Executa uma instrução Python. Observe as variáveis, a pilha e a saída para ver o efeito deste passo."
	      },
	      en: {
	        "title": "PythonVisual",
	        "app.subtitle": "Analyze your Python code execution step by step",
	        "nav.home": "Home",
	        "nav.visualizer": "Visualizer",
	        "nav.about": "About",
	        "nav.limitations": "Limitations",
	        "editor.shortcutsPlaceholder": "PythonVisual shortcuts\n\n→ or Space: next step\n←: previous step\nHome: start\nEnd: end\nCtrl + Enter: run\nEsc: focus the editor\nR: run, when not typing\nC: clear, when not typing",
	        "access.fontDown": "Decrease font size",
	        "access.fontUp": "Increase font size",
	        "access.themeToggle": "Toggle light and dark theme",
	        "theme.dark": "Dark theme",
	        "theme.light": "Light theme",
	        "section.code": "Code",
	        "section.navigation": "Navigation",
	        "section.explanation": "Current line explanation",
	        "section.input": "Requested input",
	        "section.visualization": "Visualization",
	        "examples.label": "Example:",
	        "examples.choose": "-- Choose an example --",
	        "examples.variables": "Variables and operations",
	        "examples.conditional": "Conditional (if/else)",
	        "examples.forLoop": "For loop",
	        "examples.whileLoop": "While loop",
	        "examples.function": "Simple function",
	        "examples.factorial": "Factorial (recursion)",
	        "examples.list": "List manipulation",
	        "examples.dictionary": "Dictionary",
	        "examples.tuple": "Tuple",
	        "examples.input": "Input with input()",
	        "examples.class": "Class and object",
	        "actions.run": "Run code",
	        "actions.clear": "Clear",
	        "actions.clearTitle": "Clear current code",
	        "navSteps.first": "Start",
	        "navSteps.previous": "Previous",
	        "navSteps.next": "Next",
	        "navSteps.last": "End",
	        "input.promptDefault": "Enter the value requested by input().",
	        "input.placeholder": "Enter the value for this line",
	        "input.send": "Send",
	        "input.line": "Line",
	        "input.prompt": "Prompt",
	        "counter.empty": "Run the code to navigate through the steps",
	        "counter.step": "Step {current} of {total}",
	        "state.running": "Execution",
	        "state.finished": "Execution finished",
	        "state.waitingInput": "Waiting for input",
	        "state.return": "Return",
	        "status.running": "Running",
	        "status.executed": "Executed",
	        "status.finished": "end",
	        "scope.global": "Global",
	        "scope.end": "End",
	        "output.section": "Output",
	        "output.label": "output",
	        "output.none": "No output.",
	        "output.noPrint": "No print executed up to this step.",
	        "output.errorUntil": "Output until the error",
	        "run.executing": "Running...",
	        "run.noSteps": "No steps recorded.",
	        "run.serverError": "Error communicating with the server: {error}",
	        "error.label": "Error:",
	        "line.empty": "(empty line)",
	        "line.finishedExplain": "Execution finished. There is no next line of code to explain in this step.",
	        "marker.running": "Running line",
	        "marker.executed": "Executed line",
	        "stack.title": "Call stack",
	        "stack.subtitle": "Shows the dynamic sequence of active functions in this step.",
	        "stack.currentScope": "current scope",
	        "memory.title": "Memory",
	        "memory.empty": "No variable created yet.",
	        "memory.frames": "Memory frames",
	        "memory.variables": "Variables",
	        "memory.emptyShort": "Empty",
	        "memory.objects": "Objects in memory",
	        "memory.noObjects": "No object in this step.",
	        "memory.functions": "Functions",
	        "memory.noFunctions": "No function defined in this step.",
	        "memory.imports": "Imports",
	        "memory.noImports": "No import in this step.",
	        "memory.subtitle": "Frames, objects, functions, and imports separated by category.",
	        "memory.referenceTitle": "Reference to object {name}",
	        "memory.objectEmpty": "empty",
	        "type.list": "List",
	        "type.tuple": "Tuple",
	        "type.set": "Set",
	        "type.dict": "Dictionary",
	        "explain.empty": "This line is empty. It only visually separates parts of the code.",
	        "explain.comment": "Comment: documents the code and is not executed by Python.",
	        "explain.def": "Defines a function. The indented block below runs only when this function is called.",
	        "explain.class": "Defines a class, which works as a template for creating objects.",
	        "explain.return": "Returns a value to the caller and ends that function call.",
	        "explain.if": "Tests a condition. If it is true, Python executes the indented block below.",
	        "explain.elif": "Tests a new condition when previous tests in the same if statement were not true.",
	        "explain.else": "Runs this block when no previous condition in the same if statement was true.",
	        "explain.for": "Starts a loop. The loop variable receives one value at a time from the sequence.",
	        "explain.while": "Repeats the block while the condition remains true.",
	        "explain.try": "Tries to run a block that may raise an error, allowing that error to be handled later.",
	        "explain.except": "Handles an error raised inside the try block.",
	        "explain.finally": "Runs this block at the end of the try statement, with or without an error.",
	        "explain.import": "Loads resources from another module to use in this code.",
	        "explain.print": "Shows information in the program output.",
	        "explain.input": "Requests user input. Execution pauses until the value is provided.",
	        "explain.break": "Stops the current loop immediately.",
	        "explain.continue": "Skips the rest of the current block and moves to the next loop iteration.",
	        "explain.pass": "Does nothing. It is used as a placeholder in blocks that are still empty.",
	        "explain.raise": "Raises an error manually.",
	        "explain.method": "Calls an object method, changing or checking that object.",
	        "explain.call": "Calls a function, transferring execution to the block defined by it.",
	        "explain.update": "Updates a variable using the value it already had.",
	        "explain.assign": "Assigns a value to a variable, storing that information in memory.",
	        "explain.generic": "Runs a Python statement. Watch the variables, stack, and output to see this step's effect."
	      }
	    };

	    let currentLang = localStorage.getItem("pythonvisual_lang") || "pt";
	    if (!i18n[currentLang]) currentLang = "pt";

	    function traduzir(chave, valores = {}) {
	      const base = i18n[currentLang] || i18n.pt;
	      let texto = base[chave] || i18n.pt[chave] || chave;
	      for (const [nome, valor] of Object.entries(valores)) {
	        texto = texto.replaceAll("{" + nome + "}", String(valor));
	      }
	      return texto;
	    }

	    function atualizarBotaoTema() {
	      const botao = document.getElementById("btn-tema");
	      const icone = document.getElementById("tema-icone");
	      const label = document.getElementById("tema-label");
	      if (!botao || !icone || !label) return;
	      icone.className = temaEscuro ? "fa-solid fa-sun" : "fa-solid fa-moon";
	      label.textContent = temaEscuro ? traduzir("theme.light") : traduzir("theme.dark");
	    }

	    function aplicarIdioma() {
	      const langAttr = currentLang === "en" ? "en" : "pt-br";
	      document.documentElement.lang = langAttr;
	      document.title = traduzir("title");
	      document.querySelectorAll("[data-i18n]").forEach((el) => {
	        el.textContent = traduzir(el.dataset.i18n);
	      });
	      document.querySelectorAll("[data-i18n-title]").forEach((el) => {
	        const texto = traduzir(el.dataset.i18nTitle);
	        el.title = texto;
	        el.setAttribute("aria-label", texto);
	      });
	      document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
	        el.setAttribute("aria-label", traduzir(el.dataset.i18nAria));
	      });
	      document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
	        el.placeholder = traduzir(el.dataset.i18nPlaceholder);
	      });
	      document.querySelectorAll(".lang-btn").forEach((botao) => {
	        const ativo = botao.id === "lang-" + currentLang;
	        botao.classList.toggle("active", ativo);
	        botao.setAttribute("aria-pressed", ativo ? "true" : "false");
	      });
	      editor.setOption("placeholder", traduzir("editor.shortcutsPlaceholder"));
	      atualizarBotaoTema();
	      if (entradaPendente) {
	        document.getElementById("entrada-linha-badge").textContent = traduzir("input.line") + " " + entradaPendente.linha;
	        document.getElementById("entrada-prompt-texto").textContent =
	          entradaPendente.prompt ? traduzir("input.prompt") + ": " + entradaPendente.prompt : traduzir("input.promptDefault");
	      } else {
	        document.getElementById("entrada-prompt-texto").textContent = traduzir("input.promptDefault");
	      }
	      if (passos.length > 0) {
	        renderizarPasso();
	      } else {
	        document.getElementById("contador").textContent = traduzir("counter.empty");
	      }
	    }

	    function setLang(lang) {
	      currentLang = i18n[lang] ? lang : "pt";
	      localStorage.setItem("pythonvisual_lang", currentLang);
	      aplicarIdioma();
	    }

    let exemplos = {};
async function carregarExemplos(){
    try{
        const resposta = await fetch('/static/data/exemplos.json');
        exemplos = await resposta.json();
    }catch(e){ console.error('Erro carregando exemplos', e); }
}


    function carregarExemplo() {
      const chave = document.getElementById("exemplos").value;
      if (!chave || !exemplos[chave]) return;
      editor.setValue(exemplos[chave]);
      document.getElementById("saida").style.display = "none";
      ocultarEntradaPendente();
      resetarExecucaoVisual();
    }

    function codigoPedeEntrada(codigo) {
      return /(^|[^\w.])input\s*\(/.test(codigo);
    }

    function atualizarEntradaDinamica() {
      if (!entradaPendente) ocultarEntradaPendente();
    }

    function ocultarEntradaPendente() {
      entradaPendente = null;
      document.getElementById("entrada-card").style.display = "none";
      document.getElementById("entrada").value = "";
    }

    function ocultarExplicacaoLinha() {
      document.getElementById("explicacao-card").style.display = "none";
      document.getElementById("explicacao-corpo").innerHTML = "";
    }

	    function mostrarEntradaPendente(passoAtual) {
	      entradaPendente = {
	        linha: passoAtual.linha,
	        prompt: passoAtual.prompt || ""
	      };
	      document.getElementById("entrada-card").style.display = "block";
	      document.getElementById("entrada-linha-badge").textContent = traduzir("input.line") + " " + passoAtual.linha;
	      document.getElementById("entrada-prompt-texto").textContent =
	        entradaPendente.prompt ? traduzir("input.prompt") + ": " + entradaPendente.prompt : traduzir("input.promptDefault");
	      const campoEntrada = document.getElementById("entrada");
	      campoEntrada.value = "";
	      campoEntrada.focus();
    }

    function resetarExecucaoVisual() {
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

    function limparCodigo() {
      editor.setValue("");
      document.getElementById("entrada").value = "";
      document.getElementById("saida").style.display = "none";
      resetarExecucaoVisual();
      editor.focus();
    }

    function aplicarFonte() {
      document.documentElement.style.setProperty("--font-scale", escalaFonte.toFixed(2));
      editor.refresh();
      requestAnimationFrame(desenharSetasMemoria);
    }

    function alterarFonte(delta) {
      escalaFonte = Math.max(0.85, Math.min(1.35, escalaFonte + delta));
      aplicarFonte();
    }

	    function alternarTema() {
	      temaEscuro = !temaEscuro;
	      document.body.classList.toggle("tema-escuro", temaEscuro);
	      atualizarBotaoTema();
	      editor.refresh();
	      requestAnimationFrame(desenharSetasMemoria);
	    }

    function escaparHTML(texto) {
      return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

	    function explicarComandoPython(linha) {
	      const texto = String(linha || "").trim();
	      if (!texto) return traduzir("explain.empty");
	      if (/^#/.test(texto)) return traduzir("explain.comment");
	      if (/^def\s+\w+\s*\(/.test(texto)) return traduzir("explain.def");
	      if (/^class\s+\w+/.test(texto)) return traduzir("explain.class");
	      if (/^return\b/.test(texto)) return traduzir("explain.return");
	      if (/^if\b/.test(texto)) return traduzir("explain.if");
	      if (/^elif\b/.test(texto)) return traduzir("explain.elif");
	      if (/^else\s*:/.test(texto)) return traduzir("explain.else");
	      if (/^for\b/.test(texto)) return traduzir("explain.for");
	      if (/^while\b/.test(texto)) return traduzir("explain.while");
	      if (/^try\s*:/.test(texto)) return traduzir("explain.try");
	      if (/^except\b/.test(texto)) return traduzir("explain.except");
	      if (/^finally\s*:/.test(texto)) return traduzir("explain.finally");
	      if (/^import\b/.test(texto) || /^from\b.+\bimport\b/.test(texto)) return traduzir("explain.import");
	      if (/^print\s*\(/.test(texto)) return traduzir("explain.print");
	      if (/(^|[^\w.])input\s*\(/.test(texto)) return traduzir("explain.input");
	      if (/^break\b/.test(texto)) return traduzir("explain.break");
	      if (/^continue\b/.test(texto)) return traduzir("explain.continue");
	      if (/^pass\b/.test(texto)) return traduzir("explain.pass");
	      if (/^raise\b/.test(texto)) return traduzir("explain.raise");
	      if (/^[A-Za-z_]\w*\.[A-Za-z_]\w*\s*\(/.test(texto)) return traduzir("explain.method");
	      if (/^[A-Za-z_]\w*\s*\(/.test(texto)) return traduzir("explain.call");
	      if (/^[^=<>!]+(\+=|-=|\*=|\/=|\/\/=|%=|\*\*=)/.test(texto)) return traduzir("explain.update");
	      if (/^[^=<>!]+=[^=]/.test(texto)) return traduzir("explain.assign");
	      return traduzir("explain.generic");
	    }

    function alvoExplicacaoLinha() {
	      const proxima = linhaProximaAtual();
	      if (proxima !== null) return { indice: proxima, status: traduzir("status.running") };
	      const executada = linhaExecutadaAtual();
	      if (executada !== null) return { indice: executada, status: traduzir("status.executed") };
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
	      if (!alvo) {
	        corpo.innerHTML = "<p class=\"explicacao-texto\">" + escaparHTML(traduzir("line.finishedExplain")) + "</p>";
	        return;
	      }

      const linhaCodigo = editor.getLine(alvo.indice) || "";
      corpo.innerHTML =
	        "<div class=\"explicacao-meta\">"
	        + "<span class=\"explicacao-chip\">" + escaparHTML(traduzir("input.line")) + " " + (alvo.indice + 1) + "</span>"
	        + "<span class=\"explicacao-chip\">" + escaparHTML(alvo.status) + "</span>"
	        + "</div>"
	        + "<pre class=\"explicacao-codigo\">" + escaparHTML(linhaCodigo || traduzir("line.empty")) + "</pre>"
	        + "<p class=\"explicacao-texto\">" + escaparHTML(explicarComandoPython(linhaCodigo)) + "</p>";
	    }

    function limparMarcacoes() {
      if (linhaExecutadaMarcada !== null) {
        editor.removeLineClass(linhaExecutadaMarcada, "background", "linha-executada");
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
	      marcador.title = tipo === "proxima" ? traduzir("marker.running") : traduzir("marker.executed");
      marcador.innerHTML = tipo === "proxima"
        ? "<i class=\"fa-solid fa-arrow-right\"></i>"
        : "<i class=\"fa-solid fa-check\"></i>";
      return marcador;
    }

    function renderizarListaSimples(itens, vazio) {
      if (itens.length === 0) return "<p class=\"empty\">" + vazio + "</p>";
      return "<div class=\"lista-card\">" + itens.map(({ nome, info }) => {
        const detalhe = info.modulo ? " <span>(" + escaparHTML(info.modulo) + ")</span>" : "";
        return "<div class=\"lista-item\"><strong>" + escaparHTML(nome) + "</strong>" + detalhe
          + "<br>" + escaparHTML(info.repr || info.nome || info.tipo) + "</div>";
      }).join("") + "</div>";
    }

	    function formatarChamadaPilha(item) {
	      if (!item || item.escopo === "Global") return traduzir("scope.global");
	      const argumentos = Array.isArray(item.argumentos) ? item.argumentos : [];
	      const textoArgumentos = argumentos.map((arg) =>
	        escaparHTML(arg.nome) + "=" + escaparHTML(arg.valor)
      ).join(", ");
      return escaparHTML(item.escopo) + "(" + textoArgumentos + ")";
    }

    function renderizarPilhaChamadas(pilha) {
      if (!Array.isArray(pilha) || pilha.length <= 1) return "";
	      const itens = pilha.map((item, indice) => {
	        const atual = item.atual ? " atual" : "";
	        const marcadorAtual = item.atual ? " - " + traduzir("stack.currentScope") : "";
	        const linha = Number.isInteger(item.linha) ? traduzir("input.line") + " " + item.linha : traduzir("input.line") + " -";
	        return "<div class=\"pilha-item" + atual + "\">"
          + "<div class=\"pilha-indice\">" + (indice + 1) + "</div>"
          + "<div>"
          + "<div class=\"pilha-chamada\">" + formatarChamadaPilha(item) + "</div>"
          + "<div class=\"pilha-meta\">" + linha + marcadorAtual + "</div>"
          + "</div>"
          + "</div>";
      }).join("");

	      return "<div class=\"pilha-bloco\">"
	        + "<div class=\"section-label\"><i class=\"fa-solid fa-layer-group\"></i>" + escaparHTML(traduzir("stack.title")) + "</div>"
	        + "<div class=\"pilha-subtitulo\">" + escaparHTML(traduzir("stack.subtitle")) + "</div>"
	        + "<div class=\"pilha-lista\">" + itens + "</div>"
	        + "</div>";
	    }

	    function renderizarMemoria(variaveis) {
	      if (!variaveis || Object.keys(variaveis).length === 0) {
	        return '<div class="memoria-bloco"><div class="section-label">' + escaparHTML(traduzir("memory.title")) + '</div><p class="empty">' + escaparHTML(traduzir("memory.empty")) + '</p></div>';
	      }
      const primitivos = [];
      const objetos = [];
      const funcoes = [];
      const importacoes = [];
      for (const [nome, info] of Object.entries(variaveis)) {
        if (info.categoria === "primitivo") primitivos.push({ nome, info });
        else if (info.categoria === "objeto") objetos.push({ nome, info });
        else if (info.categoria === "funcao") funcoes.push({ nome, info });
        else if (info.categoria === "importacao") importacoes.push({ nome, info });
        else primitivos.push({ nome, info });
      }

      let linhasQuadro = "";
      for (const { nome, info } of primitivos) {
        linhasQuadro += "<div class=\"quadro-linha\">"
          + "<div class=\"quadro-cel quadro-cel-nome\">" + escaparHTML(nome) + "</div>"
          + "<div class=\"quadro-cel quadro-cel-tipo\"><span class=\"tipo-chip\">" + escaparHTML(info.tipo || "var") + "</span></div>"
          + "<div class=\"quadro-cel quadro-cel-valor\">" + escaparHTML(info.repr) + "</div>"
          + "</div>";
      }
      for (const { nome, info } of objetos) {
        linhasQuadro += "<div class=\"quadro-linha\">"
          + "<div class=\"quadro-cel quadro-cel-nome\">" + escaparHTML(nome) + "</div>"
          + "<div class=\"quadro-cel quadro-cel-tipo\"><span class=\"tipo-chip\">" + escaparHTML(info.tipo || "objeto") + "</span></div>"
	          + "<div class=\"quadro-cel quadro-cel-seta\"><span class=\"referencia-dot\" data-ref-origem=\"" + escaparHTML(nome) + "\" title=\"" + escaparHTML(traduzir("memory.referenceTitle", { name: nome })) + "\"></span></div>"
          + "<div class=\"quadro-cel quadro-cel-valor\" style=\"color:#059669;font-style:italic;\">" + escaparHTML(nome) + "</div>"
          + "</div>";
      }

	      const quadroHTML = "<div class=\"painel-memoria\">"
	        + "<div class=\"painel-titulo\">" + escaparHTML(traduzir("memory.frames")) + "</div>"
	        + "<div class=\"quadro\">"
	        + "<div class=\"quadro-titulo\">" + escaparHTML(traduzir("memory.variables")) + "</div>"
	        + "<div class=\"quadro-linhas\">"
	        + (linhasQuadro || "<div class=\"quadro-linha\"><div class=\"quadro-cel\"><span class=\"empty\">" + escaparHTML(traduzir("memory.emptyShort")) + "</span></div></div>")
	        + "</div></div></div>";

      let objetosHTML = "";
      for (const { nome, info } of objetos) {
        let corpo = "";
        if (info.tipo === "lista" || info.tipo === "tupla") {
          corpo = info.elementos.map((e, i) =>
            "<div class=\"objeto-item\"><span class=\"objeto-item-idx\">" + i + "</span>" + escaparHTML(e) + "</div>"
          ).join("");
        } else if (info.tipo === "conjunto") {
          corpo = info.elementos.map(e =>
            "<div class=\"objeto-item\">" + escaparHTML(e) + "</div>"
          ).join("");
        } else if (info.tipo === "dicionario") {
          corpo = Object.entries(info.pares).map(([k, v]) =>
            "<div class=\"objeto-dict-par\"><span class=\"objeto-dict-chave\">" + escaparHTML(k) + "</span><span>:</span><span>" + escaparHTML(v) + "</span></div>"
          ).join("");
        } else if (info.atributos) {
          corpo = Object.entries(info.atributos).map(([k, v]) =>
            "<div class=\"objeto-dict-par\"><span class=\"objeto-dict-chave\">" + escaparHTML(k) + "</span><span>=</span><span>" + escaparHTML(v) + "</span></div>"
          ).join("");
        }
        if (info.truncado) {
          corpo += "<div class=\"objeto-item\">...</div>";
        }
	        const tipoLabel = { lista:traduzir("type.list"), tupla:traduzir("type.tuple"), conjunto:traduzir("type.set"), dicionario:traduzir("type.dict") }[info.tipo] || info.tipo;
	        objetosHTML += "<div class=\"objeto-card\" data-ref-destino=\"" + escaparHTML(nome) + "\">"
	          + "<div class=\"objeto-titulo\">" + escaparHTML(nome) + " — " + tipoLabel + "</div>"
	          + "<div class=\"objeto-corpo\">" + (corpo || "<span class=\"empty\">" + escaparHTML(traduzir("memory.objectEmpty")) + "</span>") + "</div>"
	          + "</div>";
	      }

	      const painelObjetos = "<div class=\"painel-memoria\">"
	        + "<div class=\"painel-titulo\">" + escaparHTML(traduzir("memory.objects")) + "</div>"
	        + (objetosHTML || "<p class=\"empty\">" + escaparHTML(traduzir("memory.noObjects")) + "</p>")
	        + "</div>";
	      const painelFuncoes = "<div class=\"painel-memoria\">"
	        + "<div class=\"painel-titulo\">" + escaparHTML(traduzir("memory.functions")) + "</div>"
	        + renderizarListaSimples(funcoes, traduzir("memory.noFunctions"))
	        + "</div>";
	      const painelImportacoes = "<div class=\"painel-memoria\">"
	        + "<div class=\"painel-titulo\">" + escaparHTML(traduzir("memory.imports")) + "</div>"
	        + renderizarListaSimples(importacoes, traduzir("memory.noImports"))
	        + "</div>";

	      return "<div class=\"memoria-bloco\">"
	        + "<div class=\"memoria-topo\">"
	        + "<div class=\"section-label\">" + escaparHTML(traduzir("memory.title")) + "</div>"
	        + "<div class=\"memoria-subtitulo\">" + escaparHTML(traduzir("memory.subtitle")) + "</div>"
	        + "</div>"
        + "<div class=\"memoria-diagrama\">"
        + "<svg class=\"memoria-setas\" id=\"memoria-setas\" aria-hidden=\"true\"></svg>"
        + "<div class=\"memoria-container\">" + quadroHTML + painelObjetos + painelFuncoes + painelImportacoes + "</div>"
        + "</div>"
        + "</div>";
    }

    function desenharSetasMemoria() {
      const diagrama = document.querySelector(".memoria-diagrama");
      const svg = document.getElementById("memoria-setas");
      if (!diagrama || !svg) return;

      const area = diagrama.getBoundingClientRect();
      if (area.width === 0 || area.height === 0) return;

      const cor = document.body.classList.contains("tema-escuro") ? "#38bdf8" : "#0f5f8f";
      svg.setAttribute("viewBox", "0 0 " + area.width + " " + area.height);
      svg.setAttribute("width", area.width);
      svg.setAttribute("height", area.height);
      svg.innerHTML = "<defs><marker id=\"memoria-arrowhead\" markerWidth=\"10\" markerHeight=\"8\" refX=\"9\" refY=\"4\" orient=\"auto\" markerUnits=\"strokeWidth\"><path d=\"M0,0 L10,4 L0,8 Z\" fill=\"" + cor + "\"></path></marker></defs>";

      const destinos = Array.from(diagrama.querySelectorAll("[data-ref-destino]"));
      const origens = Array.from(diagrama.querySelectorAll("[data-ref-origem]"));

      for (const origem of origens) {
        const nome = origem.dataset.refOrigem;
        const destino = destinos.find((item) => item.dataset.refDestino === nome);
        if (!destino) continue;

        const origemRect = origem.getBoundingClientRect();
        const destinoRect = destino.getBoundingClientRect();
        const x1 = origemRect.left + origemRect.width / 2 - area.left;
        const y1 = origemRect.top + origemRect.height / 2 - area.top;
        const destinoEstaADireita = destinoRect.left >= origemRect.left;
        const x2 = (destinoEstaADireita ? destinoRect.left : destinoRect.right) - area.left;
        const y2 = destinoRect.top + Math.min(30, destinoRect.height / 2) - area.top;
        const distancia = Math.max(34, Math.abs(x2 - x1) * 0.45);
        const c1x = destinoEstaADireita ? x1 + distancia : x1 - distancia;
        const c2x = destinoEstaADireita ? x2 - distancia : x2 + distancia;

        const caminho = document.createElementNS("http://www.w3.org/2000/svg", "path");
        caminho.setAttribute("d", "M " + x1 + " " + y1 + " C " + c1x + " " + y1 + ", " + c2x + " " + y2 + ", " + x2 + " " + y2);
        caminho.setAttribute("fill", "none");
        caminho.setAttribute("stroke", cor);
        caminho.setAttribute("stroke-width", "2");
        caminho.setAttribute("marker-end", "url(#memoria-arrowhead)");
        svg.appendChild(caminho);
      }
    }

    function entradaPendenteAtual() {
      if (passos.length === 0) return null;
      const ultimo = passos[passos.length - 1];
      return ultimo && ultimo.entrada_pendente ? ultimo : null;
    }

    async function executar() {
      entradasColetadas = [];
      ocultarEntradaPendente();
      await executarComEntradas();
    }

	    async function executarComEntradas() {
	      const codigo = editor.getValue();
	      document.getElementById("saida").style.display = "block";
	      document.getElementById("saida-corpo").innerHTML = "<p class=\"empty\">" + escaparHTML(traduzir("run.executing")) + "</p>";
	      limparMarcacoes();

      try {
        const resp = await fetch("/executar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo, entradas: entradasColetadas })
        });

        if (!resp.ok) {
          const texto = await resp.text();
          throw new Error(texto || resp.statusText);
        }

        passos = await resp.json();
        const pendente = entradaPendenteAtual();
        indiceAtual = pendente ? passos.length - 1 : 0;

	        const slider = document.getElementById("slider");

	        if (passos.length === 0) {
	          document.getElementById("saida-corpo").innerHTML = "<p class=\"empty\">" + escaparHTML(traduzir("run.noSteps")) + "</p>";
	          resetarExecucaoVisual();
	          return;
	        }

        slider.max = passos.length - 1;
        slider.value = indiceAtual;
        slider.disabled = false;
        renderizarPasso();
        if (pendente) mostrarEntradaPendente(pendente);
        else ocultarEntradaPendente();

	      } catch (erro) {
	        resetarExecucaoVisual();
	        document.getElementById("saida-corpo").innerHTML =
	          "<div class=\"error-box\">" + escaparHTML(traduzir("run.serverError", { error: String(erro) })) + "</div>";
	      }
	    }

    async function enviarEntradaPendente() {
      if (!entradaPendente) return;
      const valor = document.getElementById("entrada").value;
      entradasColetadas.push({
        linha: entradaPendente.linha,
        valor
      });
      ocultarEntradaPendente();
      await executarComEntradas();
    }

    function passo(direcao) {
      const novo = indiceAtual + direcao;
      if (novo < 0 || novo >= passos.length) return;
      indiceAtual = novo;
      document.getElementById("slider").value = indiceAtual;
      renderizarPasso();
    }

    function irPara(valor) {
      if (passos.length === 0) return;
      indiceAtual = parseInt(valor);
      renderizarPasso();
    }

    function irParaPrimeiro() {
      if (passos.length === 0) return;
      indiceAtual = 0;
      document.getElementById("slider").value = indiceAtual;
      renderizarPasso();
    }

    function irParaUltimo() {
      if (passos.length === 0) return;
      indiceAtual = passos.length - 1;
      document.getElementById("slider").value = indiceAtual;
      renderizarPasso();
    }

    function atualizarBotoes() {
      const semPassos = passos.length === 0;
      document.getElementById("btn-primeiro").disabled = semPassos || indiceAtual === 0;
      document.getElementById("btn-anterior").disabled = semPassos || indiceAtual === 0;
      document.getElementById("btn-proximo").disabled = semPassos || indiceAtual === passos.length - 1;
      document.getElementById("btn-ultimo").disabled = semPassos || indiceAtual === passos.length - 1;
    }

    function linhaExecutadaAtual() {
      const passoAtual = passos[indiceAtual];
      if (passoAtual && passoAtual.evento === "return" && Number.isInteger(passoAtual.linha)) {
        return passoAtual.linha - 1;
      }
      for (let i = indiceAtual - 1; i >= 0; i--) {
        if (Number.isInteger(passos[i].linha)) return passos[i].linha - 1;
      }
      return null;
    }

    function linhaProximaAtual() {
      const passoAtual = passos[indiceAtual];
      if (passoAtual && (passoAtual.evento === "line" || passoAtual.evento === "input_pendente") && Number.isInteger(passoAtual.linha)) {
        return passoAtual.linha - 1;
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
        editor.setGutterMarker(executada, "exec-gutter", criarMarcador("executada"));
      }
      if (proxima !== null) {
        linhaProximaMarcada = proxima;
        editor.addLineClass(proxima, "background", "linha-proxima");
        editor.setGutterMarker(proxima, "exec-gutter", criarMarcador("proxima"));
      }

      const alvo = proxima !== null ? proxima : executada;
      if (alvo !== null) editor.scrollIntoView({ line: alvo, ch: 0 }, 60);
    }

    function renderizarPasso() {
      if (passos.length === 0) return;
      const p = passos[indiceAtual];
      const corpo = document.getElementById("saida-corpo");
      const linhaExecutada = linhaExecutadaAtual();
      const linhaProxima = linhaProximaAtual();
      const textoExecutada = linhaExecutada === null ? "-" : String(linhaExecutada + 1);
	      const textoProxima = linhaProxima === null ? traduzir("status.finished") : String(linhaProxima + 1);
	      const escopo = p.evento === "fim" ? traduzir("scope.end") : (p.escopo === "Global" ? traduzir("scope.global") : (p.escopo || traduzir("scope.global")));

	      document.getElementById("contador").textContent = traduzir("counter.step", { current: indiceAtual + 1, total: passos.length });
	      atualizarBotoes();
	      aplicarMarcacoes();
	      atualizarExplicacaoLinha();

	      if (p.erro) {
	        corpo.innerHTML = "<div class=\"error-box\"><strong>" + escaparHTML(traduzir("error.label")) + "</strong> " + escaparHTML(p.erro) + "</div>"
	          + "<div class=\"section-label\" style=\"margin-top:14px;\">" + escaparHTML(traduzir("output.errorUntil")) + "</div>"
	          + "<div class=\"terminal\">"
	          + "<div class=\"terminal-header\">"
	          + "<div class=\"terminal-dot vermelho\"></div>"
	          + "<div class=\"terminal-dot amarelo\"></div>"
	          + "<div class=\"terminal-dot verde\"></div>"
	          + "<span class=\"terminal-label\">" + escaparHTML(traduzir("output.label")) + "</span></div>"
	          + "<div class=\"terminal-body\">" + (p.saida && p.saida.trim() ? escaparHTML(p.saida) : "<span class=\"empty\">" + escaparHTML(traduzir("output.none")) + "</span>") + "</div></div>";
	        return;
	      }

	      const saidaConteudo = p.saida && p.saida.trim()
	        ? escaparHTML(p.saida)
	        : "<span class=\"empty\">" + escaparHTML(traduzir("output.noPrint")) + "</span>";
	      const etapaTexto = p.evento === "fim" ? traduzir("state.finished") : (p.evento === "input_pendente" ? traduzir("state.waitingInput") : (p.evento === "return" ? traduzir("state.return") : traduzir("state.running")));

	      corpo.innerHTML =
	        "<div class=\"passo-info\">"
	        + "<span class=\"passo-badge\">" + escaparHTML(traduzir("counter.step", { current: indiceAtual + 1, total: passos.length })) + "</span>"
	        + escaparHTML(etapaTexto)
	        + "<span class=\"linha-badge executada\"><i class=\"fa-solid fa-check\"></i>" + escaparHTML(traduzir("status.executed")) + ": " + textoExecutada + "</span>"
	        + "<span class=\"linha-badge proxima\"><i class=\"fa-solid fa-arrow-right\"></i>" + escaparHTML(traduzir("status.running")) + ": " + textoProxima + "</span>"
	        + "<span class=\"escopo-badge\">" + escaparHTML(escopo) + "</span>"
	        + "</div>"
	        + renderizarPilhaChamadas(p.pilha_chamadas)
	        + renderizarMemoria(p.variaveis)
	        + "<div class=\"section-label\" style=\"margin-top:16px;\"><i class=\"fa-solid fa-square-terminal\"></i>" + escaparHTML(traduzir("output.section")) + "</div>"
	        + "<div class=\"terminal\">"
	        + "<div class=\"terminal-header\">"
	        + "<div class=\"terminal-dot vermelho\"></div>"
	        + "<div class=\"terminal-dot amarelo\"></div>"
	        + "<div class=\"terminal-dot verde\"></div>"
	        + "<span class=\"terminal-label\"><i class=\"fa-solid fa-terminal\"></i>" + escaparHTML(traduzir("output.label")) + "</span></div>"
	        + "<div class=\"terminal-body\">" + saidaConteudo + "</div></div>";
      requestAnimationFrame(desenharSetasMemoria);
    }

    editor.on("change", () => {
      entradasColetadas = [];
      ocultarEntradaPendente();
      ocultarExplicacaoLinha();
    });
	    document.getElementById("entrada").addEventListener("keydown", (evento) => {
	      if (evento.key === "Enter") {
	        evento.preventDefault();
	        enviarEntradaPendente();
	      }
	    });

	    function focoEmCampoDeTexto(evento) {
	      const alvo = evento.target;
	      if (!alvo) return false;
	      if (alvo.closest && alvo.closest(".CodeMirror")) return true;
	      if (alvo.isContentEditable) return true;
	      return ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName);
	    }

	    function alvoAtivavel(alvo) {
	      return !!(alvo && alvo.closest && alvo.closest("button, a"));
	    }

	    document.addEventListener("keydown", (evento) => {
	      const tecla = evento.key;

	      if ((evento.ctrlKey || evento.metaKey) && tecla === "Enter") {
	        evento.preventDefault();
	        executar();
	        return;
	      }

	      if (tecla === "Escape") {
	        evento.preventDefault();
	        editor.focus();
	        return;
	      }

	      if (focoEmCampoDeTexto(evento) || evento.altKey || evento.ctrlKey || evento.metaKey) return;
	      if (tecla === " " && alvoAtivavel(evento.target)) return;

	      if (tecla === "ArrowRight" || tecla === " ") {
	        evento.preventDefault();
	        passo(1);
	        return;
	      }
	      if (tecla === "ArrowLeft") {
	        evento.preventDefault();
	        passo(-1);
	        return;
	      }
	      if (tecla === "Home") {
	        evento.preventDefault();
	        irParaPrimeiro();
	        return;
	      }
	      if (tecla === "End") {
	        evento.preventDefault();
	        irParaUltimo();
	        return;
	      }
	      if (tecla.toLowerCase() === "r") {
	        evento.preventDefault();
	        executar();
	        return;
	      }
	      if (tecla.toLowerCase() === "c") {
	        evento.preventDefault();
	        limparCodigo();
	      }
	    });

	    window.addEventListener("resize", desenharSetasMemoria);
	    resetarExecucaoVisual();
	    aplicarIdioma();
	    atualizarEntradaDinamica();
