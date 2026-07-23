"""
app/cv/detector.py
Hand detection module using Google's MediaPipe Hands.
Provides a highly reusable, object-oriented detector that handles tracking 
one or two hands, extracting 21 landmarks, and drawing annotations.
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import List, Dict, Any, Tuple


class HandDetector:
    """
    Reusable Hand Detector utilizing MediaPipe.
    Designed to easily plug into video processing pipelines.
    """
    
    def __init__(
        self,
        static_image_mode: bool = False,
        max_hands: int = 2,
        detection_confidence: float = 0.5,
        tracking_confidence: float = 0.5
    ):
        """
        Initializes the MediaPipe Hand Detector.

        Args:
            static_image_mode (bool): If False, treats inputs as a video stream (optimizes tracking).
                                      If True, treats inputs as independent images.
            max_hands (int): Maximum number of hands to detect (1 or 2 are standard).
            detection_confidence (float): Minimum confidence [0.0, 1.0] for detection to be successful.
            tracking_confidence (float): Minimum confidence [0.0, 1.0] for landmarks to be tracked successfully.
        """
        self.static_image_mode = static_image_mode
        self.max_hands = max_hands
        self.detection_confidence = detection_confidence
        self.tracking_confidence = tracking_confidence

        # Initialize MediaPipe Hands solutions
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=self.static_image_mode,
            max_num_hands=self.max_hands,
            min_detection_confidence=self.detection_confidence,
            min_tracking_confidence=self.tracking_confidence
        )
        
        # Initialize MediaPipe drawing utilities for optional visual feedback
        self.mp_draw = mp.solutions.drawing_utils
        
        # Store results of the latest processing
        self.results = None

    def process_frame(self, frame: np.ndarray, draw: bool = True) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Processes an image frame to detect hands and extract coordinate landmarks.

        Args:
            frame (np.ndarray): The BGR image frame from OpenCV.
            draw (bool): If True, draws landmarks and connections directly onto the frame.

        Returns:
            Tuple[np.ndarray, List[Dict]]: 
                - The processed frame (modified with drawings if draw=True).
                - A list of detected hands. Each hand is a dictionary containing:
                    - 'type': 'Left' or 'Right' hand classification.
                    - 'score': Confidence score of the detection.
                    - 'landmarks': A list of all 21 landmarks, each containing 'id', 'x', and 'y' (in pixels).
        """
        # MediaPipe expects RGB images, but OpenCV reads as BGR
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Run inference on the frame
        self.results = self.hands.process(img_rgb)
        
        all_hands_data = []
        h, w, _ = frame.shape

        if self.results.multi_hand_landmarks and self.results.multi_handedness:
            # Zip landmarks with handedness classification to process them together
            for hand_landmarks, handedness in zip(self.results.multi_hand_landmarks, self.results.multi_handedness):
                
                # Extract Classification (Left/Right) and Confidence Score
                classification = handedness.classification[0]
                hand_type = classification.label
                confidence_score = classification.score
                
                hand_info = {
                    "type": hand_type,
                    "score": float(confidence_score),
                    "landmarks": []
                }
                
                # Extract all 21 landmarks
                for lm_id, landmark in enumerate(hand_landmarks.landmark):
                    # Convert normalized coordinates (0.0 to 1.0) to actual pixel coordinates
                    px_x, px_y = int(landmark.x * w), int(landmark.y * h)
                    
                    hand_info["landmarks"].append({
                        "id": lm_id,
                        "x": px_x,
                        "y": px_y
                    })
                
                all_hands_data.append(hand_info)
                
                # Optionally draw the landmarks and their connections on the frame
                if draw:
                    self.mp_draw.draw_landmarks(
                        frame, 
                        hand_landmarks, 
                        self.mp_hands.HAND_CONNECTIONS
                    )
                    
        return frame, all_hands_data

    def close(self) -> None:
        """
        Releases the underlying MediaPipe resources.
        Should be called when the detector is no longer needed.
        """
        self.hands.close()
