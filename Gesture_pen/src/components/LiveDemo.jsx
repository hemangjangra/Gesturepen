import React, { useState, useRef, useEffect } from 'react';
import { useHandTracker } from '../hooks/useHandTracker';
import InfiniteCanvas from './InfiniteCanvas';

// Spinner
function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="live-demo__spinner">
      <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
  );
}

const COLORS = ['#22d3ee', '#f472b6', '#a78bfa', '#34d399', '#facc15'];
const AR_TOOLS = ['Pen', 'Rect', 'Circle', 'Triangle', 'Clear', 'Save'];

export default function LiveDemo() {
  const [sessionActive, setSessionActive] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [stream, setStream] = useState(null);
  
  const [activeColorIdx, setActiveColorIdx] = useState(0);
  const [activeTool, setActiveTool] = useState('Pen');
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  
  const colorCooldown = useRef(false);
  const hoverStartRef = useRef(null);
  const hoveredToolRef = useRef(null);
  const clearCanvasRef = useRef(null);
  const saveCanvasRef = useRef(null);
  
  const videoRef = useRef(null);
  const arCanvasRef = useRef(null);
  const containerRef = useRef(null);

  const { 
    isLoaded, 
    rawHands,
    indexFinger, 
    isDrawing,
    isPinching, 
    isErasing, 
    isThreeFingers,
    isClosedFist,
    isThumbsDown,
    isRockOn,
    isTwoHandPinch,
    pinchDistance,
    handCenter
  } = useHandTracker(videoRef, sessionActive);

  useEffect(() => {
    if (containerRef.current) {
      setContainerSize({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    }
  }, [sessionActive]);

  const handleStart = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
      setStream(mediaStream);
      setSessionActive(true);
      
      // Request Fullscreen on the workspace container
      if (containerRef.current) {
         if (containerRef.current.requestFullscreen) {
            containerRef.current.requestFullscreen();
         } else if (containerRef.current.webkitRequestFullscreen) {
            containerRef.current.webkitRequestFullscreen();
         }
      }
    } catch(err) {
      console.error("Webcam error:", err);
      alert("Failed to open webcam. Please allow permissions.");
    }
  };

  useEffect(() => {
    if (sessionActive && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [sessionActive, stream]);

  const handleStop = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setSessionActive(false);
    
    // Exit Fullscreen if active
    if (document.fullscreenElement && document.exitFullscreen) {
       document.exitFullscreen();
    } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
       document.webkitExitFullscreen();
    }
  };

  // Handle Color Change
  useEffect(() => {
    if (isThreeFingers && !colorCooldown.current) {
      colorCooldown.current = true;
      setActiveColorIdx(prev => (prev + 1) % COLORS.length);
      setTimeout(() => colorCooldown.current = false, 1000);
    }
  }, [isThreeFingers]);

  // Draw AR Overlay and Toolbar
  useEffect(() => {
    if (!arCanvasRef.current) return;
    const ctx = arCanvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, 640, 480);
    
    // Draw AR Toolbar
    let anyHovered = false;
    const toolRadius = 35;
    const toolX = 640 - 60; // Mirrored on screen, physical left side of video
    
    AR_TOOLS.forEach((tool, idx) => {
       const toolY = 60 + idx * 75; // Tighter spacing to fit 6 tools
       let isHovered = false;
       
       if (rawHands && rawHands.length > 0) {
          const rawIndexTip = rawHands[0][8];
          const fx = rawIndexTip.x * 640;
          const fy = rawIndexTip.y * 480;
          const dist = Math.sqrt(Math.pow(fx - toolX, 2) + Math.pow(fy - toolY, 2));
          
          if (dist < toolRadius) {
             isHovered = true;
             anyHovered = true;
             if (hoveredToolRef.current !== tool) {
                hoveredToolRef.current = tool;
                hoverStartRef.current = performance.now();
             } else if (performance.now() - hoverStartRef.current > 800) {
                if (tool === 'Clear') {
                   if (clearCanvasRef.current) clearCanvasRef.current();
                   setActiveTool('Pen');
                   hoverStartRef.current = performance.now() + 1000; // block re-triggering instantly
                } else if (tool === 'Save') {
                   if (saveCanvasRef.current) saveCanvasRef.current();
                   setActiveTool('Pen');
                   hoverStartRef.current = performance.now() + 1000;
                } else {
                   setActiveTool(tool);
                }
             }
          }
       }
       
       ctx.beginPath();
       ctx.arc(toolX, toolY, toolRadius, 0, 2 * Math.PI);
       ctx.fillStyle = activeTool === tool ? COLORS[activeColorIdx] : (isHovered ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)');
       ctx.fill();
       ctx.strokeStyle = activeTool === tool ? '#fff' : 'rgba(255,255,255,0.3)';
       ctx.lineWidth = 2;
       ctx.stroke();
       
       ctx.fillStyle = '#fff';
       ctx.font = '14px Arial';
       ctx.textAlign = 'center';
       ctx.fillText(tool, toolX, toolY + 5);
       
       // Draw selection progress
       if (isHovered && activeTool !== tool) {
          const progress = Math.min(1, (performance.now() - hoverStartRef.current) / 800);
          ctx.beginPath();
          ctx.arc(toolX, toolY, toolRadius + 4, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress));
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 4;
          ctx.stroke();
       }
    });

    if (!anyHovered) {
      hoveredToolRef.current = null;
    }
    
    // Draw Skeletons
    if (!rawHands) return;
    rawHands.forEach(hand => {
      ctx.fillStyle = COLORS[activeColorIdx];
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      
      const connections = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [5,9],[9,10],[10,11],[11,12],
        [9,13],[13,14],[14,15],[15,16],
        [13,17],[17,18],[18,19],[19,20],
        [0,17]
      ];
      
      ctx.beginPath();
      connections.forEach(([a, b]) => {
        const ptA = hand[a];
        const ptB = hand[b];
        ctx.moveTo(ptA.x * 640, ptA.y * 480);
        ctx.lineTo(ptB.x * 640, ptB.y * 480);
      });
      ctx.stroke();

      hand.forEach((lm) => {
        ctx.beginPath();
        ctx.arc(lm.x * 640, lm.y * 480, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  }, [rawHands, activeColorIdx, indexFinger, activeTool]);

  return (
    <section className="section live-demo-section" id="live-demo">
      <div className="container">
        
        <div className="section__header--center reveal">
          <p className="section__tag">Local Geometry Builder</p>
          <h2 className="section__title">
            Your camera is the <span className="gradient-text">mouse</span>
          </h2>
          <p className="section__desc">
            Use high-precision gestures to draw, grab, and construct geometry completely locally in your browser.
          </p>
        </div>

        <div className="live-demo__controls reveal" style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '30px' }}>
          {!sessionActive ? (
            <button className="live-demo__ctrl-btn ctrl-btn--start" onClick={handleStart}>
              ▶ Start Workspace
            </button>
          ) : (
            <button className="live-demo__ctrl-btn ctrl-btn--stop" onClick={handleStop}>
              ⏹ Stop Workspace
            </button>
          )}
        </div>

        {/* WORKSPACE AREA */}
        <div 
          ref={containerRef}
          className="live-demo__workspace" 
          style={{
            width: '100%', 
            height: '70vh', 
            minHeight: '600px',
            background: '#0d0f1e',
            borderRadius: '24px',
            border: `1px solid ${COLORS[activeColorIdx]}55`,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), inset 0 0 100px ${COLORS[activeColorIdx]}22`
          }}
        >
          {sessionActive ? (
            <>
              {/* Infinite Canvas */}
              <InfiniteCanvas 
                 indexFinger={indexFinger} 
                 handCenter={handCenter}
                 isDrawing={isDrawing}
                 isPinching={isPinching} 
                 isClosedFist={isClosedFist}
                 isErasing={isErasing}
                 isThumbsDown={isThumbsDown}
                 isRockOn={isRockOn}
                 isTwoHandPinch={isTwoHandPinch}
                 pinchDistance={pinchDistance}
                 activeTool={activeTool}
                 color={COLORS[activeColorIdx]}
                 containerWidth={containerSize.width}
                 containerHeight={containerSize.height}
                 onClearCanvas={clearCanvasRef}
                 onSaveCanvas={saveCanvasRef}
              />
              
              {/* Exit Button */}
              <button
                 onClick={handleStop}
                 style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: '#ff3366',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: 'bold',
                    zIndex: 20,
                    boxShadow: '0 4px 15px rgba(255, 51, 102, 0.4)'
                 }}
              >
                 ✕ Exit Workspace
              </button>
              
              {/* Instructions Panel */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 10
              }}>
                <button 
                  onClick={() => setIsGuideOpen(!isGuideOpen)}
                  style={{
                    background: 'rgba(13, 15, 30, 0.8)',
                    border: `1px solid ${COLORS[activeColorIdx]}88`,
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'Space Grotesk, sans-serif',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{color: COLORS[activeColorIdx]}}>Gestures Guide</span> 
                  {isGuideOpen ? '▼' : '▶'}
                </button>
                
                {isGuideOpen && (
                  <div style={{
                    background: 'rgba(13, 15, 30, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${COLORS[activeColorIdx]}88`,
                    borderRadius: '12px',
                    padding: '15px 20px',
                    color: '#fff',
                    fontFamily: 'Space Grotesk, sans-serif',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                      <li><span style={{ fontSize: '18px', marginRight: '8px' }}>☝️</span> <strong>Hover:</strong> Select AR Tool</li>
                      <li><span style={{ fontSize: '18px', marginRight: '8px' }}>☝️</span> <strong>Draw:</strong> Extend Index (Pen)</li>
                      <li><span style={{ fontSize: '18px', marginRight: '8px' }}>✊</span> <strong>Pause:</strong> Closed Fist</li>
                      <li><span style={{ fontSize: '18px', marginRight: '8px' }}>🤏</span> <strong>Grab:</strong> Pinch over shape</li>
                      <li><span style={{ fontSize: '18px', marginRight: '8px' }}>👐</span> <strong>Spawn:</strong> 2-Hand Pinch + Pull</li>
                      <li><span style={{ fontSize: '18px', marginRight: '8px' }}>👎</span> <strong>Undo:</strong> Thumbs Down</li>
                      <li><span style={{ fontSize: '18px', marginRight: '8px' }}>3️⃣</span> <strong>Color:</strong> 3 Fingers Up</li>
                      <li><span style={{ fontSize: '18px', marginRight: '8px' }}>🤘</span> <strong>Save:</strong> Rock On (Index+Pinky)</li>
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Picture-in-Picture Webcam with AR Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                width: '320px',
                aspectRatio: '4/3',
                background: '#000',
                borderRadius: '12px',
                border: `2px solid ${COLORS[activeColorIdx]}`,
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                transform: 'scaleX(-1)' // Mirror container
              }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                
                {/* AR Canvas Overlay */}
                <canvas 
                  ref={arCanvasRef}
                  width="640"
                  height="480"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                />

                {!isLoaded && (
                  <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', fontSize: '12px', transform: 'scaleX(-1)'}}>
                    Loading AR Geometry Engine...
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '15px'}}>
               <div style={{fontSize: '48px'}}>🌐</div>
               <p style={{color: 'rgba(255,255,255,0.5)'}}>Click Start Workspace to begin building</p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
