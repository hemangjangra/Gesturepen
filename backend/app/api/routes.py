"""
app/api/routes.py
REST API endpoints for the AirWrite AI backend.
Adheres to clean architecture by strictly handling HTTP request/response 
parsing and delegating all core business logic to the service layer.
"""

from flask import Blueprint, jsonify, request, current_app

# Import business logic handlers from the service layer
from app.services.cv_service import (
    start_service, 
    stop_service, 
    clear_service, 
    recognize_service
)

api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health_check():
    """
    API Health check endpoint.
    Useful for load balancers or frontend to verify the API is responsive.
    """
    return jsonify({
        'status': 'healthy',
        'module': 'api_routes'
    }), 200

@api_bp.route('/start', methods=['POST'])
def start():
    """
    Starts the video capture and gesture tracking session.
    Accepts optional configuration via JSON payload.
    """
    try:
        config = request.json if request.is_json else {}
        current_app.logger.info("Handling /start request")
        
        # Delegate to service layer
        result = start_service(config)
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in POST /start: {e}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/stop', methods=['POST'])
def stop():
    """
    Stops the active video capture and releases camera resources.
    """
    try:
        current_app.logger.info("Handling /stop request")
        
        # Delegate to service layer
        result = stop_service()
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in POST /stop: {e}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/clear', methods=['POST'])
def clear():
    """
    Clears the drawing canvas.
    """
    try:
        current_app.logger.info("Handling /clear request")
        
        # Delegate to service layer
        result = clear_service()
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in POST /clear: {e}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/recognize', methods=['POST'])
def recognize():
    """
    Triggers Optical Character Recognition (OCR) on the current canvas state.
    """
    try:
        current_app.logger.info("Handling /recognize request")
        
        payload = request.json if request.is_json else {}
        base64_img = payload.get('image')
        
        # Delegate to service layer
        result = recognize_service(base64_img)
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in POST /recognize: {e}")
        return jsonify({'error': str(e)}), 500
