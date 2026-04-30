import { cn } from '../lib/utils';

export function Header({ activeTab, onTabChange }: { activeTab: 'convert' | 'compress'; onTabChange: (tab: 'convert' | 'compress') => void }) {
  return (
    <header className="h-16 border-b border-[#2A2A2A] flex items-center justify-between px-4 sm:px-8 bg-[#141414] shrink-0">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-[#FF6321] rounded-sm flex items-center justify-center font-bold text-black">Ω</div>
        <h1 className="text-lg font-semibold tracking-tight text-[#E0E0E0]">OmniMedia <span className="text-[#666] font-normal ml-2 hidden sm:inline">v1.2.0</span></h1>
      </div>

      <nav className="flex gap-6 text-sm font-medium uppercase tracking-widest text-[#888]">
        <button
          onClick={() => onTabChange('compress')}
          className={cn(
            "pb-5 translate-y-1 transition-colors",
            activeTab === 'compress' 
              ? "text-[#FF6321] border-b-2 border-[#FF6321]" 
              : "hover:text-white border-b-2 border-transparent"
          )}
        >
          Compress
        </button>
        <button
          onClick={() => onTabChange('convert')}
          className={cn(
            "pb-5 translate-y-1 transition-colors",
            activeTab === 'convert' 
              ? "text-[#FF6321] border-b-2 border-[#FF6321]" 
              : "hover:text-white border-b-2 border-transparent"
          )}
        >
          Convert
        </button>
      </nav>

      <div className="hidden sm:flex items-center gap-3">
        <div className="px-3 py-1 bg-[#222] border border-[#333] rounded text-[10px] text-[#00FF94] uppercase tracking-tighter">Cloud Engine Active</div>
        <div className="w-8 h-8 rounded-full bg-[#333] border border-[#444]"></div>
      </div>
    </header>
  );
}
