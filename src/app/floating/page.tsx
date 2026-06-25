'use client';

import { useEffect, useState, useRef } from 'react';

export default function FloatingPage() {
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const noteIdRef = useRef<string | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Read query params
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('noteId');
    const title = params.get('title') || 'Untitled Note';
    noteIdRef.current = noteId;
    setNoteTitle(title);

    // Load initial content from localStorage
    const stored = localStorage.getItem('floating-notes-storage');
    if (stored && noteId) {
      try {
        const parsed = JSON.parse(stored);
        const state = parsed?.state;
        if (state) {
          const note = state.notes?.find((n: any) => n.id === noteId);
          if (note?.content) {
            setNoteContent(note.content);
          }
        }
      } catch {}
    }

    // Sync content back to localStorage periodically
    syncIntervalRef.current = setInterval(() => {
      if (!noteId) return;
      const contentEl = contentRef.current;
      if (!contentEl) return;
      const html = contentEl.innerHTML;

      const stored = localStorage.getItem('floating-notes-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const state = parsed?.state;
          if (state) {
            const noteIndex = state.notes?.findIndex((n: any) => n.id === noteId);
            if (noteIndex !== -1 && state.notes[noteIndex]?.content !== html) {
              state.notes[noteIndex].content = html;
              state.notes[noteIndex].updatedAt = Date.now();
              // Update title from first line
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              const firstText = tempDiv.textContent?.trim() || '';
              const firstLine = firstText.split('\n')[0] || 'Untitled Note';
              state.notes[noteIndex].title = firstLine.substring(0, 50);
              localStorage.setItem('floating-notes-storage', JSON.stringify(parsed));
              setNoteTitle(firstLine.substring(0, 50));
            }
          }
        } catch {}
      }
    }, 500);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  const handleClose = () => {
    window.close();
  };

  return (
    <div id="floating-editor" style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#15181c',
      color: '#e4e4e7',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: '#1e2329',
        borderBottom: '1px solid #27272a',
        userSelect: 'none',
      }}>
        <h2 style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#a1a1aa',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '70%',
          margin: 0,
        }}>
          {noteTitle || 'Untitled Note'}
        </h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#27272a';
              e.currentTarget.style.color = '#e4e4e7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#71717a';
            }}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start typing..."
        style={{
          flex: 1,
          padding: '24px 32px',
          overflowY: 'auto',
          fontSize: 15,
          lineHeight: 1.7,
          color: '#d4d4d8',
          outline: 'none',
        }}
        dangerouslySetInnerHTML={{ __html: noteContent }}
        onInput={() => {
          // Input events handled by the interval sync
        }}
      />
    </div>
  );
}
