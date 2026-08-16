import React, { useState, useRef } from 'react';
import { useAuthStore } from '../store';
import { Image as ImageIcon, Upload, Wand2, Download, RefreshCw, Layers } from 'lucide-react';

export default function Studio() {
  const { isPinterestConnected } = useAuthStore();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [sourceImageBase64, setSourceImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [preserveFace, setPreserveFace] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isPinterestConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
          <ImageIcon className="text-neutral-400" />
        </div>
        <h2 className="text-xl font-medium text-white mb-2">Visual Studio</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Connect your Pinterest account to unlock image generation and editing.
        </p>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const [header, base64] = dataUrl.split(',');
      const match = header.match(/:(.*?);/);
      if (match && base64) {
        setMimeType(match[1]);
        setSourceImageBase64(base64);
        setIsEditMode(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateOrEdit = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    try {
      if (isEditMode && sourceImageBase64) {
        const res = await fetch('/api/gemini/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, imageBase64: sourceImageBase64, mimeType, preserveFace })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to edit image');
        }
        const data = await res.json();
        setResultImage(data.imageUrl);
      } else {
        const res = await fetch('/api/gemini/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, aspectRatio: '1:1' })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to generate image');
        }
        const data = await res.json();
        setResultImage(data.imageUrl);
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-white mb-2">Visual Studio</h1>
        <p className="text-neutral-400">
          Generate or edit images using Gemini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          
          {/* Mode Switcher */}
          <div className="flex p-1 bg-neutral-900 rounded-xl">
            <button 
              onClick={() => setIsEditMode(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${!isEditMode ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
            >
              Generate Image
            </button>
            <button 
              onClick={() => setIsEditMode(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${isEditMode ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
            >
              Edit Image
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            
            {isEditMode && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-300 mb-3">
                  Source Image
                </label>
                
                {sourceImageBase64 ? (
                  <div className="relative rounded-xl overflow-hidden border border-neutral-800 mb-4 bg-neutral-950">
                    <img src={`data:${mimeType};base64,${sourceImageBase64}`} className="w-full h-48 object-contain" alt="Source" />
                    <button 
                      onClick={() => setSourceImageBase64(null)}
                      className="absolute top-2 right-2 bg-neutral-900/80 p-1.5 rounded-lg text-white hover:bg-red-500 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-950 mb-4"
                  >
                    <Upload className="w-8 h-8 text-neutral-500 mb-2" />
                    <span className="text-sm text-neutral-400">Click to upload image</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={preserveFace} 
                    onChange={(e) => setPreserveFace(e.target.checked)}
                    className="rounded bg-neutral-800 border-neutral-700"
                  />
                  Preserve facial identity (if people are present)
                </label>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">
                {isEditMode ? 'Edit Instructions' : 'Prompt'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isEditMode ? "e.g., change the background to a sunset" : "e.g., a futuristic city at night, photorealistic"}
                className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700 transition-all resize-none mb-4"
              />
              
              <button
                onClick={handleGenerateOrEdit}
                disabled={isLoading || !prompt.trim() || (isEditMode && !sourceImageBase64)}
                className="w-full bg-neutral-100 hover:bg-white text-neutral-950 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {isLoading ? (isEditMode ? 'Editing...' : 'Generating...') : (isEditMode ? 'Edit Image' : 'Generate Image')}
                <Wand2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div>
           <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 md:p-6 min-h-[350px] md:min-h-[500px] flex flex-col">
              <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-4 flex items-center gap-2">
                 <Layers className="w-5 h-5 text-neutral-500" />
                 Result
              </h3>
              
              <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden relative">
                {isLoading ? (
                   <div className="animate-pulse flex flex-col items-center">
                     <Wand2 className="w-8 h-8 text-neutral-600 mb-4 animate-bounce" />
                     <p className="text-sm text-neutral-500">
                       {isEditMode ? 'Applying edits via Gemini...' : 'Generating pixels...'}
                     </p>
                   </div>
                ) : resultImage ? (
                   <img src={resultImage} alt="Generated" className="w-full h-full object-contain" />
                ) : (
                   <div className="text-neutral-600 flex flex-col items-center">
                     <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                     <p className="text-sm">Output will appear here</p>
                   </div>
                )}
                
                {resultImage && !isLoading && (
                   <a 
                     href={resultImage} 
                     download={isEditMode ? "edited-image.png" : "generated-image.png"}
                     className="absolute bottom-4 right-4 bg-neutral-900/80 hover:bg-neutral-900 p-2.5 md:p-2 rounded-xl text-white backdrop-blur-sm border border-neutral-700 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                   >
                     <Download className="w-5 h-5" />
                   </a>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
