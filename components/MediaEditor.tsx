import React, { useState, useEffect, useRef } from 'react';
import { MediaAsset, MediaType, MediaCrop, MediaTrim } from '../types';
import { Play, Pause, RotateCcw, Check, X, Scissors } from 'lucide-react';

interface MediaEditorProps {
  asset: MediaAsset;
  onSave: (updatedAsset: MediaAsset) => void;
  onCancel: () => void;
}

export const MediaEditor: React.FC<MediaEditorProps> = ({ asset, onSave, onCancel }) => {
  // Local state for editing
  // Removed crop state
  const [trim, setTrim] = useState<MediaTrim>(asset.trim || { startTime: 0, endTime: 0 });
  const [duration, setDuration] = useState(asset.duration || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize duration when video loads
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      // Set initial trim if not set
      if (trim.endTime === 0 || trim.endTime > dur) {
        setTrim(prev => ({ ...prev, endTime: dur }));
      }
    }
  };

  // Handle video playback loop within trim
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (trim.endTime > 0 && video.currentTime >= trim.endTime) {
        video.currentTime = trim.startTime;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [trim]);

  // Sync Play/Pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.play().catch(console.error);
      else videoRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleSave = () => {
    onSave({
      ...asset,
      // Removed crop property
      trim: asset.type === MediaType.IMAGE ? undefined : trim,
      duration: asset.type === MediaType.IMAGE ? 0 : duration
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-white">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
        <h2 className="font-bold text-zinc-300 flex items-center gap-2">
          <Scissors size={16} /> Edit Media
        </h2>
        <button onClick={onCancel} className="text-zinc-500 hover:text-white"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Main Source Preview (Simple) */}
        <div>
            <div className="bg-black rounded-lg border border-zinc-700 overflow-hidden relative aspect-video flex items-center justify-center group">
            {asset.type !== MediaType.IMAGE ? (
                <video 
                ref={videoRef}
                src={asset.url}
                className="w-full h-full object-contain"
                onLoadedMetadata={handleLoadedMetadata}
                muted
                />
            ) : (
                <img src={asset.url} className="w-full h-full object-contain" />
            )}
            </div>
        </div>

        {/* Video Trimming Controls */}
        {asset.type !== MediaType.IMAGE ? (
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 space-y-3">
            <div className="flex justify-between items-center">
               <label className="text-xs font-bold text-purple-400 flex items-center gap-2">
                 <Scissors size={12}/> Time Trim
               </label>
               <span className="text-xs font-mono text-zinc-400">
                 {trim.startTime.toFixed(1)}s - {trim.endTime.toFixed(1)}s / {duration.toFixed(1)}s
               </span>
            </div>
            
            {/* Playback Controls */}
            <div className="flex gap-2 justify-center mb-2">
               <button onClick={togglePlay} className="p-2 bg-zinc-700 rounded-full hover:bg-zinc-600">
                 {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
               </button>
               <button onClick={() => { if(videoRef.current) videoRef.current.currentTime = trim.startTime; }} className="p-2 bg-zinc-700 rounded-full hover:bg-zinc-600">
                 <RotateCcw size={16}/>
               </button>
            </div>

            <div className="space-y-4 px-1">
               <div>
                 <span className="text-[10px] text-zinc-500 uppercase">Start Time</span>
                 <input 
                   type="range" min="0" max={duration} step="0.1"
                   value={trim.startTime}
                   onChange={(e) => {
                     const v = parseFloat(e.target.value);
                     setTrim(p => ({ ...p, startTime: Math.min(v, p.endTime - 0.5) }));
                     if (videoRef.current) videoRef.current.currentTime = v;
                   }}
                   className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                 />
               </div>
               <div>
                 <span className="text-[10px] text-zinc-500 uppercase">End Time</span>
                 <input 
                   type="range" min="0" max={duration} step="0.1"
                   value={trim.endTime}
                   onChange={(e) => {
                     const v = parseFloat(e.target.value);
                     setTrim(p => ({ ...p, endTime: Math.max(v, p.startTime + 0.5) }));
                   }}
                   className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                 />
               </div>
            </div>
          </div>
        ) : (
            <div className="p-4 text-center text-zinc-500 text-xs">
                No editable properties for images in this mode.
            </div>
        )}

      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex gap-3">
        <button 
          onClick={handleSave}
          className="flex-1 bg-white hover:bg-zinc-200 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Check size={18}/> Save Changes
        </button>
      </div>
    </div>
  );
};