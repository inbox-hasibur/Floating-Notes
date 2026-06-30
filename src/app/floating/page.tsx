'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Mini floating modes: 'collapsed' = just title bar, 'expanded' = show content
type FloatMode = 'collapsed' | 'expanded';

export default function FloatingPage() {
  const noteIdRef = useRef<string | null>(null);
  const syncRef = useRef<NodeJS.Timeout | null>(null);
  const alwaysOnTopRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [noteTitle, setNoteTitle] = useState('Note');
  const [mode, setMode] = useState<FloatMode>('collapsed');

  // Toggle between collapsed (title only) and expanded (full note)
  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'collapsed' ? 'expanded' : 'collapsed');
  }, []);

  // Sync content from localStorage to this window
  const syncContent = useCallback(() => {
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

  // Save content changes to localStorage
  const handleInput = useCallback(() => {
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('noteId');
    noteIdRef.current = noteId;

    // Load initial content
    syncContent();

    // Always-on-top: periodically focus
    alwaysOnTopRef.current = setInterval(() => {
      try { if (window && !window.closed) window.focus(); } catch {}
    }, 3000);

    // Poll for external changes
    syncRef.current = setInterval(syncContent, 800);

    return () => { 
      if (syncRef.current) clearInterval(syncRef.current);
      if (alwaysOnTopRef.current) clearInterval(alwaysOnTopRef.current);
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
        borderRadius: mode === 'expanded' ? 0 : 0,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* === TOP BAR - always visible === */}
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
          transition: 'all 0.2s ease',
        }}
      >
        {/* Left: status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span style={{ fontSize: 11, color: '#3b82f6', flexShrink: 0 }}>📌</span>
          <span style={{
            fontSize: 12,
            color: '#a1a1aa',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: mode === 'collapsed' ? 200 : 150,
          }}>
            {mode === 'collapsed' ? (noteTitle || 'Note') : noteTitle}
          </span>
        </div>

        {/* Right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {mode === 'expanded' && (
            <span style={{ fontSize: 9, color: '#52525b' }}>TAP TO COLLAPSE</span>
          )}
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

      {/* === CONTENT - only when expanded === */}
      {mode === 'expanded' && (
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onClick={(e) => e.stopPropagation()}
          data-placeholder="Write..."
          style={{
            flex: 1,
            padding: '14px 16px',
            overflowY: 'auto',
            fontSize: 13,
            lineHeight: 1.5,
            color: '#d4d4d8',
            outline: 'none',
            cursor: 'text',
            userSelect: 'text',
          }}
          // Styles for content
          dangerouslySetInnerHTML={{ __html: '' }}
        />
      )}

      {/* Inline styles for the editor content */}
      <style dangerouslySetInnerHTML={{__html: `
        [contenteditable]:empty::before {
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
      `}} />
    </div>
  );
}