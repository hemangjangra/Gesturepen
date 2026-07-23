"""
app/cv/camera.py
Provides a production-ready module for webcam operations using OpenCV.
Handles resource management and provides reliable error handling.
"""

import logging
from typing import Generator, Optional

import cv2
import numpy as np

# Configure module-level logger
logger = logging.getLogger(__name__)


class Camera:
    """
    A class to interact with the webcam using OpenCV.
    
    This class handles opening the camera, reading frames, and releasing
    resources properly. It can be used as a context manager to ensure 
    that camera resources are always freed, even if exceptions occur.
    """

    def __init__(self, camera_index: int = 0):
        """
        Initializes the Camera instance.

        Args:
            camera_index (int): The index of the video capture device.
                                Defaults to 0 (usually the built-in webcam).
        """
        self.camera_index = camera_index
        self.cap: Optional[cv2.VideoCapture] = None

    def __enter__(self) -> 'Camera':
        """
        Context manager entry. Opens the camera.
        
        Returns:
            Camera: The initialized Camera instance.
        """
        self.open()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """
        Context manager exit. Ensures the camera is released.
        """
        self.release()

    def open(self) -> None:
        """
        Opens the video capture device.

        Raises:
            RuntimeError: If the camera cannot be opened or initialized.
        """
        if self.cap is not None and self.cap.isOpened():
            logger.warning(f"Camera {self.camera_index} is already open.")
            return

        logger.info(f"Attempting to open camera with index {self.camera_index}...")
        self.cap = cv2.VideoCapture(self.camera_index)
        
        if not self.cap.isOpened():
            error_msg = f"Failed to open camera with index {self.camera_index}."
            logger.error(error_msg)
            raise RuntimeError(error_msg)
            
        logger.info(f"Camera {self.camera_index} opened successfully.")

    def read_frame(self) -> Optional[np.ndarray]:
        """
        Reads a single frame from the camera.

        Returns:
            Optional[np.ndarray]: The frame as a NumPy array if successful, 
                                  otherwise None.
        """
        if self.cap is None or not self.cap.isOpened():
            logger.error("Attempted to read from an unopened camera.")
            return None

        success, frame = self.cap.read()
        
        if not success:
            logger.error("Failed to read frame from camera. The camera might be disconnected.")
            return None

        return frame

    def read_continuously(self) -> Generator[np.ndarray, None, None]:
        """
        A generator that continuously yields frames from the camera.
        
        This method will automatically open the camera if it isn't already open,
        and will release the camera when the loop is terminated or an error occurs.

        Yields:
            np.ndarray: The next frame captured by the camera.
        """
        if self.cap is None or not self.cap.isOpened():
            self.open()
            
        logger.info("Starting continuous frame capture...")
        try:
            while True:
                frame = self.read_frame()
                if frame is None:
                    # Break the loop if we fail to read a frame (e.g., camera disconnected)
                    logger.warning("Stopping continuous capture due to frame read failure.")
                    break
                yield frame
        finally:
            # Ensure resources are released when the generator is exhausted or interrupted
            self.release()

    def release(self) -> None:
        """
        Releases the video capture device and frees system resources.
        """
        if self.cap is not None and self.cap.isOpened():
            self.cap.release()
            self.cap = None
            logger.info(f"Camera {self.camera_index} resources released.")
        else:
            logger.debug(f"Camera {self.camera_index} was already released or never opened.")
