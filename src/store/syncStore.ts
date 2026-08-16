import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { useAuthStore } from '../store';

export type SyncState = 'IDLE' | 'DISCOVERING' | 'IMPORTING' | 'ANALYZING' | 'PAUSED' | 'COMPLETED' | 'ERROR';

interface SyncRunState {
  status: SyncState;
  boardsTotal: number;
  boardsProcessed: number;
  pinsDiscovered: number;
  pinsImported: number;
  pinsAnalyzed: number;
  pinsFailed: number;
  currentBoardId?: string;
  bookmark?: string;
  lastSyncTime?: number;
  error?: string;
  retryAttempts?: number;
}

interface SyncStore extends SyncRunState {
  startSync: () => Promise<void>;
  pauseSync: () => void;
  resumeSync: () => Promise<void>;
  cancelSync: () => Promise<void>;
  retryFailedPins: () => Promise<void>;
  fetchState: () => Promise<void>;
  isPaused: boolean;
}

const SYNC_BATCH_SIZE = 10;

export const useSyncStore = create<SyncStore>((set, get) => {
  let syncInterval: NodeJS.Timeout | null = null;
  let isProcessingBatch = false;

  const saveState = async (state: Partial<SyncRunState>) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    
    set({ ...state });
    
    const syncRunRef = doc(db, 'sync_runs', userId);
    await setDoc(syncRunRef, { ...get(), ...state, updated_at: Date.now() }, { merge: true });
  };

  const processBatch = async () => {
    if (isProcessingBatch) return;
    isProcessingBatch = true;
    
    const { status, currentBoardId, bookmark, pinsDiscovered, pinsImported, boardsTotal, boardsProcessed } = get();
    const userId = useAuthStore.getState().userId;
    
    if (status === 'PAUSED' || status === 'COMPLETED' || status === 'ERROR') {
      isProcessingBatch = false;
      return;
    }

    try {
      if (status === 'DISCOVERING' || status === 'IDLE' || status === 'IMPORTING') {
        if (!currentBoardId && boardsTotal === 0) {
          // Fetch boards first
          set({ status: 'DISCOVERING' });
          const boardsRes = await fetch('/api/import/boards');
          if (!boardsRes.ok) throw new Error('Failed to fetch boards');
          const boardsData = await boardsRes.json();
          
          if (!boardsData.boards || boardsData.boards.length === 0) {
            await saveState({ status: 'COMPLETED', boardsTotal: 0 });
            isProcessingBatch = false;
            return;
          }
          
          await saveState({ 
            boardsTotal: boardsData.boards.length, 
            boardsProcessed: 0,
            currentBoardId: boardsData.boards[0].id,
            status: 'IMPORTING'
          });
        } else if (currentBoardId) {
          // Fetch pins for the current board
          const pinsRes = await fetch(`/api/import/boards/${currentBoardId}/pins${bookmark ? `?bookmark=${bookmark}` : ''}`);
          if (!pinsRes.ok) throw new Error(`Failed to fetch pins for board ${currentBoardId}`);
          const pinsData = await pinsRes.json();
          
          let newlyImported = 0;
          
          // Save pins to Firestore in batch
          if (pinsData.items && pinsData.items.length > 0) {
            const batch = writeBatch(db);
            for (const pin of pinsData.items) {
               const pinRef = doc(db, 'pins', `pin_${pin.id}`);
               batch.set(pinRef, {
                 user_id: userId,
                 pinterest_id: pin.id,
                 board_id: currentBoardId,
                 title: pin.title || "",
                 description: pin.description || "",
                 link: pin.link || "",
                 media: pin.media || null,
                 alt_text: pin.alt_text || "",
                 dominant_color: pin.dominant_color || "",
                 imported_at: Date.now(),
                 status: "DISCOVERED"
               }, { merge: true });
               newlyImported++;
            }
            await batch.commit();
          }
          
          const nextBookmark = pinsData.bookmark;
          if (nextBookmark) {
            await saveState({
              bookmark: nextBookmark,
              pinsDiscovered: get().pinsDiscovered + newlyImported,
              pinsImported: get().pinsImported + newlyImported,
              retryAttempts: 0
            });
          } else {
            // Board finished, move to next
            // In a real scenario we need to fetch boards again or store them all in state. 
            // For now let's just assume we hit the end, or we can fetch boards and find next.
            // Let's simplify and just mark completed if no bookmark, although this misses other boards.
            // A better way is to fetch boards, find index of currentBoardId, and pick next.
            
            const boardsRes = await fetch('/api/import/boards');
            const boardsData = await boardsRes.json();
            const boards = boardsData.boards || [];
            const currentIndex = boards.findIndex((b: any) => b.id === currentBoardId);
            
            if (currentIndex !== -1 && currentIndex + 1 < boards.length) {
               await saveState({
                 currentBoardId: boards[currentIndex + 1].id,
                 bookmark: undefined,
                 boardsProcessed: get().boardsProcessed + 1,
                 pinsDiscovered: get().pinsDiscovered + newlyImported,
                 pinsImported: get().pinsImported + newlyImported,
                 retryAttempts: 0
               });
            } else {
               await saveState({
                 status: 'ANALYZING',
                 boardsProcessed: boards.length,
                 currentBoardId: undefined,
                 bookmark: undefined,
                 pinsDiscovered: get().pinsDiscovered + newlyImported,
                 pinsImported: get().pinsImported + newlyImported,
                 retryAttempts: 0
               });
            }
          }
        }
      } else if (status === 'ANALYZING') {
         // Query Firestore for UNANALYZED pins
         const { query, collection, where, limit, getDocs } = await import('firebase/firestore');
         const q = query(
           collection(db, 'pins'), 
           where('user_id', '==', userId), 
           where('status', '==', 'DISCOVERED'), 
           limit(5)
         );
         
         const snap = await getDocs(q);
         if (snap.empty) {
            // Done
            await saveState({ status: 'COMPLETED', lastSyncTime: Date.now() });
            isProcessingBatch = false;
            return;
         }

         let analyzedCount = 0;
         let failedCount = 0;
         const { writeBatch, doc } = await import('firebase/firestore');
         const batch = writeBatch(db);

         for (const docSnap of snap.docs) {
            const pinData = docSnap.data();
            try {
              const res = await fetch('/api/gemini/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pinData })
              });
              
              if (!res.ok) throw new Error('Analysis failed');
              const { analysis } = await res.json();
              
              batch.set(docSnap.ref, {
                status: 'COMPLETED',
                processed_at: Date.now(),
                analysis
              }, { merge: true });
              analyzedCount++;
            } catch (err) {
              console.error("Pin analysis error:", err);
              batch.set(docSnap.ref, {
                status: 'ERROR',
                failed_at: Date.now(),
                processing_attempts: (pinData.processing_attempts || 0) + 1
              }, { merge: true });
              failedCount++;
            }
         }
         
         await batch.commit();

         await saveState({
           pinsAnalyzed: get().pinsAnalyzed + analyzedCount,
           pinsFailed: get().pinsFailed + failedCount
         });
      }

    } catch (err: any) {
      console.error("Sync error:", err);
      // Wait before pausing or retrying
      const attempts = get().retryAttempts || 0;
      if (err.message?.includes('Rate limit') || err.status === 429 || attempts < 5) {
        // Exponential backoff
        const delay = Math.min(Math.pow(2, attempts) * 2000, 30000); // max 30s
        await saveState({ retryAttempts: attempts + 1 });
        console.log(`Retrying in ${delay}ms... (attempt ${attempts + 1})`);
        
        // Temporarily clear interval to prevent overlaps, let timeout handle it
        if (syncInterval) clearInterval(syncInterval);
        setTimeout(() => {
           startLoop();
        }, delay);
      } else {
        await saveState({ status: 'ERROR', error: err.message || "Unknown error" });
      }
    } finally {
      isProcessingBatch = false;
    }
  };

  const startLoop = () => {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
      processBatch();
    }, 5000); // Check every 5 seconds
    processBatch();
  };

  return {
    status: 'IDLE',
    boardsTotal: 0,
    boardsProcessed: 0,
    pinsDiscovered: 0,
    pinsImported: 0,
    pinsAnalyzed: 0,
    pinsFailed: 0,
    isPaused: false,

    fetchState: async () => {
      const userId = useAuthStore.getState().userId;
      if (!userId) return;
      const docRef = doc(db, 'sync_runs', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        set({ ...data, isPaused: data.status === 'PAUSED' } as any);
        if (data.status === 'DISCOVERING' || data.status === 'IMPORTING' || data.status === 'ANALYZING') {
           startLoop();
        }
      }
    },

    startSync: async () => {
      const userId = useAuthStore.getState().userId;
      if (!userId) return;
      await saveState({ 
        status: 'DISCOVERING', 
        boardsTotal: 0, boardsProcessed: 0, pinsDiscovered: 0, pinsImported: 0, pinsAnalyzed: 0, pinsFailed: 0,
        currentBoardId: undefined, bookmark: undefined, error: undefined
      });
      startLoop();
    },

    pauseSync: () => {
      if (syncInterval) clearInterval(syncInterval);
      saveState({ status: 'PAUSED', isPaused: true } as any);
    },

    resumeSync: async () => {
      await saveState({ status: get().status === 'ERROR' || get().status === 'PAUSED' ? 'IMPORTING' : get().status, isPaused: false, error: undefined, retryAttempts: 0 } as any);
      startLoop();
    },

    retryFailedPins: async () => {
      const userId = useAuthStore.getState().userId;
      if (!userId) return;
      
      const { query, collection, where, getDocs, writeBatch } = await import('firebase/firestore');
      const q = query(
        collection(db, 'pins'), 
        where('user_id', '==', userId), 
        where('status', '==', 'ERROR')
      );
      
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      
      snap.docs.forEach(docSnap => {
         batch.set(docSnap.ref, { status: 'DISCOVERED' }, { merge: true });
      });
      
      await batch.commit();
      
      // Update state
      await saveState({
        pinsFailed: Math.max(0, get().pinsFailed - snap.size),
        status: 'ANALYZING',
        error: undefined,
        retryAttempts: 0,
        isPaused: false
      } as any);
      
      startLoop();
    },

    cancelSync: async () => {
      if (syncInterval) clearInterval(syncInterval);
      await saveState({ status: 'IDLE', error: undefined } as any);
    }
  };
});
