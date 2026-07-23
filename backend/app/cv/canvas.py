"""
app/cv/canvas.py
Provides a virtual drawing canvas utilizing NumPy and OpenCV.
Maintains state, supports history (undo/redo), and handles file saving.
"""

import cv2
import numpy as np
import os
import logging
from typing import List, Tuple

# Initialize module logger
logger = logging.getLogger(__name__)


class VirtualCanvas:
    """
    A virtual drawing surface that manages its own image state and 
    history stacks for seamless undo and redo operations.
    """

    def __init__(
        self, 
        width: int = 1280, 
        height: int = 720, 
        bg_color: Tuple[int, int, int] = (0, 0, 0), 
        max_history: int = 50
    ):
        """
        Initializes the virtual canvas.

        Args:
            width (int): Canvas width in pixels.
            height (int): Canvas height in pixels.
            bg_color (Tuple[int, int, int]): Background color in BGR format. Default is black.
            max_history (int): Maximum number of states to keep in the undo stack to prevent memory overflow.
        """
        self.width = width
        self.height = height
        self.bg_color = bg_color
        self.max_history = max_history
        
        # The main drawing surface
        self.canvas = self._create_blank_canvas()
        
        # History stacks containing NumPy arrays (image states)
        self.undo_stack: List[np.ndarray] = []
        self.redo_stack: List[np.ndarray] = []

    def _create_blank_canvas(self) -> np.ndarray:
        """
        Creates and returns a new blank NumPy array filled with the background color.
        """
        return np.full((self.height, self.width, 3), self.bg_color, dtype=np.uint8)

    def save_state(self) -> None:
        """
        Saves the current state of the canvas to the undo stack.
        This must be called BEFORE making a drawing operation that you want to be undoable
        (e.g., right when the user 'presses the pen down').
        """
        # Save a copy of the array, otherwise it passes by reference
        self.undo_stack.append(self.canvas.copy())
        
        # Prevent memory leaks by capping the history size
        if len(self.undo_stack) > self.max_history:
            self.undo_stack.pop(0)
            
        # Any new, distinct action invalidates the redo history
        self.redo_stack.clear()

    def add_stroke(self, points: List[Tuple[int, int]], color: Tuple[int, int, int] = (255, 255, 255), thickness: int = 5) -> None:
        """
        Draws a complete continuous stroke from a list of points.
        Automatically registers as a single undoable action.

        Args:
            points (List[Tuple[int, int]]): Ordered list of (x, y) coordinate tuples.
            color (Tuple[int, int, int]): BGR color tuple.
            thickness (int): Thickness of the stroke.
        """
        if not points or len(points) < 2:
            return
            
        self.save_state()
        
        for i in range(1, len(points)):
            pt1 = points[i - 1]
            pt2 = points[i]
            cv2.line(self.canvas, pt1, pt2, color, thickness)

    def draw_line(self, pt1: Tuple[int, int], pt2: Tuple[int, int], color: Tuple[int, int, int] = (255, 255, 255), thickness: int = 5) -> None:
        """
        Draws a single line segment directly onto the canvas.
        NOTE: This does NOT automatically save state. It is designed for real-time 
        frame-by-frame drawing where you manually call `save_state()` once at the start.

        Args:
            pt1 (Tuple[int, int]): Starting (x, y) coordinate.
            pt2 (Tuple[int, int]): Ending (x, y) coordinate.
            color (Tuple[int, int, int]): BGR color tuple.
            thickness (int): Thickness of the line.
        """
        cv2.line(self.canvas, pt1, pt2, color, thickness)

    def clear(self) -> None:
        """
        Clears the canvas by filling it with the background color. 
        This is an undoable action.
        """
        self.save_state()
        self.canvas = self._create_blank_canvas()
        logger.debug("Canvas cleared.")

    def undo(self) -> bool:
        """
        Reverts the canvas to the previous state.

        Returns:
            bool: True if undo was successful, False if the stack was empty.
        """
        if not self.undo_stack:
            logger.debug("Undo ignored: No history available.")
            return False
            
        # Push current state to redo stack before overwriting
        self.redo_stack.append(self.canvas.copy())
        
        # Pop previous state and apply it
        self.canvas = self.undo_stack.pop()
        return True

    def redo(self) -> bool:
        """
        Reapplies a previously undone state.

        Returns:
            bool: True if redo was successful, False if the stack was empty.
        """
        if not self.redo_stack:
            logger.debug("Redo ignored: No redo history available.")
            return False
            
        # Push current state to undo stack before overwriting
        self.undo_stack.append(self.canvas.copy())
        
        # Pop future state and apply it
        self.canvas = self.redo_stack.pop()
        return True

    def get_image(self) -> np.ndarray:
        """
        Returns the current NumPy array representing the canvas.
        
        Returns:
            np.ndarray: The canvas image.
        """
        return self.canvas

    def save_image(self, filepath: str) -> bool:
        """
        Saves the current canvas to disk as an image file.

        Args:
            filepath (str): The destination path (e.g., 'outputs/drawing.png').

        Returns:
            bool: True if saved successfully, False otherwise.
        """
        try:
            # Create directories if they don't exist
            directory = os.path.dirname(filepath)
            if directory and not os.path.exists(directory):
                os.makedirs(directory)
                
            success = cv2.imwrite(filepath, self.canvas)
            if success:
                logger.info(f"Canvas saved successfully to: {filepath}")
            else:
                logger.error(f"Failed to save canvas to: {filepath}. cv2.imwrite failed.")
            return success
        except Exception as e:
            logger.error(f"Exception while saving canvas to {filepath}: {str(e)}")
            return False
