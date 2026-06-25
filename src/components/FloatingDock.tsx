'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNoteStore } from '@/store/useNoteStore';
import { isPiPSupported, openPiPWindow, openPopupWindow, closeFloatingWindow } from '@/lib/floating';
import { Maximize2, Minimize2, Dock, ExternalLink } from 'lucide-react';

export default function FloatingDock() {
  const { notes, activeNoteId, floatingMode, floatingWindowOpen, setFloatingMode, setFloatingWindowOpen } = useNoteStore();
  const [pipSupported, setPipSupported] = useState(false);
  const floatingWindowRef = useRef<Window | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    setPipSupported(isPiPSupported());
  }, []);

  // Listen for floating window closing externally
  useEffect(() => {
    const checkWindowClosed = setInterval(() => {
      if (floatingWindowRef.current?.closed) {
        floatingWindowRef.current = null;
        setFloatingWindowOpen(false);
        setIsFloating(false);
      }
      if (pipWindowRef.current?.closed) {
        pipWindowRef.current = null;
        setFloatingWindowOpen(false);
        setIsFloating(false);
      }
    }, 1000);

    return () => clearInterval(checkWindowClosed);
  }, [setFloatingWindowOpen]);

  const handleUndock = useCallback(async () => {
    if (!activeNoteId) return;

    const activeNote = notes.find((n) => n.id === activeNoteId);
    const noteTitle = activeNote?.title || 'Untitled Note';

    // Close any existing floating window
    closeFloatingWindow(floatingWindowRef.current);
    closeFloatingWindow(pipWindowRef.current);

    if (floatingMode === 'pip' && pipSupported) {
      const pipWin = await openPiPWindow(activeNoteId, noteTitle);
      if (pipWin) {
        pipWindowRef.current = pipWin;
        setFloatingWindowOpen(true);
        setIsFloating(true);
      }
    } else {
      const popup = openPopupWindow(activeNoteId, noteTitle);
      if (popup) {
        floatingWindowRef.current = popup;
        setFloatingWindowOpen(true);
        setIsFloating(true);
      }
    }
  }, [activeNoteId, notes, floatingMode, pipSupported, setFloatingWindowOpen]);

  const handleDock = useCallback(() => {
    closeFloatingWindow(floatingWindowRef.current);
    closeFloatingWindow(pipWindowRef.current);
    floatingWindowRef.current = null;
    pipWindowRef.current = null;
    setFloatingWindowOpen(false);
    setIsFloating(false);
  }, [setFloatingWindowOpen]);

  const toggleFloatingMode = useCallback(() => {
    const newMode = floatingMode === 'pip' ? 'popup' : 'pip';
    setFloatingMode(newMode);
    // If currently floating, re-open with new mode
    if (isFloating) {
      handleDock();
      // Small delay to ensure clean close before re-opening
      setTimeout(() => handleUndock(), 300);
    }
  }, [floatingMode, setFloatingMode, isFloating, handleDock, handleUndock]);

  if (!activeNoteId) return null;

  return (
    <div className="flex items-center gap-1.5">
      {/* Floating Mode Toggle */}
      <button
        onClick={toggleFloatingMode}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
        title={
          pipSupported
            ? floatingMode === 'pip'
              ? 'Switch to Popup mode'
              : 'Switch to Always-on-Top (PiP) mode'
            : 'PiP not supported — using Popup mode'
        }
      >
        {floatingMode === 'pip' ? (
          <Maximize2 size={14} className="text-blue-400" />
        ) : (
          <ExternalLink size={14} />
        )}
        <span className="hidden sm:inline">
          {floatingMode === 'pip' ? 'PiP' : 'Popup'}
        </span>
      </button>

      {/* Undock / Dock Button */}
      <button
        onClick={isFloating ? handleDock : handleUndock}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
          isFloating
            ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700'
        }`}
        title={isFloating ? 'Dock note back' : 'Undock note to floating window'}
      >
        {isFloating ? (
          <>
            <Dock size={14} />
            <span className="hidden sm:inline">Dock</span>
          </>
        ) : (
          <>
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Float</span>
          </>
        )}
      </button>

      {/* Status indicator */}
      {isFloating && (
        <span className="text-[10px] text-blue-400/70 animate-pulse ml-1">
          ● Live
        </span>
      )}
    </div>
  );
}