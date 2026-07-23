"""
app/cv/preprocess.py
Handles image preprocessing for Optical Character Recognition (OCR).
Transforms the raw, messy canvas drawing into a clean, normalized format for ML models.
"""

import cv2
import numpy as np
from typing import Tuple


class OCRPreprocessor:
    """
    Preprocesses drawing canvas images to optimize them for OCR engines.
    """

    def __init__(
        self,
        target_size: Tuple[int, int] = (128, 128),
        padding: int = 16,
        invert_final: bool = False
    ):
        """
        Initializes the OCR Preprocessor.

        Args:
            target_size (Tuple[int, int]): Final (width, height) of the processed image.
            padding (int): Pixel padding to leave around the centered drawing.
            invert_final (bool): Set to True if your OCR model expects black text on a 
                                 white background. (Defaults to white text on black).
        """
        self.target_size = target_size
        self.padding = padding
        self.invert_final = invert_final

    def process(self, image: np.ndarray) -> np.ndarray:
        """
        Executes the full preprocessing pipeline.

        Args:
            image (np.ndarray): The raw BGR canvas image.

        Returns:
            np.ndarray: The processed, normalized, OCR-ready image.
        """
        # 1. Convert to Grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # 2. Thresholding (Binarization)
        # Using Otsu's thresholding to automatically find the optimal threshold value.
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Ensure we have a white drawing on a black background for the bounding box logic.
        # If the background is mostly white (more white pixels than black), invert it.
        white_pixels = np.sum(thresh == 255)
        black_pixels = np.sum(thresh == 0)
        
        if white_pixels > black_pixels:
            thresh = cv2.bitwise_not(thresh)

        # 3. Noise Removal
        # Median blur is excellent for removing salt-and-pepper noise while preserving sharp edges.
        denoised = cv2.medianBlur(thresh, 3)

        # 4. Center the drawing
        centered = self._center_and_crop(denoised)

        # 5. Resize to target dimensions
        # INTER_AREA is the preferred interpolation method for shrinking images down.
        final_img = cv2.resize(centered, self.target_size, interpolation=cv2.INTER_AREA)

        # 6. Apply final inversion if requested by the OCR model requirements
        if self.invert_final:
            final_img = cv2.bitwise_not(final_img)

        return final_img

    def _center_and_crop(self, binarized_img: np.ndarray) -> np.ndarray:
        """
        Finds the drawing, crops to its tight bounding box, and centers it in a perfect square.
        
        Args:
            binarized_img (np.ndarray): Binary image (white text on black background).
            
        Returns:
            np.ndarray: Centered square image.
        """
        # Find all non-zero (white) pixels representing the actual stroke
        coords = cv2.findNonZero(binarized_img)
        
        if coords is None:
            # The canvas is entirely blank. Return a blank square safely.
            return np.zeros((self.target_size[1], self.target_size[0]), dtype=np.uint8)

        # Get the tight bounding box encompassing the drawing
        x, y, w, h = cv2.boundingRect(coords)

        # Crop out all the empty dead space
        cropped = binarized_img[y:y+h, x:x+w]

        # Calculate the size of the new square canvas.
        # It needs to be a square that fits the longest dimension of the drawing, plus padding.
        longest_side = max(w, h)
        padded_size = longest_side + (self.padding * 2)

        # Create a new black square canvas
        square_canvas = np.zeros((padded_size, padded_size), dtype=np.uint8)

        # Calculate x and y offsets to mathematically center the cropped drawing inside the square
        x_offset = (padded_size - w) // 2
        y_offset = (padded_size - h) // 2

        # Paste the cropped drawing into the dead center of the square canvas
        square_canvas[y_offset:y_offset+h, x_offset:x_offset+w] = cropped

        return square_canvas
