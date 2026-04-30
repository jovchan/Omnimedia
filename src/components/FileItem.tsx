import { FileItem as FileItemType } from '../types';
import { formatBytes } from '../lib/utils';
import { CheckCircle2, Loader2, AlertCircle, X, Download } from 'lucide-react';

interface FileItemProps {
  key?: string | number;
  item: FileItemType;
  onRemove: (id: string) => void;
}

export function FileItem({ item, onRemove }: FileItemProps) {
  const isCompleted = item.status === 'completed';
  const isProcessing = item.status === 'processing';
  const isError = item.status === 'error';

  const ext = item.file.name.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div className="flex items-center justify-between p-4 bg-[#181818] border border-[#2A2A2A] rounded-lg mb-3 hover:border-[#444] transition-colors">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 bg-[#222] rounded flex items-center justify-center text-[10px] text-[#666] uppercase shrink-0 font-bold tracking-wider">
          {ext}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-[#E0E0E0] truncate max-w-[200px] mb-0.5">{item.file.name}</h4>
          <div className="flex items-center gap-2 text-[10px] text-[#555] tracking-wide">
            <span>{formatBytes(item.file.size)}</span>
            {isProcessing && (
              <>
                 <span className="text-[#333]">•</span>
                 <span className="text-[#FF6321]">{Math.round(item.progress)}%</span>
              </>
            )}
            {isError && (
               <span className="text-red-500 truncate max-w-[150px]">{item.errorMessage}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 shrink-0 ml-4 text-right">
        {isProcessing && (
          <div className="w-16 h-1 bg-[#222] rounded-full overflow-hidden">
             <div 
               className="h-full bg-[#FF6321] transition-all duration-300"
               style={{ width: `${item.progress}%` }}
             />
          </div>
        )}
        
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: isCompleted ? '#00FF94' : isError ? '#FF3333' : isProcessing ? '#FF6321' : '#666'}}>
            {item.status}
          </div>
          {isCompleted && item.resultSize && (
            <div className="text-[9px] text-[#555] uppercase tracking-wider">
               New: {formatBytes(item.resultSize)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-2">
            {isCompleted && item.resultUrl && (
              <a
                href={item.resultUrl}
                download={`processed_${item.file.name.split('.')[0]}.${item.targetExt || 'out'}`}
                className="p-2 text-[#00FF94] hover:bg-[#00FF94]/10 rounded transition-colors"
                title="Download"
              >
                <Download size={14} />
              </a>
            )}

            {!isProcessing && (
              <button 
                onClick={() => onRemove(item.id)}
                className="p-1.5 text-[#555] hover:text-[#FF3333] hover:bg-[#FF3333]/10 rounded transition-colors"
              >
                <X size={14} />
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
