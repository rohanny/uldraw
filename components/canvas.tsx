"use client";

import { useRef, useState, useEffect } from "react";
import Dock, { DockItemData } from "./dock";
import { Brush, Pencil, Trash2, Eraser, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import Picker from "./picker";
import Profile from "./profile";
import BottomMenu from "./menu";
import GuestNameDialog from "./guest-name-dialog";
import ShareDialog from "./share-dialog";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

type Tool = "brush" | "pencil" | "eraser";

const COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#eab308"];
const BRUSH_SIZES = [5, 10, 15, 20];
const PENCIL_SIZES = [1, 2, 3, 4];
const ERASER_SIZES = [10, 20, 30, 40];

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [pencilSize, setPencilSize] = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Wait until mounted to show theme toggle to avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  
  const isDark = mounted && (theme === "dark" || (theme === "system" && systemTheme === "dark"));
  // Adapt default color based on theme instead of always black
  useEffect(() => {
    if (color === "#000000" && isDark) setColor("#ffffff");
    else if (color === "#ffffff" && !isDark) setColor("#000000");
  }, [isDark]);
  
  type Point = { x: number; y: number };
  type Stroke = {
    points: Point[];
    color: string;
    size: number;
    tool: Tool;
  };
  
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [history, setHistory] = useState<Stroke[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [roomId, setRoomId] = useState("global");
  const channelRef = useRef<RealtimeChannel | null>(null);

  type CursorData = { id: string; name: string; avatarSeed?: string; x: number; y: number; color: string; lastUpdated: number };
  const [cursors, setCursors] = useState<Record<string, CursorData>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        if (session.user.is_anonymous && !session.user.user_metadata?.full_name) {
          setShowGuestDialog(true);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setRoomId(searchParams.get("room") || "global");
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;
    
    const channel = supabase.channel(`canvas-${roomId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on(
        "broadcast",
        { event: "sync_strokes" },
        (payload) => {
          setStrokes(payload.payload.strokes);
        }
      )
      .on(
        "broadcast",
        { event: "clear_canvas" },
        () => {
          setStrokes([]);
        }
      )
      .on(
        "broadcast",
        { event: "cursor_move" },
        (payload) => {
          setCursors(prev => ({ 
            ...prev, 
            [payload.payload.id]: {
              ...payload.payload,
              lastUpdated: Date.now()
            } 
          }));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const broadcastStrokes = (newStrokes: Stroke[]) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "sync_strokes",
        payload: { strokes: newStrokes },
      });
    }
  };

  const broadcastClear = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "clear_canvas",
      });
    }
  };

  // Clean up stale cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors(prev => {
        const next = { ...prev };
        let changed = false;
        for (const id in next) {
          if (now - next[id].lastUpdated > 5000) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas to full window size with high DPI support
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        // Set actual size in memory (scaled to account for DPI)
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Set display size (css pixels)
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Scale all drawing operations by the dpr
          ctx.scale(dpr, dpr);
          
          // Enable smoothing for better line quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
        }
        
        setWindowSize({ width: rect.width, height: rect.height });
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Handle keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is currently drawing
      if (isDrawing) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          // Redo
          e.preventDefault();
          if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1;
            setHistoryStep(nextStep);
            setStrokes(history[nextStep]);
          }
        } else {
          // Undo
          e.preventDefault();
          if (historyStep > 0) {
            const prevStep = historyStep - 1;
            setHistoryStep(prevStep);
            setStrokes(history[prevStep]);
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        // Redo
        e.preventDefault();
        if (historyStep < history.length - 1) {
          const nextStep = historyStep + 1;
          setHistoryStep(nextStep);
          setStrokes(history[nextStep]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyStep, isDrawing]);

  // Redraw all strokes on canvas whenever strokes, currentStroke, or background changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Fill background (adapt to theme)
    ctx.fillStyle = isDark ? "#121212" : "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const drawStroke = (stroke: Stroke) => {
      if (stroke.points.length === 0) return;
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      // Adapt pure black/white strokes to remain visible in the current theme
      let displayColor = stroke.color;
      if (displayColor === "#000000" && isDark) {
        displayColor = "#ffffff";
      } else if (displayColor === "#ffffff" && !isDark) {
        displayColor = "#000000";
      }
      
      ctx.strokeStyle = displayColor;
      ctx.lineWidth = stroke.size;
      ctx.globalAlpha = stroke.tool === "brush" ? 0.8 : 1.0;

      for (let i = 1; i < stroke.points.length; i++) {
        const prev = stroke.points[i - 1];
        const curr = stroke.points[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
      
      // Draw the last point if it's just a dot
      if (stroke.points.length === 1) {
        ctx.lineTo(stroke.points[0].x, stroke.points[0].y);
      } else {
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x, last.y);
      }
      
      ctx.stroke();
    };

    strokes.forEach(drawStroke);
    if (currentStroke) drawStroke(currentStroke);
    
  }, [strokes, currentStroke, isDark, windowSize]);

  const pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    // Handle Case where line is just a point
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const isPointNearStroke = (x: number, y: number, stroke: Stroke) => {
    const eraserRadius = eraserSize / 2;
    const hitRadius = (stroke.size / 2) + eraserRadius;

    // Check if point is near any line segment of the stroke
    for (let i = 1; i < stroke.points.length; i++) {
      const p1 = stroke.points[i - 1];
      const p2 = stroke.points[i];
      const dist = pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
      if (dist <= hitRadius) return true;
    }
    
    // Check dot
    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      const dx = x - p.x;
      const dy = y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) return true;
    }

    return false;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Close pickers if open
    if (showColorPicker || showSizePicker) {
      setShowColorPicker(false);
      setShowSizePicker(false);
      return;
    }
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "eraser") {
      setStrokes((prev) => {
        const next = prev.filter((stroke) => !isPointNearStroke(x, y, stroke));
        if (next.length !== prev.length) {
          broadcastStrokes(next);
        }
        return next;
      });
    } else {
      setCurrentStroke({
        points: [{ x, y }],
        color,
        size: tool === "brush" ? brushSize : pencilSize,
        tool,
      });
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Broadcast cursor position occasionally to save bandwidth, or just send
    if (currentUser && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "cursor_move",
        payload: {
          id: currentUser.id,
          name: currentUser.user_metadata?.full_name || currentUser.email || "Collaborator",
          avatarSeed: currentUser.user_metadata?.avatar_seed || currentUser.user_metadata?.full_name || currentUser.email || "Collaborator",
          x,
          y,
          color,
        },
      });
    }

    if (!isDrawing) return;

    if (tool === "eraser") {
       setStrokes((prev) => {
         const next = prev.filter((stroke) => !isPointNearStroke(x, y, stroke));
         if (next.length !== prev.length) {
           broadcastStrokes(next);
         }
         return next;
       });
    } else if (currentStroke) {
      setCurrentStroke((prev) => prev ? {
        ...prev,
        points: [...prev.points, { x, y }]
      } : null);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (currentStroke) {
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);
      setCurrentStroke(null);
      broadcastStrokes(newStrokes);
      
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(newStrokes);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
    } else if (tool === "eraser") {
      const lastHistoryState = history[historyStep];
      if (strokes.length !== lastHistoryState.length) {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(strokes);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
      }
    }
  };

  const clearCanvas = () => {
    if (strokes.length === 0) return;
    setStrokes([]);
    broadcastClear();
    
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const toggleColorPicker = () => {
    setShowColorPicker(!showColorPicker);
    setShowSizePicker(false);
  };

  const selectColor = (newColor: string) => {
    setColor(newColor);
    setShowColorPicker(false);
  };

  const toggleSizePicker = (selectedTool: Tool) => {
    setTool(selectedTool);
    setShowSizePicker(!showSizePicker);
    setShowColorPicker(false);
  };

  const selectBrushSize = (size: number) => {
    setBrushSize(size);
    setShowSizePicker(false);
  };

  const selectPencilSize = (size: number) => {
    setPencilSize(size);
    setShowSizePicker(false);
  };

  const selectEraserSize = (size: number) => {
    setEraserSize(size);
    setShowSizePicker(false);
  };

  const dockItems: DockItemData[] = [
    {
      icon: <Brush className={`w-5 h-5 ${tool === "brush" ? "text-blue-600" : "text-gray-700 dark:text-gray-300"}`} />,
      label: "Brush",
      onClick: () => toggleSizePicker("brush"),
      className: tool === "brush" ? "ring-2 ring-blue-600" : "",
    },
    {
      icon: <Pencil className={`w-5 h-5 ${tool === "pencil" ? "text-blue-600" : "text-gray-700 dark:text-gray-300"}`} />,
      label: "Pencil",
      onClick: () => toggleSizePicker("pencil"),
      className: tool === "pencil" ? "ring-2 ring-blue-600" : "",
    },
    {
      icon: <Eraser className={`w-5 h-5 ${tool === "eraser" ? "text-blue-600" : "text-gray-700 dark:text-gray-300"}`} />,
      label: "Eraser",
      onClick: () => {
        setTool("eraser");
        setShowColorPicker(false);
        setShowSizePicker(false);
      },
      className: tool === "eraser" ? "ring-2 ring-blue-600" : "",
    },
    {
      icon: (
        <div
          className="w-6 h-6 rounded-full border-2 border-gray-400 dark:border-gray-500"
          style={{ 
            backgroundColor: (color === "#000000" && isDark) ? "#ffffff" :
                             (color === "#ffffff" && !isDark) ? "#000000" :
                             color 
          }}
        />
      ),
      label: "Color",
      onClick: toggleColorPicker,
    },
    {
      icon: <Trash2 className="w-5 h-5 text-red-600" />,
      label: "Clear",
      onClick: clearCanvas,
    },
  ];

  return (
    <div className="fixed inset-0 w-full h-full">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="w-full h-full bg-white dark:bg-[#121212]"
        style={{
          cursor: tool === "eraser"
            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' ${isDark ? "stroke='white'" : "stroke='black'"} stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21'/%3E%3Cpath d='M22 21H7'/%3E%3Cpath d='m5 11 9 9'/%3E%3C/svg%3E") 0 16, auto`
            : "crosshair"
        }}
      />

      {/* Live Cursors layer */}
      {Object.values(cursors).map(cursor => (
        <motion.div
          key={cursor.id}
          className="absolute pointer-events-none flex items-start"
          initial={{ opacity: 0 }}
          animate={{ x: cursor.x, y: cursor.y, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }}
          style={{ left: 0, top: 0, zIndex: 40 }}
        >
          {/* Custom SVG Cursor Arrow */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md -ml-2 -mt-2">
            <path d="M5.65376 21.3111L3.92984 3.73719C3.76611 2.06775 5.56865 0.940428 7.02553 1.80219L21.3629 10.2778C22.75 11.0975 22.5855 13.1678 21.0772 13.8821L15.4216 16.5615C15.0195 16.752 14.6738 17.068 14.4334 17.4646L11.524 22.2618C10.7067 23.6094 8.65064 23.4796 8.01902 22.0396L5.65376 21.3111Z" 
              fill={
                (cursor.color === "#000000" && isDark) ? "#ffffff" :
                (cursor.color === "#ffffff" && !isDark) ? "#000000" :
                cursor.color
              } 
              stroke={isDark ? "black" : "white"} 
              strokeWidth="2" 
              strokeLinejoin="round"
            />
          </svg>
          
          <div className="flex items-center gap-2 mt-4 ml-1">
            <div className="h-6 w-6 rounded-full bg-indigo-500 border border-white dark:border-zinc-800 shadow-md flex items-center justify-center overflow-hidden shrink-0">
              <img 
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${cursor.avatarSeed || cursor.name}`}
                alt="Avatar" 
                className="w-full h-full object-cover bg-indigo-100 dark:bg-zinc-700"
              />
            </div>
            <div 
              className="px-2 py-1 bg-white dark:bg-zinc-800 rounded-md shadow-md text-xs font-medium border border-zinc-200 dark:border-zinc-700 whitespace-nowrap text-zinc-900 dark:text-zinc-100"
            >
              {cursor.name}
            </div>
          </div>
        </motion.div>
      ))}

      <GuestNameDialog 
        isOpen={showGuestDialog} 
        canClose={Boolean(currentUser?.user_metadata?.full_name)}
        onClose={() => setShowGuestDialog(false)}
        initialName={currentUser?.user_metadata?.full_name}
        initialAvatarSeed={currentUser?.user_metadata?.avatar_seed}
        onComplete={(name, avatarSeed) => {
          setShowGuestDialog(false);
          setCurrentUser((prev: any) => prev ? {
            ...prev,
            user_metadata: { ...prev.user_metadata, full_name: name, avatar_seed: avatarSeed }
          } : prev);
        }} 
      />

      {/* Top right Avatar Profile */}
      <Profile 
        collaborators={Object.values(cursors).map(c => ({ id: c.id, name: c.name, avatarSeed: c.avatarSeed }))} 
        onShareClick={() => setShowShareDialog(true)}
      />
      
      <ShareDialog 
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        currentRoomId={roomId}
      />
      
      <AnimatePresence>
        {showColorPicker && (
          <Picker
            items={COLORS.map(c => {
              if (c === "#000000" && isDark) return "#ffffff";
              if (c === "#ffffff" && !isDark) return "#000000";
              return c;
            })}
            selectedValue={
              (color === "#000000" && isDark) ? "#ffffff" :
              (color === "#ffffff" && !isDark) ? "#000000" :
              color
            }
            onSelect={(selectedDisplayColor: string) => {
              // Map back to internal storage color to keep drawing logic uniform relative to the theme
              if (selectedDisplayColor === "#ffffff" && isDark) selectColor("#000000");
              else if (selectedDisplayColor === "#000000" && !isDark) selectColor("#ffffff");
              else selectColor(selectedDisplayColor);
            }}
            isColor
          />
        )}
        
        {showSizePicker && (
          <Picker
            items={tool === "brush" ? BRUSH_SIZES : tool === "pencil" ? PENCIL_SIZES : ERASER_SIZES}
            selectedValue={tool === "brush" ? brushSize : tool === "pencil" ? pencilSize : eraserSize}
            onSelect={(size) => {
              if (tool === "brush") selectBrushSize(size);
              else if (tool === "pencil") selectPencilSize(size);
              else selectEraserSize(size);
            }}
          />
        )}
      </AnimatePresence>

      <Dock items={dockItems} baseItemSize={40} magnification={56} panelHeight={56} />
      
      <BottomMenu 
        user={currentUser} 
        onEditProfile={() => setShowGuestDialog(true)}
      />
    </div>
  );
}
