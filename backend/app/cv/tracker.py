"""
app/cv/tracker.py
Tracks specific finger landmarks (Index, Thumb, Middle) for gesture recognition.
Acts as a higher-level wrapper around detector.py to extract meaningful spatial data.
"""

import math
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

from app.cv.detector import HandDetector

# Standard MediaPipe Landmark IDs for fingertips
LANDMARK_THUMB_TIP = 4
LANDMARK_INDEX_TIP = 8
LANDMARK_MIDDLE_TIP = 12


class GestureTracker:
    """
    A high-level tracker that utilizes HandDetector to track specific 
    fingertips and compute spatial relationships (e.g., distances) between them.
    This class is highly useful for determining pinch gestures, writing states, etc.
    """

    def __init__(self, max_hands: int = 1):
        """
        Initializes the GestureTracker.
        
        Args:
            max_hands (int): Maximum number of hands to track. Defaults to 1 for 
                             typical writing/gesture tasks to avoid background interference.
        """
        self.detector = HandDetector(max_hands=max_hands)

    def process_frame(self, frame: np.ndarray, draw: bool = True) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Processes a frame to detect hands and extract the specific tracked points.

        Args:
            frame (np.ndarray): The BGR image frame from OpenCV.
            draw (bool): Whether to draw landmarks on the frame via the detector.

        Returns:
            Tuple[np.ndarray, List[Dict]]: 
                - The processed/annotated frame.
                - A list of tracked hands, where each hand contains:
                    - 'type': 'Left' or 'Right'.
                    - 'score': Confidence score.
                    - 'points': Dictionary containing 'thumb', 'index', 'middle' coordinates and visibility.
                    - 'distances': Pre-computed distances between the key points.
        """
        # 1. Use detector.py to get raw hand data
        annotated_frame, hands_data = self.detector.process_frame(frame, draw=draw)
        
        tracked_hands = []
        for hand in hands_data:
            # 2. Track Index, Thumb, Middle fingertips
            tracked_points = self._extract_key_points(hand)
            
            # 3. Calculate spatial relationships
            distances = self._calculate_all_distances(tracked_points)
            
            tracked_hands.append({
                'type': hand.get('type', 'Unknown'),
                'score': hand.get('score', 0.0),
                'points': tracked_points,
                'distances': distances
            })
            
        return annotated_frame, tracked_hands

    def _extract_key_points(self, hand_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Extracts the thumb, index, and middle fingertips from a hand's landmarks.

        Args:
            hand_data (Dict): Raw hand data from HandDetector.

        Returns:
            Dict: Mapping of finger name to its {x, y, is_visible} state.
        """
        # Initialize default state (assume not visible until found)
        points = {
            'thumb': {'x': 0, 'y': 0, 'is_visible': False},
            'index': {'x': 0, 'y': 0, 'is_visible': False},
            'middle': {'x': 0, 'y': 0, 'is_visible': False}
        }
        
        if not hand_data or 'landmarks' not in hand_data:
            return points
            
        # Convert landmarks list to a dictionary keyed by ID for O(1) lookup
        lm_dict = {lm['id']: lm for lm in hand_data['landmarks']}
        
        if LANDMARK_THUMB_TIP in lm_dict:
            points['thumb'] = {
                'x': lm_dict[LANDMARK_THUMB_TIP]['x'], 
                'y': lm_dict[LANDMARK_THUMB_TIP]['y'], 
                'is_visible': True
            }
            
        if LANDMARK_INDEX_TIP in lm_dict:
            points['index'] = {
                'x': lm_dict[LANDMARK_INDEX_TIP]['x'], 
                'y': lm_dict[LANDMARK_INDEX_TIP]['y'], 
                'is_visible': True
            }
            
        if LANDMARK_MIDDLE_TIP in lm_dict:
            points['middle'] = {
                'x': lm_dict[LANDMARK_MIDDLE_TIP]['x'], 
                'y': lm_dict[LANDMARK_MIDDLE_TIP]['y'], 
                'is_visible': True
            }
            
        return points

    @staticmethod
    def calculate_distance(pt1: Dict[str, Any], pt2: Dict[str, Any]) -> Optional[float]:
        """
        Calculates the Euclidean distance between two tracked points.

        Args:
            pt1 (Dict): Point 1 in format {'x': int, 'y': int, 'is_visible': bool}.
            pt2 (Dict): Point 2 in format {'x': int, 'y': int, 'is_visible': bool}.

        Returns:
            Optional[float]: The Euclidean distance in pixels, or None if either point is missing.
        """
        if not pt1.get('is_visible') or not pt2.get('is_visible'):
            return None
            
        dx = pt1['x'] - pt2['x']
        dy = pt1['y'] - pt2['y']
        return math.hypot(dx, dy)

    def _calculate_all_distances(self, points: Dict[str, Dict[str, Any]]) -> Dict[str, Optional[float]]:
        """
        Calculates distances between the tracked fingertips.
        Useful for detecting pinches (e.g., if thumb_index < threshold, user is pinching).
        
        Args:
            points (Dict): Tracked key points containing x, y, is_visible.
            
        Returns:
            Dict: Distances for thumb-index, index-middle, and thumb-middle.
        """
        return {
            'thumb_index': self.calculate_distance(points['thumb'], points['index']),
            'index_middle': self.calculate_distance(points['index'], points['middle']),
            'thumb_middle': self.calculate_distance(points['thumb'], points['middle'])
        }

    def close(self) -> None:
        """
        Cleans up resources used by the underlying HandDetector.
        """
        self.detector.close()
