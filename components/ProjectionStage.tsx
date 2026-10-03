import React, { useEffect, useRef, useState } from 'react';
import { ProjectState } from '../types';
import { SurfaceRenderer } from './SurfaceRenderer';

/** One logical canvas, uniformly fitted and letterboxed in either output mode. */
export function ProjectionStage({ project }: { project: ProjectState }) {
  const root = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const element = root.current!;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(entry.contentRect.width / project.canvasSize.width,
        entry.contentRect.height / project.canvasSize.height));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [project.canvasSize.width, project.canvasSize.height]);
  return <div ref={root} className="absolute inset-0 overflow-hidden bg-black">
    <div data-testid="projection-stage" style={{ position: 'absolute', left: '50%', top: '50%',
      width: project.canvasSize.width, height: project.canvasSize.height,
      transform: `translate(-50%, -50%) scale(${scale})` }}>
      {project.surfaces.filter(s => s.visible).map(surface => <SurfaceRenderer key={surface.id}
        surface={surface} media={project.mediaAssets.find(m => m.id === surface.mediaId)}
        isSelected={false} readOnly />)}
    </div>
  </div>;
}
