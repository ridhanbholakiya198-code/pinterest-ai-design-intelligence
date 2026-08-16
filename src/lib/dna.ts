import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchUserVisualDNA(userId: string) {
  const q = query(
    collection(db, 'pins'), 
    where('user_id', '==', userId), 
    where('status', '==', 'COMPLETED')
  );
  
  const snap = await getDocs(q);
  
  const aestheticsCount: Record<string, number> = {};
  const colorsCount: Record<string, number> = {};
  const typographyCount: Record<string, number> = {};
  const principlesCount: Record<string, number> = {};
  
  snap.docs.forEach(doc => {
    const { analysis } = doc.data();
    if (!analysis) return;
    
    (analysis.aesthetics || []).forEach((a: string) => aestheticsCount[a] = (aestheticsCount[a] || 0) + 1);
    (analysis.colorPalette || []).forEach((c: string) => colorsCount[c] = (colorsCount[c] || 0) + 1);
    (analysis.typography || []).forEach((t: string) => typographyCount[t] = (typographyCount[t] || 0) + 1);
    (analysis.designPrinciples || []).forEach((p: string) => principlesCount[p] = (principlesCount[p] || 0) + 1);
  });

  const sortTop = (record: Record<string, number>) => Object.entries(record).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const topAesthetics = sortTop(aestheticsCount).map(i => i[0]);
  const topColors = sortTop(colorsCount).map(i => i[0]);
  const topTypography = sortTop(typographyCount).map(i => i[0]);
  const topPrinciples = sortTop(principlesCount).map(i => i[0]);

  return {
    sampleSize: snap.size,
    topAesthetics: sortTop(aestheticsCount),
    topColors: sortTop(colorsCount),
    topTypography: sortTop(typographyCount),
    topPrinciples: sortTop(principlesCount),
    textString: `Based on ${snap.size} analyzed references, the user prefers:
Aesthetics: ${topAesthetics.join(', ')}
Colors: ${topColors.join(', ')}
Typography: ${topTypography.join(', ')}
Key Principles: ${topPrinciples.join(', ')}`
  };
}
