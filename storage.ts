import { ProjectState, MediaAsset } from './types';

const DB_NAME = 'LuminaMapDB';
const DB_VERSION = 1;
const STORE_PROJECT = 'project';
const STORE_MEDIA = 'media';
export const SYNC_STORAGE_KEY = 'lumina_map_sync_state';

// --- Database Initialization ---

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECT)) {
        db.createObjectStore(STORE_PROJECT);
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Media Operations ---

export async function saveMediaBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_MEDIA);
    store.put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMediaBlob(id: string): Promise<Blob | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readonly');
    const store = tx.objectStore(STORE_MEDIA);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteMediaBlob(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_MEDIA);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Project State Operations ---

export async function saveProjectState(state: ProjectState): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECT, 'readwrite');
    const store = tx.objectStore(STORE_PROJECT);
    
    // We create a deep copy and sanitize media URLs before saving
    // because Blob URLs are ephemeral and shouldn't be stored in DB JSON
    const stateToSave = {
      ...state,
      mediaAssets: state.mediaAssets.map(asset => ({
        ...asset,
        url: '' // Clear URL, we will regenerate it from Blob on load
      }))
    };

    store.put(stateToSave, 'currentProject');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getProjectState(): Promise<ProjectState | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECT, 'readonly');
    const store = tx.objectStore(STORE_PROJECT);
    const request = store.get('currentProject');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Helper to Rehydrate State ---
// Loads the project JSON, then fetches all Blobs and recreates object URLs
export async function loadFullProject(): Promise<ProjectState | null> {
  try {
    const project = await getProjectState();
    if (!project) return null;

    const rehydratedAssets: MediaAsset[] = [];

    for (const asset of project.mediaAssets) {
      const blob = await getMediaBlob(asset.id);
      if (blob) {
        const newUrl = URL.createObjectURL(blob);
        rehydratedAssets.push({ ...asset, url: newUrl });
      } else {
        // If blob is missing (rare), we keep the asset structure but it won't play
        console.warn(`Media blob missing for asset: ${asset.id}`);
        rehydratedAssets.push({ ...asset });
      }
    }

    return {
      ...project,
      mediaAssets: rehydratedAssets
    };
  } catch (e) {
    console.error("Failed to load project", e);
    return null;
  }
}

// --- Sync Helpers (LocalStorage) ---
// This acts as a backup channel if BroadcastChannel fails
export function writeSyncState(state: ProjectState) {
  try {
    // Sanitize URLs to avoid "quota exceeded" or structure errors in LS
    const cleanState = {
      ...state,
      mediaAssets: state.mediaAssets.map(a => ({ ...a, url: '' })), // Media is loaded via IDB anyway
      _timestamp: Date.now() 
    };
    localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(cleanState));
  } catch (e) {
    console.warn("Sync storage write failed", e);
  }
}