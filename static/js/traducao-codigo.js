// Tradução de uma linha de código Python para linguagem simples, usada na
// dica que aparece ao passar o mouse sobre o editor. Módulo puro: não usa o
// DOM e não importa nada, então pode ser testado fora do navegador.

// Cada idioma tem as palavras trocadas dentro das expressões, as frases de cada
// instrução ({campo} marca onde entra o trecho do código) e as frases das
// atribuições aumentadas (+=, -=, ...). Em inglês as palavras não mudam, porque
// o código já está em inglês.
const TABELAS = {
  pt: {
    funcoes: {
      input: "leia",
      print: "escreva",
      range: "intervalo",
      len: "tamanho",
      int: "inteiro",
      float: "real",
      str: "texto",
    },
    palavras: {
      and: "e",
      or: "ou",
      not: "não",
      in: "em",
      True: "Verdadeiro",
      False: "Falso",
      None: "Nulo",
    },
    frases: {
      comentario: "comentário: {texto}",
      se: "se {condicao} então",
      senaoSe: "senão se {condicao} então",
      senao: "senão",
      para: "para {laco} faça",
      enquanto: "enquanto {condicao} faça",
      definaFuncao: "defina a função {assinatura}",
      definaClasse: "defina a classe {nome}",
      retorne: "retorne {valor}",
      retorneVazio: "retorne",
      interrompa: "interrompa o laço",
      proximaRepeticao: "vá para a próxima repetição",
      nadaAFazer: "não faça nada",
      tente: "tente",
      erro: "se ocorrer o erro {tipo}",
      erroGuardado: "se ocorrer o erro {tipo} (guardado em {nome})",
      qualquerErro: "se ocorrer qualquer erro",
      finalmente: "ao final, de qualquer forma",
      gereErro: "gere o erro {erro}",
      propagueErro: "propague o erro",
      importe: "importe o módulo {modulo}",
      importeComo: "importe o módulo {modulo} com o nome {apelido}",
      importeDe: "importe {itens} do módulo {modulo}",
      importeTudo: "importe tudo do módulo {modulo}",
      recebe: "{alvo} recebe {valor}",
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
  },
  en: {
    funcoes: {},
    palavras: {},
    frases: {
      comentario: "comment: {texto}",
      se: "if {condicao} then",
      senaoSe: "otherwise, if {condicao} then",
      senao: "otherwise",
      para: "for {laco} do",
      enquanto: "while {condicao} do",
      definaFuncao: "define the function {assinatura}",
      definaClasse: "define the class {nome}",
      retorne: "return {valor}",
      retorneVazio: "return",
      interrompa: "stop the loop",
      proximaRepeticao: "go to the next repetition",
      nadaAFazer: "do nothing",
      tente: "try",
      erro: "if the error {tipo} happens",
      erroGuardado: "if the error {tipo} happens (saved as {nome})",
      qualquerErro: "if any error happens",
      finalmente: "at the end, no matter what",
      gereErro: "raise the error {erro}",
      propagueErro: "pass the error on",
      importe: "import the module {modulo}",
      importeComo: "import the module {modulo} as {apelido}",
      importeDe: "import {itens} from the module {modulo}",
      importeTudo: "import everything from the module {modulo}",
      recebe: "{alvo} receives {valor}",
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
  },
};

// Instruções que têm "cabeçalho:" e, às vezes, o corpo na mesma linha.
// `traduzir` indica se o cabeçalho passa pela troca de palavras.
const INSTRUCOES_COM_CABECALHO = {
  if: { frase: "se", campo: "condicao", traduzir: true },
  elif: { frase: "senaoSe", campo: "condicao", traduzir: true },
  while: { frase: "enquanto", campo: "condicao", traduzir: true },
  for: { frase: "para", campo: "laco", traduzir: true },
  def: { frase: "definaFuncao", campo: "assinatura", traduzir: false },
  class: { frase: "definaClasse", campo: "nome", traduzir: false },
};

// Instruções de uma palavra só.
const INSTRUCOES_SIMPLES = {
  break: "interrompa",
  continue: "proximaRepeticao",
  pass: "nadaAFazer",
};

const PRIMEIRA_PALAVRA = /^[\p{L}_][\p{L}\p{N}_]*/u;
const PALAVRA = /[\p{L}_][\p{L}\p{N}_]*/gu;
const ABRE = "([{";
const FECHA = ")]}";

// Caracteres que, antes de "=", formam outro operador (!=, <=, >=, :=, |=...).
const ANTES_DE_IGUAL_SEM_ATRIBUICAO = "!<>:@&|^";
const OPERADORES_SIMPLES = "+-*/%";

function preencher(modelo, valores) {
  return modelo.replace(/\{(\w+)\}/g, (_, nome) => valores[nome]);
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
// e nomes depois de um ponto (objeto.print) ficam como estão.
function traduzirPalavras(codigo, tabela) {
  return codigo.replace(PALAVRA, (palavra, posicao) => {
    const antes = codigo.slice(0, posicao).trimEnd();
    const depois = codigo.slice(posicao + palavra.length).trimStart();

    if (antes.endsWith("."))
      return palavra;

    if (depois.startsWith("(") && Object.hasOwn(tabela.funcoes, palavra))
      return tabela.funcoes[palavra];

    if (Object.hasOwn(tabela.palavras, palavra))
      return tabela.palavras[palavra];

    return palavra;
  });
}

// Traduz as palavras do código, sem mexer em textos entre aspas nem em
// comentários.
function traduzirExpressao(texto, tabela) {
  return segmentar(texto)
    .map((trecho) => {
      const original = texto.slice(trecho.inicio, trecho.fim);

      return trecho.tipo === "codigo"
        ? traduzirPalavras(original, tabela)
        : original;
    })
    .join("");
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

  const trecho = especificacao.traduzir
    ? traduzirExpressao(cabecalho, tabela)
    : cabecalho;
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

function traduzirLevantamento(resto, tabela) {
  if (!resto)
    return tabela.frases.propagueErro;

  return preencher(tabela.frases.gereErro, {
    erro: traduzirExpressao(resto, tabela),
  });
}

function traduzirImportacao(palavra, resto, tabela) {
  if (!resto)
    return "";

  if (palavra === "import") {
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

  return preencher(tabela.frases.importeDe, { itens: de[2], modulo: de[1] });
}

function traduzirAtribuicao(atribuicao, tabela) {
  const { alvo, operador, valor } = atribuicao;

  if (!alvo || !valor)
    return "";

  const frase = operador
    ? tabela.aumentadas[operador]
    : tabela.frases.recebe;

  return preencher(frase, {
    alvo: traduzirExpressao(alvo, tabela),
    valor: traduzirExpressao(valor, tabela),
  });
}

function traduzirInstrucao(texto, tabela) {
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
    case "raise":
      return traduzirLevantamento(resto, tabela);
    case "import":
    case "from":
      return traduzirImportacao(palavra, resto, tabela);
  }

  const atribuicao = acharAtribuicao(texto);

  if (atribuicao)
    return traduzirAtribuicao(atribuicao, tabela);

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
