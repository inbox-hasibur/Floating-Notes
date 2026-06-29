'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { X, Minus, Maximize2 } from 'lucide-react';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
}

interface ResizeState {
  isResizing: boolean;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

export default function FloatingPopup() {
  const { notes, activeNoteId, floatingWindowOpen, setFloatingWindowOpen, updateNote } = useNoteStore();
  const activeNote = notes.find((n) => n.id === activeNoteId);
  const popupRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 200, y: 80, width: 640, height: 480 });
  const [minimized, setMinimized] = useState(false);
  const dragRef = useRef<DragState>({
    isDragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0,
  });
  const resizeRef = useRef<ResizeState>({
    isResizing: false, startX: 0, startY: 0, startWidth: 0, startHeight: 0,
  });
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved position
  useEffect(() => {
    try {
      const saved = localStorage.getItem('floating-popup-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.x && parsed.y) setPosition(parsed);
      }
    } catch {}
  }, []);

  // Save position periodically
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        localStorage.setItem('floating-popup-state', JSON.stringify(position));
      } catch {}
    }, 1000);
    return () => clearInterval(timer);
  }, [position]);

  // Sync content to store
  const syncContent = useCallback(() => {
    if (!activeNoteId || !contentRef.current) return;
    const html = contentRef.current.innerHTML;
    const div = document.createElement('div');
    div.innerHTML = html;
    const firstLine = div.textContent?.trim().split('\n')[0]?.substring(0, 50) || 'Untitled';
    
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateNote(activeNoteId, { content: html, title: firstLine });
    }, 500);
  }, [activeNoteId, updateNote]);

  // Set initial content
  useEffect(() => {
    if (contentRef.current && activeNote?.content) {
      contentRef.current.innerHTML = activeNote.content;
    }
  }, [activeNote?.content, floatingWindowOpen]);

  // Sync back to store periodically
  useEffect(() => {
    if (!floatingWindowOpen) return;
    const poll = setInterval(syncContent, 800);
    return () => clearInterval(poll);
  }, [floatingWindowOpen, syncContent]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: position.x,
      startTop: position.y,
    };
  }, [position]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: position.width,
      startHeight: position.height,
    };
  }, [position]);

  useEffect(() => {
    if (!floatingWindowOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current.isDragging) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPosition((prev) => ({
          ...prev,
          x: Math.max(0, dragRef.current.startLeft + dx),
          y: Math.max(0, dragRef.current.startTop + dy),
        }));
      }
      if (resizeRef.current.isResizing) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        setPosition((prev) => ({
          ...prev,
          width: Math.max(400, resizeRef.current.startWidth + dx),
          height: Math.max(300, resizeRef.current.startHeight + dy),
        }));
      }
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      resizeRef.current.isResizing = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [floatingWindowOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && floatingWindowOpen) {
        setFloatingWindowOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [floatingWindowOpen, setFloatingWindowOpen]);

  if (!floatingWindowOpen || !activeNote) return null;

  return (
    <div className="floating-overlay" onClick={() => setFloatingWindowOpen(false)}>
      <div
        ref={popupRef}
        className="floating-popup"
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: position.width,
          height: position.height,
          background: 'var(--popup-bg)',
          border: '1px solid var(--popup-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div
          className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing no-drag"
          style={{
            background: 'var(--bg-sidebar)',
            borderBottom: '1px solid var(--border)',
            userSelect: 'none',
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => setFloatingWindowOpen(false)}
                className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                title="Close"
              />
              <button
                onClick={() => setMinimized(!minimized)}
                className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
                title={minimized ? 'Restore' : 'Minimize'}
              />
              <button className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors" title="Maximize" />
            </div>
            <span className="text-xs font-medium ml-2 truncate max-w-[200px]" style={{ color: 'var(--text)' }}>
              📌 {activeNote.title || 'Untitled Note'}
            </span>
          </div>
        </div>

        {/* Content */}
        {!minimized && (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onInput={syncContent}
            data-placeholder="Write in floating note..."
            className="flex-1 overflow-y-auto"
            style={{
              padding: '16px 20px',
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--text)',
              outline: 'none',
              minHeight: 0,
            }}
          />
        )}

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          style={{
            background: 'transparent',
            borderRight: '3px solid var(--text-muted)',
            borderBottom: '3px solid var(--text-muted)',
            borderBottomRightRadius: 2,
            opacity: 0.3,
          }}
          onMouseDown={handleResizeMouseDown}
        />
      </div>
    </div>
  );
}