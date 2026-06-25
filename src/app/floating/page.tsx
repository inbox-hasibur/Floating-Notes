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
      <div style={{
        height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6px', background: '#1e2329', borderBottom: '1px solid #27272a',
        flexShrink: 0, userSelect: 'none',
      }}>
        <span style={{ fontSize: 11, color: '#52525b', cursor: 'default' }}>📌 Pinned</span>
        <button
          onClick={() => window.close()}
          style={{
            background: 'none', border: 'none', color: '#52525b', cursor: 'pointer',
            padding: '2px 6px', borderRadius: 3, fontSize: 11, lineHeight: 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#27272a'; e.currentTarget.style.color = '#e4e4e7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#52525b'; }}
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