"""
app/config.py
Manages application configurations using environment variables.
Provides a centralized object to access all settings across the app.
"""

import os
import logging
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

class Config:
    """Base configuration class mapping .env variables to Python properties."""
    
    # ---------------------------------------------------------
    # Core Application Settings
    # ---------------------------------------------------------
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key')
    
    # Debug mode (1 = True, 0 = False)
    DEBUG = os.environ.get('FLASK_DEBUG', '0') == '1'

    # ---------------------------------------------------------
    # Logging Settings
    # ---------------------------------------------------------
    # Acceptable values: DEBUG, INFO, WARNING, ERROR, CRITICAL
    LOGGING_LEVEL_NAME = os.environ.get('LOGGING_LEVEL', 'INFO').upper()

    @property
    def LOGGING_LEVEL(self) -> int:
        """Dynamically converts the string log level to the Python logging constant."""
        levels = {
            'DEBUG': logging.DEBUG,
            'INFO': logging.INFO,
            'WARNING': logging.WARNING,
            'ERROR': logging.ERROR,
            'CRITICAL': logging.CRITICAL
        }
        return levels.get(self.LOGGING_LEVEL_NAME, logging.INFO)

    # ---------------------------------------------------------
    # Camera & Video Feed Settings
    # ---------------------------------------------------------
    # Which hardware camera to use (0 is usually the built-in webcam)
    CAMERA_INDEX = int(os.environ.get('CAMERA_INDEX', 0))
    
    # Resolution for the capture feed and drawing canvas
    FRAME_WIDTH = int(os.environ.get('FRAME_WIDTH', 1280))
    FRAME_HEIGHT = int(os.environ.get('FRAME_HEIGHT', 720))

    # ---------------------------------------------------------
    # OCR Settings
    # ---------------------------------------------------------
    # EasyOCR language codes (comma separated in .env, e.g. "en,fr,de")
    _ocr_lang_raw = os.environ.get('OCR_LANGUAGE', 'en')
    OCR_LANGUAGE = [lang.strip() for lang in _ocr_lang_raw.split(',')]


class DevelopmentConfig(Config):
    """Development configuration overrides."""
    DEBUG = True
    LOGGING_LEVEL_NAME = 'DEBUG'


class ProductionConfig(Config):
    """Production configuration overrides."""
    DEBUG = False
    LOGGING_LEVEL_NAME = 'INFO'
