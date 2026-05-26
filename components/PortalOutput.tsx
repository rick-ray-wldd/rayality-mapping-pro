import React, { useEffect } from 'react';
import { ProjectState } from '../types';
import { SurfaceRenderer } from './SurfaceRenderer';

interface PortalOutputProps {
  project: ProjectState;
  windowObj: Window; // The PiP window object
}

export const PortalOutput: React.FC<PortalOutputProps> = ({ project, windowObj }) => {
  
  // Handle shortcuts specific to the PiP window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        // Fullscreen the PiP window itself (if supported by browser/OS specific behavior)
        // Note: standard requestFullscreen might fail in PiP depending on browser policy
        console.log("Toggle fullscreen requested");
      }
    };

    // We must attach listeners to the PiP window's document, not the main app's
    windowObj.document.addEventListener('keydown', handleKeyDown);
    return () => {
      windowObj.document.removeEventListener('keydown', handleKeyDown);
    };
  }, [windowObj]);

  return (
    <div className="w-full h-full bg-black overflow-hidden relative">
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