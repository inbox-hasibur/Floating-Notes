'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';

type FloatMode = 'collapsed' | 'expanded';

function FloatingToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const btnClass = (active: boolean) => {
    const base = 'p-1 leading-none rounded transition-colors cursor-pointer border-0 text-xs ';
    return base + (active
      ? 'bg-zinc-700 text-white'
      : 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800');
  };

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-zinc-800 bg-[#181b20] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold"><strong>B</strong></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic"><em>I</em></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline"><u>U</u></button>
      <span className="w-px h-3 bg-zinc-800 mx-0.5" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1">H1</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2">H2</button>
      <span className="w-px h-3 bg-zinc-800 mx-0.5" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet list">≡</button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Ordered list">#</button>
      <span className="w-px h-3 bg-zinc-800 mx-0.5" />
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Quote">"</button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive('codeBlock'))} title="Code">{'<>'}</button>
      <span className="w-px h-3 bg-zinc-800 mx-0.5" />
      <button onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)} title="Undo">↩</button>
      <button onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)} title="Redo">↪</button>
    </div>
  );
}

export default function FloatingPage() {
  const noteIdRef = useRef<string | null>(null);
  const syncRef = useRef<NodeJS.Timeout | null>(null);
  const pinRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const [noteTitle, setNoteTitle] = useState('Note');
  const [mode, setMode] = useState<FloatMode>('expanded');
  const [isPinned, setIsPinned] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Placeholder.configure({ placeholder: 'Write...' }),
      Underline,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-xs focus:outline-none max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      if (!noteIdRef.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveToStorage(editor.getHTML());
      }, 500);
    },
  });

  const loadFromStorage = useCallback(() => {
    if (!noteIdRef.current) return;
    const stored = localStorage.getItem('floating-notes-storage');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const note = parsed?.state?.notes?.find((n: any) => n.id === noteIdRef.current);
      if (note) {
        if (note.title) setNoteTitle(note.title);
        if (note.content && editor && editor.getHTML() !== note.content) {
          const isFocused = window.document.activeElement?.closest('.ProseMirror');
          if (!isFocused) {
            editor.commands.setContent(note.content);
          }
        }
      }
    } catch {}
  }, [editor]);

  const saveToStorage = useCallback((html: string) => {
    if (!noteIdRef.current) return;
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
    setIsPinned(prev => {
      const next = !prev;
      // Immediately focus when pinning
      if (next) {
        // Delay slightly to allow state to settle
        setTimeout(() => { try { window.focus(); } catch {} }, 50);
      }
      return next;
    });
  }, []);

  // Always on top using only reliable interval + visibility change
  useEffect(() => {
    if (isPinned) {
      // Immediate focus
      try { window.focus(); } catch {}

      // Fast interval: constantly try to stay on top (every 300ms)
      pinRef.current = setInterval(() => {
        try {
          if (window && !window.closed) {
            window.focus();
          }
        } catch {}
      }, 300);

      // Visibility change: re-focus when window becomes visible
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          setTimeout(() => { try { window.focus(); } catch {} }, 50);
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        if (pinRef.current) clearInterval(pinRef.current);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    } else {
      // Not pinned: stop all focus stealing
      if (pinRef.current) {
        clearInterval(pinRef.current);
        pinRef.current = null;
      }
    }
  }, [isPinned]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('noteId');
    noteIdRef.current = noteId;

    // Focus immediately on load
    try { window.focus(); } catch {}

    // Load content once editor is ready
    const checkEditor = setInterval(() => {
      if (editor) {
        clearInterval(checkEditor);
        loadFromStorage();
      }
    }, 50);

    // Sync from localStorage
    syncRef.current = setInterval(loadFromStorage, 800);

    // Hide URL bar
    document.title = 'FloatNote';
    try { window.history.replaceState(null, '', '/float'); } catch {}

    return () => {
      if (syncRef.current) clearInterval(syncRef.current);
      clearInterval(checkEditor);
    };
  }, [editor]);

  return (
    <div
      onClick={() => {
        if (mode === 'collapsed') setMode('expanded');
      }}
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
      {/* Title bar - always visible, compact */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          background: '#1e2329',
          borderBottom: '1px solid #27272a',
          flexShrink: 0,
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', flex: 1 }}>
          <span
            onClick={togglePin}
            style={{
              fontSize: 10,
              color: isPinned ? '#3b82f6' : '#52525b',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'color 0.15s ease',
              lineHeight: 1,
            }}
            title={isPinned ? 'Unpin (allow focus to leave)' : 'Pin (keep on top)'}
          >📌</span>
          <span style={{
            fontSize: 11,
            color: '#a1a1aa',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            minWidth: 0,
          }}>
            {noteTitle || 'Note'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {isPinned && (
            <span style={{ fontSize: 9, color: '#22c55e', padding: '0 4px', display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              ON TOP
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); window.close(); }}
            style={{
              background: 'none', border: 'none', color: '#52525b', cursor: 'pointer',
              padding: '1px 5px', borderRadius: 2, fontSize: 11, lineHeight: 1,
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#27272a'; e.currentTarget.style.color = '#e4e4e7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#52525b'; }}
          >✕</button>
        </div>
      </div>

      {/* Toolbar */}
      <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
        <FloatingToolbar editor={editor} />
      </div>

      {/* Editor content */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 10px',
          cursor: 'text',
          userSelect: 'text',
        }}
      >
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror {
          outline: none;
          min-height: 60px;
          font-size: 12.5px;
          line-height: 1.5;
          color: #d4d4d8;
        }
        .ProseMirror p { margin: 0 0 2px; }
        .ProseMirror h1 { font-size: 1.15em; font-weight: 600; margin: 6px 0 2px; color: #f4f4f5; }
        .ProseMirror h2 { font-size: 1.05em; font-weight: 600; margin: 4px 0 2px; color: #f4f4f5; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 16px; margin: 2px 0; }
        .ProseMirror li { margin: 0; }
        .ProseMirror code { background: #27272a; padding: 1px 3px; border-radius: 2px; font-size: 11px; }
        .ProseMirror pre { background: #1a1d23; padding: 8px; border-radius: 4px; overflow-x: auto; margin: 4px 0; font-size: 11px; }
        .ProseMirror blockquote { border-left: 2px solid #3b82f6; padding-left: 6px; color: #a1a1aa; margin: 2px 0; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #52525b;
          pointer-events: none;
          float: left;
          height: 0;
        }
        ::-webkit-scrollbar { width: 2px; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 2px; }
      `}</style>
    </div>
  );
}