"""
app/cv/ocr.py
Optical Character Recognition module using EasyOCR.
Extracts text and confidence scores from preprocessed canvas images.
"""

import easyocr
import numpy as np
import logging
from typing import Dict, Union

# Initialize module logger
logger = logging.getLogger(__name__)


class OCRService:
    """
    Service class for Optical Character Recognition using EasyOCR.
    Designed to be instantiated once per application lifecycle to avoid 
    costly model reloading.
    """
    
    def __init__(self, languages: list = ['en'], gpu: bool = False):
        """
        Initializes the EasyOCR reader.
        
        Args:
            languages (list): List of language codes to recognize (default: ['en']).
            gpu (bool): Whether to use GPU acceleration if available. 
                        Defaults to False for wider compatibility out-of-the-box.
        """
        try:
            logger.info(f"Initializing EasyOCR models for languages: {languages}. GPU Enabled: {gpu}")
            # Initialize the reader. This downloads models on first run if missing, 
            # and loads them into memory.
            self.reader = easyocr.Reader(languages, gpu=gpu)
            logger.info("EasyOCR initialized successfully.")
        except Exception as e:
            logger.error(f"Critical failure initializing EasyOCR: {e}")
            # Raise exception here because without the model, this service is useless
            raise RuntimeError(f"OCR Initialization failed: {e}")

    def recognize(self, image: np.ndarray) -> Dict[str, Union[str, float]]:
        """
        Performs OCR on a given image.
        
        Args:
            image (np.ndarray): The preprocessed image array (numpy array).
            
        Returns:
            Dict: A dictionary containing:
                - 'text' (str): The recognized string.
                - 'confidence' (float): The average confidence score [0.0 - 1.0].
        """
        result = {
            'text': '',
            'confidence': 0.0
        }
        
        # Validate input
        if image is None or not isinstance(image, np.ndarray) or image.size == 0:
            logger.warning("Invalid or empty image provided to OCRService.")
            return result
            
        try:
            # easyocr.readtext returns a list of tuples: (bounding_box, text, confidence)
            detections = self.reader.readtext(image)
            
            if not detections:
                logger.debug("No text detected in the image.")
                return result
                
            # If multiple bounding boxes are found, concatenate the text 
            # and calculate the average confidence score across all boxes.
            full_text = []
            total_confidence = 0.0
            
            for bbox, text, conf in detections:
                full_text.append(text)
                total_confidence += conf
                
            result['text'] = ' '.join(full_text).strip()
            result['confidence'] = float(total_confidence / len(detections))
            
            logger.debug(f"OCR recognized: '{result['text']}' (Conf: {result['confidence']:.2f})")
            
        except Exception as e:
            # Catch all exceptions during inference to prevent application crashes.
            # Return graceful default values instead.
            logger.error(f"Error occurred during OCR recognition inference: {e}")
            
        return result
