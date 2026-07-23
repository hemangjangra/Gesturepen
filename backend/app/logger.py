"""
app/logger.py
Configures centralized logging for the application.
Directs output to separate info and error files, as well as the console,
ensuring detailed tracking and error tracebacks.
"""

import logging
import os
import sys

def setup_logger(app):
    """
    Sets up the centralized logging architecture.
    """
    # Ensure logs directory exists
    log_dir = 'logs'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # Define the core format: 
    # %(asctime)s = Timestamp
    # %(name)s = Module name where the log originated
    # %(levelname)s = Severity
    # %(message)s = The log message
    # Note: Python's logging module automatically appends error tracebacks 
    # if logged using logger.exception() or logger.error(..., exc_info=True)
    formatter = logging.Formatter(
        fmt='%(asctime)s - [%(name)s] - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # 1. Info File Handler (Captures INFO, WARNING, ERROR, CRITICAL)
    info_file_handler = logging.FileHandler(os.path.join(log_dir, 'info.log'))
    info_file_handler.setLevel(logging.INFO)
    info_file_handler.setFormatter(formatter)

    # 2. Error File Handler (Captures ONLY ERROR and CRITICAL)
    error_file_handler = logging.FileHandler(os.path.join(log_dir, 'error.log'))
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(formatter)

    # 3. Console Handler (Captures DEBUG or INFO depending on environment)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.DEBUG if app.debug else logging.INFO)

    # Clear any default handlers Flask might have injected
    app.logger.handlers.clear()
    
    # Attach our custom handlers to the Flask app logger
    app.logger.addHandler(info_file_handler)
    app.logger.addHandler(error_file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(logging.DEBUG if app.debug else logging.INFO)

    # CRITICAL: We also attach these handlers to the Python Root Logger.
    # This ensures that when your other modules (e.g., app.cv.gestures) use 
    # `logger = logging.getLogger(__name__)`, their logs will route through 
    # these exact same files and console formats.
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(logging.DEBUG if app.debug else logging.INFO)
    root_logger.addHandler(info_file_handler)
    root_logger.addHandler(error_file_handler)
    root_logger.addHandler(console_handler)

    app.logger.info("Centralized logging configured successfully.")
