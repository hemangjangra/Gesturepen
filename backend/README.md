# AirWrite AI - Backend Documentation

## 1. Architecture Overview
AirWrite AI follows a strictly layered, **Clean Architecture** approach. The system is designed to be highly modular, scalable, and testable by strictly separating concerns:
- **API Layer**: Handles HTTP routing, CORS, and JSON serialization (Flask). It contains absolutely no business logic.
- **Service Layer**: Orchestrates interactions between the API layer, the database, and the Computer Vision engine.
- **Computer Vision (CV) Core**: Pure Python modules utilizing OpenCV, MediaPipe, and EasyOCR. Completely decoupled from the web framework.
- **Database Layer**: Manages persistence using SQLAlchemy and the Repository Pattern, keeping SQL syntax strictly out of the business domain.

## 2. Folder Structure
```text
e:\gesturepen
├── .env                  # Environment configuration variables
├── requirements.txt      # Python dependencies
├── app.py                # Main entry point and Flask Application Factory
├── tests/                # Comprehensive Pytest suite
└── app/                  # Main application package
    ├── config.py         # Loads, types, and validates .env variables
    ├── logger.py         # Centralized logging (console, info.log, error.log)
    ├── api/              
    │   └── routes.py     # REST API Blueprints
    ├── cv/               
    │   ├── camera.py     # Robust webcam context manager
    │   ├── canvas.py     # Virtual drawing surface (NumPy) with undo/redo
    │   ├── detector.py   # MediaPipe Hand detection engine
    │   ├── tracker.py    # Fingertip tracking and spatial mathematics
    │   ├── gestures.py   # Extensible rule-based gesture recognition
    │   ├── smoothing.py  # Exponential smoothing for jitter reduction
    │   ├── preprocess.py # Image binarization/cropping pipeline for OCR
    │   └── ocr.py        # EasyOCR text extraction engine
    ├── services/         
    │   ├── cv_service.py          # Links API to CV modules (Background Runner)
    │   ├── drawing_service.py     # Manages live drawing state and canvas
    │   └── recognition_service.py # Orchestrates Preprocessing and OCR execution
    └── db/               
        ├── models.py     # SQLAlchemy ORM definitions (DrawingRecord)
        └── repository.py # Database interaction wrapper (Repository Pattern)
```

## 3. Module Descriptions

### Computer Vision Core (`app/cv`)
- **`camera.py`**: Wraps `cv2.VideoCapture` in a context manager to ensure hardware resources are cleanly acquired and released, preventing memory leaks.
- **`detector.py`**: Configures Google's MediaPipe to locate hands and extract all 21 normalized 3D landmarks, translating them into usable pixel coordinates.
- **`tracker.py`**: Filters detector output to focus specifically on the Thumb, Index, and Middle fingertips, providing Euclidean distance calculations.
- **`gestures.py`**: A heuristic, rule-based engine that evaluates landmark positions to classify gestures (e.g., "Index Finger Up", "Closed Fist", "OK" pinch).
- **`smoothing.py`**: Implements Exponential Moving Average (EMA) to eliminate camera bounding-box jitter, creating buttery-smooth drawing lines without the latency of a standard moving average.
- **`canvas.py`**: A stateful NumPy matrix acting as a virtual whiteboard. It maintains capped history stacks to allow for instant `undo()` and `redo()`.
- **`preprocess.py`**: Prepares raw canvas images for OCR via Grayscale conversion, Otsu's Binarization, Median Blur denoising, tight bounding-box cropping, and centering.
- **`ocr.py`**: A robust wrapper around EasyOCR that extracts text strings and calculates average confidence scores from preprocessed images.

### Services (`app/services`)
- **`drawing_service.py`**: Consumes raw coordinates, applies smoothing, handles pen-up/pen-down continuity logic, and delegates drawing to the canvas.
- **`recognition_service.py`**: Takes a snapshot of the canvas and pushes it through the preprocessor and OCR engine synchronously, handling all edge cases.

### Database (`app/db`)
- **`models.py`**: Defines the SQLite schema (`drawing_records` table).
- **`repository.py`**: Exposes clean CRUD methods (`create`, `get`, `update`, `delete`), managing SQLAlchemy session commits and rollbacks seamlessly.

## 4. REST API Endpoints

All endpoints are prefixed with `/api/v1/`.

| Method | Endpoint | Description | Payload |
|--------|----------|-------------|---------|
| `GET`  | `/health`| Verifies API availability. | None |
| `POST` | `/start` | Initializes camera and begins background tracking. | `{"camera_index": 0}` (Optional) |
| `POST` | `/stop`  | Halts background tracking and releases camera. | None |
| `POST` | `/clear` | Wipes the virtual drawing canvas. | None |
| `POST` | `/recognize`| Triggers the OCR pipeline on the current canvas state. | None |

## 5. Data Flow

1. **Input**: A frontend client calls `POST /start`.
2. **Capture**: The `cv_service.py` initiates a background loop utilizing `camera.py` to pull frames continuously.
3. **Detection**: Each frame is passed to `detector.py` to extract 21 hand landmarks.
4. **Classification**: `gestures.py` evaluates the landmarks. If the "OK" (pinch) gesture is detected, the system registers that the "pen is down".
5. **Tracking & Smoothing**: `tracker.py` isolates the index fingertip coordinate. This point is passed to `smoothing.py` to remove camera jitter.
6. **Drawing**: The smoothed coordinate is passed to `drawing_service.py`, which draws a continuous line on the NumPy `canvas.py`.
7. **Recognition**: The client calls `POST /recognize`. The `recognition_service.py` extracts the canvas image, runs it through `preprocess.py`, and feeds it to `ocr.py`.
8. **Persistence**: The resulting text, confidence score, and timestamp are saved to the SQLite database via `repository.py`.

## 6. Installation & Setup

1. **Virtual Environment**: 
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Environment Variables**: Verify your `.env` file exists with the following defaults:
   ```env
   CAMERA_INDEX=0
   FRAME_WIDTH=1280
   FRAME_HEIGHT=720
   OCR_LANGUAGE=en
   LOGGING_LEVEL=DEBUG
   ```
4. **Run the Server**:
   ```bash
   python app.py
   ```
5. **Run the Test Suite** (Optional):
   ```bash
   pytest
   ```

## 7. Future Improvements

- **WebSockets / SocketIO**: Transition the synchronous REST API into a bidirectional WebSocket stream using `Flask-SocketIO` and `eventlet` to transmit live 60 FPS video frames and sub-100ms gesture data directly to a frontend UI.
- **Multithreading (Producer-Consumer)**: Decouple the Camera I/O from the MediaPipe inference loop using thread-safe Queues to maximize framerates and prevent main-thread blocking.
- **Asynchronous OCR**: Offload the heavy EasyOCR inference to a `ThreadPoolExecutor` or `Celery` worker so the user's drawing feed does not freeze while text is processing.
- **Cloud Database Integration**: Swap the local SQLite `airwrite.db` with PostgreSQL and AWS S3 bucket storage for production cloud deployments.
