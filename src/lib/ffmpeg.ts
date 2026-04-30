import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let isLoading = false;

export const getFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) {
    return ffmpeg;
  }
  
  if (isLoading) {
    // Wait until it's loaded if already loading
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (ffmpeg) {
          clearInterval(interval);
          resolve(ffmpeg);
        }
      }, 100);
    });
  }

  isLoading = true;
  const _ffmpeg = new FFmpeg();

  // Using unpkg to load core since we are a pure client-side SPA in this setup.
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  
  await _ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpeg = _ffmpeg;
  isLoading = false;
  return ffmpeg;
};
