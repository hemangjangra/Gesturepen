import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Group, Rect, Circle, RegularPolygon } from 'react-konva';

export default function InfiniteCanvas({ 
  indexFinger,
  handCenter, 
  isDrawing, 
  isPinching, 
  isClosedFist,
  isThumbsDown,
  isTwoHandPinch,
  pinchDistance,
  activeTool,
  color,
  containerWidth, 
  containerHeight,
  onClearCanvas,
  onSaveCanvas,
  isErasing,
  isRockOn
}) {
  const [lines, setLines] = useState([]);
  const [objects, setObjects] = useState([]);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  
  const stageRef = useRef(null);
  const undoCooldown = useRef(false);
  
  const [grabbedObjId, setGrabbedObjId] = useState(null);

  // Convert normalized [0, 1] coords to absolute canvas space
  const getPointerPos = useCallback((fingerPos) => {
    if (!fingerPos || !stageRef.current) return null;
    const stage = stageRef.current;
    const x = fingerPos.x * containerWidth;
    const y = fingerPos.y * containerHeight;
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point({ x, y });
  }, [containerWidth, containerHeight]);

  // Undo
  useEffect(() => {
    if (isThumbsDown && !undoCooldown.current) {
      undoCooldown.current = true;
      if (objects.length > 0) {
        setObjects(prev => prev.slice(0, -1));
      } else if (lines.length > 0) {
        setLines(prev => prev.slice(0, -1));
      }
      setTimeout(() => undoCooldown.current = false, 1000);
    }
  }, [isThumbsDown, lines, objects]);

  // Handle Clear Canvas
  useEffect(() => {
    if (onClearCanvas && onClearCanvas.current) {
      onClearCanvas.current = () => {
         setObjects([]);
         setLines([]);
      };
    }
  }, [onClearCanvas]);

  // Handle Save Canvas
  const saveCooldown = useRef(false);
  const handleSave = useCallback(() => {
    if (stageRef.current && !saveCooldown.current) {
      saveCooldown.current = true;
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `workspace-creation-${Date.now()}.png`;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => saveCooldown.current = false, 3000);
    }
  }, []);

  useEffect(() => {
    if (onSaveCanvas && onSaveCanvas.current) {
      onSaveCanvas.current = handleSave;
    }
  }, [onSaveCanvas, handleSave]);

  useEffect(() => {
    if (isRockOn) {
      handleSave();
    }
  }, [isRockOn, handleSave]);

  // Handle Pinky Erase
  useEffect(() => {
    if (isErasing) {
       setObjects([]);
       setLines([]);
    }
  }, [isErasing]);

  // Handle Grabbing (Pinch)
  useEffect(() => {
    const activePointer = indexFinger;
    if (isPinching && activePointer) {
      const pos = getPointerPos(activePointer);
      if (!pos) return;
      
      if (grabbedObjId === null) {
         // Try to grab something nearby
         const hitRadius = 100 / stageScale;
         for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            const dist = Math.sqrt(Math.pow(pos.x - obj.x, 2) + Math.pow(pos.y - obj.y, 2));
            const isHitRect = obj.type === 'rect' && Math.abs(pos.x - obj.x) < obj.size/2 && Math.abs(pos.y - obj.y) < (obj.height || obj.size)/2;
            const isHitCircle = obj.type === 'circle' && dist < obj.size/2;
            const isHitTri = obj.type === 'triangle' && dist < obj.size/2;
            
            if (isHitRect || isHitCircle || isHitTri || dist < hitRadius) {
               setGrabbedObjId(obj.id);
               break;
            }
         }
      } else {
        // Drag it - set exact x, y to follow pinch
         setObjects(prev => prev.map(o => {
            if (o.id === grabbedObjId) {
               return { ...o, x: pos.x, y: pos.y };
            }
            return o;
         }));
      }
    } else {
      if (grabbedObjId !== null) {
         setGrabbedObjId(null); // Release
      }
    }
  }, [isPinching, indexFinger, objects, grabbedObjId, getPointerPos, stageScale]);

  // Handle Two-Hand Pinch (Spawn Shape)
  const [spawnPreview, setSpawnPreview] = useState(null);
  
  useEffect(() => {
    if (activeTool !== 'Pen' && isTwoHandPinch) {
       // Show preview scaling dynamically based on physical pinch distance
       // Pinch distance is typically 0.1 to 0.6 in normalized camera space
       const size = pinchDistance * containerWidth * 1.5; 
       const centerPos = getPointerPos({ x: 0.5, y: 0.5 }); // Spawn in center of screen
       
       setSpawnPreview({
         type: activeTool.toLowerCase(),
         x: centerPos.x,
         y: centerPos.y,
         size: size,
         color: color
       });
    } else if (spawnPreview && !isTwoHandPinch) {
       // Just released!
       setObjects(prev => [...prev, { ...spawnPreview, id: Date.now() }]);
       setSpawnPreview(null);
    }
  }, [isTwoHandPinch, pinchDistance, activeTool, color, getPointerPos, containerWidth]);

  // Handle Two-Hand Zoom (When Pen is Active)
  const lastPinchDist = useRef(null);
  useEffect(() => {
    if (activeTool === 'Pen' && isTwoHandPinch) {
      if (lastPinchDist.current !== null) {
        const delta = pinchDistance - lastPinchDist.current;
        setStageScale(prev => Math.max(0.1, Math.min(5, prev + delta * 5)));
      }
      lastPinchDist.current = pinchDistance;
    } else {
      lastPinchDist.current = null;
    }
  }, [activeTool, isTwoHandPinch, pinchDistance]);

  // Drawing Loop (Pen Tool Only)
  useEffect(() => {
    if (activeTool !== 'Pen' || !isDrawing || !indexFinger || isPinching || isTwoHandPinch || isClosedFist) {
      return;
    }

    const pos = getPointerPos(indexFinger);
    if (!pos) return;

    setLines((prev) => {
      if (prev.length === 0 || prev[prev.length - 1].finished) {
         return [...prev, { points: [pos.x, pos.y], color: color, width: 4 / stageScale, finished: false }];
      } else {
         const lastLine = prev[prev.length - 1];
         const newPoints = lastLine.points.concat([pos.x, pos.y]);
         return prev.slice(0, -1).concat({ ...lastLine, points: newPoints });
      }
    });
  }, [activeTool, indexFinger, isDrawing, isPinching, isTwoHandPinch, isClosedFist, getPointerPos, color, stageScale]);

  // Finish line when drawing stops
  useEffect(() => {
    if (!isDrawing) {
      setLines(prev => {
        if (prev.length > 0 && !prev[prev.length - 1].finished) {
           const lastLine = prev[prev.length - 1];
           return prev.slice(0, -1).concat({ ...lastLine, finished: true });
        }
        return prev;
      });
    }
  }, [isDrawing]);

  // Render a shape dynamically
  const renderShape = (obj, isPreview = false) => {
     const props = {
       x: obj.type === 'rect' ? obj.x - obj.size/2 : obj.x, // center anchor
       y: obj.type === 'rect' ? obj.y - (obj.height ? obj.height/2 : obj.size/2) : obj.y,
       stroke: obj.color,
       strokeWidth: 4,
       shadowColor: obj.color,
       shadowBlur: 15,
       opacity: isPreview ? 0.5 : 1
     };

     if (obj.type === 'rect') {
        return <Rect {...props} width={obj.size} height={obj.height || obj.size} cornerRadius={12} />;
     } else if (obj.type === 'circle') {
        return <Circle {...props} x={obj.x} y={obj.y} radius={obj.size / 2} />;
     } else if (obj.type === 'triangle') {
        return <RegularPolygon {...props} x={obj.x} y={obj.y} sides={3} radius={obj.size / 2} />;
     }
  };

  // Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setStageScale(newScale);
    setStagePos({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
  };

  return (
    <Stage
      width={containerWidth}
      height={containerHeight}
      onWheel={handleWheel}
      scaleX={stageScale}
      scaleY={stageScale}
      x={stagePos.x}
      y={stagePos.y}
      ref={stageRef}
      style={{ backgroundColor: '#0d0f1e', cursor: 'crosshair' }}
    >
      <Layer>
        {lines.map((line, i) => (
          <Line key={i} points={line.points} stroke={line.color} strokeWidth={line.width || 4} tension={0.5} lineCap="round" lineJoin="round" shadowColor={line.color} shadowBlur={10} />
        ))}

        {objects.map(obj => (
          <Group key={obj.id}>
            {renderShape(obj)}
          </Group>
        ))}

        {/* Dynamic Spawn Preview (Two-Hand Pinch) */}
        {spawnPreview && renderShape(spawnPreview, true)}
        
        {/* User Cursor */}
        {indexFinger && !isClosedFist && (
          <Circle 
            x={getPointerPos(indexFinger)?.x || 0} 
            y={getPointerPos(indexFinger)?.y || 0} 
            radius={isPinching ? 12 : 8} 
            fill={grabbedObjId !== null ? "#ff3366" : (isPinching ? "#fbbf24" : color)} 
            shadowColor={grabbedObjId !== null ? "#ff3366" : color} 
            shadowBlur={15} 
          />
        )}
      </Layer>
    </Stage>
  );
}
