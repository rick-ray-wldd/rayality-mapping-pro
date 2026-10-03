import React, { useEffect, useState } from 'react';
import { ProjectState, SyncMessage } from '../types';
import { ProjectionStage } from './ProjectionStage';
import { getMediaBlob, SYNC_STORAGE_KEY } from '../storage';
import { SYNC_CHANNEL_NAME } from '../constants';

interface OutputViewProps {
  onExit?: () => void;
}

export const OutputView: React.FC<OutputViewProps> = ({ onExit }) => {
  const [project, setProject] = useState<ProjectState | null>(null);
  const [blackout, setBlackout] = useState(false);
  const [cursorHidden, setCursorHidden] = useState(false);

  useEffect(() => {
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(SYNC_CHANNEL_NAME) : null;
    const urls = new Map<string, string>();
    let revision = 0;
    let closed = false;
    const receive = async (payload: ProjectState) => {
      const current = ++revision;
      const assets = await Promise.all(payload.mediaAssets.map(async asset => {
        if (!urls.has(asset.id)) {
          const blob = await getMediaBlob(asset.id);
          if (blob && !closed) urls.set(asset.id, URL.createObjectURL(blob));
        }
        return { ...asset, url: urls.get(asset.id) || '' };
      }));
      if (!closed && current === revision) setProject({ ...payload, mediaAssets: assets });
    };
    const readBackup = () => {
      try {
        const saved = localStorage.getItem(SYNC_STORAGE_KEY);
        if (saved) void receive(JSON.parse(saved)).catch(console.error);
      } catch { /* Editor may not have published yet. */ }
    };
    if (channel) {
      channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        if (event.data.type === 'SYNC_STATE' && event.data.payload) void receive(event.data.payload).catch(console.error);
      };
      channel.postMessage({ type: 'REQUEST_STATE' });
    }
    const onStorage = (event: StorageEvent) => { if (event.key === SYNC_STORAGE_KEY) readBackup(); };
    window.addEventListener('storage', onStorage);
    readBackup();
    const heartbeatInterval = setInterval(() => channel?.postMessage({ type: 'HEARTBEAT' }), 2000);
    return () => {
      closed = true;
      channel?.close();
      clearInterval(heartbeatInterval);
      window.removeEventListener('storage', onStorage);
      urls.forEach(url => URL.revokeObjectURL(url));
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

      <ProjectionStage project={project} />
    </div>
  );
};