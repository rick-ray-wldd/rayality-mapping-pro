import React, { useEffect, useState } from 'react';
import { ProjectState } from '../types';
import { ProjectionStage } from './ProjectionStage';

export function PortalOutput({ project, windowObj }: { project: ProjectState; windowObj: Window }) {
  const [blackout, setBlackout] = useState(false);
  const [hideCursor, setHideCursor] = useState(false);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'b') setBlackout(v => !v);
      if (e.key.toLowerCase() === 'h') setHideCursor(v => !v);
    };
    windowObj.addEventListener('keydown', key);
    return () => windowObj.removeEventListener('keydown', key);
  }, [windowObj]);
  return <div className="w-screen h-screen relative bg-black" style={{ cursor: hideCursor ? 'none' : 'auto' }}>
    <ProjectionStage project={project} />
    {blackout && <div className="absolute inset-0 bg-black z-[9999]" />}
  </div>;
}
