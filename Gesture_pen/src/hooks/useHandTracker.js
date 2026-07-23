import { useState, useEffect, useRef, useCallback } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export function useHandTracker(videoRef, isEnabled = true) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [gestureState, setGestureState] = useState({
    rawHands: [],
    indexFinger: null, // {x, y}
    handCenter: null, // {x, y} for grabbing
    isDrawing: false,
    isPinching: false,
    isErasing: false,
    isThreeFingers: false,
    isClosedFist: false,
    isThumbsDown: false,
    isRockOn: false,
    
    // Two hand
    isTwoHandPinch: false,
    pinchDistance: 0
  });

  const landmarkerRef = useRef(null);
  const requestRef = useRef();
  
  // Smoothing internal state
  const smoothedLandmarksRef = useRef([]);
  const statesRef = useRef({ isPinching: false, isTwoHandPinch: false });

  // 1. Initialize
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        if (!active) return;
        
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });
        if (!active) return;
        
        landmarkerRef.current = landmarker;
        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to load MediaPipe:", err);
      }
    }
    init();
    return () => {
      active = false;
      if (landmarkerRef.current) landmarkerRef.current.close();
    };
  }, []);

  // 3D Euclidean Distance
  const dist3D = (p1, p2) => Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2)
  );

  // Robust Extended Check: Is tip further from wrist than the PIP joint?
  const isExtended = (hand, tipIdx, pipIdx) => {
    const wrist = hand[0];
    const tipDist = dist3D(hand[tipIdx], wrist);
    const pipDist = dist3D(hand[pipIdx], wrist);
    // Add a tiny margin to prevent noise
    return tipDist > pipDist + 0.02;
  };

  // 2. Detection Loop
  const detect = useCallback(() => {
    if (!isEnabled || !videoRef.current || !landmarkerRef.current || videoRef.current.readyState < 2) {
       requestRef.current = requestAnimationFrame(detect);
       return;
    }

    const startTimeMs = performance.now();
    const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

    // 1. Velocity-Based Dynamic Smoothing (One-Euro style filter)
    const rawHandsData = results.landmarks || [];
    let smoothedHands = [];

    if (rawHandsData.length > 0) {
       // Reset if hand count changes
       if (smoothedLandmarksRef.current.length !== rawHandsData.length) {
          smoothedLandmarksRef.current = rawHandsData.map(h => h.map(p => ({...p})));
       }
       
       smoothedHands = rawHandsData.map((hand, hIdx) => {
          // Check for huge jump (e.g. hand reappeared in new spot)
          const wrist = hand[0];
          const prevWrist = smoothedLandmarksRef.current[hIdx][0];
          const wristJump = Math.sqrt(Math.pow(wrist.x - prevWrist.x, 2) + Math.pow(wrist.y - prevWrist.y, 2));
          
          if (wristJump > 0.15) {
             smoothedLandmarksRef.current[hIdx] = hand.map(p => ({...p})); // Instant snap
          }
          
          return hand.map((pt, pIdx) => {
             const prevPt = smoothedLandmarksRef.current[hIdx][pIdx];
             
             // Calculate velocity (distance since last frame)
             const dist = Math.sqrt(Math.pow(pt.x - prevPt.x, 2) + Math.pow(pt.y - prevPt.y, 2));
             
             // Dynamic Alpha: 
             // Slow movement = low alpha (extreme smoothing/precision)
             // Fast movement = high alpha (zero latency)
             let dynamicAlpha = 0.12 + (dist * 18);
             if (dynamicAlpha > 0.85) dynamicAlpha = 0.85;

             const newPt = {
               x: prevPt.x + (pt.x - prevPt.x) * dynamicAlpha,
               y: prevPt.y + (pt.y - prevPt.y) * dynamicAlpha,
               z: prevPt.z + (pt.z - prevPt.z) * dynamicAlpha,
             };
             smoothedLandmarksRef.current[hIdx][pIdx] = newPt;
             return newPt;
          });
       });
    } else {
       smoothedLandmarksRef.current = [];
    }

    let nextState = {
      rawHands: smoothedHands,
      indexFinger: null,
      handCenter: null,
      isDrawing: false,
      isPinching: false,
      isErasing: false,
      isThreeFingers: false,
      isClosedFist: false,
      isThumbsDown: false,
      isRockOn: false,
      isTwoHandPinch: false,
      pinchDistance: 0
    };

    if (smoothedHands.length > 0) {
      // Analyze Primary Hand (Hand 0)
      const hand1 = smoothedHands[0];
      
      const thumbTip = hand1[4];
      const indexTip = hand1[8];
      
      const thumbUp = isExtended(hand1, 4, 2);
      const indexUp = isExtended(hand1, 8, 6);
      const middleUp = isExtended(hand1, 12, 10);
      const ringUp = isExtended(hand1, 16, 14);
      const pinkyUp = isExtended(hand1, 20, 18);
      
      // Pinch detection with WIDER Hysteresis for extreme lock-in
      const pinchDist = dist3D(thumbTip, indexTip);
      const pinchThreshold = statesRef.current.isPinching ? 0.09 : 0.05; // Lock in deeply once started
      const pinching = pinchDist < pinchThreshold;
      statesRef.current.isPinching = pinching;
      
      const othersCurled = !indexUp && !middleUp && !ringUp && !pinkyUp;
      
      // Thumbs Down (Thumb extended, others curled, thumb tip below wrist in Y)
      if (othersCurled && thumbUp) {
        if (thumbTip.y > hand1[0].y + 0.05) nextState.isThumbsDown = true;
      }
      
      // Closed Fist (all curled)
      if (othersCurled && !thumbUp && !pinching) {
        nextState.isClosedFist = true;
      }
      
      // Three Fingers (Index, Middle, Ring up, Pinky curled)
      if (indexUp && middleUp && ringUp && !pinkyUp && !pinching) {
        nextState.isThreeFingers = true;
      }
      
      // Drawing (Index only)
      if (indexUp && !middleUp && !ringUp && !pinkyUp && !pinching) {
        nextState.isDrawing = true;
      }
      
      // Erasing (Pinky only)
      if (!indexUp && !middleUp && !ringUp && pinkyUp && !pinching) {
        nextState.isErasing = true;
      }
      
      // Rock On (Save) - Index and Pinky up
      if (indexUp && !middleUp && !ringUp && pinkyUp && !pinching) {
        nextState.isRockOn = true;
      }
      
      nextState.isPinching = pinching;
      // Mirror X coord for natural drawing
      nextState.indexFinger = { x: 1 - indexTip.x, y: indexTip.y };
      nextState.handCenter = { x: 1 - hand1[9].x, y: hand1[9].y }; // Middle finger knuckle
      
      // Secondary Hand (Hand 1)
      if (smoothedHands.length > 1) {
        const hand2 = smoothedHands[1];
        
        const h2IndexTip = hand2[8];
        const h2ThumbTip = hand2[4];
        
        const h2PinchDist = dist3D(h2IndexTip, h2ThumbTip);
        const h2PinchThreshold = statesRef.current.isTwoHandPinch ? 0.09 : 0.05;
        const h2Pinching = h2PinchDist < h2PinchThreshold;
        
        if (pinching && h2Pinching) {
          nextState.isTwoHandPinch = true;
          statesRef.current.isTwoHandPinch = true;
          // Distance between left and right pinch centers
          const center1 = { x: (thumbTip.x + indexTip.x)/2, y: (thumbTip.y + indexTip.y)/2 };
          const center2 = { x: (h2ThumbTip.x + h2IndexTip.x)/2, y: (h2ThumbTip.y + h2IndexTip.y)/2 };
          nextState.pinchDistance = Math.sqrt(Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2));
        } else {
          statesRef.current.isTwoHandPinch = false;
        }
      }
    }

    setGestureState(nextState);
    requestRef.current = requestAnimationFrame(detect);
  }, [isEnabled, videoRef]);

  // 3. Start loop
  useEffect(() => {
    if (isLoaded && isEnabled) {
      requestRef.current = requestAnimationFrame(detect);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isLoaded, isEnabled, detect]);

  return { isLoaded, ...gestureState };
}
