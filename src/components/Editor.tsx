'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useNoteStore } from '@/store/useNoteStore';
import { useEffect, useRef } from 'react';
import FloatingDock from './FloatingDock';
import { exportAsMarkdown, exportAsPlainText, exportAsHtml } from '@/lib/exporter';
import { 
  Bold, Italic, List, ListOrdered, Heading1, Heading2, 
  Quote, Code, FileText, FileCode, FileDown, Undo2, Redo2 
} from 'lucide-react';

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-1.5 rounded transition-colors ${
      active ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
    }`;

  return (
    <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-zinc-800 bg-[#181b20] flex-wrap">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold (Ctrl+B)">
        <Bold size={15} />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic (Ctrl+I)">
        <Italic size={15} />
      </button>
      <span className="w-px h-4 bg-zinc-800 mx-1" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1">
        <Heading1 size={15} />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2">
        <Heading2 size={15} />
      </button>
      <span className="w-px h-4 bg-zinc-800 mx-1" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet list">
        <List size={15} />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Ordered list">
        <ListOrdered size={15} />
      </button>
      <span className="w-px h-4 bg-zinc-800 mx-1" />
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Quote">
        <Quote size={15} />
      </button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnClass(editor.isActive('codeBlock'))} title="Code block">
        <Code size={15} />
      </button>
      <span className="w-px h-4 bg-zinc-800 mx-1" />
      <button onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)} title="Undo (Ctrl+Z)">
        <Undo2 size={15} />
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)} title="Redo (Ctrl+Y)">
        <Redo2 size={15} />
      </button>
    </div>
  );
}

export default function Editor() {
  const { notes, activeNoteId, updateNote, floatingWindowOpen } = useNoteStore();
  const activeNote = notes.find((n) => n.id === activeNoteId);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing your note here...',
      }),
    ],
    content: activeNote?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose-base focus:outline-none max-w-none min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      if (!activeNoteId) return;

      const html = editor.getHTML();

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      
      debounceTimerRef.current = setTimeout(() => {
        updateNote(activeNoteId, {
          content: html,
        });
      }, 1000);
    },
  });

  useEffect(() => {
    if (editor && activeNote) {
      if (editor.getHTML() !== activeNote.content) {
        editor.commands.setContent(activeNote.content);
      }
    } else if (editor && !activeNote) {
      editor.commands.setContent('');
    }
  }, [activeNoteId, editor]);

  useEffect(() => {
    if (!activeNoteId || !editor) return;

    const storagePoll = setInterval(() => {
      if (!floatingWindowOpen) return;

      const stored = localStorage.getItem('floating-notes-storage');
      if (!stored) return;

      try {
        const parsed = JSON.parse(stored);
        const state = parsed?.state;
        if (!state) return;

        const note = state.notes?.find((n: any) => n.id === activeNoteId);
        if (note?.content && note.content !== editor.getHTML()) {
          const isEditorFocused = window.document.activeElement?.closest('.ProseMirror');
          if (!isEditorFocused) {
            editor.commands.setContent(note.content);
          }
        }
      } catch {}
    }, 800);

    return () => clearInterval(storagePoll);
  }, [activeNoteId, editor, floatingWindowOpen]);

  if (!activeNoteId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#15181c] text-zinc-500">
        <p>Select a note or create a new one.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Top bar: title + floating controls + export */}
      <div className="sticky top-0 z-10 backdrop-blur-sm px-6 py-1.5 border-b" style={{ background: 'color-mix(in srgb, var(--bg) 85%, transparent)', borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-400 font-medium truncate max-w-[280px]">
              {activeNote?.title || 'Note'}
            </div>
            <div className="relative group">
              <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                <FileDown size={13} />
                <span>Export</span>
              </button>
              <div className="absolute left-0 top-full mt-1 w-36 bg-[#1e2329] border border-zinc-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-20">
                <button onClick={() => exportAsMarkdown(activeNote?.title || 'note', editor?.getHTML() || '')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-t-lg transition-colors">
                  <FileText size={13} /> Markdown
                </button>
                <button onClick={() => exportAsPlainText(activeNote?.title || 'note', editor?.getHTML() || '')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                  <FileText size={13} /> Plain Text
                </button>
                <button onClick={() => exportAsHtml(activeNote?.title || 'note', editor?.getHTML() || '')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-b-lg transition-colors">
                  <FileCode size={13} /> HTML
                </button>
              </div>
            </div>
          </div>
          <FloatingDock />
        </div>
      </div>

      {/* Formatting toolbar with undo/redo */}
      <EditorToolbar editor={editor} />

      {/* Editor content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}