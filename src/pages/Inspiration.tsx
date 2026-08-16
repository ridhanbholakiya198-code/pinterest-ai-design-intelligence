import { useState } from 'react';
import { useAuthStore } from '../store';
import { Sparkles, ArrowRight, Wand2 } from 'lucide-react';

export default function Inspiration() {
  const { isPinterestConnected, userId } = useAuthStore();
  const [request, setRequest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState<any>(null);

  const [isGeneratingZip, setIsGeneratingZip] = useState(false);

  if (!isPinterestConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
          <Sparkles className="text-neutral-400" />
        </div>
        <h2 className="text-xl font-medium text-white mb-2">Inspiration Workspace</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Connect your Pinterest account to unlock the creative intelligence engine.
        </p>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!request.trim()) return;
    setIsLoading(true);
    setDirection(null);
    try {
      // 1. Fetch references (local semantic search approximation)
      const { searchVisualLibrary } = await import('../lib/search');
      const userId = useAuthStore.getState().userId;
      let references: any[] = [];
      if (userId) {
        // Extract basic keywords from request to search locally
        const keywords = request.split(' ').filter(w => w.length > 3).join(' ');
        references = await searchVisualLibrary(userId, { term: keywords, limitCount: 5 });
        // If not enough, fetch some recent ones
        if (references.length < 3) {
          const fallback = await searchVisualLibrary(userId, { limitCount: 3 });
          references = [...references, ...fallback].slice(0, 5);
        }
      }

      // 2. Fetch DNA
      const { fetchUserVisualDNA } = await import('../lib/dna');
      const dnaData = await fetchUserVisualDNA(userId);
      const userVisualDna = dnaData.textString;

      // 3. Generate Direction
      const res = await fetch('/api/gemini/creative-direction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          request,
          userVisualDna,
          references
        })
      });
      const data = await res.json();
      if (data.direction) {
        setDirection({ ...data.direction, usedReferences: references });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-white mb-2">Inspiration Workspace</h1>
        <p className="text-neutral-400">
          Turn your visual memory into original creative directions.
        </p>
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 md:p-6 mb-8 backdrop-blur-md">
        <label className="block text-sm font-medium text-neutral-300 mb-3">
          What do you want to create?
        </label>
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <input
            type="text"
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="e.g., Build my dark, minimalist portfolio website"
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700 transition-all min-h-[44px]"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || !request.trim()}
            className="w-full md:w-auto bg-neutral-100 hover:bg-white text-neutral-950 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {isLoading ? 'Thinking...' : 'Generate'}
            <Wand2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {direction && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-medium text-white flex items-center gap-2 border-b border-neutral-800 pb-4">
            <Sparkles className="w-5 h-5 text-neutral-400" />
            Creative Direction
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-5">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">Concept</h3>
              <p className="text-neutral-200">{direction.concept}</p>
            </div>
            
            <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-5">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">Visual Mood</h3>
              <p className="text-neutral-200">{direction.visualMood}</p>
            </div>

            <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-5">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">Typography</h3>
              <p className="text-neutral-200">{direction.typographyDirection}</p>
            </div>

            <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-5">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">Color System</h3>
              <p className="text-neutral-200">{direction.colorDirection}</p>
            </div>

            <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-5 md:col-span-2">
              <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">Originality Strategy</h3>
              <p className="text-neutral-200">{direction.originalityStrategy}</p>
            </div>
          </div>

          {direction.usedReferences && direction.usedReferences.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-white mb-4">Inspiration Sources</h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {direction.usedReferences.map((ref: any, idx: number) => {
                  const imgUrl = ref.media?.images?.["400x"]?.url || ref.media?.images?.["600x"]?.url || (Object.values(ref.media?.images || {})[0] as any)?.url;
                  return (
                    <div key={idx} className="min-w-[150px] w-[150px] bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shrink-0">
                      {imgUrl ? (
                        <img src={imgUrl} alt={ref.title} className="w-full h-32 object-cover" />
                      ) : (
                        <div className="w-full h-32 bg-neutral-800 flex items-center justify-center text-xs text-neutral-500">No Image</div>
                      )}
                      <div className="p-2 text-xs truncate text-neutral-300">
                        {ref.title || 'Untitled'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-end">
             <button 
               onClick={async () => {
                 setIsGeneratingZip(true);
                 try {
                   const { exportCreativeDirection } = await import('../lib/export');
                   const { fetchUserVisualDNA } = await import('../lib/dna');
                   const dnaData = await fetchUserVisualDNA(userId);
                   const userVisualDna = dnaData.textString;
                   await exportCreativeDirection(direction, request, userVisualDna, direction.usedReferences);
                 } finally {
                   setIsGeneratingZip(false);
                 }
               }}
               disabled={isGeneratingZip}
               className="w-full md:w-auto bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[44px]"
             >
                {isGeneratingZip ? "Generating Code..." : "Export Source Code (.zip)"}
                <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
