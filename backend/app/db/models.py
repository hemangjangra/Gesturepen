"""
app/db/models.py
Defines the SQLAlchemy ORM models representing database tables.
Keeps the database schema cleanly separated from business logic.
"""

from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

# Initialize the SQLAlchemy extension (will be bound to the Flask app in app.py)
db = SQLAlchemy()

class DrawingRecord(db.Model):
    """
    Stores metadata and OCR results for a specific drawing session.
    """
    __tablename__ = 'drawing_records'

    drawing_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    image_path = db.Column(db.String(255), nullable=False)
    recognized_text = db.Column(db.Text, nullable=True)
    confidence = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        """Converts the model instance into a dictionary for JSON serialization."""
        return {
            'drawing_id': self.drawing_id,
            'image_path': self.image_path,
            'recognized_text': self.recognized_text,
            'confidence': self.confidence,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
