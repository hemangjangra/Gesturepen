# Gesture Pen (Monorepo)

This repository contains the complete source code for **Gesture Pen**, structured as a modern monorepo:

- **`/Gesture_pen`**: The React/Vite Frontend. This contains the zero-latency, serverless AR workspace powered by Google MediaPipe WASM.
- **`/backend`**: The Legacy Python Backend. This contains the original FastAPI/Flask computer vision implementation. 

## Getting Started

To run the live frontend application, navigate to the `Gesture_pen` directory:

```bash
cd Gesture_pen
npm install
npm run dev
```

*Note: The frontend is entirely serverless and runs the Machine Learning models locally on your GPU via WebAssembly. The backend folder is preserved for architectural reference.*
