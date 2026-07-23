"""
app.py
Main entry point and application factory for the AirWrite AI backend.
This file sets up the Flask server, registers blueprints, configures logging,
loads environment variables, and enables CORS.
"""

import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from the .env file before anything else
load_dotenv()

# Import configurations, loggers, and blueprints from the 'app' package
from app.config import Config
from app.logger import setup_logger
from app.api.routes import api_bp

def create_app(config_class=Config):
    """
    Application Factory: Creates and configures the Flask application.
    This prepares the project for testing and multiple instances.
    """
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_class)

    # Configure Database URI if not set in environment
    if not app.config.get('SQLALCHEMY_DATABASE_URI'):
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///airwrite.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize Database Extension
    from app.db.models import db
    db.init_app(app)
    
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()

    # Enable CORS for all domains on all routes
    # For production, this should be restricted to specific origins
    CORS(app)

    # Configure centralized logging
    setup_logger(app)

    # Register Blueprints
    # This structure prepares the project for future API routes 
    # (e.g., app.register_blueprint(auth_bp, url_prefix='/api/v1/auth'))
    app.register_blueprint(api_bp, url_prefix='/api/v1')

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint to verify the API is running and accessible."""
        app.logger.info("Health check endpoint was called.")
        return jsonify({
            'status': 'healthy',
            'service': 'AirWrite AI API',
            'version': '1.0'
        }), 200

    return app


if __name__ == '__main__':
    # Initialize the app
    application = create_app()
    
    # Fetch runtime configurations from environment
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_DEBUG', '1') == '1'
    
    # Run the server
    application.run(host='0.0.0.0', port=port, debug=debug_mode)
