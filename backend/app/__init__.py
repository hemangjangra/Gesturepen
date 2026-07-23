"""
app/__init__.py
Initializes the Flask application and registers blueprints.
Follows the Application Factory pattern to allow for multiple instances
and testing.
"""

from flask import Flask
from app.config import Config
from app.logger import setup_logger

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Logger
    setup_logger(app)

    # Register Blueprints
    from app.api.cv_routes import cv_bp
    app.register_blueprint(cv_bp, url_prefix='/api/v1/cv')

    @app.route('/health', methods=['GET'])
    def health_check():
        """Basic health check endpoint"""
        return {'status': 'healthy', 'service': 'AirWrite AI API'}, 200

    return app
