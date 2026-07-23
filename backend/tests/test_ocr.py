"""
tests/test_ocr.py
Unit tests for the OCRService module.
"""

from unittest.mock import patch
from app.cv.ocr import OCRService
import numpy as np

@patch('easyocr.Reader')
def test_ocr_recognize(mock_reader_class):
    # Setup mock to prevent downloading real OCR models during testing
    mock_reader = mock_reader_class.return_value
    
    # easyocr.readtext returns [(bounding_box, text, confidence), ...]
    mock_reader.readtext.return_value = [
        ([[(0,0), (10,0), (10,10), (0,10)]], "Hello", 0.9),
        ([[(10,0), (20,0), (20,10), (10,10)]], "World", 0.8)
    ]
    
    ocr = OCRService()
    dummy_image = np.zeros((100, 100, 3), dtype=np.uint8)
    
    result = ocr.recognize(dummy_image)
    
    # It should concatenate multiple text boxes and average the confidence
    assert result['text'] == "Hello World"
    assert result['confidence'] == 0.85

def test_ocr_invalid_image():
    # If a real instance receives a bad image, it should fail gracefully
    with patch('easyocr.Reader'):
        ocr = OCRService()
        result = ocr.recognize(None)
        
        assert result['text'] == ""
        assert result['confidence'] == 0.0
