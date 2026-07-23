"""
tests/test_detector.py
Unit tests for the HandDetector module.
"""

import numpy as np
from app.cv.detector import HandDetector
from unittest.mock import patch

def test_hand_detector_initialization():
    detector = HandDetector(max_hands=1)
    assert detector.max_hands == 1
    detector.close()

@patch('mediapipe.solutions.hands.Hands')
def test_process_frame_no_hands(mock_hands_class):
    # Setup mock so MediaPipe returns no hands detected
    mock_hands_instance = mock_hands_class.return_value
    mock_result = mock_hands_instance.process.return_value
    mock_result.multi_hand_landmarks = None
    
    detector = HandDetector()
    frame = np.zeros((100, 100, 3), dtype=np.uint8)
    processed_frame, hands_data = detector.process_frame(frame)
    
    # Assert frame is returned unharmed and hands_data is empty
    assert processed_frame.shape == (100, 100, 3)
    assert len(hands_data) == 0
    detector.close()
