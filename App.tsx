
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Surface, MediaAsset, ProjectState, Point, MediaType, SyncMessage } from './types';
import { SurfaceRenderer } from './components/SurfaceRenderer';
import { VeoPanel } from './components/VeoPanel';
import { OutputView } from './components/OutputView';
import { PortalOutput } from './components/PortalOutput';
import { MediaPreviewModal } from './components/MediaPreviewModal';
import { MediaEditor } from './components/MediaEditor';
import { 
  getCentroid, 
  getBoundingBox, 
  translatePoints, 
  scalePoints, 
  rotatePoints 
} from './mathUtils';
import { 
  DEFAULT_CANVAS_WIDTH, 
  DEFAULT_CANVAS_HEIGHT, 
  BLEND_MODES,
  SYNC_CHANNEL_NAME
} from './constants';
import { 
  saveMediaBlob, 
  saveProjectState, 
  loadFullProject,
  writeSyncState
} from './storage';
import { 
  PlusSquare, 
  Layers, 
  Settings, 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Monitor,
  Grid,
  ZoomIn,
  ZoomOut,
  Maximize,
  Move,
  CornerUpRight,
  GripVertical,
  PlayCircle,
  Volume2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Wifi,
  WifiOff,
  CheckCircle2,
  Projector,
  X,
  Loader2,
  Sparkles,
  Maximize2,
  Copy,
  PictureInPicture2,
  AlertTriangle,
  RectangleHorizontal, 
  RectangleVertical,   
  Square,              
  Circle as CircleIcon,
  Scissors,
  BookOpen
} from 'lucide-react';

export const App: React.FC = () => {
  const [isOutputMode, setIsOutputMode] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      if (window.self !== window.top) setIsInIframe(true);
    } catch (e) {
      setIsInIframe(true);
    }

    if (window.location.hash === '#output') {
      setIsOutputMode(true);
      setIsAppLoading(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'output') {
      setIsOutputMode(true);
      setIsAppLoading(false); 
      return;
    } 
    
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedProject = await loadFullProject();
      if (savedProject) setProject(savedProject);
    } catch (e) {
      console.error("Error loading saved project:", e);
    } finally {
      setIsAppLoading(false);
    }
  };

  const [project, setProject] = useState<ProjectState>({
    surfaces: [],
    mediaAssets: [],
    selectedSurfaceId: null,
    canvasSize: { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT },
  });

  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(0.6); 
  const [activeTab, setActiveTab] = useState<'layers' | 'media' | 'veo' | 'edit'>('layers');
  const [outputConnected, setOutputConnected] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [pipLoading, setPipLoading] = useState(false);
  const [pipError, setPipError] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const lastHeartbeatRef = useRef<number>(0);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if ('documentPictureInPicture' in window) setPipSupported(true);
  }, []);

  useEffect(() => {
    if (isOutputMode || isAppLoading) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveProjectState(project).catch(err => console.error("Auto-save failed:", err));
    }, 1000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [project, isOutputMode, isAppLoading]);

  useEffect(() => {
    if (isOutputMode) return;
    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    broadcastChannelRef.current = channel;
    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const { type } = event.data;
      if (type === 'REQUEST_STATE') {
        channel.postMessage({ type: 'SYNC_STATE', payload: project });
        writeSyncState(project);
      } else if (type === 'HEARTBEAT') {
        lastHeartbeatRef.current = Date.now();
        setOutputConnected(true);
      }
    };
    const monitorInterval = setInterval(() => {
      if (Date.now() - lastHeartbeatRef.current > 4000) setOutputConnected(false);
    }, 1000);
    return () => { channel.close(); clearInterval(monitorInterval); };
  }, [isOutputMode, project]);

  useEffect(() => {
    if (isOutputMode || !broadcastChannelRef.current) return;
    broadcastChannelRef.current.postMessage({ type: 'SYNC_STATE', payload: project });
    writeSyncState(project);
  }, [project, isOutputMode]);

  const getOutputUrl = () => {
    const currentHref = window.location.href;
    const baseUrl = currentHref.split('#')[0];
    return `${baseUrl}#output`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(getOutputUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePiP = async () => {
    setPipError(null);
    if (pipWindow) { pipWindow.close(); setPipWindow(null); return; }
    if (!('documentPictureInPicture' in window)) {
      setPipError("API not supported.");
      return;
    }
    setPipLoading(true);
    try {
      const win = await (window as any).documentPictureInPicture.requestWindow({ width: 800, height: 600 });
      const copyStyles = () => {
        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach((styleSheet) => {
          try {
            if (styleSheet.href) {
              const newLink = win.document.createElement('link');
              newLink.rel = 'stylesheet';
              newLink.href = styleSheet.href;
              win.document.head.appendChild(newLink);
            } else if (styleSheet.cssRules) {
              const newStyle = win.document.createElement('style');
              Array.from(styleSheet.cssRules).forEach((rule: any) => {
                newStyle.appendChild(win.document.createTextNode(rule.cssText));
              });
              win.document.head.appendChild(newStyle);
            }
          } catch (e) { console.warn("Skipped stylesheet copy"); }
        });
        const tailwindScript = document.querySelector('script[src*="tailwindcss"]');
        if (tailwindScript) {
           const newScript = win.document.createElement('script');
           newScript.src = (tailwindScript as HTMLScriptElement).src;
           win.document.head.appendChild(newScript);
        }
      };
      copyStyles();
      win.document.title = "Rayality Output";
      win.document.body.style.margin = '0';
      win.document.body.style.backgroundColor = '#000';
      win.addEventListener('pagehide', () => setPipWindow(null));
      setPipWindow(win);
      setShowLaunchModal(false);
    } catch (err: any) {
      setPipError("Blocked or failed to launch. Use Manual New Tab.");
    } finally { setPipLoading(false); }
  };

  const addSurface = (type: '16:9' | '9:16' | '1:1' | 'circle' = '16:9') => {
    const center = { x: project.canvasSize.width / 2, y: project.canvasSize.height / 2 };
    let width = 300, height = 300;
    if (type === '16:9') { width = 400; height = 225; }
    else if (type === '9:16') { width = 225; height = 400; }
    
    const newSurface: Surface = {
      id: `surface-${Date.now()}`,
      name: type === 'circle' ? `Circle ${project.surfaces.length + 1}` : `Quad ${project.surfaces.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      mediaId: null,
      blendMode: 'normal',
      zIndex: project.surfaces.length + 1,
      shape: type === 'circle' ? 'circle' : 'rectangle',
      points: [
        { x: center.x - width / 2, y: center.y - height / 2 },
        { x: center.x + width / 2, y: center.y - height / 2 },
        { x: center.x + width / 2, y: center.y + height / 2 },
        { x: center.x - width / 2, y: center.y + height / 2 }
      ]
    };
    setProject(prev => ({ ...prev, surfaces: [...prev.surfaces, newSurface], selectedSurfaceId: newSurface.id }));
    setShowAddMenu(false);
  };

  const updateSurfacePoints = useCallback((id: string, points: [Point, Point, Point, Point]) => setProject((prev) => ({ ...prev, surfaces: prev.surfaces.map((s) => (s.id === id ? { ...s, points } : s)) })), []);
  const selectSurface = (id: string | null) => setProject((prev) => ({ ...prev, selectedSurfaceId: id }));
  const deleteSurface = (id: string) => setProject((prev) => ({ ...prev, surfaces: prev.surfaces.filter((s) => s.id !== id), selectedSurfaceId: prev.selectedSurfaceId === id ? null : prev.selectedSurfaceId }));
  const toggleVisibility = (id: string) => setProject((prev) => ({ ...prev, surfaces: prev.surfaces.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)) }));
  const toggleLock = (id: string) => setProject((prev) => ({ ...prev, surfaces: prev.surfaces.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s)) }));
  const updateSurfaceProp = (id: string, prop: keyof Surface, value: any) => setProject((prev) => ({ ...prev, surfaces: prev.surfaces.map((s) => (s.id === id ? { ...s, [prop]: value } : s)) }));
  const moveLayer = (fromIndex: number, toIndex: number) => { const newSurfaces = [...project.surfaces]; const [moved] = newSurfaces.splice(fromIndex, 1); newSurfaces.splice(toIndex, 0, moved); const updated = newSurfaces.map((s, i) => ({ ...s, zIndex: i + 1 })); setProject(prev => ({ ...prev, surfaces: updated })); };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    Array.from(files).forEach(async (file: File) => {
      const url = URL.createObjectURL(file); const type = file.type.startsWith('video') ? MediaType.VIDEO : MediaType.IMAGE; const id = `media-${Date.now()}-${Math.random()}`; const asset: MediaAsset = { id, type, url, name: file.name };
      try { await saveMediaBlob(id, file); } catch (err) { console.error(err); }
      setProject(prev => ({ ...prev, mediaAssets: [...prev.mediaAssets, asset] }));
    });
  };
  const addVeoAsset = async (asset: MediaAsset) => {
    try { const response = await fetch(asset.url); const blob = await response.blob(); await saveMediaBlob(asset.id, blob); } catch (err) { console.error(err); }
    setProject(prev => ({ ...prev, mediaAssets: [...prev.mediaAssets, asset] })); setActiveTab('media'); setPreviewAsset(asset);
  };
  const assignMediaToSurface = (surfaceId: string, mediaId: string) => updateSurfaceProp(surfaceId, 'mediaId', mediaId);
  const handleTransform = (type: 'translate' | 'scale' | 'rotate', values: any) => {
    if (!project.selectedSurfaceId) return; const surface = project.surfaces.find(s => s.id === project.selectedSurfaceId); if (!surface) return;
    let newPoints = surface.points; const centroid = getCentroid(surface.points); const bbox = getBoundingBox(surface.points);
    if (type === 'translate') newPoints = translatePoints(surface.points, (values.x !== undefined ? values.x : bbox.x) - bbox.x, (values.y !== undefined ? values.y : bbox.y) - bbox.y);
    else if (type === 'scale') newPoints = scalePoints(surface.points, values.width !== undefined ? values.width / (bbox.width || 1) : 1, values.height !== undefined ? values.height / (bbox.height || 1) : 1, centroid);
    else if (type === 'rotate') newPoints = rotatePoints(surface.points, values.angle, centroid);
    updateSurfacePoints(surface.id, newPoints);
  };

  const handleEditAsset = (assetId: string) => { setEditingAssetId(assetId); setActiveTab('edit'); };
  const handleUpdateAsset = (updatedAsset: MediaAsset) => {
    setProject(prev => ({ ...prev, mediaAssets: prev.mediaAssets.map(a => a.id === updatedAsset.id ? updatedAsset : a) }));
    setEditingAssetId(null); setActiveTab('media');
  };

  if (isOutputMode) return <OutputView onExit={() => setIsOutputMode(false)} />;
  if (isAppLoading) return <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-zinc-500 gap-4"><Loader2 className="animate-spin text-cyan-500" size={48} /><div className="text-sm font-mono tracking-widest">LOADING PROJECT...</div></div>;

  const selectedSurface = project.surfaces.find(s => s.id === project.selectedSurfaceId);
  const selectedBBox = selectedSurface ? getBoundingBox(selectedSurface.points) : { x:0,y:0,width:0,height:0 };

  return (
    <div className="flex flex-col h-screen bg-black text-gray-200 overflow-hidden font-sans">
      <MediaPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} hasSelectedSurface={!!project.selectedSurfaceId} onAssign={(mediaId) => { if (project.selectedSurfaceId) assignMediaToSurface(project.selectedSurfaceId, mediaId); }} />
      
      {pipWindow && createPortal(<PortalOutput project={project} windowObj={pipWindow} />, pipWindow.document.body)}

      {showLaunchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button onClick={() => setShowLaunchModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 p-2 rounded-full"><X size={20}/></button>
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4"><Projector size={32} className="text-cyan-400" /></div>
               <h2 className="text-2xl font-bold text-white mb-2">Launch Output</h2>
               <p className="text-zinc-400 text-sm">Open the projection window.</p>
            </div>
            <div className="space-y-6">
               <div className="bg-zinc-800/50 p-5 rounded-xl border border-zinc-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-cyan-500/20 text-cyan-400 p-2 rounded-lg"><Copy size={20}/></div>
                    <div className="text-left">
                        <h3 className="text-white font-bold text-sm">1. Manual New Tab (Recommended)</h3>
                        <p className="text-[10px] text-zinc-400">Copy URL, open new tab, drag to projector, paste.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/30 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-500 truncate font-mono select-all">{getOutputUrl()}</div>
                    <button onClick={copyLink} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded font-bold text-xs transition-colors shrink-0">{copied ? 'Copied!' : 'Copy'}</button>
                  </div>
                  <a href={getOutputUrl()} target="_blank" rel="noopener noreferrer" className="mt-3 w-full flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded-lg font-bold text-xs" onClick={() => setShowLaunchModal(false)}><ExternalLink size={14} /> Open Link Directly</a>
               </div>
               {pipSupported && (
                 <div className="pt-4 border-t border-zinc-800 text-center">
                    {!isInIframe ? (
                      <>
                        <button onClick={togglePiP} disabled={pipLoading} className="text-xs text-zinc-500 hover:text-cyan-400 underline decoration-zinc-700 underline-offset-4 flex items-center justify-center gap-2 w-full disabled:opacity-50">
                          {pipLoading ? <Loader2 size={12} className="animate-spin"/> : <PictureInPicture2 size={12}/>}
                          {pipLoading ? "Initializing..." : "Try Floating Window (Experimental)"}
                        </button>
                        {pipError && <div className="mt-2 text-[10px] text-red-300 bg-red-900/20 py-2 px-3 rounded border border-red-900/30 flex items-start gap-2 text-left"><AlertTriangle size={12} className="shrink-0 mt-0.5"/><span>{pipError}</span></div>}
                      </>
                    ) : (
                      <div className="text-[10px] text-yellow-600 flex items-center justify-center gap-1"><AlertTriangle size={12} /><span>Floating Window unavailable in preview mode.</span></div>
                    )}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 z-50">
        <div className="flex items-center gap-3">
          <div className="h-14 flex items-center justify-center shrink-0"><img src="./Rayality_logo.png" alt="Rayality" className="h-full w-auto object-contain" /></div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Rayality Mapping <span className="text-cyan-400 font-light">Pro</span></h1>
        </div>
        <div className="flex items-center gap-4">
           {pipWindow && <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-cyan-900 bg-cyan-900/20 text-cyan-400 animate-pulse"><PictureInPicture2 size={12} /><span>PiP Active</span></div>}
           <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${outputConnected ? 'border-green-900 bg-green-900/20 text-green-400' : 'border-zinc-700 bg-zinc-800 text-zinc-500'}`}>{outputConnected ? <Wifi size={12} /> : <WifiOff size={12} />}<span>{outputConnected ? 'Output Connected' : 'Output Offline'}</span></div>
           <div className="flex bg-zinc-800 rounded-lg p-1 border border-zinc-700">
              <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"><ZoomOut size={16} /></button>
              <span className="px-2 text-xs flex items-center w-12 justify-center text-zinc-400">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"><ZoomIn size={16} /></button>
           </div>
           <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded transition-colors ${showGrid ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-500 hover:bg-zinc-800'}`} title="Toggle Grid"><Grid size={20} /></button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-16 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-4 z-40">
          <button onClick={() => setActiveTab('layers')} className={`p-3 rounded-xl transition-all ${activeTab === 'layers' ? 'bg-zinc-800 text-cyan-400 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}><Layers size={24} /></button>
          <button onClick={() => setActiveTab('media')} className={`p-3 rounded-xl transition-all ${activeTab === 'media' ? 'bg-zinc-800 text-cyan-400 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}><Monitor size={24} /></button>
          <button onClick={() => setActiveTab('edit')} className={`p-3 rounded-xl transition-all ${activeTab === 'edit' ? 'bg-zinc-800 text-green-400 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}><Scissors size={24} /></button>
          <div className="h-px w-8 bg-zinc-800 my-2"></div>
          <button onClick={() => setActiveTab('veo')} className={`p-3 rounded-xl transition-all ${activeTab === 'veo' ? 'bg-zinc-800 text-purple-400 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}><Sparkles size={24} /></button>
          
          <div className="mt-auto mb-4 flex flex-col items-center gap-3">
             <a 
               href="https://hackmd.io/@allcare561110/H117LnMzZe"
               target="_blank"
               rel="noopener noreferrer"
               className="p-3 rounded-xl text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 transition-all"
               title="User Manual (使用手冊)"
             >
               <BookOpen size={24} />
             </a>
             <button onClick={() => setShowLaunchModal(true)} className="p-3 rounded-xl bg-zinc-800 text-green-400 hover:text-green-300 hover:bg-zinc-700 transition-all border border-green-900/50 shadow-lg" title="Launch Projector Output Window"><Projector size={24} /></button>
          </div>
        </div>

        <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col z-30 shadow-xl overflow-hidden">
          {activeTab === 'layers' && (
            <div className="flex flex-col h-full">
               <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 relative">
                  <h2 className="font-bold text-zinc-300">Surfaces</h2>
                  <div className="relative">
                    <button onClick={() => setShowAddMenu(!showAddMenu)} className={`text-xs text-white px-3 py-1.5 rounded flex items-center gap-1 font-semibold transition-colors shadow-lg shadow-cyan-900/20 ${showAddMenu ? 'bg-cyan-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}><PlusSquare size={14} /> Add Quad <ChevronDown size={12} className={`transition-transform ${showAddMenu ? 'rotate-180' : ''}`}/></button>
                    {showAddMenu && (
                      <div className="absolute right-0 top-full mt-2 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1">
                        <button onClick={() => addSurface('16:9')} className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"><RectangleHorizontal size={14} className="text-cyan-400"/> 16:9 Landscape</button>
                        <button onClick={() => addSurface('9:16')} className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"><RectangleVertical size={14} className="text-cyan-400"/> 9:16 Portrait</button>
                        <button onClick={() => addSurface('1:1')} className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"><Square size={14} className="text-cyan-400"/> 1:1 Square</button>
                        <div className="h-px bg-zinc-700 my-1 mx-2"></div>
                        <button onClick={() => addSurface('circle')} className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"><CircleIcon size={14} className="text-purple-400"/> Circle</button>
                      </div>
                    )}
                    {showAddMenu && <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)}></div>}
                  </div>
                </div>
               <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                 {[...project.surfaces].reverse().map((surface, rIndex) => {
                   const realIndex = project.surfaces.length - 1 - rIndex;
                   const media = project.mediaAssets.find(m => m.id === surface.mediaId);
                   return (
                     <div key={surface.id} onClick={() => selectSurface(surface.id)} draggable onDragStart={(e) => e.dataTransfer.setData('layerIdx', realIndex.toString())} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const fromIdx = parseInt(e.dataTransfer.getData('layerIdx')); if (!isNaN(fromIdx) && fromIdx !== realIndex) moveLayer(fromIdx, realIndex); }} className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${surface.id === project.selectedSurfaceId ? 'bg-zinc-800 border-cyan-500/50' : 'bg-zinc-800/20 border-transparent hover:bg-zinc-800 hover:border-zinc-700'}`}>
                       <div className="cursor-grab text-zinc-600 hover:text-zinc-400"><GripVertical size={14} /></div>
                       <div className="w-8 h-8 bg-black rounded border border-zinc-700 overflow-hidden flex-shrink-0 relative">
                         {media ? (media.type !== MediaType.VIDEO ? <img src={media.url} className="w-full h-full object-cover" /> : <video src={media.url} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center bg-zinc-800"><Grid size={12} className="text-zinc-600" /></div>)}
                       </div>
                       <span className="text-sm truncate flex-1 font-medium text-zinc-300">{surface.name}</span>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); toggleVisibility(surface.id); }}>{surface.visible ? <Eye size={14} className="text-zinc-400 hover:text-white" /> : <EyeOff size={14} className="text-zinc-600" />}</button>
                        <button onClick={(e) => { e.stopPropagation(); toggleLock(surface.id); }}>{surface.locked ? <Lock size={14} className="text-orange-400" /> : <Unlock size={14} className="text-zinc-600 hover:text-zinc-400" />}</button>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          )}
          {activeTab === 'media' && (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-zinc-800">
                <h2 className="font-bold text-zinc-300 mb-4">Media Library</h2>
                <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800 hover:border-zinc-500 transition-all group">
                  <div className="flex flex-col items-center gap-2"><Upload size={24} className="text-zinc-500 group-hover:text-cyan-400" /><span className="text-xs font-medium text-zinc-400">Drop Video / Image</span></div>
                  <input type="file" className="hidden" multiple accept="video/*,image/*" onChange={handleFileUpload} />
                </label>
              </div>
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 content-start">
                 {project.mediaAssets.map(asset => (
                   <div key={asset.id} draggable onDragStart={(e) => e.dataTransfer.setData('mediaId', asset.id)} className={`relative aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 group transition-all ${project.selectedSurfaceId ? 'cursor-alias hover:border-cyan-500' : 'cursor-default'}`}>
                      {asset.type !== MediaType.IMAGE ? (<video src={asset.url} className="w-full h-full object-cover" muted loop onMouseOver={e => e.currentTarget.play().catch(console.error)} onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} />) : (<img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />)}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity z-10">
                         {project.selectedSurfaceId && (<button onClick={(e) => { e.stopPropagation(); assignMediaToSurface(project.selectedSurfaceId!, asset.id); }} className="bg-cyan-600 text-white p-1.5 rounded hover:bg-cyan-500"><CheckCircle2 size={16} /></button>)}
                         <button onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }} className="bg-zinc-700 text-white p-1.5 rounded hover:bg-zinc-600"><Eye size={16} /></button>
                         <button onClick={(e) => { e.stopPropagation(); handleEditAsset(asset.id); }} className="bg-green-700 text-white p-1.5 rounded hover:bg-green-600"><Scissors size={16} /></button>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full bg-black/50 p-1 text-[10px] text-zinc-300 truncate pointer-events-none">{asset.name}</div>
                   </div>
                 ))}
              </div>
            </div>
          )}
          {activeTab === 'edit' && (editingAssetId ? (project.mediaAssets.find(a => a.id === editingAssetId) ? (<MediaEditor asset={project.mediaAssets.find(a => a.id === editingAssetId)!} onSave={handleUpdateAsset} onCancel={() => { setEditingAssetId(null); setActiveTab('media'); }} />) : (<div className="p-4 text-center text-zinc-500">Asset not found.</div>)) : (<div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8 text-center"><Scissors size={48} className="mb-4 opacity-50"/><p className="mb-4 text-sm">Select a media asset from the library to crop or trim.</p><button onClick={() => setActiveTab('media')} className="text-xs text-cyan-400 underline hover:text-white">Go to Media Library</button></div>))}
          {activeTab === 'veo' && <VeoPanel onAssetGenerated={addVeoAsset} />}
        </div>

        <div className="flex-1 bg-zinc-950 relative overflow-hidden flex items-center justify-center select-none p-12" onMouseDown={() => selectSurface(null)}>
           {showGrid && <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`, backgroundSize: `${50 * zoom}px ${50 * zoom}px`, backgroundPosition: 'center' }} />}
           <div className="relative shadow-2xl bg-black border border-zinc-800 transition-transform duration-100 ease-out" style={{ width: project.canvasSize.width, height: project.canvasSize.height, transform: `scale(${zoom})`, flexShrink: 0, transformOrigin: 'center center' }} onMouseDown={(e) => e.stopPropagation()}>
              {project.surfaces.map(surface => {
                if (!surface.visible) return null;
                const media = project.mediaAssets.find(m => m.id === surface.mediaId);
                return (<SurfaceRenderer key={surface.id} surface={surface} media={media} isSelected={project.selectedSurfaceId === surface.id} onSelect={selectSurface} onUpdatePoints={updateSurfacePoints} />);
              })}
           </div>
        </div>

        {selectedSurface ? (
          <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
               <input type="text" value={selectedSurface.name} onChange={(e) => updateSurfaceProp(selectedSurface.id, 'name', e.target.value)} className="bg-transparent border-none text-white font-bold text-sm focus:ring-0 w-full" />
            </div>
            <div className="p-4 space-y-6">
              <div className="space-y-3">
                 <h3 className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Move size={12} /> Transform</h3>
                 <div className="grid grid-cols-2 gap-2">
                   <div className="bg-zinc-800 p-2 rounded"><label className="text-[10px] text-zinc-500 uppercase block mb-1">X</label><input type="number" value={Math.round(selectedBBox.x)} onChange={(e) => handleTransform('translate', { x: parseInt(e.target.value) })} className="w-full bg-transparent text-sm text-white focus:outline-none" /></div>
                   <div className="bg-zinc-800 p-2 rounded"><label className="text-[10px] text-zinc-500 uppercase block mb-1">Y</label><input type="number" value={Math.round(selectedBBox.y)} onChange={(e) => handleTransform('translate', { y: parseInt(e.target.value) })} className="w-full bg-transparent text-sm text-white focus:outline-none" /></div>
                   <div className="bg-zinc-800 p-2 rounded"><label className="text-[10px] text-zinc-500 uppercase block mb-1">Width</label><input type="number" value={Math.round(selectedBBox.width)} onChange={(e) => handleTransform('scale', { width: parseInt(e.target.value) })} className="w-full bg-transparent text-sm text-white focus:outline-none" /></div>
                   <div className="bg-zinc-800 p-2 rounded"><label className="text-[10px] text-zinc-500 uppercase block mb-1">Height</label><input type="number" value={Math.round(selectedBBox.height)} onChange={(e) => handleTransform('scale', { height: parseInt(e.target.value) })} className="w-full bg-transparent text-sm text-white focus:outline-none" /></div>
                 </div>
                 <div className="bg-zinc-800 p-3 rounded flex items-center gap-3">
                    <span className="text-xs text-zinc-400 w-16">Rotation</span>
                    <button onClick={() => handleTransform('rotate', { angle: -90 })} className="p-1 hover:bg-zinc-700 rounded"><ChevronDown className="rotate-90" size={14}/></button>
                    <button onClick={() => handleTransform('rotate', { angle: -1 })} className="flex-1 bg-zinc-900 rounded py-1 text-xs text-center hover:bg-zinc-700">-1°</button>
                     <button onClick={() => handleTransform('rotate', { angle: 1 })} className="flex-1 bg-zinc-900 rounded py-1 text-xs text-center hover:bg-zinc-700">+1°</button>
                    <button onClick={() => handleTransform('rotate', { angle: 90 })} className="p-1 hover:bg-zinc-700 rounded"><ChevronUp className="rotate-90" size={14}/></button>
                 </div>
              </div>
              <hr className="border-zinc-800"/>
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2"><Monitor size={12} /> Media</h3>
                {selectedSurface.mediaId ? (
                   <div className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
                     <div className="aspect-video bg-black relative group">
                        {(() => {
                           const m = project.mediaAssets.find(ma => ma.id === selectedSurface.mediaId);
                           if (!m) return null;
                           return m.type !== MediaType.IMAGE ? <video src={m.url} className="w-full h-full object-cover" autoPlay loop muted /> : <img src={m.url} className="w-full h-full object-cover" />;
                        })()}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2"><button onClick={() => updateSurfaceProp(selectedSurface.id, 'mediaId', null)} className="bg-red-600 text-white px-2 py-1 text-xs rounded">Unassign</button></div>
                     </div>
                     <div className="p-2 flex items-center justify-between bg-zinc-800 border-t border-zinc-700">
                        <span className="text-xs text-zinc-400 truncate w-32">{project.mediaAssets.find(ma => ma.id === selectedSurface.mediaId)?.name}</span>
                        {project.mediaAssets.find(ma => ma.id === selectedSurface.mediaId)?.type !== MediaType.IMAGE && (<div className="flex gap-2"><PlayCircle size={16} className="text-zinc-400 hover:text-white" /><Volume2 size={16} className="text-zinc-400 hover:text-white" /></div>)}
                     </div>
                   </div>
                ) : (
                  <div className="text-center p-4 border border-zinc-700 border-dashed rounded-lg bg-zinc-800/50">
                    <p className="text-xs text-zinc-500 mb-2">No media assigned</p>
                    <button onClick={() => setActiveTab('media')} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1.5 rounded">Choose Media</button>
                  </div>
                )}
              </div>
              <hr className="border-zinc-800"/>
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-2"><Settings size={12} /> Appearance</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1"><span>Opacity</span><span>{Math.round(selectedSurface.opacity * 100)}%</span></div>
                    <input type="range" min="0" max="1" step="0.01" value={selectedSurface.opacity} onChange={(e) => updateSurfaceProp(selectedSurface.id, 'opacity', parseFloat(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Blend Mode</label>
                    <select value={selectedSurface.blendMode} onChange={(e) => updateSurfaceProp(selectedSurface.id, 'blendMode', e.target.value)} className="w-full bg-zinc-800 text-white text-xs p-2 rounded border border-zinc-700 focus:outline-none">
                      {BLEND_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-auto"><button onClick={() => deleteSurface(selectedSurface.id)} className="w-full py-2 border border-red-900/30 text-red-500/80 bg-red-900/10 rounded text-sm hover:bg-red-900/30 flex items-center justify-center gap-2"><Trash2 size={14} /> Delete Surface</button></div>
            </div>
          </div>
        ) : (
          <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col items-center justify-center text-zinc-600 text-sm"><CornerUpRight size={48} className="mb-4 opacity-20" /><p className="font-medium">No Surface Selected</p><p className="text-xs mt-2 opacity-50 text-center px-6">Click on a surface in the canvas or layers panel to edit properties.</p></div>
        )}
      </div>
    </div>
  );
};
