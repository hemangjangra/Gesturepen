"""
tests/test_camera.py
Unit tests for the Camera module using a mocked webcam.
"""

import pytest
import numpy as np
from unittest.mock import patch, MagicMock
from app.cv.camera import Camera

@patch('cv2.VideoCapture')
def test_camera_open_success(mock_vidcap):
    # Setup mock to pretend camera opened successfully
    mock_instance = MagicMock()
    mock_instance.isOpened.return_value = True
    mock_vidcap.return_value = mock_instance
    
    # Test using the context manager
    with Camera(0) as cam:
        assert cam.cap is not None
        mock_vidcap.assert_called_with(0)

@patch('cv2.VideoCapture')
def test_camera_read_frame(mock_vidcap):
    # Setup mock to return a dummy frame
    mock_instance = MagicMock()
    mock_instance.isOpened.return_value = True
    dummy_frame = np.zeros((10, 10, 3), dtype=np.uint8)
    mock_instance.read.return_value = (True, dummy_frame)
    mock_vidcap.return_value = mock_instance
    
    with Camera(0) as cam:
        frame = cam.read_frame()
        assert frame is not None
        assert frame.shape == (10, 10, 3)
        assert np.array_equal(frame, dummy_frame)
