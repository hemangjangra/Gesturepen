"""
app/services/recognition_service.py
Pure Python business logic for orchestrating optical character recognition.
Coordinates image preprocessing and the OCR engine, completely decoupled from web frameworks.
"""

import numpy as np
import logging
from typing import Dict, Union, Tuple, List

from app.cv.preprocess import OCRPreprocessor
from app.cv.ocr import OCRService

logger = logging.getLogger(__name__)


class RecognitionService:
    """
    Coordinates the pipeline from raw canvas image to recognized text.
    Maintains instances of the Preprocessor and OCR engine so models remain loaded in memory.
    """

    def __init__(
        self, 
        target_size: Tuple[int, int] = (128, 128), 
        languages: List[str] = ['en'], 
        gpu: bool = False
    ):
        """
        Initializes the recognition pipeline components.
        
        Args:
            target_size (tuple): Target size for the preprocessed image.
            languages (list): Languages for OCR.
            gpu (bool): Whether to enable GPU for OCR.
        """
        logger.info("Initializing RecognitionService pipeline...")
        
        # We set invert_final=True because EasyOCR typically performs better 
        # reading dark text on a light background.
        self.preprocessor = OCRPreprocessor(target_size=target_size, invert_final=True)
        
        self.ocr_engine = OCRService(languages=languages, gpu=gpu)
        
        logger.info("RecognitionService pipeline ready.")

    def recognize_text(self, canvas_image: np.ndarray) -> Dict[str, Union[str, float]]:
        """
        Takes a raw canvas drawing, cleans it via preprocessing, and extracts text.

        Args:
            canvas_image (np.ndarray): The raw BGR image array from the drawing canvas.

        Returns:
            Dict: Dictionary containing 'text' (str) and 'confidence' (float).
        """
        default_result = {'text': '', 'confidence': 0.0}
        
        if canvas_image is None or not isinstance(canvas_image, np.ndarray) or canvas_image.size == 0:
            logger.warning("Empty or invalid canvas image provided to RecognitionService.")
            return default_result

        try:
            # Step 1: Preprocess the raw, messy canvas into a clean, normalized, centered format
            logger.debug("Preprocessing canvas image for OCR...")
            clean_image = self.preprocessor.process(canvas_image)
            
            # Step 2: Run the OCR engine on the clean image
            logger.debug("Running OCR inference on preprocessed image...")
            result = self.ocr_engine.recognize(clean_image)
            
            return result
            
        except Exception as e:
            logger.error(f"Critical failure during recognition pipeline: {e}")
            return default_result
