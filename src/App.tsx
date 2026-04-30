/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Header } from './components/Header';
import { Converter } from './components/Converter';
import { Compressor } from './components/Compressor';

export default function App() {
  const [activeTab, setActiveTab] = useState<'convert' | 'compress'>('convert');

  return (
    <div className="h-screen bg-[#0F0F0F] text-[#E0E0E0] font-sans flex flex-col overflow-hidden">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex overflow-hidden w-full">
        {activeTab === 'convert' ? <Converter /> : <Compressor />}
      </main>
      
      <footer className="h-12 border-t border-[#2A2A2A] bg-[#0A0A0A] flex items-center justify-between px-8 text-[10px] uppercase tracking-widest text-[#444] shrink-0">
        <div className="flex gap-6">
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF94]"></span> FFmpeg WASM Enabled</div>
          <div className="hidden sm:block">Storage: Auto-Wipe @ 2h</div>
        </div>
        <div className="flex gap-6">
          <span className="text-[#666]">OmniMedia Engine &copy; 2026</span>
        </div>
      </footer>
    </div>
  );
}
