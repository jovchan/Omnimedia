import { Image as ImageIcon, FileAudio, Clapperboard } from 'lucide-react';

interface MediaSelectorProps {
  onSelect: (type: 'image' | 'audio' | 'video') => void;
  title: string;
}

export function MediaSelector({ onSelect, title }: MediaSelectorProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#0F0F0F]">
      <h2 className="text-2xl font-bold text-[#E0E0E0] mb-12 uppercase tracking-widest text-center">{title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        <button 
          onClick={() => onSelect('image')}
          className="group flex flex-col items-center justify-center bg-[#141414] border border-[#2A2A2A] hover:border-[#FF6321] rounded-xl p-12 transition-all hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(255,99,33,0.1)]"
        >
          <div className="w-20 h-20 bg-[#1A1A1A] group-hover:bg-[#FF6321] group-hover:text-black rounded-full flex items-center justify-center mb-6 transition-colors text-[#FF6321]">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">Images</h3>
          <p className="text-xs text-[#888] text-center uppercase tracking-widest">JPG, PNG, WEBP, GIF</p>
        </button>

        <button 
          onClick={() => onSelect('audio')}
          className="group flex flex-col items-center justify-center bg-[#141414] border border-[#2A2A2A] hover:border-[#FF6321] rounded-xl p-12 transition-all hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(255,99,33,0.1)]"
        >
          <div className="w-20 h-20 bg-[#1A1A1A] group-hover:bg-[#FF6321] group-hover:text-black rounded-full flex items-center justify-center mb-6 transition-colors text-[#FF6321]">
            <FileAudio size={32} />
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">Audio</h3>
          <p className="text-xs text-[#888] text-center uppercase tracking-widest">MP3, WAV, AAC, OGG</p>
        </button>

        <button 
          onClick={() => onSelect('video')}
          className="group flex flex-col items-center justify-center bg-[#141414] border border-[#2A2A2A] hover:border-[#FF6321] rounded-xl p-12 transition-all hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(255,99,33,0.1)]"
        >
          <div className="w-20 h-20 bg-[#1A1A1A] group-hover:bg-[#FF6321] group-hover:text-black rounded-full flex items-center justify-center mb-6 transition-colors text-[#FF6321]">
            <Clapperboard size={32} />
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">Video</h3>
          <p className="text-xs text-[#888] text-center uppercase tracking-widest">MP4, WEBM, MOV, MKV</p>
        </button>
      </div>
    </div>
  );
}
