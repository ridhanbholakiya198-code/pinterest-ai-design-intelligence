/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Inspiration from "./pages/Inspiration";
import Studio from "./pages/Studio";
import DNA from "./pages/DNA";
import Library from "./pages/Library";
import Monitor from "./pages/Monitor";
import Privacy from "./pages/Privacy";
import { useAuthStore } from "./store";

function PlaceholderPage({ title }: { title: string }) {
  const { isPinterestConnected } = useAuthStore();
  
  if (!isPinterestConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
          <span className="text-2xl">🚧</span>
        </div>
        <h2 className="text-xl font-medium text-white mb-2">{title}</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Connect your Pinterest account to unlock this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-semibold mb-8">{title}</h1>
      <div className="text-neutral-400">Coming soon...</div>
    </div>
  );
}

function SettingsPage() {
  const { isPinterestConnected, connectPinterest } = useAuthStore();
  
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-medium text-white mb-8">Settings</h1>
      
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 md:p-6 mb-8">
        <h2 className="text-lg font-medium text-white mb-4">Connections</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.2-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.182 0 7.439 2.981 7.439 6.953 0 4.156-2.618 7.505-6.253 7.505-1.222 0-2.373-.635-2.766-1.385l-.753 2.874c-.272 1.043-1.009 2.35-1.503 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.592 0 12.017 0z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium">Pinterest</h3>
              <p className="text-sm text-neutral-400">
                {isPinterestConnected ? "Connected" : "Not configured yet"}
              </p>
            </div>
          </div>
          {!isPinterestConnected && (
            <button 
              onClick={connectPinterest}
              className="w-full sm:w-auto px-4 py-2 bg-neutral-100 text-neutral-950 font-medium text-sm rounded-lg hover:bg-white transition-colors min-h-[44px]"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    // For local dev, let's automatically "login" the session if not logged in
    fetch("/api/auth/login", { method: "POST" }).then(() => {
      checkAuth();
    });
  }, [checkAuth]);

  if (isLoading) {
    return <div className="h-screen bg-neutral-950 flex items-center justify-center text-neutral-500">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="library" element={<Library />} />
          <Route path="search" element={<PlaceholderPage title="Search Memory" />} />
          <Route path="dna" element={<DNA />} />
          <Route path="studio" element={<Studio />} />
          <Route path="inspiration" element={<Inspiration />} />
          <Route path="monitor" element={<Monitor />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
