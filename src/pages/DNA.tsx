import { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { Sparkles } from 'lucide-react';
import { fetchUserVisualDNA } from '../lib/dna';

export default function DNA() {
  const { isPinterestConnected, userId } = useAuthStore();
  const [dnaData, setDnaData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPinterestConnected || !userId) {
      setIsLoading(false);
      return;
    }

    const loadDNA = async () => {
      try {
        const data = await fetchUserVisualDNA(userId);
        setDnaData(data);
      } catch (err) {
        console.error("Failed to load DNA:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDNA();
  }, [isPinterestConnected, userId]);

  if (!isPinterestConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
        <Sparkles className="w-12 h-12 text-neutral-600 mb-4" />
        <h2 className="text-xl font-medium text-white mb-2">Design DNA</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Connect your Pinterest account and sync your library to discover your visual taste.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-20 text-neutral-500">Extracting your visual DNA...</div>;
  }

  if (dnaData?.sampleSize === 0) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <h2 className="text-xl font-medium text-white mb-2">Not Enough Data</h2>
        <p className="text-neutral-400">
          We haven't analyzed enough pins yet. Go to the Processing Monitor and start a sync.
        </p>
      </div>
    );
  }

  const renderCard = (title: string, items: [string, number][], total: number) => (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 md:p-6">
      <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">Not enough data.</p>
      ) : (
        <ul className="space-y-4">
          {items.map(([key, count]) => {
            const percentage = Math.round((count / total) * 100);
            return (
              <li key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-300 capitalize">{key}</span>
                  <span className="text-neutral-500">{percentage}%</span>
                </div>
                <div className="w-full bg-neutral-950 rounded-full h-1.5">
                  <div className="bg-neutral-600 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-white mb-2">Design DNA</h1>
        <p className="text-neutral-400">
          Your unique visual taste aggregated from {dnaData.sampleSize} analyzed references.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderCard("Aesthetics & Mood", dnaData.topAesthetics, dnaData.sampleSize)}
        {renderCard("Color Palette", dnaData.topColors, dnaData.sampleSize)}
        {renderCard("Typography Preferences", dnaData.topTypography, dnaData.sampleSize)}
        {renderCard("Design Principles", dnaData.topPrinciples, dnaData.sampleSize)}
      </div>
    </div>
  );
}
