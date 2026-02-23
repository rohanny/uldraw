import { Stroke } from "./types";
import { getBoundingBox } from "./utils";

export const createExportHandler = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  strokes: Stroke[],
  isDark: boolean
) => {
  return (type: 'png' | 'jpg' | 'svg', fileName: string, includeBackground: boolean, scale: number = 1) => {
    if (strokes.length === 0) return;

    // Calculate union bounding box for all strokes
    const boxes = strokes.map(s => {
      // For each stroke, get its local bounding box
      const box = getBoundingBox(s.points, s.size / 2);

      // If the stroke is rotated, we need to account for the rotated points
      // However, getBoundingBox is usually called on already-transformed points for visual accuracy.
      return box;
    });

    let minX = Math.min(...boxes.map(b => b.minX));
    let minY = Math.min(...boxes.map(b => b.minY));
    let maxX = Math.max(...boxes.map(b => b.maxX));
    let maxY = Math.max(...boxes.map(b => b.maxY));

    // Add padding
    const padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const exportWidth = maxX - minX;
    const exportHeight = maxY - minY;

    if (type === 'png' || type === 'jpg') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = exportWidth * scale;
      tempCanvas.height = exportHeight * scale;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Scale context to match the chosen export scale
      tempCtx.scale(scale, scale);

      // Translate so the bounding box's top-left is at (0,0)
      tempCtx.translate(-minX, -minY);

      // Fill background if required or if format is JPG
      if (includeBackground || type === 'jpg') {
        tempCtx.fillStyle = isDark ? "#121212" : "#ffffff";
        tempCtx.fillRect(minX, minY, exportWidth, exportHeight);
      }

      // Draw strokes
      tempCtx.lineCap = "round";
      tempCtx.lineJoin = "round";

      strokes.forEach((stroke) => {
        if (stroke.points.length === 0) return;

        tempCtx.save();

        if (stroke.angle && stroke.centerX !== undefined && stroke.centerY !== undefined) {
          tempCtx.translate(stroke.centerX, stroke.centerY);
          tempCtx.rotate(stroke.angle);
          tempCtx.translate(-stroke.centerX, -stroke.centerY);
        }

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
        tempCtx.restore();
      });

      const mimeType = type === 'png' ? 'image/png' : 'image/jpeg';
      const quality = type === 'jpg' ? 0.95 : undefined;

      tempCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${fileName}.${type}`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, mimeType, quality);

    } else if (type === 'svg') {
      const bgColor = isDark ? "#121212" : "#ffffff";

      let svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${exportWidth}" height="${exportHeight}" viewBox="${minX} ${minY} ${exportWidth} ${exportHeight}">\n`;

      if (includeBackground) {
        svgContent += `  <rect x="${minX}" y="${minY}" width="${exportWidth}" height="${exportHeight}" fill="${bgColor}"/>\n`;
      }

      strokes.forEach((stroke) => {
        if (stroke.points.length === 0) return;

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

        let transform = "";
        if (stroke.angle && stroke.centerX !== undefined && stroke.centerY !== undefined) {
          transform = ` transform="rotate(${stroke.angle * 180 / Math.PI} ${stroke.centerX} ${stroke.centerY})"`;
        }

        svgContent += `  <path d="${pathData}" stroke="${displayColor}" stroke-width="${stroke.size}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"${transform}/>\n`;
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
