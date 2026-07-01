'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type FloatMode = 'collapsed' | 'expanded';

export default function FloatingPage() {
  const noteIdRef = useRef<string | null>(null);
  const syncRef = useRef<NodeJS.Timeout | null>(null);
  const pinRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [noteTitle, setNoteTitle] = useState('Note');
  const [mode, setMode] = useState<FloatMode>('collapsed');
  const [isPinned, setIsPinned] = useState(false);

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'collapsed' ? 'expanded' : 'collapsed');
  }, []);

  const loadContent = useCallback(() => {
    if (!noteIdRef.current || !contentRef.current) return;
    const stored = localStorage.getItem('floating-notes-storage');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const note = parsed?.state?.notes?.find((n: any) => n.id === noteIdRef.current);
      if (note) {
        if (note.content && contentRef.current.innerHTML !== note.content) {
          contentRef.current.innerHTML = note.content;
        }
        if (note.title) setNoteTitle(note.title);
      }
    } catch {}
  }, []);

  const saveContent = useCallback(() => {
    if (!noteIdRef.current || !contentRef.current) return;
    const html = contentRef.current.innerHTML;
    const stored = localStorage.getItem('floating-notes-storage');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const state = parsed?.state;
      if (state) {
        const idx = state.notes?.findIndex((n: any) => n.id === noteIdRef.current);
        if (idx !== -1) {
          state.notes[idx].content = html;
          state.notes[idx].updatedAt = Date.now();
          localStorage.setItem('floating-notes-storage', JSON.stringify(parsed));
        }
      }
    } catch {}
  }, []);

  const togglePin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinned(prev => !prev);
  }, []);

  // Pin effect: aggressively keep on top only when pinned
  useEffect(() => {
    if (isPinned) {
      // Immediately focus when pinning
      window.focus();
      // Keep refocusing every 800ms to stay on top
      pinRef.current = setInterval(() => {
        try {
          if (window && !window.closed) {
            window.focus();
          }
        } catch {}
      }, 800);
    } else {
      // Stop stealing focus when unpinned
      if (pinRef.current) {
        clearInterval(pinRef.current);
        pinRef.current = null;
      }
    }
    return () => {
      if (pinRef.current) {
        clearInterval(pinRef.current);
        pinRef.current = null;
      }
    };
  }, [isPinned]);

  useEffect(() => {
    // Get noteId from URL
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('noteId');
    noteIdRef.current = noteId;

    // Load initial content after a small delay for the DOM to be ready
    setTimeout(loadContent, 100);

    // Sync from localStorage
    syncRef.current = setInterval(loadContent, 600);

    return () => { 
      if (syncRef.current) clearInterval(syncRef.current);
    };
  }, []);

  return (
    <div
      onClick={toggleMode}
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: '#15181c',
        color: '#d4d4d8',
        cursor: 'default',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* TOP BAR - fills entire window when collapsed */}
      <div
        style={{
          height: mode === 'collapsed' ? '100%' : 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          background: '#1e2329',
          borderBottom: mode === 'expanded' ? '1px solid #27272a' : 'none',
          flexShrink: 0,
          cursor: 'pointer',
          transition: 'height 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span
            onClick={togglePin}
            style={{
              fontSize: 11,
              color: isPinned ? '#3b82f6' : '#52525b',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            title={isPinned ? 'Unpin window' : 'Pin window on top'}
          >📌</span>
          <span style={{
            fontSize: 12,
            color: '#a1a1aa',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: mode === 'collapsed' ? 230 : 160,
          }}>
            {noteTitle || 'Note'}
          </span>
          {isPinned && (
            <span style={{ fontSize: 10, color: '#3b82f6', flexShrink: 0 }}>●</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={(e) => { e.stopPropagation(); window.close(); }}
            style={{
              background: 'none', border: 'none', color: '#52525b', cursor: 'pointer',
              padding: '2px 6px', borderRadius: 3, fontSize: 12, lineHeight: 1,
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#27272a'; e.currentTarget.style.color = '#e4e4e7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#52525b'; }}
          >✕</button>
        </div>
      </div>

      {/* CONTENT - only when expanded */}
      {mode === 'expanded' && (
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={saveContent}
          onClick={(e) => e.stopPropagation()}
          data-placeholder="Write..."
          style={{
            flex: 1,
            padding: '12px 14px',
            overflowY: 'auto',
            fontSize: 13,
            lineHeight: 1.5,
            color: '#d4d4d8',
            outline: 'none',
            cursor: 'text',
            userSelect: 'text',
          }}
        />
      )}

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #52525b;
          pointer-events: none;
        }
        [contenteditable] p { margin-bottom: 4px; }
        [contenteditable] h1 { font-size: 1.3em; font-weight: 600; margin: 10px 0 4px; color: #f4f4f5; }
        [contenteditable] h2 { font-size: 1.15em; font-weight: 600; margin: 8px 0 3px; color: #f4f4f5; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 18px; margin-bottom: 4px; }
        [contenteditable] code { background: #27272a; padding: 1px 3px; border-radius: 3px; font-size: 12px; }
        [contenteditable] pre { background: #1a1d23; padding: 10px; border-radius: 5px; overflow-x: auto; margin: 6px 0; }
        [contenteditable] blockquote { border-left: 2px solid #3b82f6; padding-left: 8px; color: #a1a1aa; margin: 4px 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
      `}</style>
    </div>
  );
}