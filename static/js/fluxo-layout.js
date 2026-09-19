// Geometria pura do fluxograma (sem DOM). Trabalha em "pixels de referência" (1 rem = 16).
// Recebe um gráfico do fluxo (árvore vinda do backend) e devolve formas, arestas e um índice
// linha -> forma. O layout é uma "espinha" vertical: a sequência principal desce pelo x = 0,
// corpos de `se` crescem só para a direita e retornos de laço só para a esquerda, então as
// arestas nunca se cruzam.

const G = {
  ALT_NO: 36,
  ALT_LOSANGO: 52,
  ALT_TERMINAL: 32,
  GAP_V: 24,
  GAP_H: 32,
  FAIXA: 22,
  PAD: 14,
  INCL: 12,
  LARG_MIN: 88,
  TEXTO_MAX: 340,
  TEXTO_MAX_LOSANGO: 210,
  DESCIDA: 16,
  JOELHO: 10,
  MARGEM: 16,
};

const DICA_SALTO = {
  return: "flow.tip.return",
  break: "flow.tip.break",
  continue: "flow.tip.continue",
  raise: "flow.tip.raise",
};

function montarModelo(grafico, traduzir) {
  let sintetico = 0;
  const aliases = [];
  const novoId = () => --sintetico;

  function idPrincipal(no) {
    if (no.k === "se")
      return no.ramos[0].id;
    return no.id;
  }

  function simples(n) {
    const base = { k: "no", id: n.id, texto: n.texto, ini: n.linha, fim: n.linha_fim };
    if (n.tipo === "entrada")
      return { ...base, forma: "es", dica: traduzir("flow.tip.input") };
    if (n.tipo === "saida")
      return { ...base, forma: "es", dica: traduzir("flow.tip.output") };
    if (n.tipo === "retorno")
      return { ...base, forma: "salto", dica: traduzir(DICA_SALTO.return) };
    if (n.tipo === "interrupcao") {
      return {
        ...base,
        forma: "salto",
        dica: traduzir(DICA_SALTO[n.subtipo] || DICA_SALTO.raise),
      };
    }
    if (n.tipo === "omitido") {
      return {
        ...base,
        forma: "omitido",
        texto: traduzir("flow.omitted", { count: n.quantidade }),
        dica: traduzir("flow.tip.omitted"),
      };
    }
    if (n.tipo === "definicao") {
      return {
        ...base,
        forma: "definicao",
        grafico: n.grafico,
        dica: traduzir(n.grafico === null ? "flow.tip.process" : "flow.tip.definition"),
      };
    }
    return { ...base, forma: "processo", dica: traduzir("flow.tip.process") };
  }

  function ramo(n, corpo) {
    return {
      id: n.id,
      texto: n.texto,
      ini: n.linha,
      fim: n.linha_fim,
      dica: traduzir("flow.tip.decision"),
      corpo: converter(corpo),
    };
  }

  function tentar(n) {
    const corpo = converter(n.corpo);
    const finalmente = converter(n.finalmente);
    const senao = converter(n.senao);
    if (corpo.length)
      aliases.push({ ini: n.linha, fim: n.linha_fim, alvo: idPrincipal(corpo[0]) });
    if (n.tratadores.length === 0)
      return [...corpo, ...senao, ...finalmente];

    const tipados = n.tratadores.filter((t) => t.tipado);
    const nu = n.tratadores.find((t) => !t.tipado);
    let corpoNu = null;
    if (nu) {
      corpoNu = converter(nu.corpo);
      if (corpoNu.length)
        aliases.push({ ini: nu.linha, fim: nu.linha_fim, alvo: idPrincipal(corpoNu[0]) });
    }
    const propaga = {
      k: "no",
      forma: "salto",
      id: novoId(),
      texto: traduzir("flow.propagates"),
      ini: null,
      fim: null,
      dica: traduzir("flow.tip.raise"),
    };
    const senaoDaCadeia = corpoNu || [propaga];
    const cadeia = tipados.length
      ? [
          {
            k: "se",
            ramos: tipados.map((t) => ramo(t, t.corpo)),
            senao: senaoDaCadeia,
          },
        ]
      : senaoDaCadeia;
    const excecao = {
      k: "se",
      ramos: [
        {
          id: novoId(),
          texto: traduzir("flow.exceptionQuestion"),
          ini: null,
          fim: null,
          corpo: cadeia,
        },
      ],
      senao,
    };
    return [...corpo, excecao, ...finalmente];
  }

  function converter(lista) {
    const saida = [];
    for (const n of lista || []) {
      if (n.tipo === "se") {
        saida.push({
          k: "se",
          ramos: [ramo(n, n.entao), ...n.elifs.map((e) => ramo(e, e.entao))],
          senao: converter(n.senao),
        });
      } else if (n.tipo === "para" || n.tipo === "enquanto") {
        saida.push({
          k: "laco",
          id: n.id,
          texto: n.texto,
          ini: n.linha,
          fim: n.linha_fim,
          dica: traduzir("flow.tip.loop"),
          corpo: converter(n.corpo),
        });
      } else if (n.tipo === "tentar") {
        saida.push(...tentar(n));
      } else {
        saida.push(simples(n));
      }
    }
    return saida;
  }

  return { nos: converter(grafico.nos), aliases };
}

function indexarLinhas(nos, aliases) {
  const indice = new Map();
  const marcar = (ini, fim, id) => {
    if (ini === null || ini === undefined)
      return;
    for (let l = ini; l <= fim; l++) {
      if (!indice.has(l))
        indice.set(l, id);
    }
  };
  const visitar = (lista) => {
    for (const n of lista) {
      if (n.k === "se") {
        for (const r of n.ramos) {
          marcar(r.ini, r.fim, r.id);
          visitar(r.corpo);
        }
        visitar(n.senao);
      } else {
        marcar(n.ini, n.fim, n.id);
        if (n.k === "laco")
          visitar(n.corpo);
      }
    }
  };
  visitar(nos);
  for (const a of aliases)
    marcar(a.ini, a.fim, a.alvo);
  return indice;
}

export function calcularLayout(grafico, { medir, ajustar, traduzir }) {
  const { nos, aliases } = montarModelo(grafico, traduzir);
  const formas = [];
  const arestas = [];
  const juncoes = [];

  function dimensoesTexto(forma, texto) {
    if (forma === "decisao") {
      const exibido = ajustar(texto, G.TEXTO_MAX_LOSANGO);
      return { exibido, w: Math.max(112, medir(exibido) / 0.62 + 16) };
    }
    const exibido = ajustar(texto, G.TEXTO_MAX);
    const extra = forma === "es" ? 2 * G.INCL : 0;
    return { exibido, w: Math.max(G.LARG_MIN, medir(exibido) + 2 * G.PAD + extra) };
  }

  function medirSeq(lista) {
    let esq = 0;
    let dir = 0;
    let alt = 0;
    lista.forEach((n, i) => {
      const m = medir_no(n);
      esq = Math.max(esq, m.esq);
      dir = Math.max(dir, m.dir);
      alt += m.alt + (i ? G.GAP_V : 0);
    });
    const cai = lista.length ? medir_no(lista[lista.length - 1]).cai : true;
    return { esq, dir, alt, cai };
  }

  function medir_no(n) {
    if (n._m)
      return n._m;
    if (n.k === "no") {
      const t = dimensoesTexto(n.forma, n.texto);
      n._w = t.w;
      n._exibido = t.exibido;
      n._m = { esq: t.w / 2, dir: t.w / 2, alt: G.ALT_NO, cai: n.forma !== "salto" };
    } else if (n.k === "laco") {
      const t = dimensoesTexto("decisao", n.texto);
      n._w = t.w;
      n._exibido = t.exibido;
      n._corpo = medirSeq(n.corpo);
      const meio = t.w / 2;
      n._xl = Math.max(meio, n._corpo.esq) + G.FAIXA;
      n._xr = Math.max(meio, n._corpo.dir) + G.FAIXA;
      n._m = {
        esq: n._xl,
        dir: n._xr,
        alt: G.ALT_LOSANGO + G.GAP_V + n._corpo.alt + G.JOELHO + G.GAP_V,
        cai: true,
      };
    } else {
      n._m = medirSe(n);
    }
    return n._m;
  }

  function medirSe(n) {
    n.ramos.forEach((r) => {
      const t = dimensoesTexto("decisao", r.texto);
      r._w = t.w;
      r._exibido = t.exibido;
      r._corpo = medirSeq(r.corpo);
    });
    n._else = medirSeq(n.senao);
    n._temElse = n.senao.length > 0;
    const meio = Math.max(...n.ramos.map((r) => r._w / 2));
    const bEsq = Math.max(0, ...n.ramos.map((r) => r._corpo.esq));
    const bDir = Math.max(0, ...n.ramos.map((r) => r._corpo.dir));
    n._xb = meio + G.GAP_H + bEsq;
    let y = 0;
    n.ramos.forEach((r) => {
      r._y = y;
      const linha = Math.max(G.ALT_LOSANGO, G.ALT_LOSANGO / 2 + G.DESCIDA + r._corpo.alt);
      r._linha = linha;
      y += linha + G.GAP_V;
    });
    const ultimo = n.ramos[n.ramos.length - 1];
    const fimDasLinhas = ultimo._y + ultimo._linha;
    n._yElse = y;
    n._yJuncao = n._temElse ? y + n._else.alt + G.GAP_V : y;
    n._corposQueFluem = n.ramos.filter((r) => r._corpo.cai);
    const elseFlui = n._temElse ? n._else.cai : true;
    const cai = n._corposQueFluem.length > 0 || elseFlui;
    n._entradasNaJuncao = n._corposQueFluem.length + (elseFlui ? 1 : 0);
    n._xFaixa = Math.max(n._xb + bDir, meio, n._temElse ? n._else.dir : 0) + G.FAIXA;
    const dir = Math.max(
      meio,
      n._temElse ? n._else.dir : 0,
      n._xb + bDir,
      n._corposQueFluem.length ? n._xFaixa : 0,
    );
    const esq = Math.max(meio, n._temElse ? n._else.esq : 0);
    const alt = cai
      ? n._yJuncao
      : Math.max(fimDasLinhas, n._temElse ? n._yElse + n._else.alt : 0);
    return { esq, dir, alt, cai };
  }

  function forma(id, kind, cx, y, w, h, n) {
    formas.push({
      id,
      kind,
      x: cx - w / 2,
      y,
      w,
      h,
      texto: n._exibido !== undefined ? n._exibido : n.exibido,
      dica: n.dica ? (n.texto ? n.texto + "\n" + n.dica : n.dica) : n.texto || "",
      ini: n.ini === undefined ? null : n.ini,
      fim: n.fim === undefined ? null : n.fim,
      grafico: n.grafico === undefined ? null : n.grafico,
    });
  }

  function aresta(pts, seta, rotulo) {
    arestas.push({ pts, seta, rotulo: rotulo || null });
  }

  function colocarSeq(lista, cx, y0) {
    let y = y0;
    lista.forEach((n, i) => {
      colocar(n, cx, y);
      const m = medir_no(n);
      y += m.alt;
      if (i < lista.length - 1) {
        if (m.cai)
          aresta([[cx, y], [cx, y + G.GAP_V]], true);
        y += G.GAP_V;
      }
    });
  }

  function colocar(n, cx, y) {
    if (n.k === "no") {
      forma(n.id, n.forma, cx, y, n._w, G.ALT_NO, n);
    } else if (n.k === "laco") {
      colocarLaco(n, cx, y);
    } else {
      colocarSe(n, cx, y);
    }
  }

  function colocarLaco(n, cx, y0) {
    const meio = n._w / 2;
    const yc = y0 + G.ALT_LOSANGO / 2;
    forma(n.id, "decisao", cx, y0, n._w, G.ALT_LOSANGO, n);
    const yCorpo = y0 + G.ALT_LOSANGO + G.GAP_V;
    aresta([[cx, y0 + G.ALT_LOSANGO], [cx, yCorpo]], true, {
      chave: "flow.yes",
      x: cx + 6,
      y: y0 + G.ALT_LOSANGO + 15,
      ancora: "start",
    });
    colocarSeq(n.corpo, cx, yCorpo);
    const fundo = yCorpo + n._corpo.alt;
    if (n._corpo.cai) {
      aresta(
        [
          [cx, fundo],
          [cx, fundo + G.JOELHO],
          [cx - n._xl, fundo + G.JOELHO],
          [cx - n._xl, yc],
          [cx - meio, yc],
        ],
        true,
      );
    }
    const yFim = y0 + n._m.alt;
    aresta(
      [
        [cx + meio, yc],
        [cx + n._xr, yc],
        [cx + n._xr, yFim],
        [cx, yFim],
      ],
      false,
      { chave: "flow.no", x: cx + meio + 6, y: yc - 5, ancora: "start" },
    );
  }

  function colocarSe(n, cx, y0) {
    const xb = n._xb;
    const ultimoIndice = n.ramos.length - 1;
    n.ramos.forEach((r, i) => {
      const yTopo = y0 + r._y;
      const yc = yTopo + G.ALT_LOSANGO / 2;
      forma(r.id, "decisao", cx, yTopo, r._w, G.ALT_LOSANGO, r);
      const yCorpo = yc + G.DESCIDA;
      aresta([[cx + r._w / 2, yc], [cx + xb, yc], [cx + xb, yCorpo]], true, {
        chave: "flow.yes",
        x: cx + r._w / 2 + 6,
        y: yc - 5,
        ancora: "start",
      });
      colocarSeq(r.corpo, cx + xb, yCorpo);
      if (r._corpo.cai) {
        const saida = yCorpo + r._corpo.alt;
        aresta(
          [
            [cx + xb, saida],
            [cx + xb, saida + G.JOELHO],
            [cx + n._xFaixa, saida + G.JOELHO],
            [cx + n._xFaixa, y0 + n._yJuncao],
            [cx, y0 + n._yJuncao],
          ],
          false,
        );
      }
      const rotuloNao = {
        chave: "flow.no",
        x: cx + 6,
        y: yTopo + G.ALT_LOSANGO + 15,
        ancora: "start",
      };
      if (i < ultimoIndice) {
        aresta(
          [[cx, yTopo + G.ALT_LOSANGO], [cx, y0 + n.ramos[i + 1]._y]],
          true,
          rotuloNao,
        );
      } else if (n._temElse) {
        aresta([[cx, yTopo + G.ALT_LOSANGO], [cx, y0 + n._yElse]], true, rotuloNao);
      } else {
        aresta([[cx, yTopo + G.ALT_LOSANGO], [cx, y0 + n._yJuncao]], false, rotuloNao);
      }
    });
    if (n._temElse) {
      colocarSeq(n.senao, cx, y0 + n._yElse);
      if (n._else.cai) {
        aresta(
          [[cx, y0 + n._yElse + n._else.alt], [cx, y0 + n._yJuncao]],
          false,
        );
      }
    }
    if (n._m.cai && n._entradasNaJuncao >= 2)
      juncoes.push({ x: cx, y: y0 + n._yJuncao });
  }

  const inicioTexto = grafico.tipo === "principal" ? traduzir("flow.start") : grafico.texto || "";
  const terminal = (id, texto) => {
    const exibido = ajustar(texto, G.TEXTO_MAX);
    return {
      k: "no",
      forma: "terminal",
      id,
      texto,
      _exibido: exibido,
      _w: Math.max(G.LARG_MIN, medir(exibido) + 2 * G.PAD + 8),
      ini: null,
      fim: null,
      dica: "",
    };
  };
  const inicio = terminal("inicio", inicioTexto);
  const fim = terminal("fim", traduzir("flow.end"));
  const seq = medirSeq(nos);
  const cx = 0;
  forma(inicio.id, "terminal", cx, 0, inicio._w, G.ALT_TERMINAL, inicio);
  let y = G.ALT_TERMINAL;
  if (nos.length) {
    aresta([[cx, y], [cx, y + G.GAP_V]], true);
    y += G.GAP_V;
    colocarSeq(nos, cx, y);
    y += seq.alt;
  }
  if (seq.cai) {
    aresta([[cx, y], [cx, y + G.GAP_V]], true);
    y += G.GAP_V;
    forma(fim.id, "terminal", cx, y, fim._w, G.ALT_TERMINAL, fim);
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = 0;
  const cobrir = (x0, x1, y1) => {
    minX = Math.min(minX, x0);
    maxX = Math.max(maxX, x1);
    maxY = Math.max(maxY, y1);
  };
  formas.forEach((f) => cobrir(f.x, f.x + f.w, f.y + f.h));
  arestas.forEach((a) => {
    a.pts.forEach(([px, py]) => cobrir(px, px, py));
    if (a.rotulo)
      cobrir(a.rotulo.x - 4, a.rotulo.x + 30, a.rotulo.y + 4);
  });
  const dx = G.MARGEM - minX;
  const dy = G.MARGEM;
  formas.forEach((f) => {
    f.x += dx;
    f.y += dy;
  });
  arestas.forEach((a) => {
    a.pts = a.pts.map(([px, py]) => [px + dx, py + dy]);
    if (a.rotulo) {
      a.rotulo.x += dx;
      a.rotulo.y += dy;
    }
  });
  juncoes.forEach((j) => {
    j.x += dx;
    j.y += dy;
  });

  return {
    largura: maxX - minX + 2 * G.MARGEM,
    altura: maxY + 2 * G.MARGEM,
    formas,
    arestas,
    juncoes,
    indice: indexarLinhas(nos, aliases),
  };
}

export const GEOMETRIA = G;
