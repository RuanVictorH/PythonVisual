// Botão de copiar do card Código: copia o código inteiro do editor para a área de
// transferência e avisa o resultado ao lado do botão, numa região `role="status"`
// que os leitores de tela também anunciam.
const ID_BOTAO = "btn-copiar";
const ID_AVISO = "copiar-aviso";
const ICONE_PADRAO = "fa-regular fa-copy";
const DURACAO_AVISO = 1800;

const ESTADOS = {
  copiado: { icone: "fa-solid fa-check", chave: "code.copied" },
  vazio: { icone: ICONE_PADRAO, chave: "code.copyEmpty" },
  falhou: { icone: "fa-solid fa-triangle-exclamation", chave: "code.copyFailed" },
};

// Copia o texto e devolve `true` se deu certo. Usa a API moderna da área de
// transferência; se ela não existir (página aberta por http fora do localhost) ou
// recusar o pedido, cai no método antigo: selecionar um campo escondido e copiar.
// `ambiente` só existe para os testes trocarem o navegador e o documento.
export async function copiarTexto(texto, ambiente = {}) {
  const clipboard =
    "clipboard" in ambiente ? ambiente.clipboard : globalThis.navigator?.clipboard;
  const documento =
    "documento" in ambiente ? ambiente.documento : globalThis.document;

  if (clipboard && typeof clipboard.writeText === "function") {
    try {
      await clipboard.writeText(texto);
      return true;
    } catch (erro) {
      // sem permissão ou sem foco na página: tenta o método antigo
    }
  }
  return copiarPorSelecao(texto, documento);
}

function copiarPorSelecao(texto, documento) {
  if (!documento || !documento.body || typeof documento.execCommand !== "function")
    return false;

  const campo = documento.createElement("textarea");
  campo.value = texto;
  campo.setAttribute("readonly", "");
  campo.setAttribute("aria-hidden", "true");
  campo.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none";
  const foco = documento.activeElement;
  documento.body.appendChild(campo);

  let copiou = false;
  try {
    campo.select();
    campo.setSelectionRange(0, texto.length);
    copiou = documento.execCommand("copy") === true;
  } catch (erro) {
    copiou = false;
  }

  campo.remove();
  // o campo escondido roubou o foco: devolve a quem estava com ele
  if (foco && typeof foco.focus === "function")
    foco.focus({ preventScroll: true });
  return copiou;
}

export function iniciarCopiarCodigo({ obterCodigo, traduzir }) {
  const botao = document.getElementById(ID_BOTAO);
  const aviso = document.getElementById(ID_AVISO);
  if (!botao || !aviso)
    return;

  const icone = botao.querySelector("i");
  let temporizador = 0;

  function restaurar() {
    botao.removeAttribute("data-estado");
    aviso.removeAttribute("data-estado");
    aviso.textContent = "";
    if (icone)
      icone.className = ICONE_PADRAO;
  }

  function mostrar(estado) {
    clearTimeout(temporizador);
    const { icone: classes, chave } = ESTADOS[estado];
    botao.setAttribute("data-estado", estado);
    aviso.setAttribute("data-estado", estado);
    aviso.textContent = traduzir(chave);
    if (icone)
      icone.className = classes;
    temporizador = setTimeout(restaurar, DURACAO_AVISO);
  }

  botao.addEventListener("click", async () => {
    const codigo = obterCodigo();
    if (!codigo) {
      mostrar("vazio");
      return;
    }
    mostrar((await copiarTexto(codigo)) ? "copiado" : "falhou");
  });
}
