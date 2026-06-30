'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { openPopupWindow, closeFloatingWindow } from '@/lib/floating';
import { ExternalLink, Dock } from 'lucide-react';

export default function FloatingDock() {
  const { notes, activeNoteId, floatingWindowOpen, setFloatingWindowOpen } = useNoteStore();
  const floatingWindowRef = useRef<Window | null>(null);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const checkWindowClosed = setInterval(() => {
      if (floatingWindowRef.current?.closed) {
        floatingWindowRef.current = null;
        setFloatingWindowOpen(false);
        setIsFloating(false);
      }
    }, 1000);
    return () => clearInterval(checkWindowClosed);
  }, [setFloatingWindowOpen]);

  useEffect(() => {
    // Sync floatingWindowOpen state to isFloating
    if (!floatingWindowOpen) {
      setIsFloating(false);
    }
  }, [floatingWindowOpen]);

  const handleFloat = useCallback(() => {
    if (!activeNoteId) return;
    const activeNote = notes.find((n) => n.id === activeNoteId);
    const noteTitle = activeNote?.title || 'Note';

    closeFloatingWindow(floatingWindowRef.current);
    const popup = openPopupWindow(activeNoteId, noteTitle);
    if (popup) {
      floatingWindowRef.current = popup;
      setFloatingWindowOpen(true);
      setIsFloating(true);
    }
  }, [activeNoteId, notes, setFloatingWindowOpen]);

  const handleDock = useCallback(() => {
    closeFloatingWindow(floatingWindowRef.current);
    floatingWindowRef.current = null;
    setFloatingWindowOpen(false);
    setIsFloating(false);
  }, [setFloatingWindowOpen]);

  if (!activeNoteId) return null;

  return (
    <button
      onClick={isFloating ? handleDock : handleFloat}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
        isFloating
          ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700'
      }`}
      title={isFloating ? 'Dock note back' : 'Float note in separate window'}
    >
      {isFloating ? <Dock size={14} /> : <ExternalLink size={14} />}
      <span className="hidden sm:inline">{isFloating ? 'Dock' : 'Float'}</span>
    </button>
  );
}