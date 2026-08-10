carregarExemplos();

    const editor = CodeMirror.fromTextArea(document.getElementById("codigo"), {
      mode: "python",
      theme: "default",
      lineNumbers: true,
      gutters: ["exec-gutter", "CodeMirror-linenumbers"],
      indentUnit: 4,
      indentWithTabs: false,
      lineWrapping: true,
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
	        "output.errorLabel": "saída de erro",
	        "output.none": "Nenhuma saída.",
	        "output.noPrint": "Nenhum print executado até aqui.",
	        "output.errorUntil": "Saída até o erro",
	        "card.collapse": "Minimizar bloco",
	        "card.expand": "Expandir bloco",
	        "run.executing": "Executando...",
	        "run.noSteps": "Nenhum passo registrado.",
	        "run.serverError": "Erro ao comunicar com o servidor: {error}",
	        "error.label": "Erro:",
	        "error.guidanceLabel": "Como corrigir:",
	        "error.guidance.indicated": "indicado",
	        "error.guidance.indicatedFeminine": "indicada",
	        "error.guidance.tab": "Use apenas espaços ou apenas tabulações para indentar o bloco. O recomendado é substituir cada tabulação por 4 espaços e manter o mesmo padrão em todo o código.",
	        "error.guidance.indentExpected": "A linha indicada inicia um bloco, mas a instrução seguinte não está recuada. Adicione 4 espaços antes das linhas que pertencem ao bloco.",
	        "error.guidance.indentUnexpected": "A linha indicada possui recuo sem que exista um bloco aberto. Remova os espaços do início da linha ou coloque-a dentro do bloco correto.",
	        "error.guidance.indentMismatch": "O recuo desta linha não corresponde ao nível das linhas anteriores. Alinhe-a com o bloco ao qual ela pertence e use 4 espaços por nível.",
	        "error.guidance.indentation": "Revise o recuo da linha indicada e das linhas próximas. Use 4 espaços por nível e mantenha todas as instruções do mesmo bloco alinhadas.",
	        "error.guidance.stringLiteral": "A string foi iniciada, mas não foi encerrada. Adicione a mesma aspa usada no início ao final do texto.",
	        "error.guidance.decimalLiteral": "Um número contém letras ou outros caracteres inválidos. Remova esses caracteres ou coloque todo o valor entre aspas se ele deveria ser um texto.",
	        "error.guidance.delimiter": "Há um parêntese, colchete ou chave sem fechamento ou fora de ordem. Confira os delimitadores da linha indicada e feche cada abertura com o símbolo correspondente.",
	        "error.guidance.colon": "A instrução precisa terminar com dois-pontos (:). Adicione o sinal ao final da linha indicada.",
	        "error.guidance.returnOutside": "O comando return só pode ser usado dentro de uma função. Mova esta linha para o bloco de uma função ou retire o return.",
	        "error.guidance.loopControlOutside": "Esse comando só pode ser usado dentro de um laço for ou while. Mova-o para dentro do laço correspondente.",
	        "error.guidance.assignment": "O lado esquerdo do sinal de igual deve ser uma variável, atributo ou posição válida. Revise o alvo que receberá o valor.",
	        "error.guidance.syntax": "Revise a linha indicada e a linha anterior. Procure sinais ausentes ou extras, como dois-pontos, vírgulas, aspas, parênteses, colchetes e operadores.",
	        "error.guidance.name": "A variável ou função {name} ainda não foi definida. Verifique a escrita do nome e garanta que ela seja criada antes desta linha e esteja acessível neste escopo.",
	        "error.guidance.nameGeneric": "Uma variável ou função foi usada antes de ser definida. Verifique a escrita do nome, a ordem das instruções e o escopo em que ela foi criada.",
	        "error.guidance.unboundLocal": "A variável local {name} está sendo lida antes de receber um valor nesta função. Faça a atribuição antes do uso ou revise se deveria usar uma variável de outro escopo.",
	        "error.guidance.typeConcat": "Os valores concatenados têm tipos diferentes. Converta-os para o mesmo tipo, por exemplo com str(), int() ou float(), antes de usar o operador +.",
	        "error.guidance.typeOperands": "O operador usado não aceita esses tipos de valores. Verifique os operandos e converta-os para tipos compatíveis antes da operação.",
	        "error.guidance.notCallable": "O valor foi usado como se fosse uma função. Remova os parênteses da chamada ou verifique se o nome da função foi substituído por outro valor.",
	        "error.guidance.arguments": "A chamada recebeu uma quantidade ou um formato incorreto de argumentos. Compare a chamada com os parâmetros definidos pela função.",
	        "error.guidance.type": "A operação recebeu um tipo de valor incompatível. Confira os tipos envolvidos e faça a conversão necessária antes de executar a operação.",
	        "error.guidance.intValue": "O valor {value} não representa um número inteiro válido. Remova letras e símbolos indevidos ou trate a entrada antes de passá-la para int().",
	        "error.guidance.unpack": "A quantidade de valores não corresponde à quantidade de variáveis. Ajuste um dos lados da atribuição para que ambos tenham o mesmo número de elementos.",
	        "error.guidance.mathDomain": "O valor está fora do domínio aceito pela função matemática. Verifique quais entradas a função permite antes de chamá-la.",
	        "error.guidance.value": "O tipo do valor é aceito, mas seu conteúdo não é válido para essa operação. Confira o formato e os valores permitidos antes de tentar novamente.",
	        "error.guidance.zeroDivision": "O divisor resultou em zero. Verifique seu valor antes da divisão e trate o caso em que ele seja igual a 0.",
	        "error.guidance.index": "A posição acessada não existe na sequência. Lembre-se de que os índices começam em 0 e devem ser menores que a quantidade de elementos.",
	        "error.guidance.key": "A chave {key} não existe no dicionário. Confira sua escrita ou verifique a existência da chave antes do acesso com o operador in ou com get().",
	        "error.guidance.attribute": "Objetos do tipo {type} não possuem o atributo ou método {attribute}. Confira o tipo do objeto e a escrita do nome utilizado.",
	        "error.guidance.moduleNotFound": "O módulo {module} não foi encontrado. Confira o nome informado e verifique se o pacote está instalado e disponível no ambiente.",
	        "error.guidance.import": "O módulo foi encontrado, mas o item solicitado não está disponível nele. Confira o nome importado e a documentação do módulo.",
	        "error.guidance.fileNotFound": "O arquivo ou diretório não foi encontrado. Confira o caminho, o nome e se o arquivo existe antes de tentar abri-lo.",
	        "error.guidance.permission": "O programa não tem permissão para acessar esse recurso. Verifique o caminho escolhido e as permissões do arquivo ou diretório.",
	        "error.guidance.recursion": "A função chamou a si mesma vezes demais. Revise a condição de parada e garanta que cada chamada se aproxime dela.",
	        "error.guidance.assertion": "Uma condição verificada por assert resultou em falso. Confira a condição e os valores usados naquele ponto do programa.",
	        "error.guidance.overflow": "O resultado numérico ficou grande demais para essa operação. Revise os valores e considere uma forma de cálculo que evite esse crescimento.",
	        "error.guidance.eof": "O programa tentou ler uma entrada que não foi fornecida. Garanta que cada chamada de leitura receba um valor.",
	        "error.guidance.memory": "A operação tentou usar mais memória do que o ambiente permite. Reduza o tamanho das estruturas ou processe os dados em partes menores.",
	        "error.guidance.timeout": "A execução demorou mais do que o limite permitido. Verifique laços infinitos, condições que nunca se tornam falsas ou operações excessivamente longas.",
	        "error.guidance.stepLimit": "O código gerou passos demais. Revise principalmente as condições dos laços e da recursão para garantir que a execução termine.",
	        "error.guidance.internal": "O executor encontrou uma falha interna. Tente executar novamente; se o problema continuar, simplifique o exemplo e informe o erro ao responsável pelo sistema.",
	        "error.guidance.generic": "Leia a mensagem técnica, localize a linha indicada e confira os valores e a instrução usados nela. Corrija esse ponto e execute o código novamente.",
	        "line.empty": "(linha vazia)",
	        "line.finishedExplain": "Execução finalizada. Não há uma próxima linha de código para explicar neste passo.",
	        "marker.running": "Linha em execução",
	        "marker.executed": "Linha executada",
	        "stack.title": "Pilha de chamadas",
	        "stack.subtitle": "Mostra a sequência dinâmica de funções ativas neste passo.",
	        "stack.currentScope": "escopo atual",
	        "stack.empty": "Nenhuma função ativa além do escopo global neste passo.",
	        "memory.title": "Memória",
	        "memory.empty": "Nenhum dado armazenado neste passo.",
	        "memory.frames": "Quadros de memória",
	        "memory.variables": "Variáveis",
	        "memory.emptyShort": "Vazio",
	        "memory.objects": "Objetos na memória",
	        "memory.noObjects": "Nenhum objeto neste passo.",
	        "memory.functions": "Funções",
	        "memory.noFunctions": "Nenhuma função definida neste passo.",
	        "memory.classes": "Classes",
	        "memory.noClasses": "Nenhuma classe definida neste passo.",
	        "memory.imports": "Importações",
	        "memory.noImports": "Nenhuma importação neste passo.",
	        "memory.importModule": "módulo importado",
	        "memory.importFunction": "função importada de {module}",
	        "memory.importClass": "classe importada de {module}",
	        "memory.importItem": "item importado de {module}",
	        "memory.subtitle": "Quadros, objetos, funções, classes e importações separados por categoria.",
	        "memory.referenceTitle": "Referência para o objeto {name}",
	        "memory.objectEmpty": "vazio",
	        "type.list": "list",
	        "type.tuple": "tuple",
	        "type.set": "set",
	        "type.dict": "dict",
	        "explain.empty": "Esta linha está vazia. Ela apenas separa visualmente partes do código.",
	        "explain.comment": "Comentário: serve para documentar o código e não é executado pelo Python.",
	        "explain.multilineComment": "Bloco de texto delimitado por aspas triplas. Quando está isolado, costuma ser usado como comentário de múltiplas linhas; tecnicamente, o Python o trata como uma string. No início de um módulo, função ou classe, ele pode ser uma docstring.",
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
	        "output.errorLabel": "error output",
	        "output.none": "No output.",
	        "output.noPrint": "No print executed up to this step.",
	        "output.errorUntil": "Output until the error",
	        "card.collapse": "Collapse block",
	        "card.expand": "Expand block",
	        "run.executing": "Running...",
	        "run.noSteps": "No steps recorded.",
	        "run.serverError": "Error communicating with the server: {error}",
	        "error.label": "Error:",
	        "error.guidanceLabel": "How to fix it:",
	        "error.guidance.indicated": "indicated",
	        "error.guidance.indicatedFeminine": "indicated",
	        "error.guidance.tab": "Use only spaces or only tabs to indent the block. The recommended approach is to replace each tab with 4 spaces and keep the same pattern throughout the code.",
	        "error.guidance.indentExpected": "The indicated line starts a block, but the next statement is not indented. Add 4 spaces before the lines that belong to the block.",
	        "error.guidance.indentUnexpected": "The indicated line is indented without an open block. Remove the spaces at the beginning of the line or place it inside the correct block.",
	        "error.guidance.indentMismatch": "This line's indentation does not match the previous levels. Align it with the block it belongs to and use 4 spaces per level.",
	        "error.guidance.indentation": "Review the indentation of the indicated line and nearby lines. Use 4 spaces per level and align every statement in the same block.",
	        "error.guidance.stringLiteral": "The string was started but not closed. Add the same quote used at the beginning to the end of the text.",
	        "error.guidance.decimalLiteral": "A number contains letters or other invalid characters. Remove them, or put the entire value in quotes if it should be text.",
	        "error.guidance.delimiter": "A parenthesis, bracket, or brace is unclosed or out of order. Check the delimiters on the indicated line and close each opening symbol with its matching symbol.",
	        "error.guidance.colon": "The statement must end with a colon (:). Add it to the end of the indicated line.",
	        "error.guidance.returnOutside": "The return statement can only be used inside a function. Move this line into a function block or remove return.",
	        "error.guidance.loopControlOutside": "This statement can only be used inside a for or while loop. Move it into the corresponding loop.",
	        "error.guidance.assignment": "The left side of the equals sign must be a valid variable, attribute, or position. Review the target that should receive the value.",
	        "error.guidance.syntax": "Review the indicated line and the line before it. Look for missing or extra symbols such as colons, commas, quotes, parentheses, brackets, and operators.",
	        "error.guidance.name": "The variable or function {name} has not been defined yet. Check its spelling and make sure it is created before this line and is available in this scope.",
	        "error.guidance.nameGeneric": "A variable or function was used before being defined. Check its spelling, statement order, and the scope where it was created.",
	        "error.guidance.unboundLocal": "The local variable {name} is being read before receiving a value in this function. Assign it before use or review whether a variable from another scope was intended.",
	        "error.guidance.typeConcat": "The concatenated values have different types. Convert them to the same type, for example with str(), int(), or float(), before using +.",
	        "error.guidance.typeOperands": "The operator does not accept these value types. Check the operands and convert them to compatible types before the operation.",
	        "error.guidance.notCallable": "The value was used as if it were a function. Remove the call parentheses or check whether the function name was replaced by another value.",
	        "error.guidance.arguments": "The call received an incorrect number or format of arguments. Compare the call with the parameters defined by the function.",
	        "error.guidance.type": "The operation received an incompatible value type. Check the types involved and perform the required conversion first.",
	        "error.guidance.intValue": "The value {value} is not a valid integer. Remove invalid letters and symbols or validate the input before passing it to int().",
	        "error.guidance.unpack": "The number of values does not match the number of variables. Adjust one side of the assignment so both have the same number of elements.",
	        "error.guidance.mathDomain": "The value is outside the mathematical function's accepted domain. Check which inputs the function allows before calling it.",
	        "error.guidance.value": "The value type is accepted, but its contents are not valid for this operation. Check the expected format and allowed values.",
	        "error.guidance.zeroDivision": "The divisor evaluated to zero. Check its value before dividing and handle the case where it equals 0.",
	        "error.guidance.index": "The requested position does not exist in the sequence. Remember that indexes start at 0 and must be smaller than the number of elements.",
	        "error.guidance.key": "The key {key} does not exist in the dictionary. Check its spelling or verify it before access with the in operator or get().",
	        "error.guidance.attribute": "Objects of type {type} do not have the attribute or method {attribute}. Check the object's type and the spelling of the name.",
	        "error.guidance.moduleNotFound": "The module {module} was not found. Check its name and make sure the package is installed and available in the environment.",
	        "error.guidance.import": "The module was found, but the requested item is not available in it. Check the imported name and the module documentation.",
	        "error.guidance.fileNotFound": "The file or directory was not found. Check the path, its name, and whether it exists before opening it.",
	        "error.guidance.permission": "The program does not have permission to access this resource. Check the selected path and the file or directory permissions.",
	        "error.guidance.recursion": "The function called itself too many times. Review the stopping condition and make sure each call moves closer to it.",
	        "error.guidance.assertion": "A condition checked by assert evaluated to false. Review the condition and the values used at that point.",
	        "error.guidance.overflow": "The numeric result became too large for this operation. Review the values and consider a calculation that avoids this growth.",
	        "error.guidance.eof": "The program tried to read input that was not provided. Make sure every input operation receives a value.",
	        "error.guidance.memory": "The operation tried to use more memory than the environment allows. Reduce structure sizes or process the data in smaller parts.",
	        "error.guidance.timeout": "Execution took longer than the allowed limit. Check for infinite loops, conditions that never become false, or excessively long operations.",
	        "error.guidance.stepLimit": "The code generated too many steps. Review loop and recursion conditions to make sure execution ends.",
	        "error.guidance.internal": "The executor encountered an internal failure. Try again; if it continues, simplify the example and report the error to the system maintainer.",
	        "error.guidance.generic": "Read the technical message, locate the indicated line, and check the values and statement used there. Correct that point and run the code again.",
	        "line.empty": "(empty line)",
	        "line.finishedExplain": "Execution finished. There is no next line of code to explain in this step.",
	        "marker.running": "Running line",
	        "marker.executed": "Executed line",
	        "stack.title": "Call stack",
	        "stack.subtitle": "Shows the dynamic sequence of active functions in this step.",
	        "stack.currentScope": "current scope",
	        "stack.empty": "No function is active beyond the global scope in this step.",
	        "memory.title": "Memory",
	        "memory.empty": "No data stored in this step.",
	        "memory.frames": "Memory frames",
	        "memory.variables": "Variables",
	        "memory.emptyShort": "Empty",
	        "memory.objects": "Objects in memory",
	        "memory.noObjects": "No object in this step.",
	        "memory.functions": "Functions",
	        "memory.noFunctions": "No function defined in this step.",
	        "memory.classes": "Classes",
	        "memory.noClasses": "No class defined in this step.",
	        "memory.imports": "Imports",
	        "memory.noImports": "No import in this step.",
	        "memory.importModule": "imported module",
	        "memory.importFunction": "function imported from {module}",
	        "memory.importClass": "class imported from {module}",
	        "memory.importItem": "item imported from {module}",
	        "memory.subtitle": "Frames, objects, functions, classes, and imports separated by category.",
	        "memory.referenceTitle": "Reference to object {name}",
	        "memory.objectEmpty": "empty",
	        "type.list": "list",
	        "type.tuple": "tuple",
	        "type.set": "set",
	        "type.dict": "dict",
	        "explain.empty": "This line is empty. It only visually separates parts of the code.",
	        "explain.comment": "Comment: documents the code and is not executed by Python.",
	        "explain.multilineComment": "Text block delimited by triple quotes. When it stands alone, it is commonly used as a multiline comment; technically, Python treats it as a string. At the beginning of a module, function, or class, it can be a docstring.",
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
	      atualizarBotoesRecolher();
		      if (entradaPendente) {
		        document.getElementById("entrada-linha-badge").textContent = traduzir("input.line") + " " + entradaPendente.linha;
		        document.getElementById("entrada-prompt-texto").textContent =
		          entradaPendente.prompt || traduzir("input.promptDefault");
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
      document.getElementById("saida-card").style.display = "none";
      document.getElementById("pilha-card").style.display = "none";
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
		        entradaPendente.prompt || traduzir("input.promptDefault");
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
      document.getElementById("saida-card").style.display = "none";
      document.getElementById("pilha-card").style.display = "none";
      resetarExecucaoVisual();
      editor.focus();
    }

    function aplicarFonte() {
      document.documentElement.style.setProperty("--font-scale", escalaFonte.toFixed(2));
	      document.documentElement.classList.toggle("fonte-ampliada", escalaFonte > 1.3);
      editor.refresh();
      requestAnimationFrame(desenharSetasMemoria);
    }

    function alterarFonte(delta) {
      escalaFonte = Math.max(0.85, Math.min(1.8, escalaFonte + delta));
      aplicarFonte();
    }

	    function atualizarBotaoRecolher(botao) {
	      const card = botao.closest(".card");
	      if (!card) return;
	      const recolhido = card.classList.contains("recolhido");
	      const texto = traduzir(recolhido ? "card.expand" : "card.collapse");
	      const icone = botao.querySelector("i");
	      botao.setAttribute("aria-expanded", recolhido ? "false" : "true");
	      botao.setAttribute("aria-label", texto);
	      botao.title = texto;
	      if (icone) icone.className = recolhido ? "fa-solid fa-chevron-down" : "fa-solid fa-chevron-up";
	    }

	    function atualizarBotoesRecolher() {
	      document.querySelectorAll(".btn-recolher").forEach(atualizarBotaoRecolher);
	    }

	    function alternarCard(cardId) {
	      const card = document.getElementById(cardId);
	      if (!card) return;
	      card.classList.toggle("recolhido");
	      const botao = card.querySelector(":scope > .card-header .btn-recolher");
	      if (botao) atualizarBotaoRecolher(botao);
	      if (cardId === "codigo-card" && !card.classList.contains("recolhido")) editor.refresh();
	      requestAnimationFrame(desenharSetasMemoria);
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

	    function obterBlocoAspasTriplas(indiceInicial) {
	      const linhaInicial = editor.getLine(indiceInicial) || "";
	      const inicio = linhaInicial.trimStart().match(/^(?:[rRuUbB]{0,2})?("""|''')/);
	      if (!inicio) return null;

	      const delimitador = inicio[1];
	      const posicaoAbertura = linhaInicial.indexOf(delimitador);
	      const restanteLinha = linhaInicial.slice(posicaoAbertura + delimitador.length);
	      let indiceFinal = indiceInicial;

	      if (!restanteLinha.includes(delimitador)) {
	        indiceFinal = null;
	        for (let indice = indiceInicial + 1; indice < editor.lineCount(); indice++) {
	          if ((editor.getLine(indice) || "").includes(delimitador)) {
	            indiceFinal = indice;
	            break;
	          }
	        }
	      }

	      if (indiceFinal === null) return null;
	      const linhas = [];
	      for (let indice = indiceInicial; indice <= indiceFinal; indice++) {
	        linhas.push(editor.getLine(indice) || "");
	      }

	      return {
	        codigo: linhas.join("\n"),
	        indiceFinal
	      };
	    }

	    function explicarComandoPython(linha, blocoAspasTriplas = null) {
	      const texto = String(linha || "").trim();
	      if (!texto) return traduzir("explain.empty");
	      if (blocoAspasTriplas) return traduzir("explain.multilineComment");
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

	    function orientarCorrecaoErro(erro) {
	      const mensagem = String(erro || "").trim();
	      const mensagemMinuscula = mensagem.toLowerCase();
	      const correspondenciaTipo = mensagem.match(/^([A-Za-z_][A-Za-z0-9_]*):/);
	      const tipo = correspondenciaTipo ? correspondenciaTipo[1] : "";

	      if (tipo === "TabError") return traduzir("error.guidance.tab");

	      if (tipo === "IndentationError") {
	        if (mensagemMinuscula.includes("expected an indented block")) return traduzir("error.guidance.indentExpected");
	        if (mensagemMinuscula.includes("unexpected indent")) return traduzir("error.guidance.indentUnexpected");
	        if (mensagemMinuscula.includes("unindent does not match")) return traduzir("error.guidance.indentMismatch");
	        return traduzir("error.guidance.indentation");
	      }

	      if (tipo === "SyntaxError") {
	        if (mensagemMinuscula.includes("unterminated string literal") || mensagemMinuscula.includes("eol while scanning string literal")) {
	          return traduzir("error.guidance.stringLiteral");
	        }
	        if (mensagemMinuscula.includes("invalid decimal literal")) return traduzir("error.guidance.decimalLiteral");
	        if (mensagemMinuscula.includes("was never closed")
	          || mensagemMinuscula.includes("unmatched")
	          || mensagemMinuscula.includes("does not match opening")
	          || mensagemMinuscula.includes("expecting '}'")
	          || mensagemMinuscula.includes("closing parenthesis")) {
	          return traduzir("error.guidance.delimiter");
	        }
	        if (mensagemMinuscula.includes("expected ':'")) return traduzir("error.guidance.colon");
	        if (mensagemMinuscula.includes("'return' outside function")) return traduzir("error.guidance.returnOutside");
	        if (mensagemMinuscula.includes("'break' outside loop") || mensagemMinuscula.includes("'continue' not properly in loop")) {
	          return traduzir("error.guidance.loopControlOutside");
	        }
	        if (mensagemMinuscula.includes("cannot assign to") || mensagemMinuscula.includes("assignment expression")) {
	          return traduzir("error.guidance.assignment");
	        }
	        return traduzir("error.guidance.syntax");
	      }

	      if (tipo === "UnboundLocalError") {
	        const variavelLocal = mensagem.match(/local variable ['\"]([^'\"]+)['\"]/i)
	          || mensagem.match(/cannot access local variable ['\"]([^'\"]+)['\"]/i);
	        return traduzir("error.guidance.unboundLocal", {
	          name: variavelLocal ? "'" + variavelLocal[1] + "'" : traduzir("error.guidance.indicatedFeminine")
	        });
	      }

	      if (tipo === "NameError") {
	        const nome = mensagem.match(/name ['\"]([^'\"]+)['\"] is not defined/i);
	        return nome
	          ? traduzir("error.guidance.name", { name: "'" + nome[1] + "'" })
	          : traduzir("error.guidance.nameGeneric");
	      }

	      if (tipo === "TypeError") {
	        if (mensagemMinuscula.includes("concatenate") || mensagemMinuscula.includes("can only concatenate")) {
	          return traduzir("error.guidance.typeConcat");
	        }
	        if (mensagemMinuscula.includes("unsupported operand type")) return traduzir("error.guidance.typeOperands");
	        if (mensagemMinuscula.includes("not callable")) return traduzir("error.guidance.notCallable");
	        if (mensagemMinuscula.includes("argument") || mensagemMinuscula.includes("takes ") || mensagemMinuscula.includes("missing ")) {
	          return traduzir("error.guidance.arguments");
	        }
	        return traduzir("error.guidance.type");
	      }

	      if (tipo === "ValueError") {
	        const valorInteiro = mensagem.match(/invalid literal for int\(\) with base \d+:\s*(.+)$/i);
	        if (valorInteiro) return traduzir("error.guidance.intValue", { value: valorInteiro[1] });
	        if (mensagemMinuscula.includes("values to unpack")) return traduzir("error.guidance.unpack");
	        if (mensagemMinuscula.includes("math domain error")) return traduzir("error.guidance.mathDomain");
	        return traduzir("error.guidance.value");
	      }

	      if (tipo === "ZeroDivisionError") return traduzir("error.guidance.zeroDivision");
	      if (tipo === "IndexError") return traduzir("error.guidance.index");

	      if (tipo === "KeyError") {
	        const chave = mensagem.replace(/^KeyError:\s*/, "").trim();
	        const chaveExibida = chave || traduzir("error.guidance.indicatedFeminine");
	        return traduzir("error.guidance.key", { key: chaveExibida });
	      }

	      if (tipo === "AttributeError") {
	        const atributo = mensagem.match(/['\"]([^'\"]+)['\"] object has no attribute ['\"]([^'\"]+)['\"]/i);
	        return traduzir("error.guidance.attribute", {
	          type: atributo ? "'" + atributo[1] + "'" : traduzir("error.guidance.indicated"),
	          attribute: atributo ? "'" + atributo[2] + "'" : traduzir("error.guidance.indicated")
	        });
	      }

	      if (tipo === "ModuleNotFoundError") {
	        const modulo = mensagem.match(/no module named ['\"]([^'\"]+)['\"]/i);
	        return traduzir("error.guidance.moduleNotFound", {
	          module: modulo ? "'" + modulo[1] + "'" : traduzir("error.guidance.indicated")
	        });
	      }

	      if (tipo === "ImportError") return traduzir("error.guidance.import");
	      if (tipo === "FileNotFoundError") return traduzir("error.guidance.fileNotFound");
	      if (tipo === "PermissionError") return traduzir("error.guidance.permission");
	      if (tipo === "RecursionError") return traduzir("error.guidance.recursion");
	      if (tipo === "AssertionError") return traduzir("error.guidance.assertion");
	      if (tipo === "OverflowError") return traduzir("error.guidance.overflow");
	      if (tipo === "EOFError") return traduzir("error.guidance.eof");
	      if (tipo === "MemoryError") return traduzir("error.guidance.memory");
	      if (tipo === "TempoLimite" || tipo === "TimeoutError") return traduzir("error.guidance.timeout");
	      if (tipo === "LimiteDePassos") return traduzir("error.guidance.stepLimit");
	      if (tipo === "FalhaInterna") return traduzir("error.guidance.internal");
	      return traduzir("error.guidance.generic");
	    }

	    function montarCaixaErro(erro, classeExtra = "") {
	      const orientacao = orientarCorrecaoErro(erro);
	      const classe = classeExtra ? " " + classeExtra : "";
	      return "<div class=\"error-box" + classe + "\" role=\"alert\">"
	        + "<div><strong>" + escaparHTML(traduzir("error.label")) + "</strong> " + escaparHTML(erro) + "</div>"
	        + "<div class=\"error-guidance\"><strong class=\"error-guidance-label\">"
	        + escaparHTML(traduzir("error.guidanceLabel")) + "</strong> " + escaparHTML(orientacao) + "</div>"
	        + "</div>";
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
      const blocoAspasTriplas = obterBlocoAspasTriplas(alvo.indice);
      const codigoExplicado = blocoAspasTriplas ? blocoAspasTriplas.codigo : linhaCodigo;
      const identificadorLinha = blocoAspasTriplas && blocoAspasTriplas.indiceFinal !== alvo.indice
        ? (alvo.indice + 1) + "–" + (blocoAspasTriplas.indiceFinal + 1)
        : String(alvo.indice + 1);
      corpo.innerHTML =
	        "<div class=\"explicacao-meta\">"
	        + "<span class=\"explicacao-chip\">" + escaparHTML(traduzir("input.line")) + " " + identificadorLinha + "</span>"
	        + "<span class=\"explicacao-chip\">" + escaparHTML(alvo.status) + "</span>"
	        + "</div>"
	        + "<pre class=\"explicacao-codigo\">" + escaparHTML(codigoExplicado || traduzir("line.empty")) + "</pre>"
	        + "<p class=\"explicacao-texto\">" + escaparHTML(explicarComandoPython(linhaCodigo, blocoAspasTriplas)) + "</p>";
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

    function renderizarQuadroFuncoes(funcoes, vazio) {
      const linhas = funcoes.length === 0
        ? "<div class=\"quadro-linha\"><div class=\"quadro-cel\"><span class=\"empty\">" + escaparHTML(vazio) + "</span></div></div>"
        : funcoes.map(({ nome, info }) => {
          const assinatura = typeof info.assinatura === "string" ? info.assinatura : "()";
          return "<div class=\"quadro-linha\"><div class=\"quadro-cel quadro-cel-funcao\">"
            + escaparHTML(nome + assinatura)
            + "</div></div>";
        }).join("");

      return "<div class=\"quadro quadro-funcoes\">"
        + "<div class=\"quadro-titulo\">" + escaparHTML(traduzir("memory.functions")) + "</div>"
        + "<div class=\"quadro-linhas\">" + linhas + "</div>"
        + "</div>";
    }

    function renderizarQuadroClasses(classes, vazio) {
      const linhas = classes.length === 0
        ? "<div class=\"quadro-linha\"><div class=\"quadro-cel\"><span class=\"empty\">" + escaparHTML(vazio) + "</span></div></div>"
        : classes.map(({ nome }) =>
          "<div class=\"quadro-linha\">"
          + "<div class=\"quadro-cel quadro-cel-nome\">" + escaparHTML(nome) + "</div>"
          + "<div class=\"quadro-cel quadro-cel-tipo\"><span class=\"tipo-chip tipo-chip-classe\">class</span></div>"
          + "</div>"
        ).join("");

      return "<div class=\"quadro quadro-classes\">"
        + "<div class=\"quadro-titulo\">" + escaparHTML(traduzir("memory.classes")) + "</div>"
        + "<div class=\"quadro-linhas\">" + linhas + "</div>"
        + "</div>";
    }

    function renderizarQuadroImportacoes(importacoes, vazio) {
      const linhas = importacoes.length === 0
        ? "<div class=\"quadro-linha\"><div class=\"quadro-cel\"><span class=\"empty\">" + escaparHTML(vazio) + "</span></div></div>"
        : importacoes.map(({ nome, info }) => {
          const tipo = normalizarTipoPython(info.tipo);
          const nomeOriginal = info.nome || nome;
          const rotulo = nomeOriginal !== nome ? nomeOriginal + " (" + nome + ")" : nome;
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
          return "<div class=\"quadro-linha\">"
            + "<div class=\"quadro-cel quadro-cel-nome\">" + escaparHTML(rotulo) + " <span class=\"importacao-separador\">|</span></div>"
            + "<div class=\"quadro-cel quadro-cel-detalhe importacao-descricao\">" + escaparHTML(descricao) + "</div>"
            + "</div>";
        }).join("");

      return "<div class=\"quadro quadro-importacoes\">"
        + "<div class=\"quadro-titulo\">" + escaparHTML(traduzir("memory.imports")) + "</div>"
        + "<div class=\"quadro-linhas\">" + linhas + "</div>"
        + "</div>";
    }

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
	        modulo: "module"
	      };
	      return equivalencias[tipo] || tipo || "object";
	    }

	    function normalizarItemObjeto(item) {
	      if (item && typeof item === "object" && !Array.isArray(item)) {
	        return {
	          repr: Object.prototype.hasOwnProperty.call(item, "repr") ? String(item.repr) : "",
	          tipo: normalizarTipoPython(item.tipo)
	        };
	      }
	      return { repr: String(item ?? ""), tipo: "object" };
	    }

	    function classeChipTipoInterno(tipo) {
	      const primitivos = ["int", "float", "bool", "str", "NoneType", "complex", "bytes", "bytearray"];
	      return primitivos.includes(tipo) ? "tipo-chip-primitivo" : "tipo-chip-derivado";
	    }

	    function renderizarValorTipado(item) {
	      const dado = normalizarItemObjeto(item);
	      return "<span class=\"objeto-valor\">" + escaparHTML(dado.repr) + "</span>"
	        + "<span class=\"tipo-chip tipo-chip-interno " + classeChipTipoInterno(dado.tipo) + "\">"
	        + escaparHTML(dado.tipo)
	        + "</span>";
	    }

	    function paresDicionario(info) {
	      if (Array.isArray(info.pares)) return info.pares;
	      return Object.entries(info.pares || {}).map(([chave, valor]) => ({
	        chave: { repr: chave, tipo: "object" },
	        valor
	      }));
	    }

	    function atributosObjeto(info) {
	      if (Array.isArray(info.atributos)) return info.atributos;
	      return Object.entries(info.atributos || {}).map(([nome, valor]) => ({ nome, valor }));
	    }

	    function formatarChamadaPilha(item) {
	      if (!item || item.escopo === "Global") return traduzir("scope.global");
	      const argumentos = Array.isArray(item.argumentos) ? item.argumentos : [];
	      const textoArgumentos = argumentos.map((arg) => {
	        const nome = escaparHTML(arg.nome);
	        return arg.exibir_valor === false ? nome : nome + "=" + escaparHTML(arg.valor);
	      }).join(", ");
      return escaparHTML(item.escopo) + "(" + textoArgumentos + ")";
    }

	    function renderizarPilhaChamadas(pilha) {
	      if (!Array.isArray(pilha) || pilha.length <= 1) {
	        return "<p class=\"empty\">" + escaparHTML(traduzir("stack.empty")) + "</p>";
	      }
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
	        + "<div class=\"pilha-subtitulo\">" + escaparHTML(traduzir("stack.subtitle")) + "</div>"
	        + "<div class=\"pilha-lista\">" + itens + "</div>"
	        + "</div>";
	    }

	    function renderizarMemoria(variaveis, quadrosMemoria) {
	      const quadros = Array.isArray(quadrosMemoria) && quadrosMemoria.length > 0
	        ? quadrosMemoria
	        : [{ escopo: "Global", atual: true, variaveis: variaveis || {} }];
	      const possuiConteudo = quadros.some((quadro) =>
	        quadro.variaveis && Object.keys(quadro.variaveis).length > 0
	      );
	      if (!possuiConteudo) {
	        return '<div class="memoria-vazia"><span class="section-label">'
	          + escaparHTML(traduzir("memory.title"))
	          + '</span><span class="empty">'
	          + escaparHTML(traduzir("memory.empty"))
	          + '</span></div>';
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
	            const referencia = info.referencia || "quadro-" + indiceQuadro + "-" + nome;
	            if (!objetosPorReferencia.has(referencia)) {
	              objetosPorReferencia.set(referencia, { nome, info, referencia });
	            }
	          }
	          else if (info.categoria === "classe") classes.push({ nome, info });
	          else if (info.categoria === "funcao" && normalizarTipoPython(info.tipo) === "class") classes.push({ nome, info });
	          else if (info.categoria === "funcao") funcoes.push({ nome, info });
	          else if (info.categoria === "importacao") {
	            importacoes.push({ nome, info, indice: indiceImportacao });
	            indiceImportacao += 1;
	          }
	          else if (!["primitivo", "objeto"].includes(info.categoria)) {
	            variaveisQuadro.push({ nome, info });
	          }
	        }

	        let linhasQuadro = "";
	        for (const { nome, info } of variaveisQuadro) {
	          if (info.categoria === "objeto") {
	            const referencia = info.referencia || "quadro-" + indiceQuadro + "-" + nome;
	            linhasQuadro += "<div class=\"quadro-linha\">"
	              + "<div class=\"quadro-cel quadro-cel-nome\">" + escaparHTML(nome) + "</div>"
	              + "<div class=\"quadro-cel quadro-cel-tipo\"><span class=\"tipo-chip tipo-chip-derivado\">" + escaparHTML(normalizarTipoPython(info.tipo)) + "</span></div>"
	              + "<div class=\"quadro-cel quadro-cel-seta\"><span class=\"referencia-dot\" data-ref-origem=\"" + escaparHTML(referencia) + "\" title=\"" + escaparHTML(traduzir("memory.referenceTitle", { name: nome })) + "\"></span></div>"
	              + "</div>";
	          } else {
	            linhasQuadro += "<div class=\"quadro-linha\">"
	              + "<div class=\"quadro-cel quadro-cel-nome\">" + escaparHTML(nome) + "</div>"
	              + "<div class=\"quadro-cel quadro-cel-tipo\"><span class=\"tipo-chip tipo-chip-primitivo\">" + escaparHTML(normalizarTipoPython(info.tipo || "var")) + "</span></div>"
	              + "<div class=\"quadro-cel quadro-cel-valor\">" + escaparHTML(info.repr) + "</div>"
	              + "</div>";
	          }
	        }

	        const nomeEscopo = quadro.escopo === "Global" ? traduzir("scope.global") : (quadro.escopo || traduzir("scope.global"));
	        paineisQuadros.push("<div class=\"painel-memoria\">"
	          + "<div class=\"painel-titulo\">" + escaparHTML(nomeEscopo) + "</div>"
	          + "<div class=\"quadro\">"
	          + "<div class=\"quadro-titulo\">" + escaparHTML(traduzir("memory.variables")) + "</div>"
	          + "<div class=\"quadro-linhas\">"
	          + (linhasQuadro || "<div class=\"quadro-linha\"><div class=\"quadro-cel\"><span class=\"empty\">" + escaparHTML(traduzir("memory.emptyShort")) + "</span></div></div>")
	          + "</div></div></div>");
	      }

	      if (importacoes.every(({ info }) => Number.isInteger(info.ordem_importacao))) {
	        importacoes.sort((a, b) =>
	          a.info.ordem_importacao - b.info.ordem_importacao || a.indice - b.indice
	        );
	      }

      let objetosHTML = "";
      for (const { nome, info, referencia } of objetosPorReferencia.values()) {
        let corpo = "";
	        const tipoPython = normalizarTipoPython(info.tipo);
        if (tipoPython === "list" || tipoPython === "tuple") {
          corpo = info.elementos.map((e, i) =>
            "<div class=\"objeto-item\"><span class=\"objeto-item-idx\">" + i + "</span>" + renderizarValorTipado(e) + "</div>"
          ).join("");
        } else if (tipoPython === "set") {
          corpo = info.elementos.map(e =>
            "<div class=\"objeto-item\">" + renderizarValorTipado(e) + "</div>"
          ).join("");
        } else if (tipoPython === "dict") {
          corpo = paresDicionario(info).map(({ chave, valor }) =>
            "<div class=\"objeto-dict-par\"><span class=\"objeto-dict-chave\">" + escaparHTML(normalizarItemObjeto(chave).repr) + "</span><span>:</span><span class=\"objeto-valor-tipado\">" + renderizarValorTipado(valor) + "</span></div>"
          ).join("");
        } else if (info.atributos) {
          corpo = atributosObjeto(info).map(({ nome: atributo, valor }) =>
            "<div class=\"objeto-dict-par\"><span class=\"objeto-dict-chave\">" + escaparHTML(atributo) + "</span><span>=</span><span class=\"objeto-valor-tipado\">" + renderizarValorTipado(valor) + "</span></div>"
          ).join("");
        }
        if (info.truncado) {
          corpo += "<div class=\"objeto-item\">...</div>";
        }
	        const classeVisual = ["list", "tuple", "set", "dict"].includes(tipoPython)
	          ? "objeto-tipo-" + tipoPython
	          : "objeto-tipo-classe";
	        objetosHTML += "<div class=\"objeto-card " + classeVisual + "\" data-ref-destino=\"" + escaparHTML(referencia) + "\">"
	          + "<div class=\"objeto-titulo\">" + escaparHTML(nome) + " — " + escaparHTML(tipoPython) + "</div>"
	          + "<div class=\"objeto-corpo\">" + (corpo || "<span class=\"empty\">" + escaparHTML(traduzir("memory.objectEmpty")) + "</span>") + "</div>"
	          + "</div>";
	      }

	      const painelObjetos = objetosHTML
	        ? "<div class=\"painel-memoria\">"
	          + "<div class=\"painel-titulo\">" + escaparHTML(traduzir("memory.objects")) + "</div>"
	          + objetosHTML
	          + "</div>"
	        : "";
	      const painelFuncoes = funcoes.length > 0
	        ? "<div class=\"painel-memoria\">"
	          + "<div class=\"painel-titulo painel-titulo-reserva\" aria-hidden=\"true\">&nbsp;</div>"
	          + renderizarQuadroFuncoes(funcoes, traduzir("memory.noFunctions"))
	          + "</div>"
	        : "";
	      const painelClasses = classes.length > 0
	        ? "<div class=\"painel-memoria\">"
	          + "<div class=\"painel-titulo painel-titulo-reserva\" aria-hidden=\"true\">&nbsp;</div>"
	          + renderizarQuadroClasses(classes, traduzir("memory.noClasses"))
	          + "</div>"
	        : "";
	      const painelImportacoes = importacoes.length > 0
	        ? "<div class=\"painel-memoria\">"
	          + "<div class=\"painel-titulo painel-titulo-reserva\" aria-hidden=\"true\">&nbsp;</div>"
	          + renderizarQuadroImportacoes(importacoes, traduzir("memory.noImports"))
	          + "</div>"
	        : "";

	      return "<div class=\"memoria-bloco\">"
	        + "<div class=\"memoria-topo\">"
	        + "<div class=\"section-label\">" + escaparHTML(traduzir("memory.title")) + "</div>"
	        + "<div class=\"memoria-subtitulo\">" + escaparHTML(traduzir("memory.subtitle")) + "</div>"
	        + "</div>"
        + "<div class=\"memoria-diagrama\">"
        + "<svg class=\"memoria-setas\" id=\"memoria-setas\" aria-hidden=\"true\"></svg>"
        + "<div class=\"memoria-container\">" + paineisQuadros.join("") + painelObjetos + painelFuncoes + painelClasses + painelImportacoes + "</div>"
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
	      document.getElementById("saida-card").style.display = "block";
	      document.getElementById("pilha-card").style.display = "block";
	      document.getElementById("saida-corpo").innerHTML = "<p class=\"empty\">" + escaparHTML(traduzir("run.executing")) + "</p>";
	      document.getElementById("saida-programa-corpo").innerHTML = "<p class=\"empty\">" + escaparHTML(traduzir("run.executing")) + "</p>";
	      document.getElementById("pilha-corpo").innerHTML = "<p class=\"empty\">" + escaparHTML(traduzir("run.executing")) + "</p>";
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
	          document.getElementById("saida-programa-corpo").innerHTML = "<p class=\"empty\">" + escaparHTML(traduzir("output.none")) + "</p>";
	          document.getElementById("pilha-corpo").innerHTML = "<p class=\"empty\">" + escaparHTML(traduzir("stack.empty")) + "</p>";
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
	        document.getElementById("saida-programa-corpo").innerHTML =
	          "<p class=\"empty\">" + escaparHTML(traduzir("output.none")) + "</p>";
	        document.getElementById("pilha-corpo").innerHTML =
	          "<p class=\"empty\">" + escaparHTML(traduzir("stack.empty")) + "</p>";
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
	      if (passoAtual && (passoAtual.evento === "return" || passoAtual.evento === "exception") && Number.isInteger(passoAtual.linha)) {
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
	      if (passoAtual && passoAtual.evento === "exception") {
	        for (let i = indiceAtual + 1; i < passos.length; i++) {
	          if (passos[i].evento === "line" && Number.isInteger(passos[i].linha)) {
	            return passos[i].linha - 1;
	          }
	          if (passos[i].erro) break;
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

	    function montarTerminalSaida(saida, chaveVazio) {
	      const conteudo = saida && String(saida).trim()
	        ? escaparHTML(saida)
	        : "<span class=\"empty\">" + escaparHTML(traduzir(chaveVazio)) + "</span>";
	      return "<div class=\"terminal\">"
	        + "<div class=\"terminal-header\">"
	        + "<div class=\"terminal-dot vermelho\"></div>"
	        + "<div class=\"terminal-dot amarelo\"></div>"
	        + "<div class=\"terminal-dot verde\"></div>"
	        + "<span class=\"terminal-label\"><i class=\"fa-solid fa-terminal\"></i>" + escaparHTML(traduzir("output.label")) + "</span></div>"
	        + "<div class=\"terminal-body\">" + conteudo + "</div></div>";
	    }

	    function montarTerminalSaidaErro(saidaErro) {
	      if (!saidaErro || !String(saidaErro).trim()) return "";
	      return "<div class=\"terminal terminal-erro\" role=\"alert\">"
	        + "<div class=\"terminal-header\">"
	        + "<div class=\"terminal-dot vermelho\"></div>"
	        + "<span class=\"terminal-label\"><i class=\"fa-solid fa-triangle-exclamation\"></i>" + escaparHTML(traduzir("output.errorLabel")) + "</span></div>"
	        + "<div class=\"terminal-body\">" + escaparHTML(saidaErro) + "</div></div>";
	    }

    function renderizarPasso() {
      if (passos.length === 0) return;
      const p = passos[indiceAtual];
      const corpo = document.getElementById("saida-corpo");
	      const corpoSaida = document.getElementById("saida-programa-corpo");
	      const corpoPilha = document.getElementById("pilha-corpo");
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
	        corpo.innerHTML = montarCaixaErro(p.erro);
	        corpoSaida.innerHTML = "<div class=\"section-label\">" + escaparHTML(traduzir("output.errorUntil")) + "</div>"
	          + montarTerminalSaida(p.saida, "output.none")
	          + montarTerminalSaidaErro(p.saida_erro);
	        corpoPilha.innerHTML = renderizarPilhaChamadas(p.pilha_chamadas);
	        requestAnimationFrame(desenharSetasMemoria);
	        return;
	      }

	      const etapaTexto = p.evento === "fim" ? traduzir("state.finished") : (p.evento === "input_pendente" ? traduzir("state.waitingInput") : (p.evento === "return" ? traduzir("state.return") : traduzir("state.running")));

	      corpo.innerHTML =
	        "<div class=\"passo-info\">"
	        + escaparHTML(etapaTexto)
	        + "<span class=\"linha-badge executada\"><i class=\"fa-solid fa-check\"></i>" + escaparHTML(traduzir("status.executed")) + ": " + textoExecutada + "</span>"
	        + "<span class=\"linha-badge proxima\"><i class=\"fa-solid fa-arrow-right\"></i>" + escaparHTML(traduzir("status.running")) + ": " + textoProxima + "</span>"
	        + "<span class=\"escopo-badge\">" + escaparHTML(escopo) + "</span>"
	        + "</div>"
	        + renderizarMemoria(p.variaveis, p.quadros_memoria);
	      corpoSaida.innerHTML = montarTerminalSaida(p.saida, "output.noPrint")
	        + montarTerminalSaidaErro(p.saida_erro)
	        + (p.erro_ocorrido
	          ? montarCaixaErro(p.erro_ocorrido, "erro-saida")
	          : "");
	      corpoPilha.innerHTML = renderizarPilhaChamadas(p.pilha_chamadas);
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
