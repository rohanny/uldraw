import { Stroke } from "./types";

export const createExportHandler = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  strokes: Stroke[],
  isDark: boolean
) => {
  return (type: 'png' | 'jpg' | 'svg', fileName: string, includeBackground: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (type === 'png') {
      if (!includeBackground) {
        // Create temporary canvas for transparent export
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        
        const dpr = window.devicePixelRatio || 1;
        tempCtx.scale(dpr, dpr);
        
        // Draw strokes without background
        tempCtx.lineCap = "round";
        tempCtx.lineJoin = "round";
        
        strokes.forEach((stroke) => {
          if (stroke.points.length === 0) return;
          
          tempCtx.beginPath();
          tempCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
          
          let displayColor = stroke.color;
          if (displayColor === "#000000" && isDark) displayColor = "#ffffff";
          else if (displayColor === "#ffffff" && !isDark) displayColor = "#000000";
          
          tempCtx.strokeStyle = displayColor;
          tempCtx.lineWidth = stroke.size;
          tempCtx.globalAlpha = stroke.tool === "brush" ? 0.8 : 1.0;

          for (let i = 1; i < stroke.points.length; i++) {
            const prev = stroke.points[i - 1];
            const curr = stroke.points[i];
            const midX = (prev.x + curr.x) / 2;
            const midY = (prev.y + curr.y) / 2;
            tempCtx.quadraticCurveTo(prev.x, prev.y, midX, midY);
          }
          
          if (stroke.points.length === 1) {
            tempCtx.lineTo(stroke.points[0].x, stroke.points[0].y);
          } else {
            const last = stroke.points[stroke.points.length - 1];
            tempCtx.lineTo(last.x, last.y);
          }
          
          tempCtx.stroke();
          tempCtx.globalAlpha = 1.0;
        });
        
        tempCanvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${fileName}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }, 'image/png');
      } else {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${fileName}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }, 'image/png');
      }
    } else if (type === 'jpg') {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${fileName}.jpg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.95);
    } else if (type === 'svg') {
      const rect = canvas.getBoundingClientRect();
      const bgColor = isDark ? "#121212" : "#ffffff";
      
      let svgContent = `<?xml version="1.0" encoding="UTF-8"?>\\n`;
      svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}" viewBox="0 0 ${rect.width} ${rect.height}">\\n`;
      if (includeBackground) {
        svgContent += `  <rect width="100%" height="100%" fill="${bgColor}"/>\\n`;
      }
      
      strokes.forEach((stroke) => {
        if (stroke.points.length === 0) return;
        
        // Adapt color for theme
        let displayColor = stroke.color;
        if (displayColor === "#000000" && isDark) {
          displayColor = "#ffffff";
        } else if (displayColor === "#ffffff" && !isDark) {
          displayColor = "#000000";
        }
        
        const opacity = stroke.tool === "brush" ? 0.8 : 1.0;
        
        let pathData = `M ${stroke.points[0].x} ${stroke.points[0].y}`;
        
        for (let i = 1; i < stroke.points.length; i++) {
          const prev = stroke.points[i - 1];
          const curr = stroke.points[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          pathData += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
        }
        
        if (stroke.points.length > 1) {
          const last = stroke.points[stroke.points.length - 1];
          pathData += ` L ${last.x} ${last.y}`;
        }
        
        svgContent += `  <path d="${pathData}" stroke="${displayColor}" stroke-width="${stroke.size}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>\\n`;
      });
      
      svgContent += `</svg>`;
      
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${fileName}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  };
};
