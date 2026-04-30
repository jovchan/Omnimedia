import { useState } from 'react';
import { Dropzone } from './Dropzone';
import { FileItem } from './FileItem';
import { FileItem as FileItemType, getMediaType } from '../types';
import { processMedia } from '../lib/media';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { cn, formatBytes } from '../lib/utils';
import { ChevronLeft } from 'lucide-react';
import { MediaSelector } from './MediaSelector';

export function Compressor() {
  const [files, setFiles] = useState<FileItemType[]>([]);
  const [compressionMode, setCompressionMode] = useState<'preset' | 'quality' | 'targetSize'>('preset');
  const [preset, setPreset] = useState<'light' | 'optimal' | 'aggressive'>('optimal');
  const [qualitySlider, setQualitySlider] = useState<number>(70);
  const [targetSizeKB, setTargetSizeKB] = useState<number>(1024);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [mediaMode, setMediaMode] = useState<'image' | 'audio' | 'video' | null>(null);

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => getMediaType(f.type, f.name) === mediaMode);
    if (validFiles.length === 0) return;
    
    const items = validFiles.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      type: getMediaType(f.type, f.name),
      status: 'pending' as const,
      progress: 0
    }));
    setFiles(prev => [...prev, ...items]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processSingle = async (item: FileItemType) => {
    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing', progress: 0 } : f));
    
    // We assume same extension for compress
    const ext = item.file.name.split('.').pop() || '';
    
    try {
      const blob = await processMedia(
        item.file,
        item.type,
        ext,
        (progress) => setFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress } : f)),
        compressionMode === 'preset' ? preset : undefined,
        compressionMode === 'quality' ? qualitySlider : undefined,
        compressionMode === 'targetSize' ? targetSizeKB : undefined
      );

      setFiles(prev => prev.map(f => f.id === item.id ? {
        ...f,
        status: 'completed',
        progress: 100,
        resultBlob: blob,
        resultUrl: URL.createObjectURL(blob),
        resultSize: blob.size,
        targetExt: ext
      } : f));
    } catch (e: any) {
      setFiles(prev => prev.map(f => f.id === item.id ? {
        ...f, status: 'error', errorMessage: e.message || 'Compress failed'
      } : f));
    }
  };

  const startAll = async () => {
    setIsProcessingAll(true);
    // Process sequentially so we don't crash FFmpeg WASM or Canvas memory
    const pendingFiles = files.filter(f => f.status === 'pending' || f.status === 'error');
    for (const f of pendingFiles) {
      await processSingle(f);
    }
    setIsProcessingAll(false);
  };

  const downloadAllZip = async () => {
    const completed = files.filter(f => f.status === 'completed' && f.resultBlob);
    if (completed.length === 0) return;
    
    const zip = new JSZip();
    completed.forEach(f => {
      const originalName = f.file.name.split('.')[0];
      zip.file(`${originalName}_compressed.${f.targetExt}`, f.resultBlob!);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'OmniMedia_Compressed.zip');
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length;
  const originalTotalBytes = files.reduce((acc, curr) => acc + curr.file.size, 0);
  const resultTotalBytes = files.reduce((acc, curr) => acc + (curr.resultSize || 0), 0);

  if (!mediaMode) {
    return <MediaSelector onSelect={setMediaMode} title="Compress Media" />;
  }

  const acceptObj = mediaMode === 'image' ? {'image/*': []} : mediaMode === 'audio' ? {'audio/*': []} : {'video/*': []};

  return (
    <div className="flex flex-col lg:flex-row w-full h-full overflow-hidden">
        {/* Left Panel: File Queue */}
        <section className="w-full lg:w-[640px] border-r border-[#2A2A2A] flex flex-col h-full shrink-0">
            <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center bg-[#111]">
                <h2 className="text-xs uppercase tracking-widest text-[#666] font-bold flex items-center gap-2">
                    <button onClick={() => setMediaMode(null)} className="hover:text-[#FFF] transition-colors"><ChevronLeft size={16}/></button>
                    {mediaMode} Queue / {files.length} Files Selected
                </h2>
                <button onClick={() => setFiles([])} className="text-[11px] text-[#FF6321] border border-[#FF6321] px-3 py-1 rounded hover:bg-[#FF6321] hover:text-black transition-colors uppercase font-bold tracking-widest">Clear All</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#0F0F0F] custom-scrollbar">
                {files.length === 0 ? (
                    <Dropzone onFilesAccepted={handleFiles} multiple={true} accept={acceptObj} />
                ) : (
                    <>
                        {files.map(f => (
                            <FileItem key={f.id} item={f} onRemove={removeFile} />
                        ))}
                        <div className="mt-8">
                          <Dropzone onFilesAccepted={handleFiles} multiple={true} compact={true} accept={acceptObj} />
                        </div>
                    </>
                )}
            </div>
        </section>

        {/* Right Panel: Controls */}
        <section className="flex-1 bg-[#141414] p-8 flex flex-col overflow-y-auto w-full custom-scrollbar">
            <h2 className="text-xs uppercase tracking-widest text-[#666] font-bold mb-8">Compression Parameters</h2>
            
            <div className="flex bg-[#181818] border border-[#2A2A2A] p-1 rounded-sm mb-8 text-center text-xs tracking-widest uppercase">
                <button 
                  onClick={() => setCompressionMode('preset')}
                  className={cn("flex-1 py-3 rounded-sm transition-colors", compressionMode === 'preset' ? "bg-[#333] text-white" : "text-[#666] hover:text-[#888]")}
                >
                  Presets
                </button>
                <button 
                  onClick={() => setCompressionMode('quality')}
                  className={cn("flex-1 py-3 rounded-sm transition-colors", compressionMode === 'quality' ? "bg-[#333] text-white" : "text-[#666] hover:text-[#888]")}
                >
                  Quality
                </button>
                <button 
                  onClick={() => setCompressionMode('targetSize')}
                  className={cn("flex-1 py-3 rounded-sm transition-colors", compressionMode === 'targetSize' ? "bg-[#333] text-white" : "text-[#666] hover:text-[#888]")}
                >
                  Target Size
                </button>
            </div>

            <div className="space-y-10">
                 {compressionMode === 'preset' ? (
                    <div>
                        <label className="text-[10px] uppercase text-[#888] block mb-4 tracking-tighter font-semibold italic">Optimization Strategy</label>
                        <div className="grid grid-cols-3 gap-2">
                        {(['light', 'optimal', 'aggressive'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPreset(p)}
                                className={cn(
                                    "py-4 px-2 border rounded-sm text-[10px] uppercase tracking-widest transition-colors",
                                    preset === p 
                                        ? "border-[#FF6321] bg-[#FF6321] text-black font-bold" 
                                        : "border-[#333] bg-[#1A1A1A] text-[#888] hover:border-[#FF6321] hover:text-[#E0E0E0]"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                        </div>
                    </div>
                 ) : compressionMode === 'quality' ? (
                    <div>
                        <div className="flex justify-between mb-4">
                            <label className="text-[10px] uppercase text-[#888] tracking-tighter font-semibold italic">Quality Retention</label>
                            <span className="text-xs font-mono text-[#FF6321]">{qualitySlider}%</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={qualitySlider}
                            onChange={(e) => setQualitySlider(parseInt(e.target.value))}
                            className="w-full accent-[#FF6321] h-1 bg-[#222] rounded-full appearance-none cursor-pointer"
                        />
                    </div>
                 ) : (
                    <div>
                        <label className="text-[10px] uppercase text-[#888] block mb-4 tracking-tighter font-semibold italic">Hard Limit Target (Optional)</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="number"
                                min="1"
                                value={targetSizeKB}
                                onChange={(e) => setTargetSizeKB(parseInt(e.target.value))}
                                className="bg-black border border-[#333] rounded-sm px-4 py-3 text-sm w-full focus:border-[#FF6321] hover:border-[#444] outline-none font-mono text-[#FF6321] transition-colors"
                            />
                            <select className="bg-black border border-[#333] rounded-sm px-4 py-3 text-sm focus:border-[#FF6321] hover:border-[#444] outline-none text-[#888] transition-colors">
                                <option value="KB">KB</option>
                            </select>
                        </div>
                        <p className="text-[9px] text-[#444] mt-3 uppercase tracking-widest">Calculated estimations applied during scaling</p>
                    </div>
                 )}
            </div>

            <div className="mt-auto pt-8">
                <div className="p-4 bg-[#1A1A1A] border border-[#222] rounded-sm mb-6">
                    <div className="flex justify-between text-[10px] uppercase mb-2">
                        <span className="text-[#666]">Original Total</span>
                        <span className="text-[#888] font-mono">{formatBytes(originalTotalBytes)}</span>
                    </div>
                    {completedCount > 0 && (
                        <div className="flex justify-between text-[10px] uppercase">
                            <span className="text-[#666]">New Total</span>
                            <span className="text-[#00FF94] font-mono">{formatBytes(resultTotalBytes)}</span>
                        </div>
                    )}
                </div>
                
                <div className="flex gap-4 flex-col sm:flex-row">
                    <button
                        onClick={startAll}
                        disabled={isProcessingAll || pendingCount === 0}
                        className="flex-1 py-5 bg-[#FF6321] hover:bg-[#e5591d] disabled:opacity-50 disabled:hover:bg-[#FF6321] text-black font-black uppercase tracking-[0.2em] text-xs sm:text-sm shadow-[0_0_30px_rgba(255,99,33,0.2)] transition-all"
                    >
                        {isProcessingAll ? 'Processing...' : `Process Batch (${pendingCount})`}
                    </button>
                    {completedCount > 0 && (
                        <button
                            onClick={downloadAllZip}
                            className="px-6 py-5 border border-[#444] hover:border-[#FF6321] text-[#E0E0E0] hover:text-[#FF6321] bg-[#111] font-black uppercase tracking-[0.1em] text-xs sm:text-sm transition-colors"
                        >
                            Download ZIP
                        </button>
                    )}
                </div>
            </div>
        </section>
    </div>
  );
}

function FilesIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}
