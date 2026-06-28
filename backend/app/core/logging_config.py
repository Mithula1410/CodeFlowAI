import os
import logging
from logging.handlers import RotatingFileHandler

# Define logs path relative to backend root
LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)

# Formatter
log_formatter = logging.Formatter(
    '[%(asctime)s] %(levelname)s [%(name)s.%(funcName)s:%(lineno)d] - %(message)s'
)

# Rotate logs after 10MB, keep 5 backups
MAX_BYTES = 10 * 1024 * 1024
BACKUP_COUNT = 5

def setup_logging():
    # Root Logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Clean previous handlers
    root_logger.handlers.clear()

    # Stream Handler (console)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(log_formatter)
    console_handler.setLevel(logging.INFO)
    root_logger.addHandler(console_handler)

    # General App Log Handler
    app_log_path = os.path.join(LOGS_DIR, "app.log")
    app_handler = RotatingFileHandler(app_log_path, maxBytes=MAX_BYTES, backupCount=BACKUP_COUNT)
    app_handler.setFormatter(log_formatter)
    app_handler.setLevel(logging.INFO)
    root_logger.addHandler(app_handler)

    # Error Log Handler
    err_log_path = os.path.join(LOGS_DIR, "error.log")
    err_handler = RotatingFileHandler(err_log_path, maxBytes=MAX_BYTES, backupCount=BACKUP_COUNT)
    err_handler.setFormatter(log_formatter)
    err_handler.setLevel(logging.ERROR)
    root_logger.addHandler(err_handler)

    # Access Log Handler
    access_logger = logging.getLogger("access")
    access_logger.setLevel(logging.INFO)
    access_logger.propagate = False  # Avoid duplicates in standard root app log
    
    access_log_path = os.path.join(LOGS_DIR, "access.log")
    access_handler = RotatingFileHandler(access_log_path, maxBytes=MAX_BYTES, backupCount=BACKUP_COUNT)
    access_formatter = logging.Formatter('[%(asctime)s] %(message)s')
    access_handler.setFormatter(access_formatter)
    access_logger.addHandler(access_handler)

setup_logging()

# Convenient handles
logger = logging.getLogger("app")
access_logger = logging.getLogger("access")
