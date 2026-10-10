export function extractColorsFromImage(imageSrc: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve([]);

        // Sample at 40x40 for fast pixel aggregation
        const size = 40;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorCounts: Record<string, number> = {};

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or harsh extremes
          if (a < 128) continue;
          if (r > 248 && g > 248 && b > 248) continue;
          if (r < 12 && g < 12 && b < 12) continue;

          // Quantize to steps of 32
          const qr = Math.min(255, Math.round(r / 32) * 32);
          const qg = Math.min(255, Math.round(g / 32) * 32);
          const qb = Math.min(255, Math.round(b / 32) * 32);

          const hex = `#${qr.toString(16).padStart(2, '0')}${qg.toString(16).padStart(2, '0')}${qb.toString(16).padStart(2, '0')}`.toUpperCase();
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        const sorted = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([hex]) => hex);

        resolve(sorted.slice(0, 5));
      } catch {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = imageSrc;
  });
}
