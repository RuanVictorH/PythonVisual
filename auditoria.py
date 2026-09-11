import json
import logging
import re
import sys
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from pathlib import Path

from executor import CONFIG

USAR_LOG_AUDITORIA = CONFIG.get("USAR_LOG_AUDITORIA", "true").strip().lower() != "false"
LOG_AUDITORIA_ARQUIVO = CONFIG.get("LOG_AUDITORIA_ARQUIVO", "auditoria.log")
LOG_AUDITORIA_TAMANHO_MAXIMO_BYTES = int(
    CONFIG.get("LOG_AUDITORIA_TAMANHO_MAXIMO_BYTES", 10 * 1024 * 1024)
)
LOG_AUDITORIA_BACKUPS = int(CONFIG.get("LOG_AUDITORIA_BACKUPS", 10))
TAMANHO_MAXIMO_CODIGO_LOG = int(CONFIG.get("TAMANHO_MAXIMO_CODIGO_LOG", 20000))

DIRETORIO_LOGS = Path(__file__).with_name("logs")

PADRAO_TIPO_ERRO = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*):")

_logger = logging.getLogger("pythonvisual.auditoria")


def _configurar_logger():
    if not USAR_LOG_AUDITORIA:
        return None
    try:
        DIRETORIO_LOGS.mkdir(exist_ok=True)
        manipulador = RotatingFileHandler(
            DIRETORIO_LOGS / LOG_AUDITORIA_ARQUIVO,
            maxBytes=LOG_AUDITORIA_TAMANHO_MAXIMO_BYTES,
            backupCount=LOG_AUDITORIA_BACKUPS,
            encoding="utf-8",
        )
        manipulador.setFormatter(logging.Formatter("%(message)s"))
        _logger.propagate = False
        _logger.setLevel(logging.INFO)
        if not _logger.handlers:
            _logger.addHandler(manipulador)
        return _logger
    except Exception as exc:
        print(f"Aviso: log de auditoria desativado ({exc}).", file=sys.stderr)
        return None


_logger_pronto = _configurar_logger()


def _codigo_para_log(codigo):
    texto = codigo if isinstance(codigo, str) else str(codigo)
    if len(texto) <= TAMANHO_MAXIMO_CODIGO_LOG:
        return texto
    cortados = len(texto) - TAMANHO_MAXIMO_CODIGO_LOG
    return (
        texto[:TAMANHO_MAXIMO_CODIGO_LOG]
        + f"\n... [código truncado: {cortados} caracteres omitidos]"
    )


def _classificar_resultado(execucoes):
    ultimo = execucoes[-1] if isinstance(execucoes, list) and execucoes else {}
    erro = ultimo.get("erro") if isinstance(ultimo, dict) else None
    if not erro:
        return "sucesso", None, None

    correspondencia = PADRAO_TIPO_ERRO.match(erro)
    tipo_erro = correspondencia.group(1) if correspondencia else "DesconhecidoErro"
    return f"erro:{tipo_erro}", tipo_erro, erro


def registrar_execucao(requisicao, codigo, execucoes):
    if not _logger_pronto:
        return
    try:
        resultado, tipo_erro, erro_mensagem = _classificar_resultado(execucoes)
        linha = json.dumps(
            {
                "data_hora": datetime.now(timezone.utc).isoformat(),
                "ip": requisicao.remote_addr,
                "resultado": resultado,
                "tipo_erro": tipo_erro,
                "erro_mensagem": erro_mensagem,
                "codigo": _codigo_para_log(codigo),
            },
            ensure_ascii=False,
        )
        _logger.info(linha)
    except Exception:
        _logger.exception("Falha ao registrar auditoria de execução.")
