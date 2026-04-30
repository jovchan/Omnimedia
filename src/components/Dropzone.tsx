import { useDropzone, DropzoneOptions, Accept } from 'react-dropzone';
import { cn } from '../lib/utils';
import { useCallback } from 'react';

interface DropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  multiple?: boolean;
  compact?: boolean;
  accept?: Accept;
}

export function Dropzone({ onFilesAccepted, multiple = true, compact = false, accept }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop: (acceptedFiles) => onFilesAccepted(acceptedFiles), 
    multiple,
    accept
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-[#121212] group cursor-pointer transition-colors",
        isDragActive ? "border-[#FF6321] bg-[#1a1412]" : "border-[#333] hover:border-[#FF6321]",
        compact ? "h-48" : "min-h-[300px]"
      )}
    >
      <input {...getInputProps()} />
      <div className={cn(
          "bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4 transition-colors font-light",
          isDragActive ? "bg-[#FF6321] text-black" : "text-[#FF6321] group-hover:bg-[#FF6321] group-hover:text-black",
          compact ? "w-12 h-12 text-2xl" : "w-16 h-16 text-3xl"
      )}>
        +
      </div>
      <h3 className="text-xs text-[#555] uppercase tracking-widest mb-2 font-medium">
        {isDragActive ? "Drop files here" : compact ? "Drop more files to compress" : "Drag & drop files here"}
      </h3>
      <p className="text-[10px] text-[#444] uppercase tracking-widest mt-2">
        Unlimited Bulk Mode Active
      </p>
    </div>
  );
}
