"""
app/db/repository.py
Implements the Repository Pattern for the DrawingRecord model.
This isolates all SQL and database operations away from the service layer,
ensuring strict adherence to clean architecture principles.
"""

import logging
from typing import List, Optional, Dict, Any
from app.db.models import db, DrawingRecord

logger = logging.getLogger(__name__)

class DrawingRepository:
    """
    Handles all CRUD (Create, Read, Update, Delete) database interactions 
    for DrawingRecord entities.
    """

    def create(self, image_path: str, recognized_text: Optional[str] = None, confidence: Optional[float] = None) -> DrawingRecord:
        """
        Creates a new drawing record in the database.
        
        Args:
            image_path (str): The file path where the canvas image is saved.
            recognized_text (str, optional): Text identified by the OCR engine.
            confidence (float, optional): OCR confidence score.
            
        Returns:
            DrawingRecord: The newly created database record.
        """
        try:
            record = DrawingRecord(
                image_path=image_path,
                recognized_text=recognized_text,
                confidence=confidence
            )
            db.session.add(record)
            db.session.commit()
            logger.info(f"Created DrawingRecord with id {record.drawing_id}")
            return record
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to create DrawingRecord: {e}")
            raise e

    def get_by_id(self, drawing_id: int) -> Optional[DrawingRecord]:
        """
        Retrieves a single drawing record by its ID.
        """
        return db.session.get(DrawingRecord, drawing_id)

    def get_all(self, limit: int = 100, offset: int = 0) -> List[DrawingRecord]:
        """
        Retrieves a paginated list of drawing records, ordered by newest first.
        """
        return DrawingRecord.query.order_by(DrawingRecord.created_at.desc()).limit(limit).offset(offset).all()

    def update(self, drawing_id: int, updates: Dict[str, Any]) -> Optional[DrawingRecord]:
        """
        Updates an existing drawing record dynamically based on a dictionary of fields.
        Useful for updating the record once OCR finishes asynchronously.
        """
        try:
            record = self.get_by_id(drawing_id)
            if not record:
                logger.warning(f"Attempted to update non-existent DrawingRecord {drawing_id}")
                return None
                
            if 'recognized_text' in updates:
                record.recognized_text = updates['recognized_text']
            if 'confidence' in updates:
                record.confidence = updates['confidence']
                
            db.session.commit()
            logger.info(f"Updated DrawingRecord {drawing_id}")
            return record
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to update DrawingRecord {drawing_id}: {e}")
            raise e

    def delete(self, drawing_id: int) -> bool:
        """
        Deletes a drawing record from the database.
        """
        try:
            record = self.get_by_id(drawing_id)
            if not record:
                return False
                
            db.session.delete(record)
            db.session.commit()
            logger.info(f"Deleted DrawingRecord {drawing_id}")
            return True
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to delete DrawingRecord {drawing_id}: {e}")
            raise e
