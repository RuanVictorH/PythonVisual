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
- Fluxograma em tela cheia, com botão no cabeçalho do card; a tecla Espaço avança e Esc sai (veja [Fluxograma](#fluxograma)).
- Tradução de cada linha do código ao passar o mouse sobre o editor, com botão para ligar e desligar (veja [Tradução de código](#tradução-de-código)).

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

- `o Docker nao esta disponivel`: o Docker Desktop não está aberto ou ainda está iniciando. Abra o Docker Desktop e espere o ícone ficar estável antes de rodar um código.
- `docker build falhou`: confira se há espaço em disco e se há conexão com a internet na primeira execução (a imagem baixa `python:3.12-slim`).
- Para desenvolvimento local sem Docker instalado, veja a opção `USAR_SANDBOX_DOCKER=false` em [Segurança](#segurança) — não recomendada fora da sua própria máquina.

## Fluxograma

Ao executar um código, o card **Fluxograma** desenha o fluxo do programa a partir do próprio código do editor (não há outra caixa de texto). Cada linha executável vira um bloco (terminal, retângulo, losango ou paralelogramo) e, ao navegar pelos passos, o bloco da próxima linha fica em vermelho e o da linha já executada em verde, como no editor.

- Cada função, método e classe ganha um fluxograma próprio. Por padrão o card acompanha a função em execução; escolher outro no seletor (ou clicar num bloco de definição) fixa o gráfico, e o botão **Seguir execução** volta a acompanhar.
- A estrutura é montada com o módulo `ast` dentro do sandbox (`fluxo_builder.py`), então o código do usuário nunca é interpretado fora do container. A resposta de `/executar` continua sendo uma lista de passos; o fluxograma vai na chave `fluxo` do primeiro elemento.
- `match`, `async` e geradores aparecem simplificados, como um único bloco. Programas grandes têm o fluxograma resumido, e execuções interrompidas por timeout ou com erro de sintaxe não exibem o card.
- O botão de tela cheia, no cabeçalho do card, abre o fluxograma ocupando a tela inteira, o que ajuda em códigos que crescem na horizontal. Lá dentro, **Espaço** avança um passo, **Esc** (ou o mesmo botão) sai, e o cabeçalho mostra o passo atual. Se a execução chegar a um `input()`, a tela cheia fecha sozinha para você digitar o valor. A lógica fica em `static/js/fluxo-tela-cheia.js`, e o botão não aparece em navegadores sem suporte a tela cheia (como o Safari do iPhone).

Configuração em `env.conf`:

| Chave | Padrão | Efeito |
| --- | --- | --- |
| `USAR_FLUXOGRAMA` | `true` | Liga ou desliga o fluxograma. |
| `FLUXO_MAXIMO_NOS` | `150` | Máximo de blocos desenhados (o restante vira um bloco "resumido"). |
| `FLUXO_TAMANHO_MAXIMO_TEXTO` | `100` | Máximo de caracteres do texto de cada bloco no dado enviado ao navegador. |

## Tradução de código

O botão **Traduzir**, ao lado de **Limpar** no card **Código**, liga e desliga a tradução das linhas do editor. Com ele ligado, passar o mouse sobre uma linha mostra, perto do ponteiro, essa linha em português simples (ou em inglês, conforme o idioma da página). Por exemplo, `if idade >= 18:` aparece como `se idade >= 18 então` e `total += valor` como `total aumenta em valor`.

- O recurso vem desligado e a escolha fica salva no navegador. Ele existe só no editor do card **Código**; os demais cards não mudam.
- A tradução é feita no navegador, uma linha por vez, sem executar o código e sem olhar as linhas vizinhas. Por isso, linhas soltas de listas, chamadas e textos de várias linhas podem ser mal interpretadas. Palavras dentro de textos entre aspas e de comentários ficam como estão.
- Cobre os comandos mais comuns (`if`, `elif`, `else`, `for`, `while`, `def`, `class`, `return`, `break`, `continue`, `pass`, `try`, `except`, `finally`, `raise`, `import`, `from` e atribuições, inclusive `+=` e semelhantes). Nas demais linhas, o português troca só algumas palavras (`print` vira `escreva`, `len` vira `tamanho`, `and` vira `e`) e o inglês não mostra tradução.
- Funciona só com o mouse. A caixa some ao sair do editor, rolar, editar o código, apertar `Esc` ou desligar o botão.
- As regras ficam em `static/js/traducao-codigo.js`, sem depender do navegador, e a ligação com o editor em `static/js/traducao-editor.js`.

## Testes

Os testes usam apenas a biblioteca padrão. Os que exercitam o sandbox são pulados automaticamente se o Docker não estiver disponível:

```bash
python -m unittest discover -s tests -t . -v
```

Os testes da tradução de código (`tests/test_traducao_codigo.py`) executam o módulo JavaScript com o Node.js e também são pulados se ele não estiver instalado.

## Segurança

O código Python enviado pelos usuários é executado dentro de um **container Docker isolado** (definido em `docker/Dockerfile`), com:

- Sem acesso à rede (`--network none`).
- Sem acesso ao sistema de arquivos do host (nenhum diretório é montado no container).
- Sistema de arquivos do próprio container somente leitura, exceto uma área temporária pequena.
- Limites de memória, CPU e número de processos, além do timeout e do limite de passos já existentes.
- Usuário sem privilégios dentro do container.

Isso impede que o código executado leia ou modifique o código-fonte do projeto, acesse a rede ou consuma recursos além do previsto — mesmo em um deploy acessível pela internet.

Se o Docker não estiver disponível, a execução é recusada com um erro claro em vez de cair silenciosamente para um modo inseguro. Para desenvolvimento local sem Docker, é possível desativar o sandbox definindo `USAR_SANDBOX_DOCKER=false` em `env.conf` — **isso não deve ser usado em produção**, pois volta a executar o código diretamente na máquina host.
