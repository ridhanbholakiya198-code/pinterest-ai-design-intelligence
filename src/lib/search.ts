import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export interface SearchQuery {
  term?: string;
  category?: string;
  aesthetic?: string;
  limitCount?: number;
}

export async function searchVisualLibrary(userId: string, searchQuery: SearchQuery) {
  // Currently implements keyword/category matching using Firestore.
  // Architected to be easily swappable with Pinecone/Vertex AI Vector Search later.
  
  let q = query(
    collection(db, 'pins'),
    where('user_id', '==', userId),
    where('status', '==', 'COMPLETED')
  );

  // Firestore doesn't support full-text search natively without Algolia/Elastic,
  // but we can query by structured attributes if provided.
  // In a real semantic search, we'd take searchQuery.term, embed it, and hit a vector DB.
  
  // For now, we fetch a batch and filter client-side for basic textual matches,
  // or use direct equality if structured filters are provided.
  
  // Note: We'll pull recent analyzed pins and local-filter for now as the 'robust local retrieval'
  // before introducing Vector DB.
  
  const snap = await getDocs(q);
  let results = snap.docs.map(doc => doc.data());

  if (searchQuery.term) {
    const term = searchQuery.term.toLowerCase();
    results = results.filter(pin => {
      const title = (pin.title || "").toLowerCase();
      const desc = (pin.description || "").toLowerCase();
      const summary = (pin.analysis?.visualSummary || "").toLowerCase();
      const why = (pin.analysis?.whyDidISaveThis || "").toLowerCase();
      
      return title.includes(term) || desc.includes(term) || summary.includes(term) || why.includes(term);
    });
  }

  if (searchQuery.category) {
    results = results.filter(pin => pin.analysis?.primaryCategory === searchQuery.category);
  }

  if (searchQuery.aesthetic) {
    results = results.filter(pin => (pin.analysis?.aesthetics || []).includes(searchQuery.aesthetic));
  }

  return results.slice(0, searchQuery.limitCount || 50);
}
