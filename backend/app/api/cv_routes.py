"""
app/api/cv_routes.py
Defines the HTTP routes (endpoints) related to Computer Vision.
Uses a Flask Blueprint to keep routing modular.
Delegates business logic to the services layer.
"""

from flask import Blueprint, request, jsonify, current_app
from app.services.cv_service import process_gesture_service

cv_bp = Blueprint('cv', __name__)

@cv_bp.route('/process-gesture', methods=['POST'])
def process_gesture():
    """
    Endpoint to process gesture input (e.g., coordinates, images, video frames).
    Receives HTTP requests, validates input, calls the service, and returns HTTP response.
    """
    current_app.logger.info("Received request to /process-gesture")
    
    # Extract data from request
    data = request.json
    
    # Validation can be done here or in a separate validator utility
    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    # Delegate to service layer
    try:
        result = process_gesture_service(data)
        return jsonify({'status': 'success', 'data': result}), 200
    except Exception as e:
        current_app.logger.error(f"Error processing gesture: {e}")
        return jsonify({'error': str(e)}), 500
