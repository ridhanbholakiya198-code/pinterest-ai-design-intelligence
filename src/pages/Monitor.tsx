import { useEffect } from 'react';
import { useAuthStore } from '../store';
import { useSyncStore } from '../store/syncStore';
import { Play, Pause, RefreshCw, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Monitor() {
  const { isPinterestConnected } = useAuthStore();
  const { 
    status, boardsTotal, boardsProcessed, pinsDiscovered, pinsImported, pinsAnalyzed, pinsFailed,
    isPaused, fetchState, startSync, pauseSync, resumeSync, cancelSync, retryFailedPins, error, lastSyncTime
  } = useSyncStore();

  useEffect(() => {
    fetchState();
  }, []);

  if (!isPinterestConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
        <RefreshCw className="w-12 h-12 text-neutral-600 mb-4" />
        <h2 className="text-xl font-medium text-white mb-2">Processing Monitor</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Connect your Pinterest account to sync your visual library.
        </p>
      </div>
    );
  }

  const getStatusColor = () => {
    switch(status) {
      case 'IDLE': return 'text-neutral-500';
      case 'DISCOVERING':
      case 'IMPORTING':
      case 'ANALYZING': return 'text-blue-400 animate-pulse';
      case 'PAUSED': return 'text-yellow-500';
      case 'COMPLETED': return 'text-green-500';
      case 'ERROR': return 'text-red-500';
      default: return 'text-neutral-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
        <div>
          <h1 className="text-3xl font-medium text-white mb-2">Processing Monitor</h1>
          <p className="text-neutral-400">
            Monitor and control your visual library synchronization.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 md:gap-3">
          {status === 'IDLE' || status === 'COMPLETED' || status === 'ERROR' ? (
            <button onClick={startSync} className="bg-neutral-100 hover:bg-white text-neutral-950 px-4 py-2 rounded-xl font-medium flex items-center gap-2 min-h-[44px]">
              <Play className="w-4 h-4" /> Start Sync
            </button>
          ) : null}

          {status === 'PAUSED' ? (
            <button onClick={resumeSync} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 min-h-[44px]">
              <Play className="w-4 h-4" /> Resume
            </button>
          ) : null}

          {(status === 'DISCOVERING' || status === 'IMPORTING' || status === 'ANALYZING') ? (
            <button onClick={pauseSync} className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500 px-4 py-2 rounded-xl font-medium flex items-center gap-2 border border-yellow-600/50 min-h-[44px]">
              <Pause className="w-4 h-4" /> Pause
            </button>
          ) : null}

          {pinsFailed > 0 && status !== 'DISCOVERING' && status !== 'IMPORTING' && status !== 'ANALYZING' ? (
            <button onClick={retryFailedPins} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 min-h-[44px]">
              <RefreshCw className="w-4 h-4" /> Retry Failed
            </button>
          ) : null}

          {status !== 'IDLE' ? (
            <button onClick={cancelSync} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 min-h-[44px]">
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-sm font-medium text-neutral-400">Status</h3>
          </div>
          <p className={`text-2xl font-bold uppercase tracking-wider ${getStatusColor()}`}>
            {status}
          </p>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-sm font-medium text-neutral-400">Pins Discovered</h3>
          </div>
          <p className="text-2xl font-bold text-white">{pinsDiscovered.toLocaleString()}</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-sm font-medium text-neutral-400">Pins Analyzed</h3>
          </div>
          <div className="flex items-end justify-between">
             <p className="text-2xl font-bold text-white">{pinsAnalyzed.toLocaleString()}</p>
             {pinsFailed > 0 && <p className="text-sm text-red-400 mb-1">{pinsFailed} failed</p>}
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-lg font-medium text-white mb-6 border-b border-neutral-800 pb-4">Sync Pipeline</h3>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${boardsTotal > 0 ? 'bg-green-500/20 text-green-500' : 'bg-neutral-800 text-neutral-500'}`}>
               <CheckCircle2 className="w-5 h-5" />
             </div>
             <div>
               <p className="text-white font-medium">1. Board Discovery</p>
               <p className="text-sm text-neutral-400">{boardsProcessed} of {boardsTotal} boards processed</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pinsImported > 0 ? 'bg-green-500/20 text-green-500' : 'bg-neutral-800 text-neutral-500'}`}>
               <CheckCircle2 className="w-5 h-5" />
             </div>
             <div>
               <p className="text-white font-medium">2. Pin Retrieval</p>
               <p className="text-sm text-neutral-400">{pinsImported} pins imported into database</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pinsAnalyzed > 0 ? 'bg-green-500/20 text-green-500' : 'bg-neutral-800 text-neutral-500'}`}>
               <SparklesIcon active={pinsAnalyzed > 0} />
             </div>
             <div>
               <p className="text-white font-medium">3. Creative Intelligence Analysis</p>
               <p className="text-sm text-neutral-400">{pinsAnalyzed} pins visually analyzed by AI</p>
             </div>
          </div>
        </div>
      </div>
      
      {lastSyncTime && (
        <p className="text-center text-xs text-neutral-500 mt-6">
          Last sync: {new Date(lastSyncTime).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function SparklesIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-green-500" : "text-neutral-500"}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
