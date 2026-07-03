import { useEffect, useRef } from 'react';
import { drawCover } from '../utils/CoverGenerator'; 

export default function AlbumCover({ title, artist }: { title: string, artist: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawCover(canvasRef.current, title, artist);
    }
  }, [title, artist]);

  return <canvas ref={canvasRef} width="120" height="120" className="rounded" />;
}