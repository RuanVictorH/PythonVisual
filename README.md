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

## Requisitos

- Python 3.10+
- [Docker](https://www.docker.com/products/docker-desktop/) instalado e em execução — o código enviado pelos usuários roda dentro de um container isolado (sem acesso à rede, ao disco do host ou a outros processos). Veja [Segurança](#segurança) abaixo.

## Como rodar

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Na primeira execução de um código, a imagem Docker do sandbox (`docker/Dockerfile`) é construída automaticamente — pode levar alguns segundos a mais nesse primeiro uso.

Depois acesse:

```text
http://127.0.0.1:5000/
```

Para reativar o modo debug do Flask em desenvolvimento local (recarregamento automático):

```bash
PYTHONVISUAL_DEBUG=true python app.py
```

## Segurança

O código Python enviado pelos usuários é executado dentro de um **container Docker isolado** (definido em `docker/Dockerfile`), com:

- Sem acesso à rede (`--network none`).
- Sem acesso ao sistema de arquivos do host (nenhum diretório é montado no container).
- Sistema de arquivos do próprio container somente leitura, exceto uma área temporária pequena.
- Limites de memória, CPU e número de processos, além do timeout e do limite de passos já existentes.
- Usuário sem privilégios dentro do container.

Isso impede que o código executado leia ou modifique o código-fonte do projeto, acesse a rede ou consuma recursos além do previsto — mesmo em um deploy acessível pela internet.

Se o Docker não estiver disponível, a execução é recusada com um erro claro em vez de cair silenciosamente para um modo inseguro. Para desenvolvimento local sem Docker, é possível desativar o sandbox definindo `USAR_SANDBOX_DOCKER=false` em `env.conf` — **isso não deve ser usado em produção**, pois volta a executar o código diretamente na máquina host.
