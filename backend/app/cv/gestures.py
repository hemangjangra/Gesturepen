"""
app/cv/gestures.py
Gesture recognition module based on MediaPipe hand landmarks.
Designed with an extensible rule-based architecture to easily add new gestures.
"""

import math
from typing import Dict, List, Any, Callable, Tuple

# Standard MediaPipe Landmark Definitions
WRIST = 0
THUMB_MCP = 2
THUMB_IP = 3
THUMB_TIP = 4
INDEX_MCP = 5
INDEX_PIP = 6
INDEX_TIP = 8
MIDDLE_PIP = 10
MIDDLE_TIP = 12
RING_PIP = 14
RING_TIP = 16
PINKY_PIP = 18
PINKY_TIP = 20


class GestureRecognizer:
    """
    Evaluates hand landmarks against a set of heuristic rules to classify gestures.
    Built for modularity so new gestures can be added dynamically.
    """
    
    def __init__(self):
        """
        Initializes the recognizer and registers the gesture rules.
        The list order dictates the priority (first rule to return True wins).
        To add a new gesture, simply write a new method and register it here.
        """
        self.gesture_rules: List[Tuple[Callable[[Dict[int, Any], str], bool], str]] = [
            (self.is_ok_gesture, "OK"),
            (self.is_thumbs_up, "Thumbs Up"),
            (self.is_two_fingers_up, "Two Fingers Up"),
            (self.is_index_finger_up, "Index Finger Up"),
            (self.is_closed_fist, "Closed Fist")
        ]

    def recognize(self, hand_data: Dict[str, Any]) -> str:
        """
        Identifies the gesture from a single hand's data.

        Args:
            hand_data (Dict): The dictionary for a single hand, provided by HandDetector.
                              Expected to have a 'landmarks' array of 21 points.

        Returns:
            str: The name of the recognized gesture, or "Unknown" if none match.
        """
        if not hand_data or 'landmarks' not in hand_data:
            return "Unknown"
            
        landmarks = hand_data['landmarks']
        hand_type = hand_data.get('type', 'Right')
        
        # Convert landmarks list to a dictionary keyed by landmark ID for fast O(1) lookups
        lm = {landmark['id']: landmark for landmark in landmarks}
        
        # Ensure we have all necessary landmarks before attempting calculations
        required_ids = [
            WRIST, THUMB_MCP, THUMB_IP, THUMB_TIP,
            INDEX_MCP, INDEX_PIP, INDEX_TIP,
            MIDDLE_PIP, MIDDLE_TIP,
            RING_PIP, RING_TIP,
            PINKY_PIP, PINKY_TIP
        ]
        
        if not all(rid in lm for rid in required_ids):
            return "Unknown"

        # Evaluate all registered gesture rules in priority order
        for rule_func, gesture_name in self.gesture_rules:
            if rule_func(lm, hand_type):
                return gesture_name
                
        return "Unknown"

    # ---------------------------------------------------------
    # Helper Methods
    # ---------------------------------------------------------

    def _get_fingers_up(self, lm: Dict[int, Any]) -> Dict[str, bool]:
        """
        Determines which of the four main fingers are fully extended (pointing up).
        Note: In image coordinates, y=0 is at the top. A finger is 'up' if its tip's 
        y-coordinate is numerically less than its PIP joint's y-coordinate.
        """
        return {
            'index': lm[INDEX_TIP]['y'] < lm[INDEX_PIP]['y'],
            'middle': lm[MIDDLE_TIP]['y'] < lm[MIDDLE_PIP]['y'],
            'ring': lm[RING_TIP]['y'] < lm[RING_PIP]['y'],
            'pinky': lm[PINKY_TIP]['y'] < lm[PINKY_PIP]['y']
        }
        
    def _calculate_distance(self, pt1: Dict[str, int], pt2: Dict[str, int]) -> float:
        """Calculates Euclidean distance between two landmark points."""
        return math.hypot(pt1['x'] - pt2['x'], pt1['y'] - pt2['y'])

    # ---------------------------------------------------------
    # Gesture Rules 
    # (Each returns True if its specific gesture is detected)
    # ---------------------------------------------------------

    def is_index_finger_up(self, lm: Dict[int, Any], hand_type: str) -> bool:
        fingers = self._get_fingers_up(lm)
        # Only the index finger should be extended
        return fingers['index'] and not fingers['middle'] and not fingers['ring'] and not fingers['pinky']

    def is_two_fingers_up(self, lm: Dict[int, Any], hand_type: str) -> bool:
        fingers = self._get_fingers_up(lm)
        # Often called a "Peace Sign" or "Pointer/Middle"
        return fingers['index'] and fingers['middle'] and not fingers['ring'] and not fingers['pinky']

    def is_closed_fist(self, lm: Dict[int, Any], hand_type: str) -> bool:
        fingers = self._get_fingers_up(lm)
        # All four main fingers must be folded downwards
        return not any([fingers['index'], fingers['middle'], fingers['ring'], fingers['pinky']])

    def is_thumbs_up(self, lm: Dict[int, Any], hand_type: str) -> bool:
        fingers = self._get_fingers_up(lm)
        
        # The 4 main fingers must be folded into a fist
        if any([fingers['index'], fingers['middle'], fingers['ring'], fingers['pinky']]):
            return False
            
        # Thumb tip must be higher (lower y) than its own IP joint
        thumb_up = lm[THUMB_TIP]['y'] < lm[THUMB_IP]['y']
        
        # Thumb tip should also be physically higher than the folded index finger's knuckle
        thumb_highest = lm[THUMB_TIP]['y'] < lm[INDEX_PIP]['y']
        
        return thumb_up and thumb_highest

    def is_ok_gesture(self, lm: Dict[int, Any], hand_type: str) -> bool:
        fingers = self._get_fingers_up(lm)
        
        # Middle, ring, and pinky fingers should be extended
        if not (fingers['middle'] and fingers['ring'] and fingers['pinky']):
            return False
            
        # Thumb and Index finger tips should be touching (pinched)
        pinch_dist = self._calculate_distance(lm[THUMB_TIP], lm[INDEX_TIP])
        
        # Dynamically calculate a threshold based on the hand's size in the frame
        # We use the distance from the wrist to the index knuckle as a reference scale
        reference_length = self._calculate_distance(lm[WRIST], lm[INDEX_MCP])
        
        # If the pinch distance is less than 40% of the palm length, they are touching
        pinch_threshold = reference_length * 0.40  
        
        return pinch_dist < pinch_threshold
