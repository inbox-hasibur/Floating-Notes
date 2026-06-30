'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Code } from 'lucide-react';

function FloatingToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-1 rounded transition-colors ${
      active ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
    }`;

  return (
    <div className="flex items-center gap-0.5 px-3 py-1 border-b border-zinc-800 bg-[#1e2329] flex-wrap" style={{ flexShrink: 0 }}>
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold">
        <Bold size={13} />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic">
        <Italic size={13} />
      </button>
      <span className="w-px h-3 bg-zinc-800 mx-0.5" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1">
        <Heading1 size={13} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2">
        <Heading2 size={13} />
      </button>
      <span className="w-px h-3 bg-zinc-800 mx-0.5" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet list">
        <List size={13} />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Ordered list">
        <ListOrdered size={13} />
      </button>
      <span className="w-px h-3 bg-zinc-800 mx-0.5" />
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Quote">
        <Quote size={13} />
      </button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive('codeBlock'))} title="Code block">
        <Code size={13} />
      </button>
    </div>
  );
}

export default function FloatingPage() {
  const noteIdRef = useRef<string | null>(null);
  const syncRef = useRef<NodeJS.Timeout | null>(null);
  const [noteTitle, setNoteTitle] = useState('Note');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm focus:outline-none max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      if (!noteIdRef.current) return;
      const html = editor.getHTML();
      const text = editor.getText();
      const firstLine = text.split('\n')[0]?.substring(0, 50) || 'Note';

      // Save to localStorage immediately
      const stored = localStorage.getItem('floating-notes-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const state = parsed?.state;
          if (state) {
            const idx = state.notes?.findIndex((n: any) => n.id === noteIdRef.current);
            if (idx !== -1) {
              state.notes[idx].content = html;
              state.notes[idx].title = firstLine;
              state.notes[idx].updatedAt = Date.now();
              localStorage.setItem('floating-notes-storage', JSON.stringify(parsed));
              setNoteTitle(firstLine);
            }
          }
        } catch {}
      }
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('noteId');
    noteIdRef.current = noteId;

    // Load initial content from localStorage
    const stored = localStorage.getItem('floating-notes-storage');
    if (stored && noteId) {
      try {
        const parsed = JSON.parse(stored);
        const note = parsed?.state?.notes?.find((n: any) => n.id === noteId);
        if (note) {
          if (note.content && editor) {
            editor.commands.setContent(note.content);
          }
          if (note.title) setNoteTitle(note.title);
        }
      } catch {}
    }

    // Poll for external changes (from main editor)
    syncRef.current = setInterval(() => {
      if (!noteId || !editor) return;
      const stored = localStorage.getItem('floating-notes-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const note = parsed?.state?.notes?.find((n: any) => n.id === noteId);
          if (note?.content && note.content !== editor.getHTML()) {
            const isEditorFocused = window.document.activeElement?.closest('.ProseMirror');
            if (!isEditorFocused) {
              editor.commands.setContent(note.content);
            }
            if (note.title) setNoteTitle(note.title);
          }
        } catch {}
      }
    }, 500);

    return () => { if (syncRef.current) clearInterval(syncRef.current); };
  }, [editor]);

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: '#15181c', color: '#d4d4d8',
    }}>
      {/* Top bar */}
      <div style={{
        height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 8px', background: '#1e2329', borderBottom: '1px solid #27272a',
        flexShrink: 0, userSelect: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span style={{ fontSize: 10, color: '#3b82f6', flexShrink: 0 }}>📌</span>
          <span style={{ fontSize: 11, color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
            {noteTitle}
          </span>
        </div>
        <button
          onClick={() => window.close()}
          style={{
            background: 'none', border: 'none', color: '#52525b', cursor: 'pointer',
            padding: '2px 6px', borderRadius: 3, fontSize: 11, lineHeight: 1, flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#27272a'; e.currentTarget.style.color = '#e4e4e7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#52525b'; }}
        >✕</button>
      </div>

      {/* Formatting toolbar */}
      <FloatingToolbar editor={editor} />

      {/* Editor content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}