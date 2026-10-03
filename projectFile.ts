import { ProjectState } from './types';
import { getMediaBlob } from './storage';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const numeric = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
export function validateProject(value: unknown): asserts value is ProjectState {
  const p = value as ProjectState;
  if (!p || !Array.isArray(p.surfaces) || !Array.isArray(p.mediaAssets) ||
      p.surfaces.length > 1000 || p.mediaAssets.length > 1000 ||
      !numeric(p.canvasSize?.width) || !numeric(p.canvasSize?.height) ||
      p.canvasSize.width <= 0 || p.canvasSize.height <= 0 ||
      p.canvasSize.width > 16384 || p.canvasSize.height > 16384) throw new Error('Invalid project canvas or collections');
  const ids = new Set<string>();
  for (const a of p.mediaAssets) {
    if (typeof a.id !== 'string' || ids.has(a.id) || typeof a.name !== 'string' ||
        !['IMAGE', 'VIDEO', 'AI_GENERATED'].includes(a.type)) throw new Error('Invalid media');
    ids.add(a.id);
    if (a.crop && (![a.crop.x,a.crop.y,a.crop.width,a.crop.height].every(numeric) ||
        a.crop.x < 0 || a.crop.y < 0 || a.crop.width <= 0 || a.crop.height <= 0 ||
        a.crop.x+a.crop.width > 100 || a.crop.y+a.crop.height > 100)) throw new Error('Invalid crop');
    if (a.trim && (!numeric(a.trim.startTime) || !numeric(a.trim.endTime) || a.trim.startTime < 0 || a.trim.endTime <= a.trim.startTime)) throw new Error('Invalid trim');
  }
  const surfaceIds = new Set<string>();
  for (const s of p.surfaces) {
    if (typeof s.id !== 'string' || surfaceIds.has(s.id) || typeof s.name !== 'string' ||
      !Array.isArray(s.points) || s.points.length !== 4 || !s.points.every(p => numeric(p.x) && numeric(p.y)) ||
      !numeric(s.opacity) || s.opacity < 0 || s.opacity > 1 || !numeric(s.zIndex) ||
      typeof s.visible !== 'boolean' || typeof s.locked !== 'boolean' ||
      !['normal','screen','multiply','overlay','lighten'].includes(s.blendMode) ||
      (s.mediaId !== null && !ids.has(s.mediaId))) throw new Error('Invalid surface');
    surfaceIds.add(s.id);
  }
  if (p.selectedSurfaceId !== null && !surfaceIds.has(p.selectedSurfaceId)) throw new Error('Invalid selection');
}

const dataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

export async function exportProject(project: ProjectState): Promise<Blob> {
  const media: Record<string, string> = {};
  let bytes = 0;
  for (const asset of project.mediaAssets) {
    const blob = await getMediaBlob(asset.id);
    if (!blob) throw new Error(`Missing media: ${asset.name}. Reimport it before exporting.`);
    bytes += blob.size;
    if (bytes > MAX_FILE_SIZE * 0.7) throw new Error('Project too large for portable JSON (100 MB limit).');
    media[asset.id] = await dataUrl(blob);
  }
  const clean = { ...project, mediaAssets: project.mediaAssets.map(({ thumbnail, ...a }) => ({ ...a, url: '' })) };
  return new Blob([JSON.stringify({ format: 'rayality', version: 1, project: clean, media })], { type: 'application/json' });
}

export async function readProjectFile(file: File): Promise<{ project: ProjectState; blobs: Map<string, Blob> }> {
  if (file.size > MAX_FILE_SIZE) throw new Error('Project exceeds 100 MB.');
  const data = JSON.parse(await file.text());
  if (data.format !== 'rayality' || data.version !== 1) throw new Error('Unsupported project format');
  validateProject(data.project);
  const project = data.project as ProjectState;
  const blobs = new Map<string, Blob>();
  // Decode everything before changing storage. Fresh IDs protect the current project's media.
  const newIds = new Map<string, string>();
  for (const asset of project.mediaAssets) {
    const encoded = data.media?.[asset.id];
    if (typeof encoded !== 'string' || !/^data:(image\/(png|jpeg|gif|webp|svg\+xml)|video\/(mp4|webm|ogg));base64,/.test(encoded)) throw new Error('Missing or unsupported embedded media');
    const blob = await (await fetch(encoded)).blob();
    const id = crypto.randomUUID();
    newIds.set(asset.id, id);
    blobs.set(id, blob);
  }
  project.mediaAssets = project.mediaAssets.map(a => ({ ...a, id: newIds.get(a.id)!, url: '', thumbnail: undefined }));
  project.surfaces = project.surfaces.map(s => ({ ...s, mediaId: s.mediaId ? newIds.get(s.mediaId)! : null }));
  return { project, blobs };
}
