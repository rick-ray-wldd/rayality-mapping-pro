import React, { useRef, useState, useEffect } from 'react';
import { Surface, MediaAsset, Point } from '../types';
import { getPerspectiveTransform, getCentroid } from '../mathUtils';

interface SurfaceRendererProps {
  surface: Surface;
  media: MediaAsset | undefined;
  isSelected: boolean;
  onSelect?: (id: string) => void;
  onUpdatePoints?: (id: string, newPoints: [Point, Point, Point, Point]) => void;
  readOnly?: boolean;
}

const HANDLE_SIZE = 12;
const ACTIVE_COLOR = '#22d3ee'; // Cyan-400

export const SurfaceRenderer: React.FC<SurfaceRendererProps> = ({
  surface,
  media,
  isSelected,
  onSelect,
  onUpdatePoints,
  readOnly = false,
}) => {
  const [draggingMode, setDraggingMode] = useState<'none' | 'point' | 'body'>('none');
  const [dragIndex, setDragIndex] = useState<number>(-1);
  const [startDragPos, setStartDragPos] = useState<Point>({ x: 0, y: 0 });
  
  const [localPoints, setLocalPoints] = useState<[Point, Point, Point, Point]>(surface.points);
  
  const activePointsRef = useRef<[Point, Point, Point, Point]>(surface.points);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (draggingMode === 'none') {
      setLocalPoints(surface.points);
      activePointsRef.current = surface.points;
    }
  }, [surface.points, draggingMode]);

  // Video Loop Logic for Trim
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (media?.trim) {
      const { startTime, endTime } = media.trim;
      
      const handleTimeUpdate = () => {
        // Enforce loop range:
        // 1. If we pass the end time
        // 2. If we accidentally loop to 0 (native loop behavior) and 0 is less than startTime
        if (video.currentTime >= endTime || video.currentTime < startTime) {
          video.currentTime = startTime;
          video.play().catch(() => {});
        }
      };
      
      // Initial seek to start time if needed
      if (video.currentTime < startTime) {
        video.currentTime = startTime;
      }

      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [media?.trim]);

  const TEX_WIDTH = 1280;
  const TEX_HEIGHT = 720;

  const transformString = getPerspectiveTransform(TEX_WIDTH, TEX_HEIGHT, localPoints);

  const getMousePos = (e: MouseEvent | React.MouseEvent) => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return { x: 0, y: 0 };
    
    const rect = parent.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;
    
    return {
      x: relativeX * parent.offsetWidth,
      y: relativeY * parent.offsetHeight
    };
  };

  const handlePointMouseDown = (e: React.MouseEvent, idx: number) => {
    if (readOnly) return;
    e.preventDefault(); 
    e.stopPropagation();
    if (surface.locked) return;
    
    setDraggingMode('point');
    setDragIndex(idx);
    activePointsRef.current = localPoints; 
    onSelect?.(surface.id);
  };

  const handleBodyMouseDown = (e: React.MouseEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    if (surface.locked) return;

    setDraggingMode('body');
    setStartDragPos(getMousePos(e));
    activePointsRef.current = localPoints; 
    onSelect?.(surface.id);
  };

  useEffect(() => {
    if (draggingMode === 'none' || readOnly) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      e.preventDefault(); 
      const currentPos = getMousePos(e);

      if (draggingMode === 'point' && dragIndex !== -1) {
        if (e.shiftKey) {
          const originalPoints = activePointsRef.current;
          const cx = originalPoints.reduce((sum, p) => sum + p.x, 0) / 4;
          const cy = originalPoints.reduce((sum, p) => sum + p.y, 0) / 4;
          const startPoint = originalPoints[dragIndex];
          const startDist = Math.sqrt(Math.pow(startPoint.x - cx, 2) + Math.pow(startPoint.y - cy, 2));
          const currentDist = Math.sqrt(Math.pow(currentPos.x - cx, 2) + Math.pow(currentPos.y - cy, 2));

          if (startDist > 0.1) {
            const scale = currentDist / startDist;
            const newPoints = originalPoints.map(p => ({
              x: cx + (p.x - cx) * scale,
              y: cy + (p.y - cy) * scale
            })) as [Point, Point, Point, Point];
            setLocalPoints(newPoints);
          }
        } 
        else {
          const newPoints = [...activePointsRef.current] as [Point, Point, Point, Point];
          newPoints[dragIndex] = currentPos;
          setLocalPoints(newPoints);
        }
      } 
      else if (draggingMode === 'body') {
        const dx = currentPos.x - startDragPos.x;
        const dy = currentPos.y - startDragPos.y;
        
        const newPoints = activePointsRef.current.map(p => ({
          x: p.x + dx,
          y: p.y + dy
        })) as [Point, Point, Point, Point];
        
        setLocalPoints(newPoints);
      }
    };

    const handleWindowMouseUp = () => {
      if (onUpdatePoints) {
        setLocalPoints((finalPoints) => {
            onUpdatePoints(surface.id, finalPoints);
            return finalPoints;
        });
      }
      setDraggingMode('none');
      setDragIndex(-1);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [draggingMode, dragIndex, startDragPos, surface.id, readOnly, onUpdatePoints]);

  // --- Calculate Media Styles based on Shape AND Crop ---
  const getMediaStyle = () => {
    const baseStyle: React.CSSProperties = { 
      pointerEvents: 'none', 
      userSelect: 'none' 
    };
    
    // 1. Handle Crop
    // If crop exists, we scale the media up and translate it to simulate a crop
    // This is done by simulating a 'viewport' via the parent div (which has overflow hidden)
    // and scaling the child img/video.
    let cropStyle: React.CSSProperties = {};
    
    if (media?.crop) {
        const { x, y, width, height } = media.crop;
        // W = 100% * (100 / cropW)
        // Left = -(x * (100/cropW)) %
        cropStyle = {
            width: `${100 * (100 / width)}%`,
            height: `${100 * (100 / height)}%`,
            marginLeft: `-${x * (100 / width)}%`,
            marginTop: `-${y * (100 / height)}%`,
            maxWidth: 'none', // Allow overflowing
            maxHeight: 'none',
            objectFit: 'fill'
        };
    } else {
        // Default Fill
        cropStyle = { width: '100%', height: '100%', objectFit: 'fill' };
    }

    // 2. Handle Output Shape (Masking)
    // The Container handles the clipping/border-radius.
    // However, if we are cropping, 'object-fit: cover' logic in the previous implementation might conflict.
    // The previous implementation used 'object-fit: cover' to crop 16:9 to Square/Circle automatically.
    // Now we have explicit manual cropping.
    
    // If Manual Crop is active, we trust the user's crop.
    // If NO manual crop, and shape is Square/Circle, we fallback to auto-center crop (cover).
    
    if (!media?.crop && (media?.shape === 'square' || media?.shape === 'circle')) {
        cropStyle = {
            ...cropStyle,
            height: '100%',
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            margin: '0 auto',
            display: 'block'
        };
    }

    return { ...baseStyle, ...cropStyle };
  };

  return (
    <div 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      ref={containerRef}
      style={{ zIndex: surface.zIndex }}
    >
      <div
        className={`absolute top-0 left-0 overflow-hidden transition-opacity duration-75 ${readOnly ? 'pointer-events-none' : 'pointer-events-auto'}`}
        onMouseDown={handleBodyMouseDown}
        style={{
          width: TEX_WIDTH,
          height: TEX_HEIGHT,
          transform: transformString,
          transformOrigin: '0 0',
          opacity: surface.opacity,
          mixBlendMode: surface.blendMode as any,
          cursor: readOnly ? 'none' : (isSelected ? 'move' : 'pointer'),
          border: isSelected && !readOnly ? '2px solid #22d3ee' : 'none',
          boxShadow: isSelected && !readOnly ? '0 0 15px rgba(34, 211, 238, 0.3)' : 'none',
          boxSizing: 'border-box',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          // Apply Shape Mask to the CONTAINER
          borderRadius: surface.shape === 'circle' ? '50%' : '0%',
          background: 'black'
        }}
      >
        {media ? (
          media.type === 'VIDEO' || media.type === 'AI_GENERATED' ? (
            <video
              ref={videoRef}
              src={media.url}
              autoPlay
              // Disable native loop if we are manually trimming
              loop={!media.trim} 
              muted
              playsInline
              style={getMediaStyle()}
            />
          ) : (
            <img 
              src={media.url} 
              alt={media.name} 
              style={getMediaStyle()}
            />
          )
        ) : (
          <div className={`w-full h-full bg-zinc-800/80 flex items-center justify-center border border-zinc-600/50 ${readOnly ? 'opacity-0' : ''}`}>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 pointer-events-none"></div>
             {isSelected && !readOnly && <span className="text-cyan-400 font-mono font-bold text-4xl drop-shadow-md tracking-widest opacity-50 select-none">QUAD</span>}
          </div>
        )}
      </div>

      {isSelected && !readOnly && !surface.locked && (
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          <path
            d={`M ${localPoints[0].x} ${localPoints[0].y} L ${localPoints[1].x} ${localPoints[1].y} L ${localPoints[2].x} ${localPoints[2].y} L ${localPoints[3].x} ${localPoints[3].y} Z`}
            fill="none"
            stroke={ACTIVE_COLOR}
            strokeWidth="1.5"
            strokeDasharray="5 3"
            opacity="0.8"
          />
          {localPoints.map((p, idx) => (
            <g key={idx} transform={`translate(${p.x}, ${p.y})`}>
              <circle
                r={HANDLE_SIZE + 6}
                fill="transparent"
                className="pointer-events-auto cursor-crosshair hover:fill-white/10"
                onMouseDown={(e) => handlePointMouseDown(e as any, idx)}
              />
              <circle
                r={HANDLE_SIZE / 2}
                fill="black"
                stroke={ACTIVE_COLOR}
                strokeWidth="2"
                className="pointer-events-none"
              />
               <text y={-10} x={10} fill={ACTIVE_COLOR} fontSize="10" fontFamily="monospace" opacity="0.7">
                 {idx + 1}
               </text>
            </g>
          ))}
          {(() => {
             const cx = (localPoints[0].x + localPoints[2].x + localPoints[1].x + localPoints[3].x) / 4;
             const cy = (localPoints[0].y + localPoints[2].y + localPoints[1].y + localPoints[3].y) / 4;
             return (
               <g transform={`translate(${cx}, ${cy})`}>
                  <circle r="3" fill={ACTIVE_COLOR} />
                  <line x1="-6" y1="0" x2="6" y2="0" stroke={ACTIVE_COLOR} strokeWidth="1" opacity="0.5"/>
                  <line x1="0" y1="-6" x2="0" y2="6" stroke={ACTIVE_COLOR} strokeWidth="1" opacity="0.5"/>
               </g>
             );
          })()}
        </svg>
      )}
    </div>
  );
};