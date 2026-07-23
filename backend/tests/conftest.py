"""
tests/conftest.py
Shared pytest fixtures for the testing suite.
Provides a test client and in-memory database configuration.
"""

import pytest
import numpy as np
from app import create_app
from app.db.models import db

@pytest.fixture
def app():
    """Provides a Flask application instance configured for testing."""
    class TestConfig:
        TESTING = True
        SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:' # Use fast in-memory DB
        SQLALCHEMY_TRACK_MODIFICATIONS = False
        SECRET_KEY = 'test-secret'
        CAMERA_INDEX = 0
        FRAME_WIDTH = 640
        FRAME_HEIGHT = 480
        OCR_LANGUAGE = ['en']
        LOGGING_LEVEL_NAME = 'CRITICAL' # Silence logs during tests
        
    app = create_app(TestConfig)
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Provides a Flask test client for simulating HTTP requests."""
    return app.test_client()

@pytest.fixture
def dummy_frame():
    """Provides a blank 640x480 BGR image array for CV testing."""
    return np.zeros((480, 640, 3), dtype=np.uint8)
