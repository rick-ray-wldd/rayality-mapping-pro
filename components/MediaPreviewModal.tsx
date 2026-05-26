import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { MediaAsset, MediaType } from '../types';

interface MediaPreviewModalProps {
  asset: MediaAsset | null;
  onClose: () => void;
  onAssign?: (mediaId: string) => void;
  hasSelectedSurface?: boolean;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ 
  asset, 
  onClose,
  onAssign,
  hasSelectedSurface = false
}) => {
  if (!asset) return null;

  const handleAssign = () => {
    if (onAssign) {
      onAssign(asset.id);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" 
      onClick={onClose}
    >
      <div 
        className="relative bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl flex flex-col max-w-4xl w-full max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <h3 className="text-white font-medium truncate pr-4 text-sm">{asset.name || 'Untitled Media'}</h3>
            <button 
              onClick={onClose} 
              className="text-zinc-400 hover:text-white transition-colors bg-zinc-800 p-1 rounded-full hover:bg-zinc-700"
            >
              <X size={18}/>
            </button>
        </div>
        
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden p-4 relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
           {asset.type === MediaType.VIDEO || asset.type === MediaType.AI_GENERATED ? (
             <video 
               src={asset.url} 
               controls 
               autoPlay 
               loop
               className="max-w-full max-h-[70vh] shadow-lg" 
               onError={(e) => console.error("Preview video error:", e)}
             />
           ) : (
             <img 
               src={asset.url} 
               alt={asset.name} 
               className="max-w-full max-h-[70vh] object-contain shadow-lg" 
             />
           )}
        </div>
        
        <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-mono uppercase">Media Type</span>
              <span className="text-xs text-zinc-300 font-mono">{asset.type}</span>
            </div>

            <div className="flex gap-3">
               {hasSelectedSurface && onAssign && (
                 <button 
                   onClick={handleAssign}
                   className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-cyan-900/20"
                 >
                   <CheckCircle2 size={16} />
                   Assign to Surface
                 </button>
               )}
            </div>
        </div>
      </div>
    </div>
  );
};