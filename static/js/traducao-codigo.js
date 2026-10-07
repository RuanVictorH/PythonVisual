// Tradução de uma linha de código Python para linguagem simples, usada na
// dica que aparece ao passar o mouse sobre o editor. Módulo puro: não usa o
// DOM e não importa nada, então pode ser testado fora do navegador.

// Cada idioma tem as palavras trocadas dentro das expressões, as frases de cada
// instrução ({campo} marca onde entra o trecho do código), as frases das
// atribuições aumentadas (+=, -=, ...) e as frases dos métodos de lista e de
// dicionário chamados como instrução (notas.append(5.5)). Em inglês as palavras
// não mudam, porque o código já está em inglês.
const TABELAS = {
  pt: {
    // só valem quando seguidas de "(": print vira escreva, mas "print" sozinho não
    funcoes: {
      input: "leia",
      print: "escreva",
      range: "intervalo",
      len: "tamanho",
      int: "inteiro",
      float: "real",
      str: "texto",
      round: "arredonda",
      max: "maior",
      min: "menor",
      sum: "soma",
      abs: "absoluto",
      sorted: "ordenado",
      reversed: "invertido",
      list: "lista",
      tuple: "tupla",
      dict: "dicionário",
      set: "conjunto",
      bool: "lógico",
      type: "tipo",
      enumerate: "enumera",
      zip: "combina",
      pow: "potência",
    },
    palavras: {
      and: "e",
      or: "ou",
      not: "não",
      in: "está em",
      is: "é",
      "is not": "não é",
      for: "para",
      if: "se",
      else: "senão",
      lambda: "função anônima",
      True: "Verdadeiro",
      False: "Falso",
      None: "Nulo",
    },
    // o "in" de um laço (for x in lista) não é um teste de pertinência
    palavrasDeLaco: {
      in: "em",
    },
    e: "e",
    frases: {
      comentario: "comentário: {texto}",
      se: "se {condicao} então",
      senaoSe: "senão se {condicao} então",
      senao: "senão",
      para: "para {laco} faça",
      enquanto: "enquanto {condicao} faça",
      com: "usando {contexto} faça",
      definaFuncao: "defina a função {assinatura}",
      definaClasse: "defina a classe {nome}",
      definaClasseHerda: "defina a classe {nome}, que herda de {bases}",
      retorne: "retorne {valor}",
      retorneVazio: "retorne",
      entregue: "entregue {valor}",
      entregueVazio: "entregue",
      interrompa: "interrompa o laço",
      proximaRepeticao: "vá para a próxima repetição",
      nadaAFazer: "não faça nada",
      tente: "tente",
      erro: "se ocorrer o erro {tipo}",
      erroGuardado: "se ocorrer o erro {tipo} (guardado em {nome})",
      qualquerErro: "se ocorrer qualquer erro",
      finalmente: "ao final, de qualquer forma",
      gereErro: "gere o erro {erro}",
      gereErroDe: "gere o erro {erro}, causado por {causa}",
      propagueErro: "propague o erro",
      garanta: "garanta que {condicao}",
      garantaMensagem: "garanta que {condicao} (se falhar, mostre {mensagem})",
      apague: "apague {alvo}",
      declareGlobal: "declare {nomes} como global",
      declareNaoLocal: "declare {nomes} como variável da função externa",
      decorador: "aplique o decorador {nome}",
      importe: "importe o módulo {modulo}",
      importeComo: "importe o módulo {modulo} com o nome {apelido}",
      importeVarios: "importe os módulos {modulos}",
      importeDe: "importe {itens} do módulo {modulo}",
      importeTudo: "importe tudo do módulo {modulo}",
      como: "como",
      comONome: "com o nome",
      recebe: "{alvo} recebe {valor}",
      recebemTodos: "{alvos} recebem {valor}",
      chame: "chame {chamada}",
    },
    aumentadas: {
      "+": "{alvo} aumenta em {valor}",
      "-": "{alvo} diminui em {valor}",
      "*": "{alvo} é multiplicado por {valor}",
      "/": "{alvo} é dividido por {valor}",
      "//": "{alvo} é dividido por {valor} (divisão inteira)",
      "%": "{alvo} recebe o resto da divisão de {alvo} por {valor}",
      "**": "{alvo} é elevado a {valor}",
    },
    // frase de cada método, pela quantidade de argumentos ({obj} é o objeto e
    // {1}, {2}... são os argumentos)
    metodos: {
      append: { 1: "adicione {1} ao fim de {obj}" },
      extend: { 1: "adicione os itens de {1} ao fim de {obj}" },
      insert: { 2: "insira {2} em {obj} na posição {1}" },
      remove: { 1: "remova {1} de {obj}" },
      pop: {
        0: "remova o último item de {obj}",
        1: "remova o item da posição {1} de {obj}",
      },
      sort: { 0: "ordene {obj}" },
      reverse: { 0: "inverta a ordem de {obj}" },
      clear: { 0: "esvazie {obj}" },
      update: { 1: "atualize {obj} com {1}" },
    },
  },
  en: {
    funcoes: {},
    palavras: {},
    palavrasDeLaco: {},
    e: "and",
    frases: {
      comentario: "comment: {texto}",
      se: "if {condicao} then",
      senaoSe: "otherwise, if {condicao} then",
      senao: "otherwise",
      para: "for {laco} do",
      enquanto: "while {condicao} do",
      com: "with {contexto} do",
      definaFuncao: "define the function {assinatura}",
      definaClasse: "define the class {nome}",
      definaClasseHerda: "define the class {nome}, which inherits from {bases}",
      retorne: "return {valor}",
      retorneVazio: "return",
      entregue: "yield {valor}",
      entregueVazio: "yield",
      interrompa: "stop the loop",
      proximaRepeticao: "go to the next repetition",
      nadaAFazer: "do nothing",
      tente: "try",
      erro: "if the error {tipo} happens",
      erroGuardado: "if the error {tipo} happens (saved as {nome})",
      qualquerErro: "if any error happens",
      finalmente: "at the end, no matter what",
      gereErro: "raise the error {erro}",
      gereErroDe: "raise the error {erro}, caused by {causa}",
      propagueErro: "pass the error on",
      garanta: "make sure that {condicao}",
      garantaMensagem: "make sure that {condicao} (if it fails, show {mensagem})",
      apague: "delete {alvo}",
      declareGlobal: "declare {nomes} as global",
      declareNaoLocal: "declare {nomes} as a variable of the outer function",
      decorador: "apply the decorator {nome}",
      importe: "import the module {modulo}",
      importeComo: "import the module {modulo} as {apelido}",
      importeVarios: "import the modules {modulos}",
      importeDe: "import {itens} from the module {modulo}",
      importeTudo: "import everything from the module {modulo}",
      como: "as",
      comONome: "as",
      recebe: "{alvo} receives {valor}",
      recebemTodos: "{alvos} receive {valor}",
      chame: "call {chamada}",
    },
    aumentadas: {
      "+": "{alvo} increases by {valor}",
      "-": "{alvo} decreases by {valor}",
      "*": "{alvo} is multiplied by {valor}",
      "/": "{alvo} is divided by {valor}",
      "//": "{alvo} is divided by {valor} (whole division)",
      "%": "{alvo} becomes the remainder of {alvo} divided by {valor}",
      "**": "{alvo} is raised to the power {valor}",
    },
    metodos: {
      append: { 1: "add {1} to the end of {obj}" },
      extend: { 1: "add the items of {1} to the end of {obj}" },
      insert: { 2: "insert {2} into {obj} at position {1}" },
      remove: { 1: "remove {1} from {obj}" },
      pop: {
        0: "remove the last item of {obj}",
        1: "remove the item at position {1} of {obj}",
      },
      sort: { 0: "sort {obj}" },
      reverse: { 0: "reverse the order of {obj}" },
      clear: { 0: "empty {obj}" },
      update: { 1: "update {obj} with {1}" },
    },
  },
};

// Funções do próprio Python que a tabela conhece: uma linha que é só uma
// chamada delas (print(...), input()) é traduzida pela troca de palavras, e não
// pela frase genérica "chame ...", nos dois idiomas.
const FUNCOES_EMBUTIDAS = new Set(Object.keys(TABELAS.pt.funcoes));

// Instruções que têm "cabeçalho:" e, às vezes, o corpo na mesma linha.
// `traduzir` indica se o cabeçalho passa pela troca de palavras; `laco` avisa
// que o primeiro "in" é o do laço; `como` troca o "as" por "como"; `heranca`
// reconhece a classe com a lista de classes-base entre parênteses.
const INSTRUCOES_COM_CABECALHO = {
  if: { frase: "se", campo: "condicao", traduzir: true },
  elif: { frase: "senaoSe", campo: "condicao", traduzir: true },
  while: { frase: "enquanto", campo: "condicao", traduzir: true },
  for: { frase: "para", campo: "laco", traduzir: true, laco: true },
  with: { frase: "com", campo: "contexto", traduzir: true, como: true },
  def: { frase: "definaFuncao", campo: "assinatura", traduzir: false },
  class: {
    frase: "definaClasse",
    campo: "nome",
    traduzir: false,
    heranca: true,
  },
};

// Instruções de uma palavra só.
const INSTRUCOES_SIMPLES = {
  break: "interrompa",
  continue: "proximaRepeticao",
  pass: "nadaAFazer",
};

const PRIMEIRA_PALAVRA = /^[\p{L}_][\p{L}\p{N}_]*/u;
const PALAVRA = /[\p{L}_][\p{L}\p{N}_]*/gu;
// Com o grupo de captura, split() devolve as palavras nas posições ímpares.
const DIVISAO_EM_PALAVRAS = /([\p{L}_][\p{L}\p{N}_]*)/u;
// Começo de uma chamada: nome ou objeto.metodo seguido de "(".
const CHAMADA = /^([\p{L}_][\p{L}\p{N}_]*(?:\s*\.\s*[\p{L}_][\p{L}\p{N}_]*)*)\s*\(/u;
const ABRE = "([{";
const FECHA = ")]}";

// Caracteres que, antes de "=", formam outro operador (!=, <=, >=, :=, |=...).
const ANTES_DE_IGUAL_SEM_ATRIBUICAO = "!<>:@&|^";
const OPERADORES_SIMPLES = "+-*/%";

function preencher(modelo, valores) {
  return modelo.replace(/\{(\w+)\}/g, (_, nome) => valores[nome]);
}

// "x", "x e y", "x, y e z".
function juntarLista(itens, tabela) {
  if (itens.length <= 1)
    return itens.join("");

  return (
    itens.slice(0, -1).join(", ") + " " + tabela.e + " " + itens[itens.length - 1]
  );
}

function ehSoEspaco(texto) {
  return typeof texto === "string" && /^\s+$/.test(texto);
}

// Forma usada para saber se a tradução mudou alguma coisa na linha: ignora
// espaços repetidos e os dois-pontos do fim (try: e "try" são o mesmo texto).
function paraComparar(texto) {
  return texto.replace(/\s+/g, " ").trim().replace(/\s*:$/, "");
}

// Devolve o índice logo depois do texto entre aspas que começa em `inicio`.
function acharFimDoTexto(linha, inicio) {
  const aspas = linha[inicio];
  const delimitador = linha.startsWith(aspas.repeat(3), inicio)
    ? aspas.repeat(3)
    : aspas;
  let i = inicio + delimitador.length;

  while (i < linha.length && !linha.startsWith(delimitador, i))
    i += linha[i] === "\\" ? 2 : 1;

  return Math.min(linha.length, i + delimitador.length);
}

// Divide a linha em trechos de código, de texto entre aspas e de comentário.
// Os trechos são contíguos e cobrem a linha inteira.
function segmentar(linha) {
  const trechos = [];
  let inicio = 0;
  let i = 0;

  function fechar(tipo, fim) {
    if (fim > inicio)
      trechos.push({ tipo, inicio, fim });
    inicio = fim;
  }

  while (i < linha.length) {
    const caractere = linha[i];

    if (caractere === "#") {
      fechar("codigo", i);
      fechar("comentario", linha.length);
      break;
    }

    if (caractere === '"' || caractere === "'") {
      fechar("codigo", i);
      i = acharFimDoTexto(linha, i);
      fechar("texto", i);
      continue;
    }

    i++;
  }

  fechar("codigo", linha.length);
  return trechos;
}

// Separa o código do comentário que vem depois de um "#" fora de aspas.
function separarComentario(linha) {
  const comentario = segmentar(linha).find(
    (trecho) => trecho.tipo === "comentario",
  );

  if (!comentario)
    return { codigo: linha, comentario: "" };

  return {
    codigo: linha.slice(0, comentario.inicio),
    comentario: linha.slice(comentario.inicio + 1).trim(),
  };
}

// Profundidade de parênteses, colchetes e chaves de cada caractere do código.
// Caracteres de textos e de comentários recebem -1.
function mapearNiveis(linha) {
  const niveis = new Array(linha.length).fill(-1);
  let profundidade = 0;

  for (const trecho of segmentar(linha)) {
    if (trecho.tipo !== "codigo")
      continue;

    for (let i = trecho.inicio; i < trecho.fim; i++) {
      const caractere = linha[i];

      if (ABRE.includes(caractere)) {
        niveis[i] = profundidade;
        profundidade++;
      } else if (FECHA.includes(caractere)) {
        profundidade = Math.max(0, profundidade - 1);
        niveis[i] = profundidade;
      } else {
        niveis[i] = profundidade;
      }
    }
  }

  return niveis;
}

// Troca as palavras de um trecho de código. Cada palavra é lida uma única vez,
// e nomes depois de um ponto (objeto.print) ficam como estão. `noLaco` avisa que
// o trecho é o cabeçalho de um for: o primeiro "in" é o do laço ("em") e os
// demais são testes de pertinência ("está em"). O mesmo vale depois de um "for"
// dentro de uma expressão, como [x for x in lista].
function traduzirPalavras(codigo, tabela, noLaco = false) {
  const pedacos = codigo.split(DIVISAO_EM_PALAVRAS);
  let esperaIn = noLaco;

  for (let i = 1; i < pedacos.length; i += 2) {
    const palavra = pedacos[i];
    const antes = pedacos[i - 1].trimEnd();
    const depois = (pedacos[i + 1] || "").trimStart();

    if (antes.endsWith("."))
      continue;

    if (palavra === "for")
      esperaIn = true;

    if (palavra === "in" && esperaIn) {
      esperaIn = false;

      if (Object.hasOwn(tabela.palavrasDeLaco, palavra))
        pedacos[i] = tabela.palavrasDeLaco[palavra];

      continue;
    }

    // "is not" é uma palavra só: sem isto sairia "é não"
    if (
      palavra === "is" &&
      ehSoEspaco(pedacos[i + 1]) &&
      pedacos[i + 2] === "not" &&
      Object.hasOwn(tabela.palavras, "is not")
    ) {
      pedacos[i] = tabela.palavras["is not"];
      pedacos[i + 1] = "";
      pedacos[i + 2] = "";
      continue;
    }

    if (depois.startsWith("(") && Object.hasOwn(tabela.funcoes, palavra))
      pedacos[i] = tabela.funcoes[palavra];
    else if (Object.hasOwn(tabela.palavras, palavra))
      pedacos[i] = tabela.palavras[palavra];
  }

  return pedacos.join("");
}

// Traduz as palavras do código, sem mexer em textos entre aspas nem em
// comentários.
function traduzirExpressao(texto, tabela, noLaco = false) {
  let primeiroCodigo = true;

  return segmentar(texto)
    .map((trecho) => {
      const original = texto.slice(trecho.inicio, trecho.fim);

      if (trecho.tipo !== "codigo")
        return original;

      const traduzido = traduzirPalavras(
        original,
        tabela,
        noLaco && primeiroCodigo,
      );

      primeiroCodigo = false;
      return traduzido;
    })
    .join("");
}

// Troca uma palavra por outra nos trechos de código, sem mexer em textos.
function trocarPalavra(texto, palavra, troca) {
  return segmentar(texto)
    .map((trecho) => {
      const original = texto.slice(trecho.inicio, trecho.fim);

      if (trecho.tipo !== "codigo")
        return original;

      return original
        .split(DIVISAO_EM_PALAVRAS)
        .map((pedaco, i) => (i % 2 === 1 && pedaco === palavra ? troca : pedaco))
        .join("");
    })
    .join("");
}

// Divide o texto em um caractere separador (";" ou ",") fora de aspas e de
// parênteses, colchetes e chaves. Partes vazias ficam de fora.
function dividirNoNivelZero(texto, separador) {
  const niveis = mapearNiveis(texto);
  const partes = [];
  let inicio = 0;

  for (let i = 0; i < texto.length; i++) {
    if (texto[i] !== separador || niveis[i] !== 0)
      continue;

    partes.push(texto.slice(inicio, i));
    inicio = i + 1;
  }

  partes.push(texto.slice(inicio));
  return partes.map((parte) => parte.trim()).filter(Boolean);
}

// Acha uma palavra solta (como "from") fora de aspas e de colchetes, com texto
// dos dois lados. Devolve o que vem antes e o que vem depois dela.
function acharPalavraNoNivelZero(texto, palavra) {
  const niveis = mapearNiveis(texto);

  for (const achado of texto.matchAll(PALAVRA)) {
    if (achado[0] !== palavra || niveis[achado.index] !== 0)
      continue;

    const antes = texto.slice(0, achado.index).trim();
    const depois = texto.slice(achado.index + palavra.length).trim();

    if (antes && depois)
      return { antes, depois };
  }

  return null;
}

// Separa "cabeçalho: corpo" no primeiro ":" fora de aspas e de colchetes.
function dividirCabecalho(resto) {
  const niveis = mapearNiveis(resto);

  for (let i = 0; i < resto.length; i++) {
    if (niveis[i] !== 0 || resto[i] !== ":" || resto[i + 1] === "=")
      continue;

    return {
      cabecalho: resto.slice(0, i).trim(),
      corpo: resto.slice(i + 1).trim(),
    };
  }

  return { cabecalho: resto.trim(), corpo: "" };
}

// Acha o primeiro "=" de atribuição fora de aspas e de colchetes. Devolve o
// alvo, o operador de uma atribuição aumentada (+=, //=, ...) ou "", e o valor.
function acharAtribuicao(texto) {
  const niveis = mapearNiveis(texto);

  for (let i = 0; i < texto.length; i++) {
    if (niveis[i] !== 0 || texto[i] !== "=")
      continue;

    // "==" é comparação: pula os dois sinais
    if (texto[i + 1] === "=") {
      i++;
      continue;
    }

    const anterior = texto[i - 1] || "";

    if (anterior && ANTES_DE_IGUAL_SEM_ATRIBUICAO.includes(anterior))
      continue;

    const dupla = texto.slice(Math.max(0, i - 2), i);
    let operador = "";

    if (dupla === "**" || dupla === "//")
      operador = dupla;
    else if (anterior && OPERADORES_SIMPLES.includes(anterior))
      operador = anterior;

    return {
      alvo: texto.slice(0, i - operador.length).trim(),
      operador,
      valor: texto.slice(i + 1).trim(),
    };
  }

  return null;
}

// Atribuição em cadeia (x = y = 0): junta todos os alvos e deixa o último
// valor. Uma atribuição aumentada nunca é cadeia.
function acharCadeia(atribuicao) {
  const alvos = [atribuicao.alvo];
  let valor = atribuicao.valor;

  if (atribuicao.operador)
    return { alvos, operador: atribuicao.operador, valor };

  for (;;) {
    const proxima = acharAtribuicao(valor);

    // "lambda a=1: a" tem um "=" solto que não é uma atribuição
    if (!proxima || proxima.operador || /\blambda\b/.test(proxima.alvo))
      break;

    alvos.push(proxima.alvo);
    valor = proxima.valor;
  }

  return { alvos, operador: "", valor };
}

// Junta a frase do cabeçalho com a tradução do corpo, quando ele vem na mesma
// linha (if x: print(1)).
function anexarCorpo(frase, corpo, tabela) {
  if (!corpo)
    return frase;

  return (frase + " " + traduzirInstrucao(corpo, tabela)).trim();
}

function traduzirComCabecalho(especificacao, resto, tabela) {
  const { cabecalho, corpo } = dividirCabecalho(resto);

  if (!cabecalho)
    return "";

  if (especificacao.heranca) {
    const classe = cabecalho.match(/^([\p{L}_][\p{L}\p{N}_]*)\s*\((.+)\)$/u);

    if (classe) {
      const frase = preencher(tabela.frases.definaClasseHerda, {
        nome: classe[1],
        bases: classe[2].trim(),
      });

      return anexarCorpo(frase, corpo, tabela);
    }
  }

  let trecho = especificacao.traduzir
    ? traduzirExpressao(cabecalho, tabela, especificacao.laco)
    : cabecalho;

  if (especificacao.como)
    trecho = trocarPalavra(trecho, "as", tabela.frases.como);

  const frase = preencher(tabela.frases[especificacao.frase], {
    [especificacao.campo]: trecho,
  });

  return anexarCorpo(frase, corpo, tabela);
}

// else, try e finally: não têm nada entre a palavra e os dois-pontos.
function traduzirSemCabecalho(chave, texto, resto, tabela) {
  const { cabecalho, corpo } = dividirCabecalho(resto);

  // "else if x:" não é uma instrução válida: só troca as palavras
  if (cabecalho)
    return traduzirExpressao(texto, tabela);

  return anexarCorpo(tabela.frases[chave], corpo, tabela);
}

function traduzirExcecao(resto, tabela) {
  const { cabecalho, corpo } = dividirCabecalho(resto);
  const guardado = cabecalho.match(/^(.+?)\s+as\s+(\w+)$/);
  let frase = tabela.frases.qualquerErro;

  if (guardado) {
    frase = preencher(tabela.frases.erroGuardado, {
      tipo: guardado[1],
      nome: guardado[2],
    });
  } else if (cabecalho) {
    frase = preencher(tabela.frases.erro, { tipo: cabecalho });
  }

  return anexarCorpo(frase, corpo, tabela);
}

function traduzirRetorno(resto, tabela) {
  if (!resto)
    return tabela.frases.retorneVazio;

  return preencher(tabela.frases.retorne, {
    valor: traduzirExpressao(resto, tabela),
  });
}

// yield x. "yield from x" fica sem dica: a frase de yield não serviria.
function traduzirEntrega(resto, tabela) {
  if (!resto)
    return tabela.frases.entregueVazio;

  if (/^from(?![\p{L}\p{N}_])/u.test(resto))
    return "";

  return preencher(tabela.frases.entregue, {
    valor: traduzirExpressao(resto, tabela),
  });
}

function traduzirLevantamento(resto, tabela) {
  if (!resto)
    return tabela.frases.propagueErro;

  // raise ErroNovo(...) from erro
  const causa = acharPalavraNoNivelZero(resto, "from");

  if (causa) {
    return preencher(tabela.frases.gereErroDe, {
      erro: traduzirExpressao(causa.antes, tabela),
      causa: traduzirExpressao(causa.depois, tabela),
    });
  }

  return preencher(tabela.frases.gereErro, {
    erro: traduzirExpressao(resto, tabela),
  });
}

// assert condicao, "mensagem"
function traduzirGarantia(resto, tabela) {
  if (!resto)
    return "";

  const [condicao, ...mensagem] = dividirNoNivelZero(resto, ",");

  if (!mensagem.length) {
    return preencher(tabela.frases.garanta, {
      condicao: traduzirExpressao(condicao, tabela),
    });
  }

  return preencher(tabela.frases.garantaMensagem, {
    condicao: traduzirExpressao(condicao, tabela),
    mensagem: traduzirExpressao(mensagem.join(", "), tabela),
  });
}

function traduzirApagar(resto, tabela) {
  if (!resto)
    return "";

  return preencher(tabela.frases.apague, {
    alvo: traduzirExpressao(resto, tabela),
  });
}

// global x, y e nonlocal x
function traduzirDeclaracao(palavra, resto, tabela) {
  if (!resto)
    return "";

  const frase =
    palavra === "global"
      ? tabela.frases.declareGlobal
      : tabela.frases.declareNaoLocal;

  return preencher(frase, { nomes: resto });
}

// @decorador e @decorador(argumentos)
function traduzirDecorador(resto, tabela) {
  if (!resto)
    return "";

  return preencher(tabela.frases.decorador, {
    nome: traduzirExpressao(resto, tabela),
  });
}

function traduzirImportacao(palavra, resto, tabela) {
  if (!resto)
    return "";

  if (palavra === "import") {
    // import os, sys
    if (resto.includes(",")) {
      return preencher(tabela.frases.importeVarios, {
        modulos: trocarPalavra(resto, "as", tabela.frases.comONome),
      });
    }

    const como = resto.match(/^(.+?)\s+as\s+(\w+)$/);

    if (como) {
      return preencher(tabela.frases.importeComo, {
        modulo: como[1],
        apelido: como[2],
      });
    }

    return preencher(tabela.frases.importe, { modulo: resto });
  }

  const de = resto.match(/^(\S+)\s+import\s+(.+)$/);

  if (!de)
    return "";

  if (de[2].trim() === "*")
    return preencher(tabela.frases.importeTudo, { modulo: de[1] });

  return preencher(tabela.frases.importeDe, {
    itens: trocarPalavra(de[2], "as", tabela.frases.comONome),
    modulo: de[1],
  });
}

function traduzirAtribuicao(atribuicao, tabela) {
  const { alvos, operador, valor } = acharCadeia(atribuicao);

  if (alvos.some((alvo) => !alvo) || !valor)
    return "";

  const valorTraduzido = traduzirExpressao(valor, tabela);

  if (operador) {
    return preencher(tabela.aumentadas[operador], {
      alvo: traduzirExpressao(alvos[0], tabela),
      valor: valorTraduzido,
    });
  }

  if (alvos.length > 1) {
    return preencher(tabela.frases.recebemTodos, {
      alvos: juntarLista(
        alvos.map((alvo) => traduzirExpressao(alvo, tabela)),
        tabela,
      ),
      valor: valorTraduzido,
    });
  }

  return preencher(tabela.frases.recebe, {
    alvo: traduzirExpressao(alvos[0], tabela),
    valor: valorTraduzido,
  });
}

// Reconhece uma linha que é só uma chamada, como notas.append(5.5) ou
// mostrar(a, b): o nome (com o objeto, se houver) e os argumentos. Devolve null
// quando sobra qualquer coisa depois do ")" que fecha a chamada.
function analisarChamada(texto) {
  const comeco = texto.match(CHAMADA);

  if (!comeco)
    return null;

  const abre = comeco[0].length - 1;
  const niveis = mapearNiveis(texto);
  let fecha = -1;

  for (let i = abre + 1; i < texto.length; i++) {
    if (texto[i] === ")" && niveis[i] === 0) {
      fecha = i;
      break;
    }
  }

  if (fecha !== texto.length - 1)
    return null;

  const nome = comeco[1].replace(/\s+/g, "");
  const ponto = nome.lastIndexOf(".");

  return {
    objeto: ponto === -1 ? "" : nome.slice(0, ponto),
    nome: ponto === -1 ? nome : nome.slice(ponto + 1),
    argumentos: dividirNoNivelZero(texto.slice(abre + 1, fecha), ","),
  };
}

// Frase própria para os métodos conhecidos (append, sort...) com a quantidade de
// argumentos que a frase espera, e "chame ..." para qualquer outra chamada.
// Devolve null para print, input e as demais funções da tabela, que seguem pela
// troca de palavras.
function traduzirChamada(chamada, texto, tabela) {
  const { objeto, nome, argumentos } = chamada;

  if (!objeto && FUNCOES_EMBUTIDAS.has(nome))
    return null;

  if (objeto && Object.hasOwn(tabela.metodos, nome)) {
    const modelo = tabela.metodos[nome][argumentos.length];

    if (modelo) {
      const valores = { obj: traduzirExpressao(objeto, tabela) };

      argumentos.forEach((argumento, i) => {
        valores[i + 1] = traduzirExpressao(argumento, tabela);
      });

      return preencher(modelo, valores);
    }
  }

  return preencher(tabela.frases.chame, {
    chamada: traduzirExpressao(texto, tabela),
  });
}

function traduzirInstrucao(texto, tabela) {
  // a = 1; b = 2
  const partes = dividirNoNivelZero(texto, ";");

  if (partes.length > 1) {
    return partes
      .map((parte) => traduzirInstrucao(parte, tabela) || parte)
      .join("; ");
  }

  if (texto.startsWith("@"))
    return traduzirDecorador(texto.slice(1).trim(), tabela);

  const correspondencia = texto.match(PRIMEIRA_PALAVRA);
  const palavra = correspondencia ? correspondencia[0] : "";
  const resto = texto.slice(palavra.length).trim();

  if (Object.hasOwn(INSTRUCOES_COM_CABECALHO, palavra)) {
    return traduzirComCabecalho(
      INSTRUCOES_COM_CABECALHO[palavra],
      resto,
      tabela,
    );
  }

  if (!resto && Object.hasOwn(INSTRUCOES_SIMPLES, palavra))
    return tabela.frases[INSTRUCOES_SIMPLES[palavra]];

  switch (palavra) {
    case "else":
      return traduzirSemCabecalho("senao", texto, resto, tabela);
    case "try":
      return traduzirSemCabecalho("tente", texto, resto, tabela);
    case "finally":
      return traduzirSemCabecalho("finalmente", texto, resto, tabela);
    case "except":
      return traduzirExcecao(resto, tabela);
    case "return":
      return traduzirRetorno(resto, tabela);
    case "yield":
      return traduzirEntrega(resto, tabela);
    case "raise":
      return traduzirLevantamento(resto, tabela);
    case "assert":
      return traduzirGarantia(resto, tabela);
    case "del":
      return traduzirApagar(resto, tabela);
    case "global":
    case "nonlocal":
      return traduzirDeclaracao(palavra, resto, tabela);
    case "import":
    case "from":
      return traduzirImportacao(palavra, resto, tabela);
  }

  const atribuicao = acharAtribuicao(texto);

  if (atribuicao)
    return traduzirAtribuicao(atribuicao, tabela);

  const chamada = analisarChamada(texto);

  if (chamada) {
    const traducao = traduzirChamada(chamada, texto, tabela);

    if (traducao !== null)
      return traducao;
  }

  return traduzirExpressao(texto, tabela);
}

// Traduz uma linha de código. Devolve "" quando não há o que mostrar: linha
// vazia, instrução incompleta ou linha sem nada a traduzir.
export function traduzirLinhaCodigo(linha, idioma = "pt") {
  const tabela = Object.hasOwn(TABELAS, idioma)
    ? TABELAS[idioma]
    : TABELAS.pt;
  const original = String(linha || "");
  const { codigo, comentario } = separarComentario(original);
  const texto = codigo.trim();

  if (!texto) {
    if (!comentario)
      return "";

    return preencher(tabela.frases.comentario, { texto: comentario });
  }

  let traducao = traduzirInstrucao(texto, tabela);

  if (traducao && comentario)
    traducao += "  # " + comentario;

  if (paraComparar(traducao) === paraComparar(original))
    return "";

  return traducao;
}
