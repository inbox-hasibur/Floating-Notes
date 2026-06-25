'use client';

import { useEffect, useRef } from 'react';

export default function FloatingPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const noteIdRef = useRef<string | null>(null);
  const syncRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('noteId');
    noteIdRef.current = noteId;

    const stored = localStorage.getItem('floating-notes-storage');
    if (stored && noteId && contentRef.current) {
      try {
        const parsed = JSON.parse(stored);
        const note = parsed?.state?.notes?.find((n: any) => n.id === noteId);
        if (note?.content) contentRef.current.innerHTML = note.content;
      } catch {}
    }

    syncRef.current = setInterval(() => {
      if (!noteId || !contentRef.current) return;
      const html = contentRef.current.innerHTML;
      const stored = localStorage.getItem('floating-notes-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const state = parsed?.state;
          if (state) {
            const idx = state.notes?.findIndex((n: any) => n.id === noteId);
            if (idx !== -1 && state.notes[idx]?.content !== html) {
              state.notes[idx].content = html;
              state.notes[idx].updatedAt = Date.now();
              const div = document.createElement('div');
              div.innerHTML = html;
              const firstLine = div.textContent?.trim().split('\n')[0]?.substring(0, 50) || 'Untitled';
              state.notes[idx].title = firstLine;
              localStorage.setItem('floating-notes-storage', JSON.stringify(parsed));
            }
          }
        } catch {}
      }
    }, 500);

    return () => { if (syncRef.current) clearInterval(syncRef.current); };
  }, []);

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: '#15181c', color: '#d4d4d8',
    }}>
      {/* Minimal top bar */}
      <div className="top-bar">
        <span className="pin-label">📌 Pinned</span>
        <button
          onClick={() => window.close()}
          title="Close"
        >✕</button>
      </div>

      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Write..."
        style={{
          flex: 1, padding: '16px 20px', overflowY: 'auto',
          fontSize: 14, lineHeight: 1.6, color: '#d4d4d8', outline: 'none',
        }}
      />
    </div>
  );
}