const i18n = {
  pt: {
    title: "PythonVisual",
    "app.subtitle": "Analise a execução do seu código Python passo a passo",
    "nav.home": "Home",
    "nav.visualizer": "Visualizador",
    "nav.about": "Sobre",
    "nav.limitations": "Limitações",
    "editor.shortcutsPlaceholder":
      "Atalhos PythonVisual\n\n→ ou Espaço: próximo passo\n←: passo anterior\nHome: início\nEnd: fim\nCtrl + Enter: executar\nEsc: focar o editor\nR: executar, quando não estiver digitando\nC: limpar, quando não estiver digitando",
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
    "examples.fibonacci": "Fibonacci",
    "examples.list": "Manipulação de lista",
    "examples.dictionary": "Dicionário",
    "examples.tuple": "Tupla",
    "examples.input": "Entrada com input()",
    "examples.bhaskara": "Fórmula de Bhaskara",
    "examples.class": "Classe e objeto",
    "examples.tryExcept": "Try/except",
    "examples.bubbleSort": "Bubble Sort",
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
    "error.guidance.tab":
      "Use apenas espaços ou apenas tabulações para indentar o bloco. O recomendado é substituir cada tabulação por 4 espaços e manter o mesmo padrão em todo o código.",
    "error.guidance.indentExpected":
      "A linha indicada inicia um bloco, mas a instrução seguinte não está recuada. Adicione 4 espaços antes das linhas que pertencem ao bloco.",
    "error.guidance.indentUnexpected":
      "A linha indicada possui recuo sem que exista um bloco aberto. Remova os espaços do início da linha ou coloque-a dentro do bloco correto.",
    "error.guidance.indentMismatch":
      "O recuo desta linha não corresponde ao nível das linhas anteriores. Alinhe-a com o bloco ao qual ela pertence e use 4 espaços por nível.",
    "error.guidance.indentation":
      "Revise o recuo da linha indicada e das linhas próximas. Use 4 espaços por nível e mantenha todas as instruções do mesmo bloco alinhadas.",
    "error.guidance.stringLiteral":
      "A string foi iniciada, mas não foi encerrada. Adicione a mesma aspa usada no início ao final do texto.",
    "error.guidance.decimalLiteral":
      "Um número contém letras ou outros caracteres inválidos. Remova esses caracteres ou coloque todo o valor entre aspas se ele deveria ser um texto.",
    "error.guidance.delimiter":
      "Há um parêntese, colchete ou chave sem fechamento ou fora de ordem. Confira os delimitadores da linha indicada e feche cada abertura com o símbolo correspondente.",
    "error.guidance.colon":
      "A instrução precisa terminar com dois-pontos (:). Adicione o sinal ao final da linha indicada.",
    "error.guidance.returnOutside":
      "O comando return só pode ser usado dentro de uma função. Mova esta linha para o bloco de uma função ou retire o return.",
    "error.guidance.loopControlOutside":
      "Esse comando só pode ser usado dentro de um laço for ou while. Mova-o para dentro do laço correspondente.",
    "error.guidance.assignment":
      "O lado esquerdo do sinal de igual deve ser uma variável, atributo ou posição válida. Revise o alvo que receberá o valor.",
    "error.guidance.syntax":
      "Revise a linha indicada e a linha anterior. Procure sinais ausentes ou extras, como dois-pontos, vírgulas, aspas, parênteses, colchetes e operadores.",
    "error.guidance.name":
      "A variável ou função {name} ainda não foi definida. Verifique a escrita do nome e garanta que ela seja criada antes desta linha e esteja acessível neste escopo.",
    "error.guidance.nameGeneric":
      "Uma variável ou função foi usada antes de ser definida. Verifique a escrita do nome, a ordem das instruções e o escopo em que ela foi criada.",
    "error.guidance.unboundLocal":
      "A variável local {name} está sendo lida antes de receber um valor nesta função. Faça a atribuição antes do uso ou revise se deveria usar uma variável de outro escopo.",
    "error.guidance.typeConcat":
      "Os valores concatenados têm tipos diferentes. Converta-os para o mesmo tipo, por exemplo com str(), int() ou float(), antes de usar o operador +.",
    "error.guidance.typeOperands":
      "O operador usado não aceita esses tipos de valores. Verifique os operandos e converta-os para tipos compatíveis antes da operação.",
    "error.guidance.notCallable":
      "O valor foi usado como se fosse uma função. Remova os parênteses da chamada ou verifique se o nome da função foi substituído por outro valor.",
    "error.guidance.arguments":
      "A chamada recebeu uma quantidade ou um formato incorreto de argumentos. Compare a chamada com os parâmetros definidos pela função.",
    "error.guidance.type":
      "A operação recebeu um tipo de valor incompatível. Confira os tipos envolvidos e faça a conversão necessária antes de executar a operação.",
    "error.guidance.intValue":
      "O valor {value} não representa um número inteiro válido. Remova letras e símbolos indevidos ou trate a entrada antes de passá-la para int().",
    "error.guidance.unpack":
      "A quantidade de valores não corresponde à quantidade de variáveis. Ajuste um dos lados da atribuição para que ambos tenham o mesmo número de elementos.",
    "error.guidance.mathDomain":
      "O valor está fora do domínio aceito pela função matemática. Verifique quais entradas a função permite antes de chamá-la.",
    "error.guidance.value":
      "O tipo do valor é aceito, mas seu conteúdo não é válido para essa operação. Confira o formato e os valores permitidos antes de tentar novamente.",
    "error.guidance.zeroDivision":
      "O divisor resultou em zero. Verifique seu valor antes da divisão e trate o caso em que ele seja igual a 0.",
    "error.guidance.index":
      "A posição acessada não existe na sequência. Lembre-se de que os índices começam em 0 e devem ser menores que a quantidade de elementos.",
    "error.guidance.key":
      "A chave {key} não existe no dicionário. Confira sua escrita ou verifique a existência da chave antes do acesso com o operador in ou com get().",
    "error.guidance.attribute":
      "Objetos do tipo {type} não possuem o atributo ou método {attribute}. Confira o tipo do objeto e a escrita do nome utilizado.",
    "error.guidance.moduleNotFound":
      "O módulo {module} não foi encontrado. Confira o nome informado e verifique se o pacote está instalado e disponível no ambiente.",
    "error.guidance.import":
      "O módulo foi encontrado, mas o item solicitado não está disponível nele. Confira o nome importado e a documentação do módulo.",
    "error.guidance.fileNotFound":
      "O arquivo ou diretório não foi encontrado. Confira o caminho, o nome e se o arquivo existe antes de tentar abri-lo.",
    "error.guidance.permission":
      "O programa não tem permissão para acessar esse recurso. Verifique o caminho escolhido e as permissões do arquivo ou diretório.",
    "error.guidance.recursion":
      "A função chamou a si mesma vezes demais. Revise a condição de parada e garanta que cada chamada se aproxime dela.",
    "error.guidance.assertion":
      "Uma condição verificada por assert resultou em falso. Confira a condição e os valores usados naquele ponto do programa.",
    "error.guidance.overflow":
      "O resultado numérico ficou grande demais para essa operação. Revise os valores e considere uma forma de cálculo que evite esse crescimento.",
    "error.guidance.eof":
      "O programa tentou ler uma entrada que não foi fornecida. Garanta que cada chamada de leitura receba um valor.",
    "error.guidance.memory":
      "A operação tentou usar mais memória do que o ambiente permite. Reduza o tamanho das estruturas ou processe os dados em partes menores.",
    "error.guidance.timeout":
      "A execução demorou mais do que o limite permitido. Verifique laços infinitos, condições que nunca se tornam falsas ou operações excessivamente longas.",
    "error.guidance.stepLimit":
      "O código gerou passos demais. Revise principalmente as condições dos laços e da recursão para garantir que a execução termine.",
    "error.guidance.internal":
      "O executor encontrou uma falha interna. Tente executar novamente; se o problema continuar, simplifique o exemplo e informe o erro ao responsável pelo sistema.",
    "error.guidance.generic":
      "Leia a mensagem técnica, localize a linha indicada e confira os valores e a instrução usados nela. Corrija esse ponto e execute o código novamente.",
    "line.empty": "(linha vazia)",
    "line.finishedExplain":
      "Execução finalizada. Não há uma próxima linha de código para explicar neste passo.",
    "marker.running": "Linha em execução",
    "marker.executed": "Linha executada",
    "stack.title": "Pilha de chamadas",
    "stack.subtitle":
      "Mostra a sequência dinâmica de funções ativas neste passo.",
    "stack.currentScope": "escopo atual",
    "stack.empty": "Nenhuma função ativa além do escopo global neste passo.",
    "stack.calls": "chama",
    "stack.returns": "retorna",
    "memory.title": "Memória",
    "memory.empty": "Nenhum dado armazenado neste passo.",
    "memory.frames": "Quadros de memória",
    "memory.variablesGlobal": "Variáveis globais",
    "memory.variablesLocal": "Variáveis locais - {name}",
    "memory.emptyShort": "Vazio",
    "memory.objects": "Objetos na memória",
    "memory.noObjects": "Nenhum objeto neste passo.",
    "memory.functions": "Funções",
    "memory.noFunctions": "Nenhuma função definida neste passo.",
    "memory.method": "método",
    "memory.classes": "Classes",
    "memory.noClasses": "Nenhuma classe definida neste passo.",
    "memory.imports": "Importações",
    "memory.noImports": "Nenhuma importação neste passo.",
    "memory.importModule": "módulo importado",
    "memory.importFunction": "função importada de {module}",
    "memory.importClass": "classe importada de {module}",
    "memory.importItem": "item importado de {module}",
    "memory.subtitle":
      "Quadros, objetos, funções, classes e importações separados por categoria.",
    "memory.referenceTitle": "Referência para o objeto {name}",
    "memory.objectEmpty": "vazio",
    "type.list": "list",
    "type.tuple": "tuple",
    "type.set": "set",
    "type.dict": "dict",
    "explain.empty":
      "Esta linha está vazia. Ela apenas separa visualmente partes do código.",
    "explain.comment":
      "Comentário: serve para documentar o código e não é executado pelo Python.",
    "explain.multilineComment":
      "Bloco de texto delimitado por aspas triplas. Quando está isolado, costuma ser usado como comentário de múltiplas linhas; tecnicamente, o Python o trata como uma string. No início de um módulo, função ou classe, ele pode ser uma docstring.",
    "explain.def":
      "Define uma função. O bloco indentado abaixo só será executado quando essa função for chamada.",
    "explain.class":
      "Define uma classe, que funciona como um modelo para criar objetos.",
    "explain.return":
      "Retorna um valor para quem chamou a função e encerra aquela chamada.",
    "explain.if":
      "Testa uma condição. Se ela for verdadeira, o Python executa o bloco indentado abaixo.",
    "explain.elif":
      "Testa uma nova condição quando os testes anteriores do mesmo if não foram verdadeiros.",
    "explain.else":
      "Executa este bloco quando nenhuma condição anterior do mesmo if foi verdadeira.",
    "explain.for":
      "Inicia uma repetição. A variável do laço recebe um valor por vez da sequência percorrida.",
    "explain.while": "Repete o bloco enquanto a condição continuar verdadeira.",
    "explain.try":
      "Tenta executar um bloco que pode gerar erro, permitindo tratar esse erro depois.",
    "explain.except": "Trata um erro ocorrido dentro do bloco try.",
    "explain.finally": "Executa este bloco no final do try, com ou sem erro.",
    "explain.import":
      "Carrega recursos de outro módulo para usar neste código.",
    "explain.print": "Mostra uma informação na saída do programa.",
    "explain.input":
      "Solicita uma entrada do usuário. A execução pausa até o valor ser informado.",
    "explain.break": "Interrompe o laço atual imediatamente.",
    "explain.continue":
      "Pula o restante do bloco atual e avança para a próxima repetição do laço.",
    "explain.pass":
      "Não executa nenhuma ação. É usado como espaço reservado em blocos ainda vazios.",
    "explain.raise": "Dispara um erro manualmente.",
    "explain.method":
      "Chama um método de um objeto, alterando ou consultando esse objeto.",
    "explain.call":
      "Chama uma função, transferindo a execução para o bloco definido por ela.",
    "explain.update": "Atualiza uma variável usando o valor que ela já tinha.",
    "explain.assign":
      "Atribui um valor a uma variável, guardando essa informação na memória.",
    "explain.generic":
      "Executa uma instrução Python. Observe as variáveis, a pilha e a saída para ver o efeito deste passo.",
  },
  en: {
    title: "PythonVisual",
    "app.subtitle": "Analyze your Python code execution step by step",
    "nav.home": "Home",
    "nav.visualizer": "Visualizer",
    "nav.about": "About",
    "nav.limitations": "Limitations",
    "editor.shortcutsPlaceholder":
      "PythonVisual shortcuts\n\n→ or Space: next step\n←: previous step\nHome: start\nEnd: end\nCtrl + Enter: run\nEsc: focus the editor\nR: run, when not typing\nC: clear, when not typing",
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
    "examples.fibonacci": "Fibonacci",
    "examples.list": "List manipulation",
    "examples.dictionary": "Dictionary",
    "examples.tuple": "Tuple",
    "examples.input": "Input with input()",
    "examples.bhaskara": "Quadratic formula",
    "examples.class": "Class and object",
    "examples.tryExcept": "Try/except",
    "examples.bubbleSort": "Bubble sort",
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
    "error.guidance.tab":
      "Use only spaces or only tabs to indent the block. The recommended approach is to replace each tab with 4 spaces and keep the same pattern throughout the code.",
    "error.guidance.indentExpected":
      "The indicated line starts a block, but the next statement is not indented. Add 4 spaces before the lines that belong to the block.",
    "error.guidance.indentUnexpected":
      "The indicated line is indented without an open block. Remove the spaces at the beginning of the line or place it inside the correct block.",
    "error.guidance.indentMismatch":
      "This line's indentation does not match the previous levels. Align it with the block it belongs to and use 4 spaces per level.",
    "error.guidance.indentation":
      "Review the indentation of the indicated line and nearby lines. Use 4 spaces per level and align every statement in the same block.",
    "error.guidance.stringLiteral":
      "The string was started but not closed. Add the same quote used at the beginning to the end of the text.",
    "error.guidance.decimalLiteral":
      "A number contains letters or other invalid characters. Remove them, or put the entire value in quotes if it should be text.",
    "error.guidance.delimiter":
      "A parenthesis, bracket, or brace is unclosed or out of order. Check the delimiters on the indicated line and close each opening symbol with its matching symbol.",
    "error.guidance.colon":
      "The statement must end with a colon (:). Add it to the end of the indicated line.",
    "error.guidance.returnOutside":
      "The return statement can only be used inside a function. Move this line into a function block or remove return.",
    "error.guidance.loopControlOutside":
      "This statement can only be used inside a for or while loop. Move it into the corresponding loop.",
    "error.guidance.assignment":
      "The left side of the equals sign must be a valid variable, attribute, or position. Review the target that should receive the value.",
    "error.guidance.syntax":
      "Review the indicated line and the line before it. Look for missing or extra symbols such as colons, commas, quotes, parentheses, brackets, and operators.",
    "error.guidance.name":
      "The variable or function {name} has not been defined yet. Check its spelling and make sure it is created before this line and is available in this scope.",
    "error.guidance.nameGeneric":
      "A variable or function was used before being defined. Check its spelling, statement order, and the scope where it was created.",
    "error.guidance.unboundLocal":
      "The local variable {name} is being read before receiving a value in this function. Assign it before use or review whether a variable from another scope was intended.",
    "error.guidance.typeConcat":
      "The concatenated values have different types. Convert them to the same type, for example with str(), int(), or float(), before using +.",
    "error.guidance.typeOperands":
      "The operator does not accept these value types. Check the operands and convert them to compatible types before the operation.",
    "error.guidance.notCallable":
      "The value was used as if it were a function. Remove the call parentheses or check whether the function name was replaced by another value.",
    "error.guidance.arguments":
      "The call received an incorrect number or format of arguments. Compare the call with the parameters defined by the function.",
    "error.guidance.type":
      "The operation received an incompatible value type. Check the types involved and perform the required conversion first.",
    "error.guidance.intValue":
      "The value {value} is not a valid integer. Remove invalid letters and symbols or validate the input before passing it to int().",
    "error.guidance.unpack":
      "The number of values does not match the number of variables. Adjust one side of the assignment so both have the same number of elements.",
    "error.guidance.mathDomain":
      "The value is outside the mathematical function's accepted domain. Check which inputs the function allows before calling it.",
    "error.guidance.value":
      "The value type is accepted, but its contents are not valid for this operation. Check the expected format and allowed values.",
    "error.guidance.zeroDivision":
      "The divisor evaluated to zero. Check its value before dividing and handle the case where it equals 0.",
    "error.guidance.index":
      "The requested position does not exist in the sequence. Remember that indexes start at 0 and must be smaller than the number of elements.",
    "error.guidance.key":
      "The key {key} does not exist in the dictionary. Check its spelling or verify it before access with the in operator or get().",
    "error.guidance.attribute":
      "Objects of type {type} do not have the attribute or method {attribute}. Check the object's type and the spelling of the name.",
    "error.guidance.moduleNotFound":
      "The module {module} was not found. Check its name and make sure the package is installed and available in the environment.",
    "error.guidance.import":
      "The module was found, but the requested item is not available in it. Check the imported name and the module documentation.",
    "error.guidance.fileNotFound":
      "The file or directory was not found. Check the path, its name, and whether it exists before opening it.",
    "error.guidance.permission":
      "The program does not have permission to access this resource. Check the selected path and the file or directory permissions.",
    "error.guidance.recursion":
      "The function called itself too many times. Review the stopping condition and make sure each call moves closer to it.",
    "error.guidance.assertion":
      "A condition checked by assert evaluated to false. Review the condition and the values used at that point.",
    "error.guidance.overflow":
      "The numeric result became too large for this operation. Review the values and consider a calculation that avoids this growth.",
    "error.guidance.eof":
      "The program tried to read input that was not provided. Make sure every input operation receives a value.",
    "error.guidance.memory":
      "The operation tried to use more memory than the environment allows. Reduce structure sizes or process the data in smaller parts.",
    "error.guidance.timeout":
      "Execution took longer than the allowed limit. Check for infinite loops, conditions that never become false, or excessively long operations.",
    "error.guidance.stepLimit":
      "The code generated too many steps. Review loop and recursion conditions to make sure execution ends.",
    "error.guidance.internal":
      "The executor encountered an internal failure. Try again; if it continues, simplify the example and report the error to the system maintainer.",
    "error.guidance.generic":
      "Read the technical message, locate the indicated line, and check the values and statement used there. Correct that point and run the code again.",
    "line.empty": "(empty line)",
    "line.finishedExplain":
      "Execution finished. There is no next line of code to explain in this step.",
    "marker.running": "Running line",
    "marker.executed": "Executed line",
    "stack.title": "Call stack",
    "stack.subtitle":
      "Shows the dynamic sequence of active functions in this step.",
    "stack.currentScope": "current scope",
    "stack.empty":
      "No function is active beyond the global scope in this step.",
    "stack.calls": "calls",
    "stack.returns": "returns",
    "memory.title": "Memory",
    "memory.empty": "No data stored in this step.",
    "memory.frames": "Memory frames",
    "memory.variablesGlobal": "Global variables",
    "memory.variablesLocal": "Local variables - {name}",
    "memory.emptyShort": "Empty",
    "memory.objects": "Objects in memory",
    "memory.noObjects": "No object in this step.",
    "memory.functions": "Functions",
    "memory.noFunctions": "No function defined in this step.",
    "memory.method": "method",
    "memory.classes": "Classes",
    "memory.noClasses": "No class defined in this step.",
    "memory.imports": "Imports",
    "memory.noImports": "No import in this step.",
    "memory.importModule": "imported module",
    "memory.importFunction": "function imported from {module}",
    "memory.importClass": "class imported from {module}",
    "memory.importItem": "item imported from {module}",
    "memory.subtitle":
      "Frames, objects, functions, classes, and imports separated by category.",
    "memory.referenceTitle": "Reference to object {name}",
    "memory.objectEmpty": "empty",
    "type.list": "list",
    "type.tuple": "tuple",
    "type.set": "set",
    "type.dict": "dict",
    "explain.empty":
      "This line is empty. It only visually separates parts of the code.",
    "explain.comment":
      "Comment: documents the code and is not executed by Python.",
    "explain.multilineComment":
      "Text block delimited by triple quotes. When it stands alone, it is commonly used as a multiline comment; technically, Python treats it as a string. At the beginning of a module, function, or class, it can be a docstring.",
    "explain.def":
      "Defines a function. The indented block below runs only when this function is called.",
    "explain.class":
      "Defines a class, which works as a template for creating objects.",
    "explain.return":
      "Returns a value to the caller and ends that function call.",
    "explain.if":
      "Tests a condition. If it is true, Python executes the indented block below.",
    "explain.elif":
      "Tests a new condition when previous tests in the same if statement were not true.",
    "explain.else":
      "Runs this block when no previous condition in the same if statement was true.",
    "explain.for":
      "Starts a loop. The loop variable receives one value at a time from the sequence.",
    "explain.while": "Repeats the block while the condition remains true.",
    "explain.try":
      "Tries to run a block that may raise an error, allowing that error to be handled later.",
    "explain.except": "Handles an error raised inside the try block.",
    "explain.finally":
      "Runs this block at the end of the try statement, with or without an error.",
    "explain.import":
      "Loads resources from another module to use in this code.",
    "explain.print": "Shows information in the program output.",
    "explain.input":
      "Requests user input. Execution pauses until the value is provided.",
    "explain.break": "Stops the current loop immediately.",
    "explain.continue":
      "Skips the rest of the current block and moves to the next loop iteration.",
    "explain.pass":
      "Does nothing. It is used as a placeholder in blocks that are still empty.",
    "explain.raise": "Raises an error manually.",
    "explain.method":
      "Calls an object method, changing or checking that object.",
    "explain.call":
      "Calls a function, transferring execution to the block defined by it.",
    "explain.update": "Updates a variable using the value it already had.",
    "explain.assign":
      "Assigns a value to a variable, storing that information in memory.",
    "explain.generic":
      "Runs a Python statement. Watch the variables, stack, and output to see this step's effect.",
  },
};

let currentLang = localStorage.getItem("pythonvisual_lang") || "pt";
if (!i18n[currentLang])
  currentLang = "pt";

export function traduzir(chave, valores = {}) {
  const base = i18n[currentLang] || i18n.pt;
  let texto = base[chave] || i18n.pt[chave] || chave;
  for (const [nome, valor] of Object.entries(valores)) {
    texto = texto.replaceAll("{" + nome + "}", String(valor));
  }
  return texto;
}

export function obterIdioma() {
  return currentLang;
}

export function definirIdioma(lang) {
  currentLang = i18n[lang] ? lang : "pt";
  localStorage.setItem("pythonvisual_lang", currentLang);
  return currentLang;
}
