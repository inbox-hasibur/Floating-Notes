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

  const format = (cmd: string, value?: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    document.execCommand(cmd, false, value);
    contentRef.current?.focus();
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: '#15181c', color: '#d4d4d8',
    }}>
      {/* Single toolbar: formatting LEFT, window controls RIGHT */}
      <div className="toolbar">
        <div className="toolbar-left">
          <button onClick={() => format('bold')} title="Bold"><b>B</b></button>
          <button onClick={() => format('italic')} title="Italic"><i>I</i></button>
          <span className="separator" />
          <button onClick={() => format('formatBlock', '<H1>')} title="Heading 1">H1</button>
          <button onClick={() => format('formatBlock', '<H2>')} title="Heading 2">H2</button>
          <span className="separator" />
          <button onClick={() => format('insertUnorderedList')} title="Bullet list">•</button>
          <button onClick={() => format('insertOrderedList')} title="Numbered list">1.</button>
          <span className="separator" />
          <button onClick={() => format('formatBlock', '<BLOCKQUOTE>')} title="Quote">"</button>
        </div>
        <div className="toolbar-right">
          <button onClick={() => window.alert('Minimize')} title="Minimize">−</button>
          <button onClick={() => window.alert('Maximize')} title="Maximize">□</button>
          <button onClick={() => window.close()} title="Close">✕</button>
        </div>
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