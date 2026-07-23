"""
app/cv/smoothing.py
Provides algorithms to smooth the jittery movement of finger tracking.
Includes Moving Average and Exponential Smoothing techniques.
"""

import collections
from typing import Tuple, Optional


class PointSmoother:
    """
    Applies smoothing to a sequence of 2D points to reduce camera tracking jitter.
    Maintains state between frames to calculate continuous smoothed trajectories.
    """

    def __init__(
        self, 
        method: str = 'exponential', 
        window_size: int = 5, 
        alpha: float = 0.4, 
        enabled: bool = True
    ):
        """
        Initializes the point smoother.
        
        Args:
            method (str): 'moving_average' or 'exponential'.
            window_size (int): Number of points to average (for 'moving_average').
            alpha (float): Smoothing factor [0.0, 1.0] (for 'exponential').
                           Higher alpha = faster reaction to new points, less smooth.
                           Lower alpha = slower reaction, smoother line.
            enabled (bool): If False, the smoother acts as a passthrough, returning raw inputs.
        """
        if method not in ['moving_average', 'exponential']:
            raise ValueError("Method must be 'moving_average' or 'exponential'")

        self.method = method
        self.window_size = window_size
        self.alpha = alpha
        self.enabled = enabled
        
        # State for Moving Average
        self.history_x = collections.deque(maxlen=window_size)
        self.history_y = collections.deque(maxlen=window_size)
        
        # State for Exponential Smoothing
        self.prev_x: Optional[float] = None
        self.prev_y: Optional[float] = None

    def update(self, pt: Tuple[int, int]) -> Tuple[int, int]:
        """
        Takes a raw coordinate point and returns the smoothed point based on the configured method.
        
        Args:
            pt (Tuple[int, int]): Raw (x, y) coordinate from the tracker.
            
        Returns:
            Tuple[int, int]: Smoothed (x, y) coordinate.
        """
        if not self.enabled:
            return pt
            
        x, y = pt
        
        if self.method == 'moving_average':
            return self._moving_average(x, y)
        elif self.method == 'exponential':
            return self._exponential_smoothing(x, y)
        else:
            return pt

    def _moving_average(self, x: int, y: int) -> Tuple[int, int]:
        """Calculates Simple Moving Average (SMA)."""
        self.history_x.append(x)
        self.history_y.append(y)
        
        smoothed_x = int(sum(self.history_x) / len(self.history_x))
        smoothed_y = int(sum(self.history_y) / len(self.history_y))
        
        return (smoothed_x, smoothed_y)

    def _exponential_smoothing(self, x: int, y: int) -> Tuple[int, int]:
        """
        Calculates Exponential Moving Average (EMA).
        Formula: S_t = alpha * Y_t + (1 - alpha) * S_{t-1}
        """
        if self.prev_x is None or self.prev_y is None:
            # First point in a stroke has no previous history
            self.prev_x, self.prev_y = float(x), float(y)
            return (x, y)
            
        smoothed_x = (self.alpha * x) + ((1.0 - self.alpha) * self.prev_x)
        smoothed_y = (self.alpha * y) + ((1.0 - self.alpha) * self.prev_y)
        
        self.prev_x = smoothed_x
        self.prev_y = smoothed_y
        
        return (int(smoothed_x), int(smoothed_y))

    def reset(self) -> None:
        """
        Resets the smoother's history. 
        CRITICAL: This MUST be called whenever the user lifts their finger 
        (ends a stroke) so the algorithm doesn't drag a line from the end 
        of the old stroke to the beginning of the new one.
        """
        self.history_x.clear()
        self.history_y.clear()
        self.prev_x = None
        self.prev_y = None
