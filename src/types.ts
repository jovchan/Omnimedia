export type MediaType = 'audio' | 'image' | 'video';

export interface FileItem {
  id: string;
  file: File;
  type: MediaType;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  resultBlob?: Blob;
  resultUrl?: string;
  resultSize?: number;
  errorMessage?: string;
  targetExt?: string;
}

export const SUPPORTED_FORMATS = {
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'],
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv'],
};

export const getMediaType = (fileType: string, fileName: string): MediaType => {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('audio/')) return 'audio';
  if (fileType.startsWith('video/')) return 'video';
  
  // Fallback checking extension
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (SUPPORTED_FORMATS.audio.includes(ext)) return 'audio';
  if (SUPPORTED_FORMATS.image.includes(ext)) return 'image';
  if (SUPPORTED_FORMATS.video.includes(ext)) return 'video';
  
  // Default to video if unknown but might be handled by ffmpeg
  return 'video';
};
