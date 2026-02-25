"use client";

import { useRef, useState, useEffect } from "react";
import Dock, { DockItemData } from "../dock";
import { Brush, Pencil, Trash2, Eraser, MousePointer2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Picker from "../picker";
import Profile from "../profile";
import BottomMenu from "../menu";
import GuestNameDialog from "../guest";
import ShareDialog from "../share";
import ExportDialog from "../export";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useAvatarStore } from "@/lib/store";
import { Tool, Point, Stroke, CursorData } from "./types";
import { COLORS, BRUSH_SIZES, PENCIL_SIZES, ERASER_SIZES } from "./constants";
import { pointToLineDistance, isPointNearStroke, getBoundingBox, isPointInBox, distanceToPoint, applyTransform, doBoxesIntersect, BoundingBox, rotatePoint } from "./utils";
import { createExportHandler } from "./exportutils";
import { ADJECTIVES, NOUNS } from "@/assets/names";

interface DrawingCanvasProps {
  mode?: "local" | "global";
}

export default function DrawingCanvas({ mode = "local" }: DrawingCanvasProps) {
  const router = useRouter();
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
  
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const strokesRef = useRef<Stroke[]>([]);
  
  const [history, setHistory] = useState<Stroke[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
  const [marquee, setMarquee] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);
  const [transformState, setTransformState] = useState<{ type: "move" | "resize" | "rotate", handle?: string, startX: number, startY: number, initialStrokes: Stroke[] } | null>(null);
  const [hoverHandle, setHoverHandle] = useState<string | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [roomId, setRoomId] = useState(mode === "local" ? "local" : "global");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [showPanIndicator, setShowPanIndicator] = useState(false);
  const panTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showPanHint, setShowPanHint] = useState(false);
  const [hasSeenPanHint, setHasSeenPanHint] = useState(false);

  useEffect(() => { 
    strokesRef.current = strokes;
    if (!isLoaded) return;

    if (strokes.length > 0) {
      localStorage.setItem(`uldraw-strokes-${roomId}`, JSON.stringify(strokes));
    } else {
      localStorage.removeItem(`uldraw-strokes-${roomId}`);
    }
  }, [strokes, roomId, isLoaded]);

  const spacePressRef = useRef({ count: 0, lastTime: 0 });

  // Check if user has seen the pan hint before
  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("uldraw-pan-hint-seen");
      setHasSeenPanHint(seen === "true");
    }
  }, []);

  // Handle Space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (e.repeat) return; // Ignore hold-down repetitions for triple-press count
        
        const now = Date.now();
        if (now - spacePressRef.current.lastTime < 500) {
          spacePressRef.current.count += 1;
        } else {
          spacePressRef.current.count = 1;
        }
        spacePressRef.current.lastTime = now;

        if (spacePressRef.current.count === 3) {
          setPan({ x: 0, y: 0 });
          spacePressRef.current.count = 0; // Reset after trigger
          
          // Show indicator that we reset
          setShowPanIndicator(true);
          if (panTimeoutRef.current) clearTimeout(panTimeoutRef.current);
          panTimeoutRef.current = setTimeout(() => setShowPanIndicator(false), 2000);
          return;
        }

        if (!isSpacePressed) {
          setIsSpacePressed(true);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed]);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const [cursors, setCursors] = useState<Record<string, CursorData>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  const { getAvatarSeed } = useAvatarStore();
  
  // Persistent guest ID for reliability
  const [guestId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = sessionStorage.getItem("uldraw-guest-id");
      if (!id) {
        id = `guest-${crypto.randomUUID()}`;
        sessionStorage.setItem("uldraw-guest-id", id);
      }
      return id;
    }
    return "";
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Check if seed exists in store
        const store = useAvatarStore.getState();
        const existingSeed = store.avatarSeeds[session.user.id];
        
        let avatarSeed;
        if (existingSeed) {
          avatarSeed = existingSeed;
        } else {
          // Generate new seed - use timestamp for anonymous users
          avatarSeed = store.generateAvatarSeed(session.user.id, session.user.is_anonymous);
        }
        
        // Update user object with avatar seed from store
        const userWithAvatar = {
          ...session.user,
          user_metadata: {
            ...session.user.user_metadata,
            avatar_seed: avatarSeed,
          },
        };
        if (session.user.is_anonymous && !session.user.user_metadata?.full_name) {
          const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
          const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
          
          const randomName = `${adj} ${noun}`;
          const updatedUser = {
            ...userWithAvatar,
            user_metadata: {
              ...userWithAvatar.user_metadata,
              full_name: randomName,
            }
          };
          
          setCurrentUser(updatedUser);
          
          // Update supabase so the name persists in the session
          supabase.auth.updateUser({
            data: { full_name: randomName, avatar_seed: avatarSeed }
          }).catch(console.error);
        } else {
          setCurrentUser(userWithAvatar);
        }
      }
    });
  }, [getAvatarSeed]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (mode === "local") {
        // Local mode: use local storage only
        setRoomId("local");
      } else {
        // Global mode: support room parameter
        const searchParams = new URLSearchParams(window.location.search);
        const room = searchParams.get("room") || "global";
        setRoomId(room);
      }
      
      const currentRoom = mode === "local" ? "local" : (new URLSearchParams(window.location.search).get("room") || "global");
      const savedStrokes = localStorage.getItem(`uldraw-strokes-${currentRoom}`);
      if (savedStrokes) {
        try {
          const parsed = JSON.parse(savedStrokes);
          setStrokes(parsed);
          setHistory([parsed]);
        } catch (e) {
          console.error("Failed to parse saved strokes");
        }
      }
      setIsLoaded(true);
    }
  }, [mode]);

  useEffect(() => {
    // Only subscribe to realtime in global mode
    if (mode === "local") {
      return;
    }
    
    // Always use a room (default to "global" if none specified)
    const effectiveRoomId = roomId || "global";
    
    const channel = supabase.channel(`canvas-${effectiveRoomId}`, {
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
        { event: "sync_strokes" },
        (payload) => {
          setStrokes(payload.payload.strokes);
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
      .on(
        "broadcast",
        { event: "request_sync" },
        () => {
          // If we have strokes, share them with the new peer
          if (strokesRef.current.length > 0) {
            channel.send({
              type: "broadcast",
              event: "sync_strokes",
              payload: { strokes: strokesRef.current },
            });
          }
        }
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Request sync from existing peers
          channel.send({
            type: "broadcast",
            event: "request_sync",
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, mode]);

  const broadcastStrokes = (newStrokes: Stroke[]) => {
    if (mode === "local") return; // Don't broadcast in local mode
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "sync_strokes",
        payload: { strokes: newStrokes },
      });
    }
  };

  // Export function
  const handleExport = createExportHandler(canvasRef, strokes, isDark);

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

    ctx.save();
    ctx.translate(pan.x, pan.y);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const drawStroke = (stroke: Stroke) => {
      if (stroke.points.length === 0) return;
      
      ctx.save();
      
      if (stroke.angle && stroke.centerX !== undefined && stroke.centerY !== undefined) {
        ctx.translate(stroke.centerX, stroke.centerY);
        ctx.rotate(stroke.angle);
        ctx.translate(-stroke.centerX, -stroke.centerY);
      }
      
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
      ctx.restore();
    };

    strokes.forEach(drawStroke);
    if (currentStroke) drawStroke(currentStroke);
    
    // Draw bounding box if strokes are selected
    if (selectedStrokeIds.length > 0) {
      const selectedStrokes = strokes.filter(s => selectedStrokeIds.includes(s.id));
      if (selectedStrokes.length > 0) {
        // Find comprehensive bounding box for all selected items
        // Currently we only support single-item bounding-box rendering with rotation,
        // grouped items will be bounded individually for math
        const boxes = selectedStrokes.map(s => getBoundingBox(s.points, 10 + s.size / 2));
        const finalBox = {
          minX: Math.min(...boxes.map(b => b.minX)),
          minY: Math.min(...boxes.map(b => b.minY)),
          maxX: Math.max(...boxes.map(b => b.maxX)),
          maxY: Math.max(...boxes.map(b => b.maxY)),
          get width() { return this.maxX - this.minX; },
          get height() { return this.maxY - this.minY; },
          get centerX() { return (this.minX + this.maxX) / 2; },
          get centerY() { return (this.minY + this.maxY) / 2; },
        };

        // If a single item is selected, we can apply its rotation to the bounding box visually
        if (selectedStrokes.length === 1) {
          const s = selectedStrokes[0];
          if (s.angle && s.centerX !== undefined && s.centerY !== undefined) {
            ctx.save();
            ctx.translate(s.centerX, s.centerY);
            ctx.rotate(s.angle);
            ctx.translate(-s.centerX, -s.centerY);
          }
        }
        
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(finalBox.minX, finalBox.minY, finalBox.width, finalBox.height);
        ctx.setLineDash([]);
        
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 2;
        
        const handleSize = 8;
        const halfSize = handleSize / 2;
        
        const drawHandle = (x: number, y: number) => {
          ctx.fillRect(x - halfSize, y - halfSize, handleSize, handleSize);
          ctx.strokeRect(x - halfSize, y - halfSize, handleSize, handleSize);
        };
        
        drawHandle(finalBox.minX, finalBox.minY); // TL
        drawHandle(finalBox.maxX, finalBox.minY); // TR
        drawHandle(finalBox.minX, finalBox.maxY); // BL
        drawHandle(finalBox.maxX, finalBox.maxY); // BR
        
        // Rotation handle
        const rotHandleY = finalBox.minY - 24;
        ctx.beginPath();
        ctx.moveTo(finalBox.centerX, finalBox.minY);
        ctx.lineTo(finalBox.centerX, rotHandleY + halfSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(finalBox.centerX, rotHandleY, halfSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (selectedStrokes.length === 1) {
          ctx.restore();
        }
      }
    }

    if (marquee) {
       const w = marquee.currentX - marquee.startX;
       const h = marquee.currentY - marquee.startY;
       ctx.fillStyle = "rgba(168, 85, 247, 0.1)"; // purple transparent
       ctx.strokeStyle = "rgba(168, 85, 247, 0.5)"; // purple semi transparent
       ctx.lineWidth = 1;
       ctx.setLineDash([]);
       ctx.fillRect(marquee.startX, marquee.startY, w, h);
       ctx.strokeRect(marquee.startX, marquee.startY, w, h);
    }
    
    // Draw other users' in-progress strokes
        Object.values(cursors).forEach(cursor => {
      if (cursor.id !== currentUser?.id && cursor.currentStroke) {
        drawStroke(cursor.currentStroke);
      }
    });

    ctx.restore();
    
  }, [strokes, currentStroke, isDark, windowSize, cursors, currentUser, pan]);

  const [hasUserDrawn, setHasUserDrawn] = useState(false);

  useEffect(() => {
    if (mode === "global" && (currentUser || guestId) && strokes.length > 0 && !hasUserDrawn) {
      const currentId = currentUser?.id || guestId;
      if (strokes.some(s => s.userId === currentId)) {
        setHasUserDrawn(true);
      }
    }
  }, [strokes, currentUser, guestId, mode, hasUserDrawn]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only allow left-click drawing
    if (e.button !== 0) return;

    // Close pickers if open
    if (showColorPicker || showSizePicker) {
      setShowColorPicker(false);
      setShowSizePicker(false);
      return;
    }
    
    // Mark that the user has interacted so we can hide hints
    setHasUserDrawn(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Virtual coordinates (account for pan)
    const vx = x - pan.x;
    const vy = y - pan.y;

    if (isSpacePressed) {
      setIsPanning(true);
      return;
    }
    
    setIsDrawing(true);

    if (tool === "select") {
      let hitHandle: string | undefined;
      let hitStrokeId: string | undefined;
      let clickedStroke: Stroke | undefined;
      
      if (selectedStrokeIds.length > 0) {
        const selectedStrokes = strokes.filter((s) => selectedStrokeIds.includes(s.id));
        if (selectedStrokes.length > 0) {
          const boxes = selectedStrokes.map(s => getBoundingBox(s.points, 10 + s.size / 2));
          const finalBox = {
            minX: Math.min(...boxes.map(b => b.minX)),
            minY: Math.min(...boxes.map(b => b.minY)),
            maxX: Math.max(...boxes.map(b => b.maxX)),
            maxY: Math.max(...boxes.map(b => b.maxY)),
            get width() { return this.maxX - this.minX; },
            get height() { return this.maxY - this.minY; },
            get centerX() { return (this.minX + this.maxX) / 2; },
            get centerY() { return (this.minY + this.maxY) / 2; },
          };
          
          const handleSize = 12; // slightly larger hit area
          const halfSize = handleSize / 2;
          
          const rotHandleY = finalBox.minY - 24;
          
          let pointerX = vx;
          let pointerY = vy;
          if (selectedStrokeIds.length === 1 && selectedStrokes[0].angle && selectedStrokes[0].centerX !== undefined && selectedStrokes[0].centerY !== undefined) {
             const s = selectedStrokes[0];
             const rotated = rotatePoint(vx, vy, s.centerX!, s.centerY!, -(s.angle || 0));
             pointerX = rotated.x;
             pointerY = rotated.y;
          }
          
          if (selectedStrokeIds.length === 1 && distanceToPoint(pointerX, pointerY, finalBox.centerX, rotHandleY) <= halfSize + 4) hitHandle = "rotate";
          else if (isPointInBox(pointerX, pointerY, { minX: finalBox.minX - halfSize, minY: finalBox.minY - halfSize, maxX: finalBox.minX + halfSize, maxY: finalBox.minY + halfSize, width: handleSize, height: handleSize, centerX: finalBox.minX, centerY: finalBox.minY })) hitHandle = "TL";
          else if (isPointInBox(pointerX, pointerY, { minX: finalBox.maxX - halfSize, minY: finalBox.minY - halfSize, maxX: finalBox.maxX + halfSize, maxY: finalBox.minY + halfSize, width: handleSize, height: handleSize, centerX: finalBox.maxX, centerY: finalBox.minY })) hitHandle = "TR";
          else if (isPointInBox(pointerX, pointerY, { minX: finalBox.minX - halfSize, minY: finalBox.maxY - halfSize, maxX: finalBox.minX + halfSize, maxY: finalBox.minY + halfSize, width: handleSize, height: handleSize, centerX: finalBox.minX, centerY: finalBox.maxY })) hitHandle = "BL";
          else if (isPointInBox(pointerX, pointerY, { minX: finalBox.maxX - halfSize, minY: finalBox.maxY - halfSize, maxX: finalBox.maxX + halfSize, maxY: finalBox.maxY + halfSize, width: handleSize, height: handleSize, centerX: finalBox.maxX, centerY: finalBox.maxY })) hitHandle = "BR";
          else if (isPointInBox(pointerX, pointerY, finalBox)) hitHandle = "move";
          
          if (hitHandle) {
             setTransformState({ type: hitHandle === "move" ? "move" : hitHandle === "rotate" ? "rotate" : "resize", handle: hitHandle, startX: vx, startY: vy, initialStrokes: JSON.parse(JSON.stringify(selectedStrokes)) });
             return;
          }
        }
      }
      
      // Check if we hit a stroke
      for (let i = strokes.length - 1; i >= 0; i--) {
        const stroke = strokes[i];
        
        // In global mode, only allow selecting our own strokes
        if (mode === "global" && stroke.userId !== currentUser?.id) continue;

        let pX = vx;
        let pY = vy;
        if (stroke.angle && stroke.centerX !== undefined && stroke.centerY !== undefined) {
           const rotated = rotatePoint(vx, vy, stroke.centerX!, stroke.centerY!, -(stroke.angle || 0));
           pX = rotated.x;
           pY = rotated.y;
        }

        if (isPointNearStroke(pX, pY, stroke, 10)) {
           hitStrokeId = stroke.id;
           clickedStroke = stroke;
           break;
        }
      }
      
      setSelectedStrokeIds(hitStrokeId ? [hitStrokeId] : []);
      if (hitStrokeId && clickedStroke) {
        setTransformState({ type: "move", handle: "move", startX: vx, startY: vy, initialStrokes: JSON.parse(JSON.stringify([clickedStroke])) });
      } else {
        setTransformState(null);
        setMarquee({ startX: vx, startY: vy, currentX: vx, currentY: vy });
      }
      return;
    }

    if (tool === "eraser") {
      setStrokes((prev) => {
        const next = prev.filter((stroke) => {
          if (!isPointNearStroke(vx, vy, stroke, eraserSize)) return true;
          // If near, only allow removal if it's our own stroke in global mode
          if (mode === "global") {
            return stroke.userId !== currentUser?.id;
          }
          return false; // Remove in local mode
        });
        if (next.length !== prev.length) {
          broadcastStrokes(next);
        }
        return next;
      });
    } else {
      setCurrentStroke({
        id: crypto.randomUUID(),
        points: [{ x: vx, y: vy }],
        color,
        size: tool === "brush" ? brushSize : pencilSize,
        tool,
        userId: currentUser?.id || guestId,
      });
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Virtual coordinates (account for pan)
    const vx = x - pan.x;
    const vy = y - pan.y;

    if (isPanning) {
      const dx = e.movementX;
      const dy = e.movementY;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      
      // Show hint on first pan only
      if (!hasSeenPanHint && !showPanHint) {
        setShowPanHint(true);
        setHasSeenPanHint(true);
        localStorage.setItem("uldraw-pan-hint-seen", "true");
        // Auto-hide hint after 10 seconds
        setTimeout(() => setShowPanHint(false), 10000);
      }
      
      setShowPanIndicator(true);
      if (panTimeoutRef.current) clearTimeout(panTimeoutRef.current);
      panTimeoutRef.current = setTimeout(() => setShowPanIndicator(false), 3000);
      return;
    }

    // Broadcast cursor position occasionally to save bandwidth, or just send
    if (currentUser && channelRef.current) {
      let activeStroke: Stroke | undefined;
      
      if (isDrawing && tool !== "eraser" && tool !== "select" && !isPanning) {
        activeStroke = currentStroke ? {
          ...currentStroke,
          points: [...currentStroke.points, { x: vx, y: vy }]
        } : {
          id: crypto.randomUUID(),
          points: [{ x: vx, y: vy }],
          color,
          size: tool === "brush" ? brushSize : pencilSize,
          tool,
          userId: currentUser?.id || guestId,
        };
      }

      if (mode === "global" && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "cursor_move",
          payload: {
            id: currentUser?.id || guestId,
            name: currentUser?.user_metadata?.full_name || currentUser?.email || "Collaborator",
            avatarSeed: currentUser?.user_metadata?.avatar_seed || currentUser?.user_metadata?.full_name || currentUser?.email || "Collaborator",
            x: vx,
            y: vy,
            color,
            currentStroke: activeStroke
          },
        });
      }
    }

    if (!isDrawing) {
       if (tool === "select" && selectedStrokeIds.length > 0) {
          const selectedStrokes = strokes.filter(s => selectedStrokeIds.includes(s.id));
          if (selectedStrokes.length > 0) {
            const boxes = selectedStrokes.map(s => getBoundingBox(s.points, 10 + s.size / 2));
            const finalBox = {
              minX: Math.min(...boxes.map(b => b.minX)),
              minY: Math.min(...boxes.map(b => b.minY)),
              maxX: Math.max(...boxes.map(b => b.maxX)),
              maxY: Math.max(...boxes.map(b => b.maxY)),
              get width() { return this.maxX - this.minX; },
              get height() { return this.maxY - this.minY; },
              get centerX() { return (this.minX + this.maxX) / 2; },
              get centerY() { return (this.minY + this.maxY) / 2; },
            };
            const rotHandleY = finalBox.minY - 24;
            
            let pointerX = vx;
            let pointerY = vy;
            if (selectedStrokeIds.length === 1 && selectedStrokes[0].angle && selectedStrokes[0].centerX !== undefined && selectedStrokes[0].centerY !== undefined) {
               const s = selectedStrokes[0];
               const rotated = rotatePoint(vx, vy, s.centerX!, s.centerY!, -(s.angle || 0));
               pointerX = rotated.x;
               pointerY = rotated.y;
            }

            if (selectedStrokeIds.length === 1 && distanceToPoint(pointerX, pointerY, finalBox.centerX, rotHandleY) <= 10) {
               if (hoverHandle !== "rotate") setHoverHandle("rotate");
            } else {
               if (hoverHandle !== null) setHoverHandle(null);
            }
          } else {
            if (hoverHandle !== null) setHoverHandle(null);
          }
       } else {
          if (hoverHandle !== null) setHoverHandle(null);
       }
       return;
    }

    if (marquee) {
       setMarquee(prev => prev ? { ...prev, currentX: vx, currentY: vy } : null);
       return;
    }

    if (tool === "select" && transformState && selectedStrokeIds.length > 0) {
       setStrokes((prev) => prev.map((stroke) => {
         if (selectedStrokeIds.includes(stroke.id)) {
            const initialStroke = transformState.initialStrokes.find(s => s.id === stroke.id);
            if (!initialStroke) return stroke;
            
            if (transformState.handle === "rotate" && selectedStrokeIds.length === 1) {
              const startAngle = Math.atan2(transformState.startY - initialStroke.centerY!, transformState.startX - initialStroke.centerX!);
              const endAngle = Math.atan2(vy - initialStroke.centerY!, vx - initialStroke.centerX!);
              const angleDelta = endAngle - startAngle;
              return { ...stroke, angle: (initialStroke.angle || 0) + angleDelta };
            }

            const boxes = transformState.initialStrokes.map(s => getBoundingBox(s.points, 10 + s.size / 2));
            const groupBox = {
              minX: Math.min(...boxes.map(b => b.minX)),
              minY: Math.min(...boxes.map(b => b.minY)),
              maxX: Math.max(...boxes.map(b => b.maxX)),
              maxY: Math.max(...boxes.map(b => b.maxY)),
              get width() { return this.maxX - this.minX; },
              get height() { return this.maxY - this.minY; },
              get centerX() { return (this.minX + this.maxX) / 2; },
              get centerY() { return (this.minY + this.maxY) / 2; },
            };

            const transformedPoints = applyTransform(initialStroke.points, groupBox, transformState.startX, transformState.startY, vx, vy, transformState.handle || "move");
            
            let newCx = initialStroke.centerX;
            let newCy = initialStroke.centerY;
            if (newCx !== undefined && newCy !== undefined && transformState.handle !== "move") {
                const centerTransformed = applyTransform([{x: newCx, y: newCy}], groupBox, transformState.startX, transformState.startY, vx, vy, transformState.handle || "move");
                newCx = centerTransformed[0].x;
                newCy = centerTransformed[0].y;
            } else if (newCx !== undefined && newCy !== undefined && transformState.handle === "move") {
                newCx += vx - transformState.startX;
                newCy += vy - transformState.startY;
            }

            return { ...stroke, points: transformedPoints, centerX: newCx, centerY: newCy };
         }
         return stroke;
       }));
       return;
    }

    if (tool === "eraser") {
       setStrokes((prev) => {
         const next = prev.filter((stroke) => {
           if (!isPointNearStroke(vx, vy, stroke, eraserSize)) return true;
           if (mode === "global") {
             return stroke.userId !== (currentUser?.id || guestId);
           }
           return false;
         });
         if (next.length !== prev.length) {
           broadcastStrokes(next);
         }
         return next;
       });
    } else if (currentStroke) {
      setCurrentStroke((prev) => prev ? {
        ...prev,
        points: [...prev.points, { x: vx, y: vy }]
      } : null);
    }
  };

  const stopDrawing = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (!isDrawing) return;
    setIsDrawing(false);

    if (marquee) {
      const minX = Math.min(marquee.startX, marquee.currentX);
      const maxX = Math.max(marquee.startX, marquee.currentX);
      const minY = Math.min(marquee.startY, marquee.currentY);
      const maxY = Math.max(marquee.startY, marquee.currentY);
      const box = { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 };
      
      const selected = strokes.filter(s => {
        const sBox = getBoundingBox(s.points, 10 + s.size / 2);
        if (!doBoxesIntersect(box, sBox)) return false;
        if (mode === "global") return s.userId === (currentUser?.id || guestId);
        return true;
      });
      setSelectedStrokeIds(selected.map(s => s.id));
      setMarquee(null);
      return;
    }

    if (tool === "select") {
       if (transformState) {
         setTransformState(null);
         broadcastStrokes(strokes);
         
         const newHistory = history.slice(0, historyStep + 1);
         newHistory.push(strokes);
         setHistory(newHistory);
         setHistoryStep(newHistory.length - 1);
       }
       return;
    }
    
    if (currentStroke) {
      const box = getBoundingBox(currentStroke.points, 10 + currentStroke.size / 2);
      const finishedStroke = { ...currentStroke, centerX: box.centerX, centerY: box.centerY, angle: 0 };
      const newStrokes = [...strokes, finishedStroke];
      setStrokes(newStrokes);
      setCurrentStroke(null);
      broadcastStrokes(newStrokes);
      
      // Clear current stroke from our cursor broadcast
      if (mode === "global" && (currentUser || guestId) && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "cursor_move",
          payload: {
            id: currentUser?.id || guestId,
            name: currentUser?.user_metadata?.full_name || currentUser?.email || "Collaborator",
            avatarSeed: currentUser?.user_metadata?.avatar_seed || currentUser?.user_metadata?.full_name || currentUser?.email || "Collaborator",
            x: -9999, // Move far offscreen since we don't have vx/vy context here easily without passing it
            y: -9999,
            color,
            currentStroke: undefined
          },
        });
      }
      
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

  const [isTrashClicked, setIsTrashClicked] = useState(false);

  const clearCanvas = () => {
    setIsTrashClicked(true);
    setTimeout(() => setIsTrashClicked(false), 1500);

    if (strokes.length === 0) return;
    
    let newStrokes: Stroke[];
    const currentUserId = currentUser?.id || guestId;
    if (mode === "global" && currentUserId) {
      // In global mode, only clear strokes belonging to the current user
      newStrokes = strokes.filter(s => s.userId !== currentUserId);
      if (newStrokes.length === strokes.length) return; // Nothing to clear
    } else {
      // In local mode, clear everything
      newStrokes = [];
    }
    
    setStrokes(newStrokes);
    broadcastStrokes(newStrokes);
    
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newStrokes);
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
      icon: <MousePointer2 className={`w-5 h-5 ${tool === "select" ? "text-purple-600" : "text-gray-700 dark:text-gray-300"}`} />,
      label: "Select",
      onClick: () => {
        setTool("select");
        setShowColorPicker(false);
        setShowSizePicker(false);
      },
      className: tool === "select" ? "ring-2 ring-purple-600" : "",
    },
    {
      icon: <Brush className={`w-5 h-5 ${tool === "brush" ? "text-purple-600" : "text-gray-700 dark:text-gray-300"}`} />,
      label: "Brush",
      onClick: () => toggleSizePicker("brush"),
      className: tool === "brush" ? "ring-2 ring-purple-600" : "",
    },
    {
      icon: <Pencil className={`w-5 h-5 ${tool === "pencil" ? "text-purple-600" : "text-gray-700 dark:text-gray-300"}`} />,
      label: "Pencil",
      onClick: () => toggleSizePicker("pencil"),
      className: tool === "pencil" ? "ring-2 ring-purple-600" : "",
    },
    {
      icon: <Eraser className={`w-5 h-5 ${tool === "eraser" ? "text-purple-600" : "text-gray-700 dark:text-gray-300"}`} />,
      label: "Eraser",
      onClick: () => {
        setTool("eraser");
        setShowColorPicker(false);
        setShowSizePicker(false);
      },
      className: tool === "eraser" ? "ring-2 ring-purple-600" : "",
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
      icon: <Trash2 className={`w-5 h-5 transition-colors ${isTrashClicked ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`} />,
      label: mode === "global" ? "Clear My Strokes" : "Clear All",
      onClick: clearCanvas,
    },
  ].filter(item => {
    if (mode === "global" && (item.label === "Clear My Strokes" || item.label === "Clear All")) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 w-full h-full">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full bg-white dark:bg-[#121212]"
        style={{
          cursor: isPanning
            ? "grabbing"
            : isSpacePressed
            ? "grab"
            : tool === "eraser"
            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' ${isDark ? "stroke='white'" : "stroke='black'"} stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21'/%3E%3Cpath d='M22 21H7'/%3E%3Cpath d='m5 11 9 9'/%3E%3C/svg%3E") 0 16, auto`
            : tool === "select"
            ? hoverHandle === "rotate" ? "crosshair" : hoverHandle ? "move" : "default"
            : "crosshair"
        }}
      />

      {/* Live Cursors layer */}
      {Object.values(cursors)
        .filter(cursor => cursor.id !== currentUser?.id)
        .map(cursor => (
        <motion.div
          key={cursor.id}
          className="absolute pointer-events-none flex items-start"
          initial={{ opacity: 0 }}
          animate={{ x: cursor.x + pan.x, y: cursor.y + pan.y, opacity: 1 }}
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
        collaborators={mode === "global" ? Object.values(cursors).map(c => ({ id: c.id, name: c.name, avatarSeed: c.avatarSeed })) : []} 
        onShareClick={
          mode === "local" 
            ? () => setShowShareDialog(true) 
            : (mode === "global" && roomId !== "global") 
              ? () => setShowShareDialog(true)
              : undefined
        }
      />
      
      <ShareDialog 
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        currentRoomId={roomId}
        mode={mode}
      />
      
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
      />

      <AnimatePresence>
        {showPanIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-6 z-50 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-2 pointer-events-none"
          >
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              POS: {Math.round(-pan.x)}, {Math.round(-pan.y)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
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

      {/* Empty State Hints */}
      <AnimatePresence>
        {isLoaded && (mode === "global" ? !hasUserDrawn : strokes.length === 0) && !isDrawing && !currentStroke && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-center font-sans select-none ${
              mode === "global" ? "bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl" : ""
            }`}
          >
            <div className="text-center max-w-lg mt-[-10vh]">
              <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center justify-center gap-3 mb-6">
                <span className="text-purple-600 dark:text-purple-400 rotation-12">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </span>
                ULDRAW
              </h1>
              {mode === "local" ? (
                <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed font-medium" style={{ fontFamily: "cursive, sans-serif" }}>
                  Your drawings are saved in your browser's storage.<br/>
                  Browser storage can be cleared unexpectedly.<br/>
                  Save your work to a file regularly to avoid losing it.
                </p>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed font-medium" style={{ fontFamily: "cursive, sans-serif" }}>
                    This is a public global canvas. Anyone can join and draw.<br/>
                    Please be respectful and spread positivity.<br/>
                    Have fun collaborating!
                  </p>
                  <button 
                    onClick={() => router.push("/")}
                    className="mt-2 px-4 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-colors pointer-events-auto"
                  >
                    ← Go back to local canvas
                  </button>
                </div>
              )}
            </div>

            {/* Hint: Dock */}
            <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 flex flex-col items-center text-zinc-400 dark:text-zinc-500">
              <span className="text-sm font-medium mb-2 opacity-80" style={{ fontFamily: "cursive, sans-serif" }}>Pick a tool & Start drawing!</span>
              <svg width="24" height="60" viewBox="0 0 24 60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 text-current">
                <path d="M12 5 Q 12 30 12 55" />
                <path d="M6 45 L 12 55 L 18 45" />
              </svg>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <Dock items={dockItems} baseItemSize={40} magnification={56} panelHeight={56} />
      
      <BottomMenu 
        user={currentUser} 
        showProfile={mode !== "local"}
        onEditProfile={() => setShowGuestDialog(true)}
        onExport={currentUser?.is_anonymous ? undefined : () => setShowExportDialog(true)}
        showGlobalLink={mode === "local"}
      />
      
      {/* Pan Hint */}
      <AnimatePresence>
        {showPanHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-20 right-6 z-50 pointer-events-auto font-sans flex items-end gap-3"
          >
            {/* Tooltip Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-4 max-w-xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Press <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300">Space</kbd> three times quickly to reset to position (0, 0)
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Info Icon Button */}
            <div 
              className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shadow-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setShowPanHint(false)}
              title="Dismiss hint"
            >
              <span className="text-xl font-bold">?</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
