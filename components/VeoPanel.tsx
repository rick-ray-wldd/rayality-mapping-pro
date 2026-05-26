
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { VEO_MODEL } from '../constants';
import { MediaAsset, MediaType } from '../types';
import { 
  Loader2, 
  Wand2, 
  Sparkles, 
  Image as ImageIcon, 
  X, 
  AlertCircle, 
  Zap,
  Info,
  Key,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Settings,
  Trash2
} from 'lucide-react';

interface VeoPanelProps {
  onAssetGenerated: (asset: MediaAsset) => void;
}

const PRESETS = [
  { 
    label: 'Inner Plasma', 
    prompt: 'A projection mapping texture. The white outline of a character is filled with swirling purple and white plasma energy. Static black background.' 
  },
  { 
    label: 'Electric Aura', 
    prompt: 'Radiating white electrical waves flowing outwards from a central static object. High contrast, pure black background.' 
  },
  { 
    label: 'Matrix Glitch', 
    prompt: 'A digital glitch mapping effect with cascading green code lines constrained within a geometric shape. Cinematic lighting.' 
  },
  { 
    label: 'Holiday Glow', 
    prompt: 'Festive red and gold sparkling lights dancing around a holiday silhouette. Soft bokeh, pure black background.' 
  },
];

const STORAGE_KEY = 'rayality_user_api_key';

export const VeoPanel: React.FC<VeoPanelProps> = ({ onAssetGenerated }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [tempKey, setTempKey] = useState<string>('');
  const [isSettingKey, setIsSettingKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize: Load key from storage or environment
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setApiKey(saved);
    } else if (process.env.API_KEY) {
      // If server provides a fallback key
      setApiKey(process.env.API_KEY);
    }
  }, []);

  const handleSaveKey = async () => {
    if (tempKey.length < 20) return;
    setIsVerifying(true);
    setStatus('');
    try {
      // Minimal test call to verify key
      const ai = new GoogleGenAI({ apiKey: tempKey });
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'ping',
      });
      localStorage.setItem(STORAGE_KEY, tempKey);
      setApiKey(tempKey);
      setIsSettingKey(false);
      setTempKey('');
    } catch (e: any) {
      setStatus(`Error: Key validation failed. ${e.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey('');
    setIsSettingKey(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setStatus('Error: Image too large (Max 10MB)');
        return;
      }
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else reject(new Error('Conversion failed'));
      };
      reader.onerror = reject;
    });
  };

  const generateVideo = async () => {
    if (!prompt.trim() || !apiKey) return;
    
    const ai = new GoogleGenAI({ apiKey: apiKey });
    setIsGenerating(true);
    setStatus('Submitting request to Google Veo...');

    try {
      let operation;
      if (selectedImage) {
        const base64Data = await fileToBase64(selectedImage);
        operation = await ai.models.generateVideos({
          model: VEO_MODEL,
          prompt: prompt,
          image: { imageBytes: base64Data, mimeType: selectedImage.type },
          config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio }
        });
      } else {
        operation = await ai.models.generateVideos({
          model: VEO_MODEL,
          prompt: prompt,
          config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio }
        });
      }

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
        setStatus('Veo is rendering your texture... (Estimated 2-3 mins)');
      }

      if (operation.error) throw new Error(operation.error.message);

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const uri = operation.response.generatedVideos[0].video.uri;
        const videoResponse = await fetch(`${uri}&key=${apiKey}`);
        const videoBlob = await videoResponse.blob();
        const localVideoUrl = URL.createObjectURL(videoBlob);
        
        onAssetGenerated({ 
          id: `veo-${Date.now()}`, 
          type: MediaType.AI_GENERATED, 
          url: localVideoUrl, 
          name: prompt.substring(0, 20) + "..." 
        });
        setStatus('Success! Texture added to library.');
      }
    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message || 'Check your API Key and billing status.'}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => { if (!isGenerating && !status.startsWith('Error')) setStatus(''); }, 5000);
    }
  };

  // --- Render 1: No Key Setup ---
  if (!apiKey || isSettingKey) {
    return (
      <div className="flex flex-col h-full bg-zinc-950 overflow-y-auto custom-scrollbar">
        <div className="relative h-56 shrink-0 bg-gradient-to-br from-purple-900/40 via-zinc-900 to-black p-8 flex flex-col justify-end border-b border-zinc-800">
          <div className="absolute top-8 left-8 w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-2xl">
            <Zap className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">AI Engine Setup</h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Unlock professional AI textures using the Google Veo generative model.
          </p>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold flex items-center justify-center border border-zinc-700">1</span>
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Get API Key</h3>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-inner">
               <div className="flex items-start gap-4">
                 <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shrink-0 mt-0.5"><Key size={18}/></div>
                 <div className="space-y-1">
                   <p className="text-xs text-zinc-300 font-medium">Create a Gemini API Key</p>
                   <p className="text-[10px] text-zinc-500 leading-relaxed">
                     Visit Google AI Studio. Ensure you select a <strong>paid project</strong> to use the Veo model.
                   </p>
                 </div>
               </div>
               <a 
                 href="https://aistudio.google.com/app/apikey" 
                 target="_blank" 
                 rel="noreferrer" 
                 className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all border border-zinc-700"
               >
                 Go to AI Studio <ExternalLink size={12}/>
               </a>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold flex items-center justify-center border border-zinc-700">2</span>
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Connect</h3>
            </div>
            <div className="space-y-3">
              <div className="relative group">
                <input 
                  type="password"
                  placeholder="Paste your API Key here..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-2xl py-4 px-5 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-zinc-700"
                />
                <ShieldCheck className="absolute right-5 top-4 text-zinc-800 group-focus-within:text-purple-500 transition-colors" size={20}/>
              </div>
              <div className="flex gap-2">
                {apiKey && (
                  <button onClick={() => setIsSettingKey(false)} className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-bold text-xs hover:bg-zinc-700 transition-all border border-zinc-700">
                    Cancel
                  </button>
                )}
                <button 
                  onClick={handleSaveKey}
                  disabled={isVerifying || tempKey.length < 20}
                  className="flex-[2] py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-white/5 active:scale-[0.98]"
                >
                  {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16}/>}
                  {isVerifying ? 'Verifying Key...' : 'Activate AI Engine'}
                </button>
              </div>
            </div>
          </div>

          {status && (
             <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/30 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
               <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
               <span className="text-[11px] text-red-300 leading-normal">{status}</span>
             </div>
          )}

          <div className="pt-8 border-t border-zinc-900 flex items-center gap-3 text-zinc-600 justify-center">
             <Info size={14}/>
             <span className="text-[10px] tracking-wide uppercase font-bold">Standalone Version 1.0.4</span>
          </div>
        </div>
      </div>
    );
  }

  // --- Render 2: Generation Interface ---
  return (
    <div className="p-6 bg-zinc-900 h-full overflow-y-auto flex flex-col custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
            <Zap className="text-purple-400 fill-purple-400/20" size={20} />
            <h2 className="text-lg font-bold text-white tracking-tight">AI Texture Lab</h2>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => setIsSettingKey(true)}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button 
              onClick={handleClearKey}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              title="Disconnect Key"
            >
              <Trash2 size={18} />
            </button>
        </div>
      </div>

      <div className="space-y-8 flex-1">
        {/* Presets */}
        <section>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Surface Strategies</label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
               <button
                 key={preset.label}
                 onClick={() => setPrompt(preset.prompt)}
                 className="p-3 text-[10px] bg-zinc-800/30 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 text-left transition-all leading-tight"
                 disabled={isGenerating}
               >
                 <div className="font-bold mb-1 text-zinc-300">{preset.label}</div>
                 <div className="truncate opacity-50">{preset.prompt}</div>
               </button>
            ))}
          </div>
        </section>

        {/* Prompt */}
        <section>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Prompt</label>
          <div className="relative">
            <textarea
              className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-sm text-white focus:border-purple-500 focus:outline-none h-32 transition-all resize-none shadow-inner leading-relaxed"
              placeholder="Describe your projection mapping texture..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
            <Wand2 className="absolute bottom-4 right-4 text-zinc-700" size={18} />
          </div>
        </section>

        {/* Structure Reference */}
        <section>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Structure Mask (Optional)</label>
          {!selectedImage ? (
            <div 
              onClick={() => !isGenerating && fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
            >
              <ImageIcon className="text-zinc-600 mb-3 group-hover:text-purple-400" size={28} />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Upload Guide Image</span>
              <span className="text-[9px] text-zinc-700 mt-1">Keep it high contrast</span>
            </div>
          ) : (
            <div className="relative bg-black rounded-2xl border border-zinc-800 overflow-hidden group">
              <img src={imagePreview || ''} className="w-full h-32 object-contain" alt="Reference" />
              <button 
                onClick={() => { setSelectedImage(null); setImagePreview(null); }} 
                className="absolute top-3 right-3 bg-black/80 p-1.5 rounded-full text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                disabled={isGenerating}
              >
                <X size={14} />
              </button>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
        </section>

        {/* Aspect Ratio */}
        <section className="bg-zinc-800/20 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Aspect Ratio</label>
            <div className="flex bg-black p-1 rounded-xl border border-zinc-800">
              {['16:9', '9:16'].map(ratio => (
                <button 
                  key={ratio}
                  onClick={() => setAspectRatio(ratio as any)}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${aspectRatio === ratio ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Action */}
        <button
          onClick={generateVideo}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-4.5 bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-2xl shadow-purple-900/10 active:scale-[0.98]"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="text-purple-600" />}
          <span>{isGenerating ? 'Rendering frames...' : 'Generate Loop'}</span>
        </button>

        {/* Status */}
        {status && (
          <div className={`text-[11px] p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${status.startsWith('Error') ? 'bg-red-950/20 border-red-900/30 text-red-300' : 'bg-purple-950/20 border-purple-900/30 text-purple-200'}`}>
            {status.startsWith('Error') ? <AlertCircle size={16} className="shrink-0 mt-0.5" /> : <Loader2 size={16} className="animate-spin shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{status}</span>
          </div>
        )}
      </div>
    </div>
  );
};
