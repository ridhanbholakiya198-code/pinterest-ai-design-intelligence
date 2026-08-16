import { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { searchVisualLibrary } from '../lib/search';
import { Sparkles, Search, Image as ImageIcon } from 'lucide-react';

export default function Library() {
  const { isPinterestConnected, userId } = useAuthStore();
  const [pins, setPins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadPins = async (term?: string) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const results = await searchVisualLibrary(userId, { term, limitCount: 100 });
      setPins(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isPinterestConnected && userId) {
      loadPins();
    } else {
      setIsLoading(false);
    }
  }, [isPinterestConnected, userId]);

  if (!isPinterestConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
        <ImageIcon className="w-12 h-12 text-neutral-600 mb-4" />
        <h2 className="text-xl font-medium text-white mb-2">Visual Library</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Connect your Pinterest account to browse your analyzed inspiration.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-white mb-2">Visual Library</h1>
          <p className="text-neutral-400">
            Browse your saved inspiration, understood by AI.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input 
            type="text"
            placeholder="Search ideas, aesthetics..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadPins(searchTerm)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-neutral-500">Loading your visual memory...</div>
      ) : pins.length === 0 ? (
        <div className="text-center py-20 text-neutral-500 border border-dashed border-neutral-800 rounded-2xl">
          <p>No pins found. Try searching something else or sync more pins.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {pins.map(pin => {
            const imgUrl = pin.media?.images?.["400x"]?.url || pin.media?.images?.["600x"]?.url || (Object.values(pin.media?.images || {})[0] as any)?.url;
            return (
              <div key={pin.pinterest_id} className="break-inside-avoid bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden group">
                {imgUrl ? (
                  <img src={imgUrl} alt={pin.title || pin.alt_text} className="w-full object-cover" />
                ) : (
                  <div className="w-full h-40 bg-neutral-800 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-neutral-600" />
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="font-medium text-white mb-1 truncate">{pin.title || "Untitled"}</h3>
                  {pin.analysis && (
                    <>
                       <div className="flex flex-wrap gap-2 mt-3">
                         {pin.analysis.primaryCategory && (
                           <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded-md">
                             {pin.analysis.primaryCategory}
                           </span>
                         )}
                         {pin.analysis.aesthetics?.[0] && (
                           <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded-md">
                             {pin.analysis.aesthetics[0]}
                           </span>
                         )}
                       </div>
                       <p className="text-xs text-neutral-400 mt-3 line-clamp-3">
                         <Sparkles className="inline w-3 h-3 mr-1 text-neutral-500" />
                         {pin.analysis.whyDidISaveThis || pin.analysis.visualSummary}
                       </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
