"""
tests/test_canvas.py
Unit tests for the VirtualCanvas module.
"""

import numpy as np
from app.cv.canvas import VirtualCanvas

def test_canvas_initialization():
    canvas = VirtualCanvas(width=100, height=50, bg_color=(0, 0, 0))
    img = canvas.get_image()
    
    assert img.shape == (50, 100, 3)
    # Check it is entirely black
    assert np.all(img == 0)

def test_canvas_draw_line():
    canvas = VirtualCanvas(width=100, height=100)
    canvas.draw_line((0, 0), (10, 10), (255, 255, 255), 1)
    img = canvas.get_image()
    
    # The coordinate (10, 10) should be colored white
    assert np.array_equal(img[10, 10], [255, 255, 255])

def test_canvas_undo_redo():
    canvas = VirtualCanvas(width=10, height=10)
    
    # Save blank state, then draw
    canvas.save_state()
    canvas.draw_line((0, 0), (5, 5), (255, 255, 255), 1)
    
    # Canvas should have white pixels
    assert np.any(canvas.get_image() == 255)
    
    # Perform Undo
    success = canvas.undo()
    assert success is True
    # Canvas should be entirely black again
    assert np.all(canvas.get_image() == 0)
    
    # Perform Redo
    success = canvas.redo()
    assert success is True
    # Canvas should have white pixels again
    assert np.any(canvas.get_image() == 255)
