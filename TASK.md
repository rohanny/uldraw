# UlDraw - Collaborative Drawing Tool

## Project Overview

A high-performance real-time collaborative whiteboard where multiple users can draw on a shared canvas with instant synchronization using Supabase Realtime.

---

## Phase 1: Foundation & Drawing
- [x] Implement HTML5 Canvas with React
- [x] Basic drawing tools (pencil, brush, eraser)
- [x] Adaptive cursor styles (pencil vs eraser)
- [x] Real-time stroke broadcasting
- [x] Color picker (theme-aware)
- [x] Stroke size controls

## Phase 2: Real-Time Collaboration
- [x] Integrated Supabase Realtime for low-latency syncing
- [x] Room-based connection handling (via URL query params)
- [x] Live collaborator cursors with custom avatars
- [x] Collaborator presence stack (top-right profile group)
- [x] Dynamic cursor visibility (hiding stale cursors)

## Phase 3: Identity & Sharing
- [x] Supabase Anonymous Authentication (Guest Mode)
- [x] Guest identity dialog (custom name & avatar assignment)
- [x] Edit profile functionality via bottom menu
- [x] Share Canvas dialog with "Copy Link" feature
- [x] Private room generation logic

## Phase 4: App Infrastructure
- [x] Dark/Light mode support with persistent theme provider
- [x] Responsive dock and interactive bottom menu
- [x] Toast notifications for system events (Auth, Sharing)

---

## Future Roadmap

### Shapes & Manipulation
- [ ] Shape tools (rectangle, ellipse, line)
- [ ] Shape selection and multi-select
- [ ] Z-index ordering (bring forward/send back)

### History & Persistence
- [x] Undo/Redo (local operation stack)
- [ ] Persistent canvas state (PostgreSQL storage)
- [ ] Room snapshots

### Export & Advanced
- [ ] PNG/SVG export
- [ ] Infinite canvas with pan/zoom
- [ ] Text tool
- [ ] Image upload support

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Realtime | Supabase Realtime (Broadcasting) |
| Auth | Supabase Anonymous Auth |
| Animation | Framer Motion |
| Icons/UI | Lucide React, Sonner (Toasts) |
| Avatars | DiceBear API (Notionists style) |
