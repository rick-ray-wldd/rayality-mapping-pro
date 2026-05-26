import React, { useEffect, useState } from 'react';
import { ProjectState, SyncMessage } from '../types';
import { SurfaceRenderer } from './SurfaceRenderer';
import { SYNC_CHANNEL_NAME } from '../constants';

interface OutputViewProps {
  onExit?: () => void;
}

export const OutputView: React.FC<OutputViewProps> = ({ onExit }) => {
  const [project, setProject] = useState<ProjectState | null>(null);
  const [blackout, setBlackout] = useState(false);
  const [cursorHidden, setCursorHidden] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);

    const handleMessage = (event: MessageEvent<SyncMessage>) => {
      const { type, payload } = event.data;
      if (type === 'SYNC_STATE' && payload) {
        setProject(payload);
      }
    };

    channel.onmessage = handleMessage;

    // Request initial state from editor
    channel.postMessage({ type: 'REQUEST_STATE' });

    // Start heartbeat
    const heartbeatInterval = setInterval(() => {
      channel.postMessage({ type: 'HEARTBEAT' });
    }, 2000);

    return () => {
      channel.close();
      clearInterval(heartbeatInterval);
    };
  }, []);

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Escape to exit
      if (e.key === 'Escape') {
        if (onExit) onExit();
        // Allow default behavior (like exiting fullscreen) to propagate if needed,
        // but often we want to trigger our exit logic too.
      }

      switch (e.key.toLowerCase()) {
        case 'f':
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error);
          } else {
            document.exitFullscreen().catch(console.error);
          }
          break;
        case 'h':
          setCursorHidden(prev => !prev);
          break;
        case 'b':
          setBlackout(prev => !prev);
          break;
      }
    };

    // Double click to toggle fullscreen
    const handleDoubleClick = () => {
       if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(console.error);
       } else {
          document.exitFullscreen().catch(console.error);
       }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dblclick', handleDoubleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [onExit]);

  if (!project) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-zinc-500 font-mono">
        <div className="animate-pulse mb-4">CONNECTING TO EDITOR...</div>
        <p className="text-xs">Waiting for synchronization signal</p>
      </div>
    );
  }

  return (
    <div 
      className={`w-screen h-screen bg-black overflow-hidden relative ${cursorHidden ? 'cursor-none' : ''}`}
    >
      {/* Blackout Overlay */}
      <div 
        className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${blackout ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Rendering Stage */}
      <div className="relative w-full h-full">
         {project.surfaces.map(surface => {
            if (!surface.visible) return null;
            const media = project.mediaAssets.find(m => m.id === surface.mediaId);
            return (
              <SurfaceRenderer
                key={surface.id}
                surface={surface}
                media={media}
                isSelected={false} // No selection visual in output
                readOnly={true} // Disable all interactions
              />
            );
          })}
      </div>
    </div>
  );
};