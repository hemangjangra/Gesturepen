"""
app/services/cv_service.py
Contains business logic for Computer Vision features.
Acts as a bridge between the API routes and the core CV modules.
Ensures clean architecture by isolating domain logic from framework specifics (Flask requests/responses).
"""

import logging
import base64
import numpy as np
import cv2
from app.cv.ocr import OCRService

logger = logging.getLogger(__name__)

# Lazy singleton to avoid loading OCR on import
_ocr_service = None

def get_ocr_service():
    global _ocr_service
    if _ocr_service is None:
        _ocr_service = OCRService(languages=['en'])
    return _ocr_service

def start_service(config=None):
    logger.debug("start_service called")
    return {'status': 'success', 'message': 'Client-side workspace started'}

def stop_service():
    logger.debug("stop_service called")
    return {'status': 'success', 'message': 'Client-side workspace stopped'}

def clear_service():
    logger.debug("clear_service called")
    return {'status': 'success', 'message': 'Canvas cleared'}

def recognize_service(base64_image_str=None):
    logger.debug("recognize_service called")
    if not base64_image_str:
        return {'status': 'error', 'message': 'No image provided'}
        
    try:
        if ',' in base64_image_str:
            base64_image_str = base64_image_str.split(',')[1]
            
        img_data = base64.b64decode(base64_image_str)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {'status': 'error', 'message': 'Failed to decode image'}
            
        ocr = get_ocr_service()
        result = ocr.recognize(img)
        
        return {'status': 'success', 'text': result['text'], 'confidence': result['confidence']}
    except Exception as e:
        logger.error(f"Error in recognize_service: {e}")
        return {'status': 'error', 'message': str(e)}
