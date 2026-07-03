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

## Como rodar

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

Depois acesse:

```text
http://127.0.0.1:5000/
```

## Aviso

Este projeto é apenas didático/local. O timeout ajuda a evitar travamentos, mas não substitui um sandbox real com isolamento de sistema de arquivos, rede e permissões.
