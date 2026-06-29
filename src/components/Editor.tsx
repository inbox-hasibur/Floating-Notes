'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { useNoteStore } from '@/store/useNoteStore';
import { useEffect, useRef, useCallback } from 'react';
import FloatingDock from './FloatingDock';
import FloatingPopup from './FloatingPopup';
import { exportAsMarkdown, exportAsPlainText, exportAsHtml } from '@/lib/exporter';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Quote, Code, FileText, FileCode, FileDown,
  Undo2, Redo2, Highlighter, Palette,
} from 'lucide-react';

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-1.5 rounded transition-colors ${
      active
        ? 'text-white'
        : 'hover:bg-[var(--toolbar-btn-hover)]'
    }`;

  return (
    <div
      className="flex items-center gap-0.5 px-4 py-1.5 border-b flex-wrap"
      style={{
        background: 'var(--toolbar-bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Undo / Redo */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        className="p-1.5 rounded transition-colors hover:bg-[var(--toolbar-btn-hover)]"
        style={{ color: 'var(--toolbar-btn)' }}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        className="p-1.5 rounded transition-colors hover:bg-[var(--toolbar-btn-hover)]"
        style={{ color: 'var(--toolbar-btn)' }}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={15} />
      </button>
      <span className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

      {/* Text formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        style={{
          color: editor.isActive('bold') ? 'var(--toolbar-btn-active)' : 'var(--toolbar-btn)',
          background: editor.isActive('bold') ? 'var(--toolbar-btn-hover)' : 'transparent',
        }}
        title="Bold (Ctrl+B)"
      >
        <Bold size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        style={{
          color: editor.isActive('italic') ? 'var(--toolbar-btn-active)' : 'var(--toolbar-btn)',
          background: editor.isActive('italic') ? 'var(--toolbar-btn-hover)' : 'transparent',
        }}
        title="Italic (Ctrl+I)"
      >
        <Italic size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))}
        style={{
          color: editor.isActive('underline') ? 'var(--toolbar-btn-active)' : 'var(--toolbar-btn)',
          background: editor.isActive('underline') ? 'var(--toolbar-btn-hover)' : 'transparent',
        }}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive('strike'))}
        style={{
          color: editor.isActive('strike') ? 'var(--toolbar-btn-active)' : 'var(--toolbar-btn)',
          background: editor.isActive('strike') ? 'var(--toolbar-btn-hover)' : 'transparent',
        }}
        title="Strikethrough"
      >
        <Strikethrough size={15} />
      </button>
      <span className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive('heading', { level: 1 }))}
        style={{
          color: editor.isActive('heading', { level: 1 }) ? 'var(--toolbar-btn-active)' : 'var(--toolbar-btn)',
          background: editor.isActive('heading', { level: 1 }) ? 'var(--toolbar-btn-hover)' : 'transparent',
        }}
        title="Heading 1"
      >
        <Heading1 size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
        style={{
          color: editor.isActive('heading', { level: 2 }) ? 'var(--toolbar-btn-active)' : 'var(--toolbar-btn)',
          background: editor.isActive('heading', { level: 2 }) ? 'var(--toolbar-btn-hover)' : 'transparent',
        }}
        title="Heading 2"
      >
        <Heading2 size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive('heading', { level: 3 }))}
        style={{
          color: editor.isActive('heading', { level: 3 }) ? 'var(--toolbar-btn-active)' : 'var(--toolbar-btn)',
          background: editor.isActive('heading', { level: 3 }) ? 'var(--toolbar-btn-hover)' : 'transparent',
        }}
        title="Heading 3"
      >
        <Heading3 size={15} />
      </button>
      <span className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
        style={{
          color: editor.isActive('bulletList') ? 'var(--toolbar-btn-active)' : 'var(--toolbar-btn)',
          background: editor.isActive('bulletList') ? 'var(--toolbar-btn-hover)' : 'transparent',
        }}
        title="Bullet list"
      >
        <List size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
        style={{
          color: editor.isActive('orderedList') ? 'var(--toolbar-btn-active)' : 'var(--toolbar-btn)',
          background: editor.isActive('orderedList') ? 'var(--toolbar-btn-hover)' : 'transparent',
        }}
        title="Ordered list"
      >
        <ListOrdered size={15} />
      </button>
      <span className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

      {/* Block elements */}
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive('blockquote'))}
        style={{
          color: editor.isActive('blockquote') ? 'var(--toolbar-btn-active)' : 'var(--toolbar-btn)',
          background: editor.isActive('blockquote') ? 'var(--toolbar-btn-hover)' : 'transparent',
        }}
        title="Quote"
      >
        <Quote size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={btnClass(editor.isActive('codeBlock'))}
        style={{
          color: editor.isActive('codeBlock') ? 'var(--toolbar-btn-active)' : 'var(--toolbar-btn)',
          background: editor.isActive('codeBlock') ? 'var(--toolbar-btn-hover)' : 'transparent',
        }}
        title="Code block"
      >
        <Code size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={btnClass(editor.isActive('highlight'))}
        style={{
          color: editor.isActive('highlight') ? 'var(--toolbar-btn-active)' : 'var(--toolbar-btn)',
          background: editor.isActive('highlight') ? 'var(--toolbar-btn-hover)' : 'transparent',
        }}
        title="Highlight"
      >
        <Highlighter size={15} />
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
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: 'Start typing your note here...',
      }),
    ],
    content: activeNote?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none max-w-none min-h-[400px]',
      },
    },
    onUpdate: ({ editor }) => {
      if (!activeNoteId) return;

      const html = editor.getHTML();
      const text = editor.getText();
      const firstLine = text.split('\n')[0] || 'Untitled Note';

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        updateNote(activeNoteId, {
          content: html,
          title: firstLine.substring(0, 50),
        });
      }, 1000);
    },
  });

  // Sync content when switching notes
  useEffect(() => {
    if (editor && activeNote) {
      if (editor.getHTML() !== activeNote.content) {
        editor.commands.setContent(activeNote.content);
      }
    } else if (editor && !activeNote) {
      editor.commands.setContent('');
    }
  }, [activeNoteId, editor]);

  // Sync from floating popup
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
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
        <p>Select a note or create a new one.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Top bar: title + floating controls + export */}
      <div
        className="sticky top-0 z-10 backdrop-blur-sm px-6 py-1.5 border-b"
        style={{
          background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="text-sm font-medium truncate max-w-[280px]"
              style={{ color: 'var(--text-muted)' }}
            >
              {activeNote?.title || 'Untitled Note'}
            </div>
            <div className="relative group">
              <button
                className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-alt)' }}
              >
                <FileDown size={13} />
                <span>Export</span>
              </button>
              <div
                className="absolute left-0 top-full mt-1 w-36 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-20"
                style={{ background: 'var(--popup-bg)', border: '1px solid var(--popup-border)' }}
              >
                <button
                  onClick={() => exportAsMarkdown(activeNote?.title || 'note', editor?.getHTML() || '')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors rounded-t-lg"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-alt)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <FileText size={13} /> Markdown
                </button>
                <button
                  onClick={() => exportAsPlainText(activeNote?.title || 'note', editor?.getHTML() || '')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-alt)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <FileText size={13} /> Plain Text
                </button>
                <button
                  onClick={() => exportAsHtml(activeNote?.title || 'note', editor?.getHTML() || '')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors rounded-b-lg"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-alt)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <FileCode size={13} /> HTML
                </button>
              </div>
            </div>
          </div>
          <FloatingDock />
        </div>
      </div>

      {/* Formatting toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <EditorContent editor={editor} />
      </div>

      {/* Floating popup overlay */}
      <FloatingPopup />
    </div>
  );
}