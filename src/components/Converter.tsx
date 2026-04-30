import { useState } from 'react';
import { Dropzone } from './Dropzone';
import { FileItem } from './FileItem';
import { FileItem as FileItemType, getMediaType, SUPPORTED_FORMATS } from '../types';
import { processMedia } from '../lib/media';
import { cn } from '../lib/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ChevronLeft } from 'lucide-react';
import { MediaSelector } from './MediaSelector';

export function Converter() {
  const [files, setFiles] = useState<FileItemType[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [mediaMode, setMediaMode] = useState<'image' | 'audio' | 'video' | null>(null);
  
  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => getMediaType(f.type, f.name) === mediaMode);
    if (validFiles.length === 0) return;
    
    const items = validFiles.map(f => {
      const type = getMediaType(f.type, f.name);
      return {
        id: Math.random().toString(36).substring(7),
        file: f,
        type,
        status: 'pending' as const,
        progress: 0
      };
    });
    setFiles(prev => [...prev, ...items]);
    
    // Automatically set target format based on the first file added if not already set
    if (!targetFormat && items.length > 0) {
        setTargetFormat(SUPPORTED_FORMATS[items[0].type][0]);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processSingle = async (item: FileItemType) => {
    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing', progress: 0 } : f));
    
    try {
      const blob = await processMedia(
        item.file, 
        item.type, 
        targetFormat, 
        (progress) => setFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress } : f))
      );
      
      const resultUrl = URL.createObjectURL(blob);
      setFiles(prev => prev.map(f => f.id === item.id ? {
        ...f,
        status: 'completed',
        progress: 100,
        resultBlob: blob,
        resultUrl,
        resultSize: blob.size,
        targetExt: targetFormat
      } : f));
    } catch (e: any) {
      setFiles(prev => prev.map(f => f.id === item.id ? {
        ...f,
        status: 'error',
        errorMessage: e.message || 'Conversion failed'
      } : f));
    }
  };

  const startAll = async () => {
    if (!targetFormat) return;
    setIsProcessingAll(true);
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
      zip.file(`${originalName}_converted.${f.targetExt}`, f.resultBlob!);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'OmniMedia_Converted.zip');
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length;

  if (!mediaMode) {
    return <MediaSelector onSelect={setMediaMode} title="Convert Media" />;
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
          <h2 className="text-xs uppercase tracking-widest text-[#666] font-bold mb-8">Conversion Parameters</h2>

          {files.length > 0 && (
            <div className="bg-[#181818] border border-[#2A2A2A] p-6 rounded-sm mb-8">
              <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-tighter mb-4 italic">
                Convert All To Format
              </label>
              
              {/* Show options grouped by type based on the first file to allow converting similar media */}
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="w-full h-11 px-4 rounded-sm border border-[#333] bg-[#0A0A0A] text-[#FF6321] font-mono focus:border-[#FF6321] outline-none transition-all uppercase tracking-widest"
              >
                {files.length > 0 && SUPPORTED_FORMATS[files[0].type].map(ext => (
                  <option key={ext} value={ext}>{ext.toUpperCase()}</option>
                ))}
              </select>
              <p className="text-[9px] text-[#444] mt-3 uppercase tracking-widest">
                  {files.length > 0 ? `Target format options based on your first added file (${files[0].type}).` : ""}
              </p>
            </div>
          )}

          <div className="mt-auto pt-8">
              <div className="flex gap-4 flex-col sm:flex-row">
                  <button
                      onClick={startAll}
                      disabled={isProcessingAll || pendingCount === 0 || !targetFormat}
                      className="flex-1 py-5 bg-[#FF6321] hover:bg-[#e5591d] disabled:opacity-50 disabled:hover:bg-[#FF6321] text-black font-black uppercase tracking-[0.2em] text-xs sm:text-sm shadow-[0_0_30px_rgba(255,99,33,0.2)] transition-all"
                  >
                      {isProcessingAll ? 'Processing...' : `Convert Batch (${pendingCount})`}
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
