# PythonVisual

Protótipo didático inspirado no Python Tutor para visualizar a execução de código Python passo a passo.

## Melhorias desta versão

- Execução do código em subprocesso, evitando travar o servidor Flask.
- Timeout de 3 segundos para interromper loops infinitos ou execuções longas.
- Limite de 1000 passos de rastreamento por execução.
- Campo de entrada padrão para códigos que usam `input()`.
- Evento final de execução para mostrar o estado depois da última linha.
- Setas e cores separadas para linha executada e próxima linha.
- Tema claro no editor, nos painéis e na saída.
- Organização da memória em Variáveis, Objetos, Funções e Importações.
- Serialização mais segura de valores grandes ou com `repr()` problemático.
- Fluxograma automático do código, com o bloco em execução destacado a cada passo (veja [Fluxograma](#fluxograma)).
- Fluxograma em tela cheia, com botão no cabeçalho do card; Espaço ou → avança, ← volta, Home e End vão ao início e ao fim, e Esc sai (veja [Fluxograma](#fluxograma)).
- Tradução de cada linha do código ao passar o mouse sobre o editor, com botão para ligar e desligar (veja [Tradução de código](#tradução-de-código)).
- Visualizador em duas colunas, com as abas **Visualização** e **Fluxograma** e a faixa **Saída** | **Pilha de chamadas** embaixo, pensado para telas de 1366×768 ou menos (veja [Layout do visualizador](#layout-do-visualizador)).
- Atalhos de teclado novos: **Ctrl+Delete** limpa, **Alt+T** liga e desliga a tradução e, na tela cheia do fluxograma, as setas, **Home** e **End** navegam pelos passos (veja [Atalhos de teclado](#atalhos-de-teclado)).
- Bandeiras do Brasil e do Reino Unido ao lado de **PT** e **EN** no seletor de idioma, em todas as páginas.
- As dicas dos botões **A-** e **A+** mostram o zoom atual da página, em porcentagem (de 60% a 180%).
- Botão de copiar no cabeçalho do card **Código**: copia todo o código do editor e avisa ao lado do botão quando terminou. Sem a API de área de transferência do navegador (página aberta por http fora do localhost), usa um campo escondido para copiar; com o editor vazio só avisa que não há nada para copiar.
- Tradução de código revisada: `round` vira `arredonda` e outras funções ganham tradução (`max`, `min`, `sum`...), `not in`, `is`, `x = y = 0` e `;` passam a sair certos, e `with`, `assert`, `del`, `global`, `yield`, decoradores e chamadas como `notas.append(5.5)` ganham dica (veja [Tradução de código](#tradução-de-código)).

## Requisitos

- Python 3.10+
- [Docker](https://www.docker.com/products/docker-desktop/) instalado e em execução — o código enviado pelos usuários roda dentro de um container isolado (sem acesso à rede, ao disco do host ou a outros processos). Veja [Segurança](#segurança) abaixo.

## Como rodar

1. Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/) e deixe-o em execução (o ícone da baleia precisa aparecer ativo na bandeja do sistema). É ele quem isola o código executado pelos usuários — veja [Segurança](#segurança).

2. Crie o ambiente virtual e instale as dependências do Flask:

   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Rode a aplicação:

   ```bash
   python app.py
   ```

4. Acesse:

   ```text
   http://127.0.0.1:5000/
   ```

Na primeira execução de um código, a imagem Docker do sandbox (`docker/Dockerfile`) é construída automaticamente — pode levar alguns segundos a mais nesse primeiro uso. Nas próximas vezes a imagem já vai estar pronta e a execução volta a ser rápida.

Se quiser construir a imagem manualmente antes (opcional, só para conferir que está tudo certo):

```bash
docker build -t pythonvisual-sandbox:latest docker/
```

Para reativar o modo debug do Flask em desenvolvimento local (recarregamento automático):

```bash
PYTHONVISUAL_DEBUG=true python app.py
```

### Problemas comuns com o Docker

- `o Docker não está disponível`: o Docker Desktop não está aberto ou ainda está iniciando. Abra o Docker Desktop e espere o ícone ficar estável antes de rodar um código.
- `docker build falhou`: confira se há espaço em disco e se há conexão com a internet na primeira execução (a imagem baixa `python:3.12-slim`).
- Para desenvolvimento local sem Docker instalado, veja a opção `USAR_SANDBOX_DOCKER=false` em [Segurança](#segurança) — não recomendada fora da sua própria máquina.

## Fluxograma

Ao executar um código, a aba **Fluxograma** (ao lado de **Visualização**) desenha o fluxo do programa a partir do próprio código do editor (não há outra caixa de texto). Cada linha executável vira um bloco (terminal, retângulo, losango ou paralelogramo) e, ao navegar pelos passos, o bloco da próxima linha fica em vermelho e o da linha já executada em verde, como no editor.

- Cada função, método e classe ganha um fluxograma próprio. Por padrão o card acompanha a função em execução; escolher outro no seletor (ou clicar num bloco de definição) fixa o gráfico, e o botão **Seguir execução** volta a acompanhar.
- A estrutura é montada com o módulo `ast` dentro do sandbox (`fluxo_builder.py`), então o código do usuário nunca é interpretado fora do container. A resposta de `/executar` continua sendo uma lista de passos; o fluxograma vai na chave `fluxo` do primeiro elemento.
- `match`, `async` e geradores aparecem simplificados, como um único bloco. Programas grandes têm o fluxograma resumido, e execuções interrompidas por timeout ou com erro de sintaxe não exibem o fluxograma (a aba fica desabilitada).
- A legenda das formas e das marcas só aparece na tela cheia, onde há espaço para ela.
- O botão de tela cheia, no cabeçalho do painel, abre o fluxograma ocupando a tela inteira, o que ajuda em códigos que crescem na horizontal. Lá dentro, **Espaço** ou **→** avançam um passo, **←** volta um passo, **Home** e **End** vão ao primeiro e ao último passo, **Esc** (ou o mesmo botão) sai, e o cabeçalho mostra o passo atual e essas teclas. As setas deixam de rolar o diagrama: para ver a parte que não cabe na tela use a roda do mouse, as barras de rolagem ou o toque. Se a execução chegar a um `input()`, a tela cheia fecha sozinha para você digitar o valor. A lógica fica em `static/js/fluxo-tela-cheia.js`, e o botão não aparece em navegadores sem suporte a tela cheia (como o Safari do iPhone).

Configuração em `env.conf`:

| Chave | Padrão | Efeito |
| --- | --- | --- |
| `USAR_FLUXOGRAMA` | `true` | Liga ou desliga o fluxograma. |
| `FLUXO_MAXIMO_NOS` | `150` | Máximo de blocos desenhados (o restante vira um bloco "resumido"). |
| `FLUXO_TAMANHO_MAXIMO_TEXTO` | `100` | Máximo de caracteres do texto de cada bloco no dado enviado ao navegador. |

## Layout do visualizador

Nas telas dos laboratórios (1366×768 ou menos) o visualizador usa duas colunas e procura mostrar, na primeira execução de um programa pequeno, tudo o que se usa a cada passo sem rolar a página.

- **Coluna da esquerda:** o card **Código**, os botões **Executar código**, **Limpar** e **Traduzir** e a **Navegação**, que aparece como uma barra fina, sem cabeçalho de card (e por isso não pode ser recolhida).
- **Coluna da direita:** as abas **Visualização** e **Fluxograma** (uma de cada vez), o card de entrada do `input()` e, embaixo, **Saída** e **Pilha de chamadas** lado a lado. A barra de abas só aparece depois da primeira execução, e a aba **Fluxograma** fica desabilitada quando não há fluxograma. Se ela estiver aberta e a execução seguinte não gerar fluxograma, a página volta sozinha para **Visualização**.
- **Alturas:** o painel da aba preenche o espaço ao lado do código e cresce com o conteúdo até `min(44rem, max(60vh, 25rem))` (cerca de 400 px numa janela de 640 px de altura e 570 px numa de 950 px); passando disso, rola por dentro. **Saída** e **Pilha de chamadas** também crescem com o conteúdo, mas só até `min(26rem, 52vh)` (cerca de 333 px numa janela de 640 px de altura e 416 px numa de 950 px), e depois rolam por dentro; os dois cards da faixa ficam sempre com a mesma altura. Com o código pequeno de uma primeira execução a faixa mede uns 117 px e tudo cabe na janela. O teto menor do painel mantém o início da faixa **Saída** | **Pilha de chamadas** perto dele; quando o painel e a faixa crescem juntos numa janela baixa, a página rola para chegar ao resto.
- **Compactação:** só no visualizador, o cabeçalho do site fica mais fino (sem o subtítulo) e os espaçamentos dos cards diminuem. O editor continua com 17 linhas visíveis.
- **Telas estreitas:** abaixo de 901 px de largura tudo volta a uma única coluna, com os espaçamentos e as alturas de antes. As abas continuam valendo.

A lógica das abas fica em `static/js/abas-direita.js`, e o estilo na seção "Visualizador: abas à direita e layout compacto" de `static/css/style.css`.

## Tradução de código

O botão **Traduzir**, ao lado de **Limpar** no card **Código**, liga e desliga a tradução das linhas do editor. Com ele ligado, passar o mouse sobre uma linha mostra, perto do ponteiro, essa linha em português simples (ou em inglês, conforme o idioma da página). Por exemplo, `if idade >= 18:` aparece como `se idade >= 18 então` e `total += valor` como `total aumenta em valor`.

- O recurso vem desligado e a escolha fica salva no navegador. Ele existe só no editor do card **Código**; os demais cards não mudam.
- A tradução é feita no navegador, uma linha por vez, sem executar o código e sem olhar as linhas vizinhas. Por isso, linhas soltas de listas, chamadas e textos de várias linhas podem ser mal interpretadas (o último item de uma lista aberta que é uma chamada, sem vírgula, aparece como `chame ...`). Palavras dentro de textos entre aspas e de comentários ficam como estão.
- Cobre os comandos mais comuns: `if`, `elif`, `else`, `for`, `while`, `def`, `class` (a classe-base vira "que herda de ..."), `return`, `break`, `continue`, `pass`, `try`, `except`, `finally`, `raise` (também `raise ... from ...`), `import`, `from`, `with`, `assert`, `del`, `global`, `nonlocal`, `yield`, decoradores e atribuições, inclusive `+=` e semelhantes e as em cadeia (`x = y = 0` vira `x e y recebem 0`). Instruções separadas por `;` na mesma linha são traduzidas uma a uma.
- Dentro das expressões, o português troca palavras e nomes de funções: `and` (`e`), `or` (`ou`), `not` (`não`), `is` (`é`) e `is not` (`não é`), `in` (`está em`, e `em` nos laços e nas compreensões), `if`, `else` e `for` em compreensões e condições de uma linha (`se`, `senão`, `para`), `lambda` (`função anônima`), `True`, `False` e `None` (`Verdadeiro`, `Falso`, `Nulo`) e, quando seguidos de parênteses, `print` (`escreva`), `input` (`leia`), `range` (`intervalo`), `len` (`tamanho`), `int` (`inteiro`), `float` (`real`), `str` (`texto`), `round` (`arredonda`), `max` (`maior`), `min` (`menor`), `sum` (`soma`), `abs` (`absoluto`), `sorted` (`ordenado`), `reversed` (`invertido`), `list` (`lista`), `tuple` (`tupla`), `dict` (`dicionário`), `set` (`conjunto`), `bool` (`lógico`), `type` (`tipo`), `enumerate` (`enumera`), `zip` (`combina`) e `pow` (`potência`). O inglês não troca palavras, porque o código já está em inglês, e os operadores (`>=`, `==`, `%`...) ficam como estão nos dois idiomas.
- Uma linha que é só uma chamada mostra uma frase: `notas.append(5.5)` aparece como `adicione 5.5 ao fim de notas`, e os métodos `extend`, `insert`, `remove`, `pop`, `sort`, `reverse`, `clear` e `update` também têm frase própria. As demais chamadas aparecem como `chame conta.depositar(50)` (em inglês, `call ...`). `print`, `input` e as outras funções da tabela seguem pela troca de palavras.
- Funciona só com o mouse. A caixa some ao sair do editor, rolar, editar o código, apertar `Esc` ou desligar o botão.
- As regras ficam em `static/js/traducao-codigo.js`, sem depender do navegador, e a ligação com o editor em `static/js/traducao-editor.js`.

## Atalhos de teclado

| Atalho | O que faz |
| --- | --- |
| `Ctrl` + `Enter` ou `R` | Executa o código (o `R` só quando você não está digitando). |
| `Ctrl` + `Delete` ou `C` | Limpa o editor e a execução (o `C` só quando você não está digitando). No editor, o `Ctrl` + `Delete` deixa de apagar a palavra seguinte, e o `Ctrl` + `Z` desfaz a limpeza. |
| `Alt` + `T` | Liga e desliga a tradução do código, até com o cursor no editor. |
| `→` ou `Espaço` | Avança um passo. |
| `←` | Volta um passo. |
| `Home` e `End` | Vão ao primeiro e ao último passo. |
| `Esc` | Põe o foco no editor; na tela cheia do fluxograma, sai da tela cheia. |

- Fora a exceção do `Ctrl` + `Enter` e do `Alt` + `T`, os atalhos não agem com o foco em campos de texto ou listas, como o campo do `input()`.
- Na tela cheia do fluxograma só valem as teclas de navegação e o `Esc`: executar, limpar e traduzir ficam inativos, e as setas, o `Home` e o `End` navegam pelos passos mesmo com o foco no diagrama.
- O `Ctrl` + `T` não serve para a tradução: o navegador o reserva para abrir uma nova aba e a página nunca recebe a tecla.
- As regras ficam em `static/js/atalhos.js`, sem depender do navegador, e a ligação com a página em `static/js/app.js`.

## Testes

Os testes usam apenas a biblioteca padrão. Os que exercitam o sandbox são pulados automaticamente se o Docker não estiver disponível:

```bash
python -m unittest discover -s tests -t . -v
```

Os testes da tradução de código (`tests/test_traducao_codigo.py`) executam o módulo JavaScript com o Node.js e também são pulados se ele não estiver instalado. Os das abas do visualizador (`tests/test_abas_direita.py`) conferem a estrutura de `templates/index.html` e as chaves de tradução e, com o Node.js, executam `static/js/abas-direita.js` sobre um DOM simulado. Os dos atalhos de teclado (`tests/test_atalhos.py`) e os das marcas do fluxograma (`tests/test_fluxo_marcas.py`) também executam módulos JavaScript no Node.js.

## Segurança

O código Python enviado pelos usuários é executado dentro de um **container Docker isolado** (definido em `docker/Dockerfile`), com:

- Sem acesso à rede (`--network none`).
- Sem acesso ao sistema de arquivos do host (nenhum diretório é montado no container).
- Sistema de arquivos do próprio container somente leitura, exceto uma área temporária pequena.
- Limites de memória, CPU e número de processos, além do timeout e do limite de passos já existentes.
- Usuário sem privilégios dentro do container.

Isso impede que o código executado leia ou modifique o código-fonte do projeto, acesse a rede ou consuma recursos além do previsto — mesmo em um deploy acessível pela internet.

Se o Docker não estiver disponível, a execução é recusada com um erro claro em vez de cair silenciosamente para um modo inseguro. Para desenvolvimento local sem Docker, é possível desativar o sandbox definindo `USAR_SANDBOX_DOCKER=false` em `env.conf` — **isso não deve ser usado em produção**, pois volta a executar o código diretamente na máquina host.
