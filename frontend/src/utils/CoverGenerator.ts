export const drawCover = (canvas: HTMLCanvasElement, title: string, artist: string) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // background gradient(random color generation) 
  const hue = Math.floor(Math.random() * 360);
  const gradient = ctx.createLinearGradient(0, 0, 120, 120);
  gradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
  gradient.addColorStop(1, `hsl(${hue + 60}, 70%, 30%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 120, 120);

  // text rendering
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title.length > 15 ? title.substring(0, 12) + '...' : title, 60, 50);
  
  ctx.font = '12px sans-serif';
  ctx.fillText(artist, 60, 80);

  //random geometric pattern (so that the cover looks unique)
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(60, 60, 40, 0, Math.PI * 2);
  ctx.stroke();
};