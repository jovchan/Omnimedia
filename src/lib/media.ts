import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg';

// Compress/Convert Image using Canvas API
export const processImage = async (
  file: File,
  targetFormat: string,
  qualityPercent: number,
  targetSizeKB?: number
): Promise<{ blob: Blob }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      
      // Basic scaling down if targetSize is requested (very naive implementation)
      let scale = 1;
      if (targetSizeKB && targetSizeKB > 0) {
          // Estimate scale based on size ratio (rough)
          const targetBytes = targetSizeKB * 1024;
          if (file.size > targetBytes) {
              scale = Math.sqrt(targetBytes / file.size);
              // limit how small it gets to avoid destroying the image
              scale = Math.max(scale, 0.1); 
          }
      }

      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Failed to get canvas context'));
      
      // Fill transparent background with white if converting to JPEG
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      let mimeType = `image/${targetFormat.replace('.', '')}`;
      if (targetFormat === 'jpg') mimeType = 'image/jpeg';
      
      const q = Math.max(0.01, Math.min(1, qualityPercent / 100));

      canvas.toBlob((blob) => {
        if (blob) resolve({ blob });
        else reject(new Error('Canvas toBlob failed'));
      }, mimeType, q);
    };
    img.onerror = () => reject(new Error('Failed to parse image'));
    img.src = url;
  });
};

export const processMedia = async (
  file: File,
  type: 'video' | 'audio' | 'image',
  targetExt: string,
  onProgress: (progress: number) => void,
  compressionLevel?: 'light' | 'optimal' | 'aggressive',
  qualityPercent?: number,
  targetSizeKB?: number
): Promise<Blob> => {
  
  if (type === 'image') {
      const { blob } = await processImage(file, targetExt, qualityPercent ?? 90, targetSizeKB);
      onProgress(100);
      return blob;
  }

  const ffmpeg = await getFFmpeg();
  
  const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`;
  const outputName = `output_${Date.now()}.${targetExt}`;
  
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  
  ffmpeg.on('progress', ({ progress, time }) => {
    onProgress(progress * 100);
  });

  const args: string[] = ['-i', inputName];

  if (targetSizeKB) {
      // Very rough bitrate estimation: (TargetSize in kb * 8) / seconds
      // We don't know duration easily without ffprobe, so we will just use a generic low bitrate if target is small.
      // This is a naive implementation for the sake of the requirement.
      const sizeTargetScale = Math.max(0.1, Math.min(1, targetSizeKB / (file.size / 1024)));
      if (type === 'video') {
         args.push('-vf', `scale=trunc(iw*${sizeTargetScale}/2)*2:trunc(ih*${sizeTargetScale}/2)*2`);
         args.push('-preset', 'ultrafast');
      } else {
         args.push('-b:a', '64k');
      }
  } else {
    if (type === 'video') {
        // Compression logic for video
        if (compressionLevel === 'aggressive' || (qualityPercent && qualityPercent < 40)) {
            args.push('-vf', 'scale=-2:480', '-crf', '32', '-preset', 'ultrafast');
        } else if (compressionLevel === 'optimal' || (qualityPercent && qualityPercent < 75)) {
            args.push('-vf', 'scale=-2:720', '-crf', '28', '-preset', 'veryfast');
        } else if (compressionLevel === 'light') {
            args.push('-crf', '23', '-preset', 'fast');
        } else {
           args.push('-preset', 'fast');
        }
    } else if (type === 'audio') {
         if (compressionLevel === 'aggressive' || (qualityPercent && qualityPercent < 40)) {
             args.push('-b:a', '64k');
         } else if (compressionLevel === 'optimal' || (qualityPercent && qualityPercent < 75)) {
             args.push('-b:a', '128k');
         } else if (compressionLevel === 'light') {
             args.push('-b:a', '192k');
         } else {
             args.push('-b:a', '256k'); // Default high quality for conversion
         }
    }
  }

  args.push(outputName);

  await ffmpeg.exec(args);
  
  const data = await ffmpeg.readFile(outputName);
  
  // Clean up memory
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  let mimeType = 'application/octet-stream';
  if (type === 'video') mimeType = `video/${targetExt === 'mkv' ? 'x-matroska' : targetExt}`;
  if (type === 'audio') mimeType = `audio/${targetExt}`;

  return new Blob([data], { type: mimeType });
};
