export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export enum MediaType {
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  AI_GENERATED = 'AI_GENERATED'
}

export interface MediaCrop {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width: number; // Percentage 0-100
  height: number; // Percentage 0-100
}

export interface MediaTrim {
  startTime: number; // Seconds
  endTime: number; // Seconds
}

export interface MediaAsset {
  id: string;
  type: MediaType;
  url: string;
  name: string;
  thumbnail?: string;
  shape?: 'rectangle' | 'square' | 'circle';
  crop?: MediaCrop;
  trim?: MediaTrim;
  duration?: number; // Total duration in seconds (for video)
}

export interface Surface {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  mediaId: string | null; // ID of the assigned media
  points: [Point, Point, Point, Point]; // TL, TR, BR, BL
  zIndex: number;
  blendMode: 'normal' | 'screen' | 'multiply' | 'overlay' | 'lighten';
  shape?: 'rectangle' | 'circle';
}

export interface ProjectState {
  surfaces: Surface[];
  mediaAssets: MediaAsset[];
  selectedSurfaceId: string | null;
  canvasSize: Size;
}

// --- Sync Types ---

export type SyncMessageType = 'SYNC_STATE' | 'REQUEST_STATE' | 'HEARTBEAT';

export interface SyncMessage {
  type: SyncMessageType;
  payload?: ProjectState;
  timestamp?: number;
}