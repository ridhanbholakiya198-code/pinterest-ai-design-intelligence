import { useEffect } from 'react';
import { useAuthStore } from '../store';
import { ArrowRight, Sparkles, Image as ImageIcon, Zap } from 'lucide-react';

export default function Home() {
  const { isPinterestConnected, connectPinterest } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto mt-8 md:mt-20 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/50 border border-neutral-700/50 text-xs font-medium text-neutral-300 mb-6 md:mb-8">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Pinterest AI Design Intelligence</span>
      </div>
      
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
        Your visual memory, <br className="hidden sm:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-300 to-neutral-600">
          understood by AI.
        </span>
      </h1>
      
      <p className="text-base md:text-lg text-neutral-400 mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed px-2 md:px-0">
        Connect your Pinterest library. We analyze your saved references, extract design patterns, and use your entire collection to build better project directions.
      </p>

      {!isPinterestConnected ? (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 md:p-8 max-w-md mx-auto backdrop-blur-sm">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.2-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.182 0 7.439 2.981 7.439 6.953 0 4.156-2.618 7.505-6.253 7.505-1.222 0-2.373-.635-2.766-1.385l-.753 2.874c-.272 1.043-1.009 2.35-1.503 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.592 0 12.017 0z"/>
            </svg>
          </div>
          <h2 className="text-xl font-medium text-white mb-2">Connect Pinterest</h2>
          <p className="text-sm text-neutral-400 mb-6">
            Securely connect to import and analyze your saved inspiration.
          </p>
          <button 
            onClick={connectPinterest}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            Authenticate
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto px-2 md:px-0">
          {[
            { title: "Analyze", desc: "Extract visual patterns", icon: ImageIcon },
            { title: "Synthesize", desc: "Cross-category connections", icon: Zap },
            { title: "Generate", desc: "Build new directions", icon: Sparkles }
          ].map((feature, i) => (
            <div key={i} className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-5 md:p-6 text-left backdrop-blur-md">
              <feature.icon className="w-6 h-6 text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-neutral-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
