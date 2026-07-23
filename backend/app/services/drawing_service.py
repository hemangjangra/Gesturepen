"""
app/services/drawing_service.py
Pure Python business logic for orchestrating drawing operations.
Manages the canvas and smoothing algorithms, completely decoupled from Flask or API routes.
"""

import logging
import numpy as np
from typing import Tuple, Optional

from app.cv.canvas import VirtualCanvas
from app.cv.smoothing import PointSmoother

logger = logging.getLogger(__name__)


class DrawingService:
    """
    Manages the lifecycle of drawing operations.
    Receives raw finger coordinates, applies smoothing, and updates the canvas dynamically.
    """

    def __init__(self, canvas_width: int = 1280, canvas_height: int = 720, use_smoothing: bool = True):
        """
        Initializes the drawing service.
        """
        self.canvas = VirtualCanvas(width=canvas_width, height=canvas_height)
        self.smoother = PointSmoother(method='exponential', alpha=0.4, enabled=use_smoothing)
        
        self.last_point: Optional[Tuple[int, int]] = None
        self.current_color: Tuple[int, int, int] = (255, 255, 255) # Default: White
        self.current_thickness: int = 5
        self.is_drawing: bool = False

    def process_coordinate(self, x: int, y: int, is_pen_down: bool) -> np.ndarray:
        """
        Main entry point for processing live finger coordinates.
        
        Args:
            x (int): X coordinate of the finger.
            y (int): Y coordinate of the finger.
            is_pen_down (bool): True if the user is actively drawing (e.g., pinching), 
                                False if just hovering.
                                
        Returns:
            np.ndarray: The updated canvas image as a NumPy array.
        """
        # If the user is just hovering (not pinching to draw)
        if not is_pen_down:
            # If they were previously drawing, that means they just lifted their finger
            if self.is_drawing:
                self._end_stroke()
            return self.canvas.get_image()

        # Apply smoothing to the raw coordinate to remove camera jitter
        smoothed_pt = self.smoother.update((x, y))

        if not self.is_drawing:
            # User just put the pen down. Start a new stroke.
            self._start_stroke(smoothed_pt)
        else:
            # User is dragging the pen. Connect the lines.
            self._update_stroke(smoothed_pt)

        return self.canvas.get_image()

    def _start_stroke(self, pt: Tuple[int, int]) -> None:
        """Internal method to handle the beginning of a stroke."""
        self.is_drawing = True
        
        # Register an undo state right before the line is drawn
        self.canvas.save_state() 
        self.last_point = pt
        logger.debug("Started new drawing stroke.")

    def _update_stroke(self, pt: Tuple[int, int]) -> None:
        """Internal method to handle the continuation of a stroke."""
        if self.last_point is not None:
            self.canvas.draw_line(
                pt1=self.last_point, 
                pt2=pt, 
                color=self.current_color, 
                thickness=self.current_thickness
            )
        self.last_point = pt

    def _end_stroke(self) -> None:
        """Internal method to handle the ending of a stroke."""
        self.is_drawing = False
        self.last_point = None
        
        # CRITICAL: Reset the smoother history so the next stroke 
        # doesn't mathematically interpolate from the end of this one.
        self.smoother.reset()  
        logger.debug("Ended drawing stroke.")

    # ----------------------------------------------------------------
    # Canvas Delegation Methods (Clean API for external callers)
    # ----------------------------------------------------------------

    def clear_canvas(self) -> np.ndarray:
        """Clears the canvas and ends any active strokes."""
        self.canvas.clear()
        self._end_stroke()
        return self.canvas.get_image()

    def undo(self) -> np.ndarray:
        """Undoes the last stroke."""
        self.canvas.undo()
        self._end_stroke()
        return self.canvas.get_image()

    def redo(self) -> np.ndarray:
        """Redoes a previously undone stroke."""
        self.canvas.redo()
        self._end_stroke()
        return self.canvas.get_image()

    def set_color(self, b: int, g: int, r: int) -> None:
        """Updates the current drawing color."""
        self.current_color = (b, g, r)

    def set_thickness(self, thickness: int) -> None:
        """Updates the current brush thickness."""
        self.current_thickness = max(1, thickness)
        
    def get_latest_canvas(self) -> np.ndarray:
        """Returns the current state of the canvas without modifying it."""
        return self.canvas.get_image()
