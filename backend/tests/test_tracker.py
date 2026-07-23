"""
tests/test_tracker.py
Unit tests for the GestureTracker module.
"""

from app.cv.tracker import GestureTracker

def test_tracker_extract_key_points():
    tracker = GestureTracker()
    # Mock hand data with specific landmarks
    hand_data = {
        'type': 'Right',
        'score': 0.9,
        'landmarks': [
            {'id': 4, 'x': 10, 'y': 20},  # THUMB_TIP
            {'id': 8, 'x': 30, 'y': 40},  # INDEX_TIP
            {'id': 12, 'x': 50, 'y': 60}  # MIDDLE_TIP
        ]
    }
    
    points = tracker._extract_key_points(hand_data)
    
    assert points['thumb']['is_visible'] is True
    assert points['thumb']['x'] == 10
    
    assert points['index']['is_visible'] is True
    assert points['index']['x'] == 30
    
    assert points['middle']['is_visible'] is True
    assert points['middle']['x'] == 50
    tracker.close()

def test_calculate_distance():
    tracker = GestureTracker()
    # 3-4-5 right triangle
    pt1 = {'x': 0, 'y': 0, 'is_visible': True}
    pt2 = {'x': 3, 'y': 4, 'is_visible': True}
    
    dist = tracker.calculate_distance(pt1, pt2)
    assert dist == 5.0
    
    # Test missing visibility
    pt3 = {'x': 3, 'y': 4, 'is_visible': False}
    assert tracker.calculate_distance(pt1, pt3) is None
    tracker.close()
