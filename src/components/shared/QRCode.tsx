import { useEffect, useRef } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
}

export default function QRCode({ value, size = 128 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple QR-like pattern generator (for visual representation)
    // In production, you'd use a proper QR library like qrcode
    const cellSize = Math.floor(size / 25);
    const padding = Math.floor((size - cellSize * 21) / 2);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#000000';
    
    // Generate a simple deterministic pattern based on the value
    const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Draw finder patterns (corners)
    const drawFinderPattern = (x: number, y: number) => {
      // Outer square
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (i === 0 || i === 6 || j === 0 || j === 6 || 
              (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
            ctx.fillRect(
              padding + (x + i) * cellSize,
              padding + (y + j) * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      }
    };

    drawFinderPattern(0, 0);
    drawFinderPattern(14, 0);
    drawFinderPattern(0, 14);

    // Draw data pattern (pseudo-random based on value)
    for (let i = 0; i < 21; i++) {
      for (let j = 0; j < 21; j++) {
        // Skip finder patterns
        if ((i < 8 && j < 8) || (i >= 13 && j < 8) || (i < 8 && j >= 13)) continue;
        
        const shouldFill = ((hash * (i + 1) * (j + 1)) % 3) === 0;
        if (shouldFill) {
          ctx.fillRect(
            padding + i * cellSize,
            padding + j * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="border rounded-lg"
      title={value}
    />
  );
}
